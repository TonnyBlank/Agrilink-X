import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppRole, isAppRole, resolveAppRole } from "../lib/roles";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";

const router = Router();
const LOAN_STATUSES = new Set(["pending_review", "approved", "rejected", "disbursed", "repaid"]);
const VERIFICATION_STATUSES = new Set(["unverified", "pending_review", "verified", "rejected"]);
const MANUAL_LOAN_ROLES = new Set(["farmer_pro", "buyer_enterprise"]);
const MANUAL_LOAN_PRODUCTS = new Set(["seasonal_working_capital", "equipment_top_up", "buyer_contract_financing"]);
const TRANSACTION_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

function isMissingLoanOffersTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message ?? "") : "";
  return message.includes("micro_loan_offers") && message.includes("schema cache");
}

function escapeCsv(value: unknown) {
  const normalized = String(value ?? "");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
}

function toNumberOrNull(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function toIntegerOrNull(value: unknown) {
  const numericValue = toNumberOrNull(value);
  if (numericValue === null) return null;
  return Math.round(numericValue);
}

function computeLoanEligibility(params: {
  role: "farmer_pro" | "buyer_enterprise";
  profile: {
    full_name?: string | null;
    phone?: string | null;
    county?: string | null;
    payout_method?: string | null;
    payout_mpesa_number?: string | null;
    bank_name?: string | null;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
  } | null | undefined;
  verificationStatus?: string | null;
  orders: Array<{ total_price?: number | null; created_at: string; status?: string | null; payment_status?: string | null }>;
}) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const qualifiedOrders = params.orders.filter((order) => {
    const createdAt = new Date(order.created_at);
    const hasQualifiedPayment = order.payment_status === "paid" || TRANSACTION_STATUSES.has(String(order.status ?? ""));
    return hasQualifiedPayment && createdAt >= ninetyDaysAgo;
  });

  const revenue90 = qualifiedOrders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
  const totalQualifiedOrders = qualifiedOrders.length;
  const averageMonthlyRevenue = revenue90 / 3;

  const hasPayout =
    params.profile?.payout_method === "mpesa"
      ? Boolean(params.profile?.payout_mpesa_number?.trim())
      : params.profile?.payout_method === "bank"
        ? Boolean(
            params.profile?.bank_name?.trim() &&
              params.profile?.bank_account_name?.trim() &&
              params.profile?.bank_account_number?.trim(),
          )
        : false;

  const readinessChecks = [
    params.verificationStatus === "verified",
    hasPayout,
    Boolean(params.profile?.full_name?.trim() && params.profile?.phone?.trim() && params.profile?.county?.trim()),
    totalQualifiedOrders >= 2,
    revenue90 >= 10000,
  ];

  const allChecksMet = readinessChecks.every(Boolean);
  const scoreMultiplier = params.role === "buyer_enterprise" ? 1.1 : 0.8;
  const rawEligibleAmount = averageMonthlyRevenue * scoreMultiplier;
  const minimumEligibleAmount = params.role === "buyer_enterprise" ? 25000 : 10000;
  const maxEligibleAmount = params.role === "buyer_enterprise" ? 1200000 : 250000;
  const eligibleAmount = allChecksMet
    ? Math.max(minimumEligibleAmount, Math.min(maxEligibleAmount, Math.round(rawEligibleAmount / 1000) * 1000))
    : 0;

  return {
    isEligible: allChecksMet && eligibleAmount > 0,
    eligibleAmount,
    averageMonthlyRevenue,
    totalQualifiedOrders,
  };
}

