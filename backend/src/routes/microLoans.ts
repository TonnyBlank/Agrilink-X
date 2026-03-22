import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppRole, resolveAppRole } from "../lib/roles";
import { normalizeKenyanPhone } from "../lib/mpesa";
import { buildLoanSchedule, LoanRepaymentRecord } from "../lib/loanSchedule";

const router = Router();

const QUALIFIED_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);
const ACTIVE_LOAN_STATUSES = new Set(["approved", "disbursed"]);

type LoanProductType =
  | "seasonal_working_capital"
  | "equipment_top_up"
  | "buyer_contract_financing";

const PRODUCT_CONFIG: Record<
  LoanProductType,
  {
    title: string;
    multiplier: number;
    enterpriseMinimum: number;
    farmerMinimum: number;
    speedEnterprise: string;
    speedFarmer: string;
    interestEnterprise: number;
    interestFarmer: number;
    repaymentDaysEnterprise: number;
    repaymentDaysFarmer: number;
  }
> = {
  seasonal_working_capital: {
    title: "Seasonal Working Capital",
    multiplier: 0.35,
    enterpriseMinimum: 35000,
    farmerMinimum: 15000,
    speedEnterprise: "Same-day review",
    speedFarmer: "24-48h review",
    interestEnterprise: 6.5,
    interestFarmer: 8.5,
    repaymentDaysEnterprise: 45,
    repaymentDaysFarmer: 30,
  },
  equipment_top_up: {
    title: "Equipment Top-Up",
    multiplier: 0.65,
    enterpriseMinimum: 80000,
    farmerMinimum: 30000,
    speedEnterprise: "1 day release",
    speedFarmer: "2 day release",
    interestEnterprise: 7.5,
    interestFarmer: 9.5,
    repaymentDaysEnterprise: 90,
    repaymentDaysFarmer: 60,
  },
  buyer_contract_financing: {
    title: "Buyer Contract Financing",
    multiplier: 1,
    enterpriseMinimum: 150000,
    farmerMinimum: 50000,
    speedEnterprise: "Priority lane",
    speedFarmer: "Fast review",
    interestEnterprise: 5.5,
    interestFarmer: 7.5,
    repaymentDaysEnterprise: 120,
    repaymentDaysFarmer: 75,
  },
};

function isLoanProductType(value: unknown): value is LoanProductType {
  return typeof value === "string" && value in PRODUCT_CONFIG;
}

function isMissingLoanOffersTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message ?? "") : "";
  return message.includes("micro_loan_offers") && message.includes("schema cache");
}

