import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppRole, resolveAppRole } from "../lib/roles";

const router = Router();

const QUALIFIED_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

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

  return {
    eligibleAmount,
    isEligible: allChecksMet && eligibleAmount > 0,
  };
}

router.get("/applications", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("micro_loan_applications")
    .select("*")
    .eq("user_id", req.userId!)
    .order("created_at", { ascending: false });

  if (error) throw error;
  res.json(data ?? []);
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

  const { productType, requestedAmount } = req.body as { productType?: unknown; requestedAmount?: unknown };
  if (!isLoanProductType(productType)) {
    return res.status(400).json({ error: "Invalid loan product selected." });
  }

  const numericRequestedAmount = Number(requestedAmount);
  if (!Number.isFinite(numericRequestedAmount) || numericRequestedAmount <= 0) {
    return res.status(400).json({ error: "Requested amount must be a valid number." });
  }

  const eligibility = await buildEligibility(req, role);
  if (!eligibility.isEligible) {
    return res.status(400).json({ error: "You are not eligible for borrowing yet. Complete readiness requirements first." });
  }

  const config = PRODUCT_CONFIG[productType];
  const maxForProduct = Math.max(
    eligibility.eligibleAmount * config.multiplier,
    role === "buyer_enterprise" ? config.enterpriseMinimum : config.farmerMinimum,
  );

  if (numericRequestedAmount > maxForProduct) {
    return res.status(400).json({ error: `Requested amount exceeds your current limit for ${config.title}.` });
  }

  const approvedAmount = Math.round(numericRequestedAmount / 100) * 100;
  const interestRate = role === "buyer_enterprise" ? config.interestEnterprise : config.interestFarmer;
  const repaymentDays = role === "buyer_enterprise" ? config.repaymentDaysEnterprise : config.repaymentDaysFarmer;
  const { data, error } = await supabase
    .from("micro_loan_applications")
    .insert({
      user_id: userId,
      applicant_role: role,
      product_type: productType,
      product_title: config.title,
      requested_amount: approvedAmount,
      approved_amount: approvedAmount,
      speed: role === "buyer_enterprise" ? config.speedEnterprise : config.speedFarmer,
      interest_rate: interestRate,
      repayment_days: repaymentDays,
      status: "approved",
      note: `Auto-approved from live financing readiness checks at ${interestRate}% interest over ${repaymentDays} days.`,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  res.status(201).json(data);
});

export default router;