router.use(authenticate);
router.use(async (req: AuthRequest, res, next) => {
  const role = await resolveAppRole(req.supabase!, req.userId!, req.requestedRole);
  if (role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
});

router.get("/overview", async (_req, res) => {
  const admin = getSupabaseAdmin();

  const [
    { count: usersCount, error: usersError },
    { count: productsCount, error: productsError },
    { count: ordersCount, error: ordersError },
    { count: loansCount, error: loansError },
    { count: pendingLoansCount, error: pendingLoansError },
    { count: pendingVerificationsCount, error: pendingVerificationsError },
    { count: adminCount, error: adminCountError },
    { data: loansValueRows, error: loansValueError },
  ] = await Promise.all([
    admin.from("profiles").select("user_id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("micro_loan_applications").select("id", { count: "exact", head: true }),
    admin.from("micro_loan_applications").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    admin.from("id_verifications").select("id", { count: "exact", head: true }).in("status", ["pending_review", "unverified"]),
    admin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("micro_loan_applications").select("approved_amount, requested_amount"),
  ]);

  if (usersError || productsError || ordersError || loansError || pendingLoansError || pendingVerificationsError || adminCountError || loansValueError) {
    throw usersError || productsError || ordersError || loansError || pendingLoansError || pendingVerificationsError || adminCountError || loansValueError;
  }

  const totalApprovedLoanValue = (loansValueRows ?? []).reduce((sum, row) => {
    const amount = Number(row.approved_amount ?? row.requested_amount ?? 0);
    return sum + amount;
  }, 0);

  res.json({
    usersCount: usersCount ?? 0,
    productsCount: productsCount ?? 0,
    ordersCount: ordersCount ?? 0,
    loansCount: loansCount ?? 0,
    pendingLoansCount: pendingLoansCount ?? 0,
    pendingVerificationsCount: pendingVerificationsCount ?? 0,
    adminCount: adminCount ?? 0,
    totalApprovedLoanValue,
  });
});

router.get("/analytics", async (_req, res) => {
  const admin = getSupabaseAdmin();
  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id, product_id, quantity, total_price, status, payment_status, created_at")
    .order("created_at", { ascending: true });

  if (ordersError) throw ordersError;

  const productIds = Array.from(new Set((orders ?? []).map((order) => order.product_id)));
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, category")
    .in("id", productIds);

  if (productsError) throw productsError;

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const now = new Date();
  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      key,
      month: date.toLocaleDateString("en-KE", { month: "short" }),
      orders: 0,
      revenue: 0,
    };
  });
  const monthLookup = new Map(monthKeys.map((item) => [item.key, item]));
  const cropDemand = new Map<string, { crop: string; orders: number; quantity: number; revenue: number }>();

  (orders ?? []).forEach((order) => {
    if (order.status === "cancelled") return;

    const orderDate = new Date(order.created_at);
    const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
    const monthEntry = monthLookup.get(monthKey);
    if (monthEntry) {
      monthEntry.orders += 1;
      monthEntry.revenue += Number(order.total_price ?? 0);
    }

    const hasDemandSignal = order.payment_status === "paid" || TRANSACTION_STATUSES.has(order.status);
    if (!hasDemandSignal) return;

    const product = productsById.get(order.product_id);
    const cropName = product?.name?.trim() || product?.category?.trim() || "Unknown crop";
    const existing = cropDemand.get(cropName) ?? { crop: cropName, orders: 0, quantity: 0, revenue: 0 };
    existing.orders += 1;
    existing.quantity += Number(order.quantity ?? 0);
    existing.revenue += Number(order.total_price ?? 0);
    cropDemand.set(cropName, existing);
  });

  const demand = Array.from(cropDemand.values()).sort((left, right) => {
    if (right.orders !== left.orders) return right.orders - left.orders;
    if (right.quantity !== left.quantity) return right.quantity - left.quantity;
    return right.revenue - left.revenue;
  });

  res.json({
    orderTrend: monthKeys,
    cropDemand: demand.slice(0, 8),
    topCrop: demand[0] ?? null,
  });
});