async function buildEligibility(req: AuthRequest, role: "farmer_pro" | "buyer_enterprise") {
  const supabase = req.supabase!;
  const userId = req.userId!;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [{ data: orderRows, error: ordersError }, { data: profile, error: profileError }, { data: verification, error: verificationError }] =
    await Promise.all([
      supabase.from("orders").select("total_price, created_at, status, payment_status").eq("farmer_id", userId),
      supabase
        .from("profiles")
        .select("full_name, phone, county, payout_method, payout_mpesa_number, bank_name, bank_account_name, bank_account_number")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("id_verifications").select("status").eq("user_id", userId).maybeSingle(),
    ]);

  if (ordersError) throw ordersError;
  if (profileError) throw profileError;
  if (verificationError) throw verificationError;

  const qualifiedOrders = (orderRows ?? []).filter((order) => {
    const createdAt = new Date(order.created_at);
    const hasQualifiedPayment = order.payment_status === "paid" || QUALIFIED_STATUSES.has(order.status);
    return hasQualifiedPayment && createdAt >= ninetyDaysAgo;
  });

  const revenue90 = qualifiedOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
  const totalQualifiedOrders = qualifiedOrders.length;
  const averageMonthlyRevenue = revenue90 / 3;

  const hasPayout =
    profile?.payout_method === "mpesa"
      ? Boolean(profile?.payout_mpesa_number?.trim())
      : profile?.payout_method === "bank"
        ? Boolean(profile?.bank_name?.trim() && profile?.bank_account_name?.trim() && profile?.bank_account_number?.trim())
        : false;

  const readinessChecks = [
    verification?.status === "verified",
    hasPayout,
    Boolean(profile?.full_name?.trim() && profile?.phone?.trim() && profile?.county?.trim()),
    totalQualifiedOrders >= 2,
    revenue90 >= 10000,
  ];

  const allChecksMet = readinessChecks.every(Boolean);
  const scoreMultiplier = role === "buyer_enterprise" ? 1.1 : 0.8;
  const rawEligibleAmount = averageMonthlyRevenue * scoreMultiplier;
  const minimumEligibleAmount = role === "buyer_enterprise" ? 25000 : 10000;
  const maxEligibleAmount = role === "buyer_enterprise" ? 1200000 : 250000;
  const eligibleAmount = allChecksMet
    ? Math.max(minimumEligibleAmount, Math.min(maxEligibleAmount, Math.round(rawEligibleAmount / 1000) * 1000))
    : 0;
  const outstandingLoanBalance = allChecksMet ? await fetchOutstandingLoanBalance(supabase, userId) : 0;
  const availableAmount = Math.max(0, eligibleAmount - outstandingLoanBalance);

  return {
    eligibleAmount,
    availableAmount,
    outstandingLoanBalance,
    isEligible: allChecksMet && eligibleAmount > 0,
  };
}

function enrichLoanApplication(
  loan: Record<string, unknown>,
  repayments: LoanRepaymentRecord[],
) {
  const scheduleData = buildLoanSchedule({
    approvedAmount: Number(loan.approved_amount ?? 0),
    requestedAmount: Number(loan.requested_amount ?? 0),
    interestRate: Number(loan.interest_rate ?? 0),
    repaymentDays: Number(loan.repayment_days ?? 0),
    startDate: String(loan.disbursed_at ?? loan.reviewed_at ?? loan.created_at ?? new Date().toISOString()),
    repayments,
  });

  return {
    ...loan,
    repayments,
    loan_summary: scheduleData.summary,
    amortization_schedule: scheduleData.schedule,
  };
}

async function fetchOutstandingLoanBalance(supabase: AuthRequest["supabase"], userId: string) {
  const { data: loans, error: loansError } = await supabase!
    .from("micro_loan_applications")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending_review", "approved", "disbursed"]);

  if (loansError) throw loansError;

  const loanIds = (loans ?? []).map((loan) => loan.id);
  if (!loanIds.length) return 0;

  const { data: repayments, error: repaymentsError } = await supabase!
    .from("micro_loan_repayments")
    .select("id, loan_application_id, amount, payment_method, payment_ref, phone_number, note, created_at")
    .in("loan_application_id", loanIds)
    .order("created_at", { ascending: true });

  if (repaymentsError) throw repaymentsError;

  const repaymentsByLoanId = new Map<string, LoanRepaymentRecord[]>();
  for (const repayment of repayments ?? []) {
    const existing = repaymentsByLoanId.get(repayment.loan_application_id) ?? [];
    existing.push({
      id: repayment.id,
      amount: Number(repayment.amount ?? 0),
      payment_method: repayment.payment_method ?? null,
      payment_ref: repayment.payment_ref ?? null,
      phone_number: repayment.phone_number ?? null,
      note: repayment.note ?? null,
      created_at: repayment.created_at,
    });
    repaymentsByLoanId.set(repayment.loan_application_id, existing);
  }

  return (loans ?? []).reduce((sum, loan) => {
    const enriched = enrichLoanApplication(loan, repaymentsByLoanId.get(loan.id) ?? []);
    return sum + Number(enriched.loan_summary?.remainingBalance ?? 0);
  }, 0);
}

