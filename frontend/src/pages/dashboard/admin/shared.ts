import { supabase } from "@/integrations/supabase/client";
import { getStoredRole } from "@/lib/subscription";

export type AppRole = "farmer_free" | "farmer_pro" | "buyer_enterprise" | "admin";
export type LoanRole = "farmer_pro" | "buyer_enterprise";
export type LoanProductType = "seasonal_working_capital" | "equipment_top_up" | "buyer_contract_financing";

export type AdminOverview = {
  usersCount: number;
  productsCount: number;
  ordersCount: number;
  loansCount: number;
  pendingLoansCount: number;
  pendingVerificationsCount: number;
  adminCount: number;
  totalApprovedLoanValue: number;
};

export type AdminUser = {
  user_id: string;
  full_name: string | null;
  county: string | null;
  phone: string | null;
  created_at: string;
  email: string | null;
  role: AppRole;
};

export type AdminLoan = {
  id: string;
  product_title: string;
  product_type: LoanProductType;
  requested_amount: number;
  approved_amount: number | null;
  interest_rate: number | null;
  repayment_days: number | null;
  status: string;
  note: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
    county: string | null;
  } | null;
};

export type AdminLoanOffer = {
  id: string;
  applicant_role: LoanRole;
  product_type: LoanProductType;
  product_title: string;
  max_amount: number;
  interest_rate: number | null;
  repayment_days: number | null;
  speed: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminLoanCandidate = {
  user_id: string;
  full_name: string | null;
  county: string | null;
  phone: string | null;
  role: LoanRole;
  eligibleAmount: number;
  averageMonthlyRevenue: number;
  totalQualifiedOrders: number;
};

export type AdminOrder = {
  id: string;
  total_price: number;
  delivery_fee?: number | null;
  payment_status: string;
  payment_ref?: string | null;
  paid_at?: string | null;
  created_at: string;
  product: { name: string | null } | null;
  buyer_profile: { full_name: string | null } | null;
  farmer_profile: { full_name: string | null } | null;
};

export type AdminAnalytics = {
  orderTrend: { month: string; orders: number; revenue: number }[];
  cropDemand: { crop: string; orders: number; quantity: number; revenue: number }[];
  topCrop: { crop: string; orders: number; quantity: number; revenue: number } | null;
};

export type LoanOfferFormState = {
  applicant_role: LoanRole;
  product_type: LoanProductType;
  product_title: string;
  max_amount: string;
  interest_rate: string;
  repayment_days: string;
  speed: string;
  note: string;
};

export const ROLE_OPTIONS: AppRole[] = ["farmer_free", "farmer_pro", "buyer_enterprise", "admin"];
export const LOAN_STATUS_OPTIONS = ["pending_review", "approved", "rejected", "disbursed", "repaid"];
export const LOAN_PRODUCT_TITLES: Record<LoanProductType, string> = {
  seasonal_working_capital: "Seasonal Working Capital",
  equipment_top_up: "Equipment Top-Up",
  buyer_contract_financing: "Buyer Contract Financing",
};

export const initialLoanOfferForm: LoanOfferFormState = {
  applicant_role: "farmer_pro",
  product_type: "seasonal_working_capital",
  product_title: LOAN_PRODUCT_TITLES.seasonal_working_capital,
  max_amount: "",
  interest_rate: "",
  repayment_days: "",
  speed: "",
  note: "",
};

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value);
}

function parseFilename(contentDisposition: string | null) {
  return contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1] ?? `agrilink-transaction-receipts-${new Date().toISOString().slice(0, 10)}.csv`;
}

export async function downloadReceiptsCsv() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You need to sign in again before downloading receipts.");
  }

  const headers = new Headers({ Authorization: `Bearer ${session.access_token}` });
  const localRole = getStoredRole(session.user.id);
  if (localRole) headers.set("X-AgriLink-Role", localRole);

  const response = await fetch(`${import.meta.env.VITE_API_URL || "https://agrilink-x.onrender.com/api"}/admin/receipts/export`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Receipt export failed with status ${response.status}.`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = parseFilename(response.headers.get("content-disposition"));
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