router.get("/users", async (_req, res) => {
  const admin = getSupabaseAdmin();

  const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }, authUsersResponse] = await Promise.all([
    admin.from("profiles").select("user_id, full_name, county, phone, created_at, updated_at").order("created_at", { ascending: false }),
    admin.from("user_roles").select("user_id, role"),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);

  if (profilesError) throw profilesError;
  if (rolesError) throw rolesError;
  if (authUsersResponse.error) throw authUsersResponse.error;

  const roleByUserId = new Map((roles ?? []).map((item) => [item.user_id, item.role]));
  const authByUserId = new Map(authUsersResponse.data.users.map((item) => [item.id, item]));

  res.json(
    (profiles ?? []).map((profile) => {
      const authUser = authByUserId.get(profile.user_id);
      return {
        ...profile,
        email: authUser?.email ?? null,
        email_confirmed_at: authUser?.email_confirmed_at ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        role: (roleByUserId.get(profile.user_id) ?? "farmer_free") as AppRole,
      };
    }),
  );
});

router.patch("/users/:userId/role", async (req, res) => {
  const nextRole = req.body?.role;
  if (!isAppRole(nextRole)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const admin = getSupabaseAdmin();
  const userId = req.params.userId;

  const { error: deleteError } = await admin.from("user_roles").delete().eq("user_id", userId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await admin.from("user_roles").insert({ user_id: userId, role: nextRole });
  if (insertError) throw insertError;

  res.json({ user_id: userId, role: nextRole });
});

router.get("/orders", async (_req, res) => {
  const admin = getSupabaseAdmin();
  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (ordersError) throw ordersError;

  const productIds = Array.from(new Set((orders ?? []).map((order) => order.product_id)));
  const userIds = Array.from(new Set((orders ?? []).flatMap((order) => [order.buyer_id, order.farmer_id])));

  const [{ data: products, error: productsError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.from("products").select("id, name, cover_image_url, image_emoji").in("id", productIds),
    admin.from("profiles").select("user_id, full_name").in("user_id", userIds),
  ]);

  if (productsError) throw productsError;
  if (profilesError) throw profilesError;

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const profilesByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));

  res.json(
    (orders ?? []).map((order) => ({
      ...order,
      product: productsById.get(order.product_id) ?? null,
      buyer_profile: profilesByUserId.get(order.buyer_id) ?? null,
      farmer_profile: profilesByUserId.get(order.farmer_id) ?? null,
    })),
  );
});

router.get("/loan-candidates", async (_req, res) => {
  const admin = getSupabaseAdmin();

  const [{ data: roles, error: rolesError }, { data: profiles, error: profilesError }, { data: verifications, error: verificationsError }, { data: orders, error: ordersError }] =
    await Promise.all([
      admin.from("user_roles").select("user_id, role").eq("role", "farmer_pro"),
      admin
        .from("profiles")
        .select("user_id, full_name, county, phone, payout_method, payout_mpesa_number, bank_name, bank_account_name, bank_account_number"),
      admin.from("id_verifications").select("user_id, status"),
      admin.from("orders").select("farmer_id, total_price, created_at, status, payment_status"),
    ]);

  if (rolesError || profilesError || verificationsError || ordersError) {
    throw rolesError || profilesError || verificationsError || ordersError;
  }

  const qualifiedUserIds = new Set((roles ?? []).map((item) => item.user_id));
  const verificationByUserId = new Map((verifications ?? []).map((item) => [item.user_id, item.status]));
  const ordersByUserId = new Map<string, Array<{ total_price?: number | null; created_at: string; status?: string | null; payment_status?: string | null }>>();

  for (const order of orders ?? []) {
    if (!qualifiedUserIds.has(order.farmer_id)) continue;
    const existing = ordersByUserId.get(order.farmer_id) ?? [];
    existing.push(order);
    ordersByUserId.set(order.farmer_id, existing);
  }

  const candidates = (profiles ?? [])
    .filter((profile) => qualifiedUserIds.has(profile.user_id))
    .map((profile) => {
      const eligibility = computeLoanEligibility({
        role: "farmer_pro",
        profile,
        verificationStatus: verificationByUserId.get(profile.user_id) ?? null,
        orders: ordersByUserId.get(profile.user_id) ?? [],
      });

      return {
        user_id: profile.user_id,
        full_name: profile.full_name ?? null,
        county: profile.county ?? null,
        phone: profile.phone ?? null,
        role: "farmer_pro",
        ...eligibility,
      };
    })
    .filter((candidate) => candidate.isEligible)
    .sort((left, right) => right.eligibleAmount - left.eligibleAmount);

  res.json(candidates);
});