router.get("/applications", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data: loans, error: loansError } = await supabase
    .from("micro_loan_applications")
    .select("*")
    .eq("user_id", req.userId!)
    .order("created_at", { ascending: false });

  if (loansError) throw loansError;

  const loanIds = (loans ?? []).map((loan) => loan.id);
  const { data: repayments, error: repaymentsError } = loanIds.length
    ? await supabase
        .from("micro_loan_repayments")
        .select("id, loan_application_id, amount, payment_method, payment_ref, phone_number, note, created_at")
        .in("loan_application_id", loanIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (repaymentsError) throw repaymentsError;

  const repaymentsByLoanId = new Map<string, LoanRepaymentRecord[]>();
  for (const repayment of repayments ?? []) {
    const existing = repaymentsByLoanId.get(repayment.loan_application_id) ?? [];
    existing.push({
      id: repayment.id,
      amount: Number(repayment.amount ?? 0),
      payment_method: repayment.payment_method ?? null,
      payment_ref: repayment.payment_ref ?? null,
      phone_number: repayment.phone_number ?? null,
      note: repayment.note ?? null,
      created_at: repayment.created_at,
    });
    repaymentsByLoanId.set(repayment.loan_application_id, existing);
  }

  res.json((loans ?? []).map((loan) => enrichLoanApplication(loan, repaymentsByLoanId.get(loan.id) ?? [])));
});

router.get("/offers", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const userId = req.userId!;
  const resolvedRole = await resolveAppRole(supabase, userId, req.requestedRole);
  const requestedRole = req.requestedRole as AppRole | undefined;
  const role =
    requestedRole === "farmer_pro" || requestedRole === "buyer_enterprise"
      ? requestedRole
      : resolvedRole;

  if (role !== "farmer_pro" && role !== "buyer_enterprise") {
    return res.json([]);
  }

  const { data: offers, error } = await supabase
    .from("micro_loan_offers")
    .select("*")
    .eq("is_active", true)
    .eq("applicant_role", role)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingLoanOffersTable(error)) return res.json([]);
    throw error;
  }

  const eligibility = await buildEligibility(req, role);
  const filteredOffers = (offers ?? []).map((offer) => ({
    ...offer,
    max_amount: Number(offer.max_amount ?? 0),
    interest_rate: offer.interest_rate === null ? null : Number(offer.interest_rate),
    repayment_days: offer.repayment_days === null ? null : Number(offer.repayment_days),
    available_amount: eligibility.isEligible ? Math.min(eligibility.availableAmount, Number(offer.max_amount ?? 0)) : 0,
    user_eligible: eligibility.isEligible,
    outstanding_loan_balance: eligibility.outstandingLoanBalance,
  }));

  res.json(filteredOffers);
});

router.post("/applications", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const userId = req.userId!;
  const resolvedRole = await resolveAppRole(supabase, userId, req.requestedRole);
  const requestedRole = req.requestedRole as AppRole | undefined;
  const role =
    requestedRole === "farmer_pro" || requestedRole === "buyer_enterprise"
      ? requestedRole
      : resolvedRole;

  if (role !== "farmer_pro" && role !== "buyer_enterprise") {
    return res.status(403).json({ error: "Upgrade required before borrowing." });
  }

  const { offerId, productType, requestedAmount } = req.body as { offerId?: unknown; productType?: unknown; requestedAmount?: unknown };

  const numericRequestedAmount = Number(requestedAmount);
  if (!Number.isFinite(numericRequestedAmount) || numericRequestedAmount <= 0) {
    return res.status(400).json({ error: "Requested amount must be a valid number." });
  }

  const eligibility = await buildEligibility(req, role);
  if (!eligibility.isEligible) {
    return res.status(400).json({ error: "You are not eligible for borrowing yet. Complete readiness requirements first." });
  }

  let selectedProductType: LoanProductType;
  let productTitle: string;
  let speed: string | null;
  let interestRate: number;
  let repaymentDays: number;
  let maxAllowedAmount: number;

  if (typeof offerId === "string" && offerId.trim()) {
    const { data: offer, error: offerError } = await supabase
      .from("micro_loan_offers")
      .select("*")
      .eq("id", offerId.trim())
      .eq("is_active", true)
      .eq("applicant_role", role)
      .maybeSingle();

    if (offerError) {
      if (isMissingLoanOffersTable(offerError)) {
        return res.status(400).json({ error: "Loan offers table is missing. Run the micro_loan_offers SQL migration first." });
      }
      throw offerError;
    }
    if (!offer) {
      return res.status(404).json({ error: "Loan offer not found or no longer active." });
    }

    selectedProductType = offer.product_type as LoanProductType;
    productTitle = String(offer.product_title ?? "").trim();
    speed = offer.speed ? String(offer.speed) : null;
    interestRate = offer.interest_rate === null ? 0 : Number(offer.interest_rate);
    repaymentDays = offer.repayment_days === null ? 0 : Number(offer.repayment_days);
    maxAllowedAmount = Math.min(eligibility.availableAmount, Number(offer.max_amount ?? 0));
  } else {
    if (!isLoanProductType(productType)) {
      return res.status(400).json({ error: "Invalid loan product selected." });
    }

    const config = PRODUCT_CONFIG[productType];
    selectedProductType = productType;
    productTitle = config.title;
    speed = role === "buyer_enterprise" ? config.speedEnterprise : config.speedFarmer;
    interestRate = role === "buyer_enterprise" ? config.interestEnterprise : config.interestFarmer;
    repaymentDays = role === "buyer_enterprise" ? config.repaymentDaysEnterprise : config.repaymentDaysFarmer;
    maxAllowedAmount = Math.max(
      eligibility.availableAmount * config.multiplier,
      role === "buyer_enterprise" ? config.enterpriseMinimum : config.farmerMinimum,
    );
  }

  const { data: duplicateLoan, error: duplicateLoanError } = await supabase
    .from("micro_loan_applications")
    .select("id, product_title, product_type, status")
    .eq("user_id", userId)
    .eq("product_type", selectedProductType)
    .in("status", ["pending_review", "approved", "disbursed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (duplicateLoanError) throw duplicateLoanError;
  if (duplicateLoan) {
    return res.status(400).json({
      error: `You already have this loan type (${duplicateLoan.product_title}) in progress. Finish it before applying for the same one again.`,
    });
  }

  if (numericRequestedAmount > maxAllowedAmount) {
    return res.status(400).json({ error: `Requested amount exceeds your current limit for ${productTitle}.` });
  }

  const approvedAmount = Math.round(numericRequestedAmount / 100) * 100;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("micro_loan_applications")
    .insert({
      user_id: userId,
      applicant_role: role,
      product_type: selectedProductType,
      product_title: productTitle,
      requested_amount: approvedAmount,
      approved_amount: approvedAmount,
      speed,
      interest_rate: interestRate,
      repayment_days: repaymentDays,
      status: "disbursed",
      note: `Auto-approved from live financing readiness checks at ${interestRate}% interest over ${repaymentDays} days.`,
      disbursed_at: now,
      reviewed_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  res.status(201).json(enrichLoanApplication(data, []));
});

router.post("/applications/:loanId/repay", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const userId = req.userId!;
  const loanId = req.params.loanId;
  const amount = Number(req.body?.amount);
  const phoneNumberInput = String(req.body?.phoneNumber ?? "");

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Repayment amount must be greater than zero." });
  }

  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeKenyanPhone(phoneNumberInput);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Enter a valid M-Pesa number." });
  }

  const { data: loan, error: loanError } = await supabase
    .from("micro_loan_applications")
    .select("*")
    .eq("id", loanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (loanError) throw loanError;
  if (!loan) return res.status(404).json({ error: "Loan application not found." });
  if (loan.status === "rejected") return res.status(400).json({ error: "Rejected loans cannot be repaid." });
  if (loan.status === "repaid") return res.status(400).json({ error: "This loan is already fully repaid." });

  const { data: repayments, error: repaymentsError } = await supabase
    .from("micro_loan_repayments")
    .select("id, amount, payment_method, payment_ref, phone_number, note, created_at")
    .eq("loan_application_id", loanId)
    .order("created_at", { ascending: true });

  if (repaymentsError) throw repaymentsError;

  const repaymentRows = (repayments ?? []).map((repayment) => ({
    id: repayment.id,
    amount: Number(repayment.amount ?? 0),
    payment_method: repayment.payment_method ?? null,
    payment_ref: repayment.payment_ref ?? null,
    phone_number: repayment.phone_number ?? null,
    note: repayment.note ?? null,
    created_at: repayment.created_at,
  }));

  const currentSchedule = buildLoanSchedule({
    approvedAmount: Number(loan.approved_amount ?? 0),
    requestedAmount: Number(loan.requested_amount ?? 0),
    interestRate: Number(loan.interest_rate ?? 0),
    repaymentDays: Number(loan.repayment_days ?? 0),
    startDate: String(loan.disbursed_at ?? loan.reviewed_at ?? loan.created_at ?? new Date().toISOString()),
    repayments: repaymentRows,
  });

  if (currentSchedule.summary.remainingBalance <= 0) {
    return res.status(400).json({ error: "This loan is already fully repaid." });
  }

  if (amount > currentSchedule.summary.remainingBalance) {
    return res.status(400).json({ error: `Repayment exceeds the current balance of KES ${currentSchedule.summary.remainingBalance.toFixed(2)}.` });
  }

  const paymentRef = `LN-${Date.now()}`;
  const repaymentNote = `M-Pesa repayment posted to ${loan.product_title}.`;
  const { data: insertedRepayment, error: insertError } = await supabase
    .from("micro_loan_repayments")
    .insert({
      loan_application_id: loanId,
      user_id: userId,
      amount,
      payment_method: "mpesa",
      payment_ref: paymentRef,
      phone_number: normalizedPhone,
      note: repaymentNote,
    })
    .select("id, amount, payment_method, payment_ref, phone_number, note, created_at")
    .single();

  if (insertError) throw insertError;

  const updatedRepayments = [
    ...repaymentRows,
    {
      id: insertedRepayment.id,
      amount: Number(insertedRepayment.amount ?? 0),
      payment_method: insertedRepayment.payment_method ?? null,
      payment_ref: insertedRepayment.payment_ref ?? null,
      phone_number: insertedRepayment.phone_number ?? null,
      note: insertedRepayment.note ?? null,
      created_at: insertedRepayment.created_at,
    },
  ];

  const nextSchedule = buildLoanSchedule({
    approvedAmount: Number(loan.approved_amount ?? 0),
    requestedAmount: Number(loan.requested_amount ?? 0),
    interestRate: Number(loan.interest_rate ?? 0),
    repaymentDays: Number(loan.repayment_days ?? 0),
    startDate: String(loan.disbursed_at ?? loan.reviewed_at ?? loan.created_at ?? new Date().toISOString()),
    repayments: updatedRepayments,
  });

  const nextStatus = nextSchedule.summary.remainingBalance <= 0 ? "repaid" : ACTIVE_LOAN_STATUSES.has(loan.status) ? loan.status : "disbursed";
  const { data: updatedLoan, error: updateLoanError } = await supabase
    .from("micro_loan_applications")
    .update({
      status: nextStatus,
      disbursed_at: loan.disbursed_at ?? loan.reviewed_at ?? loan.created_at ?? new Date().toISOString(),
      repaid_at: nextStatus === "repaid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .select("*")
    .single();

  if (updateLoanError) throw updateLoanError;

  res.json({
    message: `Repayment of KES ${amount.toFixed(2)} received successfully.`,
    repayment: insertedRepayment,
    loan: enrichLoanApplication(updatedLoan, updatedRepayments),
  });
});

export default router;