router.get("/loan-offers", async (_req, res) => {
  const admin = getSupabaseAdmin();
  const { data: offers, error } = await admin
    .from("micro_loan_offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingLoanOffersTable(error)) return res.json([]);
    throw error;
  }
  res.json((offers ?? []).map((offer) => ({
    ...offer,
    max_amount: Number(offer.max_amount ?? 0),
    interest_rate: offer.interest_rate === null ? null : Number(offer.interest_rate),
    repayment_days: offer.repayment_days === null ? null : Number(offer.repayment_days),
  })));
});

router.post("/loan-offers", async (req, res) => {
  const {
    applicant_role,
    product_type,
    product_title,
    max_amount,
    interest_rate,
    repayment_days,
    speed,
    note,
  } = req.body ?? {};

  if (typeof applicant_role !== "string" || !MANUAL_LOAN_ROLES.has(applicant_role)) {
    return res.status(400).json({ error: "Applicant role must be farmer_pro or buyer_enterprise." });
  }

  if (typeof product_type !== "string" || !MANUAL_LOAN_PRODUCTS.has(product_type)) {
    return res.status(400).json({ error: "Select a valid loan product type." });
  }

  if (typeof product_title !== "string" || !product_title.trim()) {
    return res.status(400).json({ error: "Loan product title is required." });
  }

  const maxAmount = toNumberOrNull(max_amount);
  if (maxAmount === null || maxAmount <= 0) {
    return res.status(400).json({ error: "Maximum offer amount must be greater than zero." });
  }

  const admin = getSupabaseAdmin();
  const timestamp = new Date().toISOString();
  const { data, error } = await admin
    .from("micro_loan_offers")
    .insert({
      applicant_role,
      product_type,
      product_title: product_title.trim(),
      max_amount: maxAmount,
      interest_rate: toNumberOrNull(interest_rate),
      repayment_days: toIntegerOrNull(repayment_days),
      speed: typeof speed === "string" && speed.trim() ? speed.trim() : null,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      is_active: true,
      updated_at: timestamp,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingLoanOffersTable(error)) {
      return res.status(400).json({ error: "Loan offers table is missing. Run the micro_loan_offers SQL migration first." });
    }
    throw error;
  }
  res.status(201).json(data);
});

router.patch("/loan-offers/:offerId", async (req, res) => {
  const { product_title, max_amount, interest_rate, repayment_days, speed, note, is_active } = req.body ?? {};

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (product_title !== undefined) {
    if (typeof product_title !== "string" || !product_title.trim()) {
      return res.status(400).json({ error: "Loan product title is required." });
    }
    updates.product_title = product_title.trim();
  }

  if (max_amount !== undefined) {
    const maxAmount = toNumberOrNull(max_amount);
    if (maxAmount === null || maxAmount <= 0) {
      return res.status(400).json({ error: "Maximum offer amount must be greater than zero." });
    }
    updates.max_amount = maxAmount;
  }

  if (interest_rate !== undefined) updates.interest_rate = toNumberOrNull(interest_rate);
  if (repayment_days !== undefined) updates.repayment_days = toIntegerOrNull(repayment_days);
  if (speed !== undefined) updates.speed = typeof speed === "string" && speed.trim() ? speed.trim() : null;
  if (note !== undefined) updates.note = typeof note === "string" && note.trim() ? note.trim() : null;
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("micro_loan_offers")
    .update(updates)
    .eq("id", req.params.offerId)
    .select("*")
    .single();

  if (error) {
    if (isMissingLoanOffersTable(error)) {
      return res.status(400).json({ error: "Loan offers table is missing. Run the micro_loan_offers SQL migration first." });
    }
    throw error;
  }
  res.json(data);
});

router.delete("/loan-offers/:offerId", async (req, res) => {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("micro_loan_offers")
    .delete()
    .eq("id", req.params.offerId);

  if (error) {
    if (isMissingLoanOffersTable(error)) {
      return res.status(400).json({ error: "Loan offers table is missing. Run the micro_loan_offers SQL migration first." });
    }
    throw error;
  }
  res.status(204).send();
});

router.get("/loans", async (_req, res) => {
  const admin = getSupabaseAdmin();
  const { data: loans, error: loansError } = await admin
    .from("micro_loan_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (loansError) throw loansError;

  const userIds = Array.from(new Set((loans ?? []).map((loan) => loan.user_id)));
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, full_name, county, phone")
    .in("user_id", userIds);

  if (profilesError) throw profilesError;

  const profilesByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
  res.json((loans ?? []).map((loan) => ({ ...loan, profile: profilesByUserId.get(loan.user_id) ?? null })));
});

router.post("/loans", async (req, res) => {
  const {
    user_id,
    applicant_role,
    product_type,
    product_title,
    requested_amount,
    approved_amount,
    speed,
    status,
    note,
    interest_rate,
    repayment_days,
  } = req.body ?? {};

  if (typeof user_id !== "string" || !user_id.trim()) {
    return res.status(400).json({ error: "A valid borrower user ID is required." });
  }

  if (typeof applicant_role !== "string" || !MANUAL_LOAN_ROLES.has(applicant_role)) {
    return res.status(400).json({ error: "Applicant role must be farmer_pro or buyer_enterprise." });
  }

  if (typeof product_type !== "string" || !MANUAL_LOAN_PRODUCTS.has(product_type)) {
    return res.status(400).json({ error: "Select a valid loan product type." });
  }

  if (typeof product_title !== "string" || !product_title.trim()) {
    return res.status(400).json({ error: "Loan product title is required." });
  }

  const requestedAmount = toNumberOrNull(requested_amount);
  if (requestedAmount === null || requestedAmount <= 0) {
    return res.status(400).json({ error: "Requested amount must be greater than zero." });
  }

  const approvedAmount = toNumberOrNull(approved_amount);
  const interestRate = toNumberOrNull(interest_rate);
  const repaymentDays = toIntegerOrNull(repayment_days);
  const nextStatus = typeof status === "string" && status ? status : "approved";

  if (!LOAN_STATUSES.has(nextStatus)) {
    return res.status(400).json({ error: "Invalid loan status." });
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id, full_name, county, phone")
    .eq("user_id", user_id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    return res.status(404).json({ error: "Borrower profile not found." });
  }

  const timestamp = new Date().toISOString();
  const { data, error } = await admin
    .from("micro_loan_applications")
    .insert({
      user_id,
      applicant_role,
      product_type,
      product_title: product_title.trim(),
      requested_amount: requestedAmount,
      approved_amount: approvedAmount ?? requestedAmount,
      speed: typeof speed === "string" && speed.trim() ? speed.trim() : null,
      status: nextStatus,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      interest_rate: interestRate,
      repayment_days: repaymentDays,
      reviewed_at: timestamp,
      updated_at: timestamp,
    })
    .select("*")
    .single();

  if (error) throw error;
  res.status(201).json({ ...data, profile });
});

router.patch("/loans/:loanId", async (req, res) => {
  const { status, note, approved_amount, interest_rate, repayment_days } = req.body ?? {};

  if (status !== undefined && !LOAN_STATUSES.has(status)) {
    return res.status(400).json({ error: "Invalid loan status." });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status !== undefined) updates.status = status;
  if (note !== undefined) updates.note = note;
  if (approved_amount !== undefined) updates.approved_amount = Number(approved_amount);
  if (interest_rate !== undefined) updates.interest_rate = Number(interest_rate);
  if (repayment_days !== undefined) updates.repayment_days = Number(repayment_days);
  if (status !== undefined || note !== undefined || approved_amount !== undefined || interest_rate !== undefined || repayment_days !== undefined) {
    updates.reviewed_at = new Date().toISOString();
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("micro_loan_applications")
    .update(updates)
    .eq("id", req.params.loanId)
    .select("*")
    .single();

  if (error) throw error;
  res.json(data);
});

router.delete("/loans/:loanId", async (req, res) => {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("micro_loan_applications")
    .delete()
    .eq("id", req.params.loanId);

  if (error) throw error;
  res.status(204).send();
});

router.get("/verifications", async (_req, res) => {
  const admin = getSupabaseAdmin();
  const { data: verifications, error: verificationsError } = await admin
    .from("id_verifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (verificationsError) throw verificationsError;

  const userIds = Array.from(new Set((verifications ?? []).map((item) => item.user_id)));
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id, full_name, county, phone")
    .in("user_id", userIds);

  if (profilesError) throw profilesError;

  const profilesByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
  res.json((verifications ?? []).map((item) => ({ ...item, profile: profilesByUserId.get(item.user_id) ?? null })));
});

router.patch("/verifications/:verificationId", async (req, res) => {
  const { status, reviewer_note } = req.body ?? {};
  if (status !== undefined && !VERIFICATION_STATUSES.has(status)) {
    return res.status(400).json({ error: "Invalid verification status." });
  }

  const admin = getSupabaseAdmin();
  const updates: Record<string, unknown> = {
    reviewed_at: new Date().toISOString(),
  };

  if (status !== undefined) updates.status = status;
  if (reviewer_note !== undefined) updates.reviewer_note = reviewer_note;

  const { data, error } = await admin
    .from("id_verifications")
    .update(updates)
    .eq("id", req.params.verificationId)
    .select("*")
    .single();

  if (error) throw error;
  res.json(data);
});

router.get("/receipts/export", async (_req, res) => {
  const admin = getSupabaseAdmin();
  const { data: orders, error: ordersError } = await admin
    .from("orders")
    .select("id, product_id, buyer_id, farmer_id, quantity, unit, total_price, delivery_fee, status, payment_status, payment_method, payment_ref, paid_at, created_at")
    .order("created_at", { ascending: false });

  if (ordersError) throw ordersError;

  const productIds = Array.from(new Set((orders ?? []).map((order) => order.product_id)));
  const userIds = Array.from(new Set((orders ?? []).flatMap((order) => [order.buyer_id, order.farmer_id])));

  const [{ data: products, error: productsError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.from("products").select("id, name, category").in("id", productIds),
    admin.from("profiles").select("user_id, full_name").in("user_id", userIds),
  ]);

  if (productsError) throw productsError;
  if (profilesError) throw profilesError;

  const productsById = new Map((products ?? []).map((product) => [product.id, product]));
  const profilesByUserId = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
  const rows = [
    [
      "order_id",
      "created_at",
      "paid_at",
      "receipt_number",
      "payment_method",
      "payment_status",
      "order_status",
      "product_name",
      "category",
      "buyer_name",
      "farmer_name",
      "quantity",
      "unit",
      "subtotal_amount",
      "delivery_fee",
      "total_amount",
    ].join(","),
    ...(orders ?? []).map((order) => {
      const product = productsById.get(order.product_id);
      const buyer = profilesByUserId.get(order.buyer_id);
      const farmer = profilesByUserId.get(order.farmer_id);
      const deliveryFee = Number(order.delivery_fee ?? 0);
      const subtotal = Number(order.total_price ?? 0);
      return [
        order.id,
        order.created_at,
        order.paid_at ?? "",
        order.payment_ref ?? "",
        order.payment_method ?? "",
        order.payment_status ?? "",
        order.status ?? "",
        product?.name ?? "",
        product?.category ?? "",
        buyer?.full_name ?? "",
        farmer?.full_name ?? "",
        Number(order.quantity ?? 0),
        order.unit ?? "",
        subtotal,
        deliveryFee,
        subtotal + deliveryFee,
      ].map(escapeCsv).join(",");
    }),
  ];

  const dateStamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="agrilink-transaction-receipts-${dateStamp}.csv"`);
  res.send(rows.join("\n"));
});

export default router;
