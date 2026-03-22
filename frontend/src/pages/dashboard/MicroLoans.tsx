import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CircleAlert,
  Clock3,
  CreditCard,
  Download,
  Eye,
  HandCoins,
  Lock,
  Search,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useIdVerification } from "@/hooks/useIdVerification";
import { useOrders } from "@/hooks/useOrders";
import { apiFetch } from "@/lib/api";

const enterpriseBenefits = [
  "Portfolio-level credit review across multiple farms and suppliers",
  "Contract-backed disbursement planning for bulk procurement cycles",
  "Repayment visibility linked to orders, deliveries, and settlement status",
];

const readinessIcons = [BadgeCheck, Clock3, Sparkles, Building2, BadgeCheck];

type LoanStatus = "pending_review" | "approved" | "rejected" | "disbursed" | "repaid";

type LoanRepayment = {
  id: string;
  amount: number;
  payment_method: string | null;
  payment_ref: string | null;
  phone_number: string | null;
  note: string | null;
  created_at: string;
};

type LoanSummary = {
  principal: number;
  annualInterestRate: number;
  scheduledPayment: number;
  scheduledNumberOfPayments: number;
  actualNumberOfPayments: number;
  paymentsPerYear: number;
  startDate: string;
  totalInterest: number;
  totalPayable: number;
  totalRepaid: number;
  remainingBalance: number;
};

type LoanScheduleRow = {
  paymentNumber: number;
  paymentDate: string;
  beginningBalance: number;
  scheduledPayment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
};

type LoanApplication = {
  id: string;
  product_type?: string | null;
  product_title: string;
  requested_amount: number;
  approved_amount: number | null;
  speed: string | null;
  interest_rate: number | null;
  repayment_days: number | null;
  status: LoanStatus;
  note: string | null;
  created_at: string;
  disbursed_at?: string | null;
  repaid_at?: string | null;
  repayments: LoanRepayment[];
  loan_summary: LoanSummary;
  amortization_schedule: LoanScheduleRow[];
};

type FundingOption = {
  key: string;
  productType?: string | null;
  title: string;
  rawAmount: number;
  amount: string;
  detail: string;
  speed: string;
  interestRate: number;
  repaymentDays: number;
  note: string | null;
};

function formatScheduleDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function downloadLoanReceipt(application: LoanApplication) {
  const currency = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  });

  const scheduleRows = application.amortization_schedule
    .map(
      (row) => `
        <tr>
          <td>${row.paymentNumber}</td>
          <td>${formatScheduleDate(row.paymentDate)}</td>
          <td>${currency.format(row.beginningBalance)}</td>
          <td>${currency.format(row.scheduledPayment)}</td>
          <td>${currency.format(row.principal)}</td>
          <td>${currency.format(row.interest)}</td>
          <td>${currency.format(row.endingBalance)}</td>
          <td>${currency.format(row.cumulativeInterest)}</td>
        </tr>`,
    )
    .join("");

  const repaymentRows = application.repayments.length
    ? application.repayments
        .map(
          (repayment) => `
            <tr>
              <td>${repayment.payment_ref || "Manual repayment"}</td>
              <td>${currency.format(repayment.amount)}</td>
              <td>${formatScheduleDate(repayment.created_at)}</td>
              <td>${repayment.phone_number || repayment.payment_method || "Repayment"}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="4">No repayments posted yet.</td></tr>`;

  const receiptWindow = window.open("", "_blank", "width=1200,height=900");
  if (!receiptWindow) return;

  receiptWindow.document.write(`
    <html>
      <head>
        <title>AgriLink Loan Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
          h1, h2, h3 { margin: 0 0 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #e8f5ee; color: #1d7a55; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
          .card { border: 1px solid #d9e2dd; border-radius: 12px; padding: 12px; }
          .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
          .value { font-size: 18px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th, td { border: 1px solid #d9e2dd; padding: 10px; text-align: left; }
          th { background: #f5f8f6; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: #6b7280; }
          .section { margin-top: 28px; }
          @media print {
            body { margin: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Loan Amortization Schedule</h1>
            <p>${application.product_title}</p>
            <p>Loan ID: ${application.id}</p>
          </div>
          <span class="badge">${application.status.replace("_", " ")}</span>
        </div>

        <div class="grid">
          <div class="card"><div class="label">Loan Amount</div><div class="value">${currency.format(application.loan_summary.principal)}</div></div>
          <div class="card"><div class="label">Annual Interest</div><div class="value">${application.loan_summary.annualInterestRate.toFixed(2)}%</div></div>
          <div class="card"><div class="label">Scheduled Payment</div><div class="value">${currency.format(application.loan_summary.scheduledPayment)}</div></div>
          <div class="card"><div class="label">Start Date</div><div class="value">${formatScheduleDate(application.loan_summary.startDate)}</div></div>
          <div class="card"><div class="label">Scheduled Payments</div><div class="value">${application.loan_summary.scheduledNumberOfPayments}</div></div>
          <div class="card"><div class="label">Actual Repayments</div><div class="value">${application.loan_summary.actualNumberOfPayments}</div></div>
          <div class="card"><div class="label">Total Interest</div><div class="value">${currency.format(application.loan_summary.totalInterest)}</div></div>
          <div class="card"><div class="label">Loan Balance</div><div class="value">${currency.format(application.loan_summary.remainingBalance)}</div></div>
        </div>

        <div class="section">
          <h3>Amortization Schedule</h3>
          <table>
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Payment Date</th>
                <th>Beginning Balance</th>
                <th>Scheduled Payment</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Ending Balance</th>
                <th>Cumulative Interest</th>
              </tr>
            </thead>
            <tbody>${scheduleRows}</tbody>
          </table>
        </div>

        <div class="section">
          <h3>Repayment History</h3>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Phone / Method</th>
              </tr>
            </thead>
            <tbody>${repaymentRows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}

function ProGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-lg overflow-hidden rounded-[1.75rem] border border-emerald-200/60 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92))] p-7 text-center shadow-[0_25px_80px_-40px_rgba(5,150,105,0.5)] dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.97),rgba(17,24,39,0.96))]"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-emerald-100 text-primary shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Micro Loans</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Upgrade to Pro to unlock revenue-based financing, loan readiness scoring, and faster access to working capital tools.
        </p>
        <div className="mt-6 grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-[1rem] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-background/60">
            <p className="font-semibold text-foreground">Financing readiness</p>
            <p className="mt-1">Track the exact profile, payout, and revenue checks lenders use.</p>
          </div>
          <div className="rounded-[1rem] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-background/60">
            <p className="font-semibold text-foreground">Credit visibility</p>
            <p className="mt-1">See your estimated loan ceiling update as your order history grows.</p>
          </div>
        </div>
        <Button asChild className="mt-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/dashboard/upgrade">
            <Zap className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}

function MicroLoansDashboard() {
  const [searchParams] = useSearchParams();
  const { role, profile, refreshProfile } = useAuth();
  const { sellingOrders, loading: ordersLoading, refetch: refetchOrders } = useOrders();
  const { verification, loading: verificationLoading, refetch: refetchVerification } = useIdVerification();
  const hasAccess = role === "farmer_pro" || role === "buyer_enterprise";
  const isEnterprise = role === "buyer_enterprise";
  const loading = ordersLoading || verificationLoading;
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [loanOffers, setLoanOffers] = useState<FundingOption[]>([]);
  const [loanOffersLoading, setLoanOffersLoading] = useState(true);
  const [applyingProduct, setApplyingProduct] = useState<string | null>(null);
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);
  const [repaymentDialogLoan, setRepaymentDialogLoan] = useState<LoanApplication | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentPhone, setRepaymentPhone] = useState("");
  const [selectedLoanReceipt, setSelectedLoanReceipt] = useState<LoanApplication | null>(null);
  const [currentLoanStep, setCurrentLoanStep] = useState(1);
  const [loanSidebarView, setLoanSidebarView] = useState<"active" | "closed">("active");
  const [loanListSearch, setLoanListSearch] = useState("");

  const currency = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  });

  const eligibility = useMemo(() => {
    const qualifiedStatuses = new Set(["confirmed", "processing", "shipped", "delivered"]);
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const qualifiedOrders = sellingOrders.filter((order) => {
      const createdAt = new Date(order.created_at);
      const hasQualifiedPayment = order.payment_status === "paid" || qualifiedStatuses.has(order.status);
      return hasQualifiedPayment && createdAt >= ninetyDaysAgo;
    });

    const revenue90 = qualifiedOrders.reduce((sum, order) => sum + order.total_price, 0);
    const totalQualifiedOrders = qualifiedOrders.length;
    const averageMonthlyRevenue = revenue90 / 3;

    const hasPayout =
      profile?.payout_method === "mpesa"
        ? Boolean(profile?.payout_mpesa_number?.trim())
        : profile?.payout_method === "bank"
          ? Boolean(
              profile?.bank_name?.trim() &&
                profile?.bank_account_name?.trim() &&
                profile?.bank_account_number?.trim(),
            )
          : false;

    const readinessChecks = [
      { label: "Verified identity", met: verification?.status === "verified" },
      { label: "Payout details completed", met: hasPayout },
      {
        label: "Contact profile completed",
        met: Boolean(profile?.full_name?.trim() && profile?.phone?.trim() && profile?.county?.trim()),
      },
      { label: "At least 2 successful orders in 90 days", met: totalQualifiedOrders >= 2 },
      { label: "At least KES 10,000 revenue in 90 days", met: revenue90 >= 10000 },
    ];

    const allChecksMet = readinessChecks.every((check) => check.met);
    const scoreMultiplier = isEnterprise ? 1.1 : 0.8;
    const rawEligibleAmount = averageMonthlyRevenue * scoreMultiplier;
    const minimumEligibleAmount = isEnterprise ? 25000 : 10000;
    const maxEligibleAmount = isEnterprise ? 1200000 : 250000;
    const eligibleAmount = allChecksMet
      ? Math.max(minimumEligibleAmount, Math.min(maxEligibleAmount, Math.round(rawEligibleAmount / 1000) * 1000))
      : 0;

    return {
      revenue90,
      totalQualifiedOrders,
      averageMonthlyRevenue,
      readinessChecks,
      missingRequirements: readinessChecks.filter((check) => !check.met),
      isEligible: hasAccess && allChecksMet,
      eligibleAmount,
      nextReviewWindow: isEnterprise ? "Priority review within 24 hours" : "Standard review within 24-48 hours",
    };
  }, [hasAccess, isEnterprise, profile, sellingOrders, verification?.status]);

  const readinessScore = Math.round(
    (eligibility.readinessChecks.filter((item) => item.met).length / eligibility.readinessChecks.length) * 100,
  );

  const activeLoanBalance = applications.reduce((sum, application) => {
    if (application.status === "rejected" || application.status === "repaid") return sum;
    return sum + Number(application.loan_summary?.remainingBalance ?? 0);
  }, 0);
  const netEligibleAmount = Math.max(0, eligibility.eligibleAmount - activeLoanBalance);
  const totalBorrowedAmount = applications.reduce(
    (sum, application) => sum + Number(application.approved_amount ?? application.requested_amount ?? 0),
    0,
  );

  const decision = !hasAccess
    ? {
        title: "Upgrade required",
        amount: "Unlock on paid plan",
        detail: "Upgrade to Farmer Pro or Buyer Enterprise to unlock live credit tracking and borrowing.",
        tone: "amber",
      }
    : loading
      ? {
          title: "Checking live eligibility",
          amount: "Calculating...",
          detail: "Syncing your orders, verification state, and payout profile.",
          tone: "slate",
        }
      : eligibility.isEligible
        ? {
            title: "Eligible",
            amount: currency.format(netEligibleAmount),
            detail: eligibility.nextReviewWindow,
            tone: "emerald",
          }
        : {
            title: "Not eligible yet",
            amount: currency.format(netEligibleAmount),
            detail: "Finish the missing checks below and keep growing revenue to unlock financing.",
            tone: "red",
          };

  const summaryCards = [
    {
      label: "Eligible Amount",
      value: !hasAccess ? "Locked" : loading ? "Loading..." : currency.format(netEligibleAmount),
      detail: "Live available amount after deducting your current active loan balance.",
      icon: CreditCard,
    },
    {
      label: "Past 90-Day Revenue",
      value: loading ? "Loading..." : currency.format(eligibility.revenue90),
      detail: "Revenue from paid or completed selling activity.",
      icon: TrendingUp,
    },
    {
      label: "Loan Balance",
      value: applicationsLoading ? "Loading..." : currency.format(activeLoanBalance),
      detail: isEnterprise ? "Outstanding enterprise financing already taken." : "Outstanding balance across active loans already taken.",
      icon: Banknote,
    },
    {
      label: "Readiness Score",
      value: loading ? "Loading..." : `${readinessScore}%`,
      detail: "Composite readiness across profile, payout, revenue, and ID checks.",
      icon: ShieldCheck,
    },
  ];

  const fundingOptions = loanOffers;

  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading, netEligibleAmount, eligibility.revenue90, readinessScore]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const formatRelativeTime = (value: string | Date | null) => {
    if (!value) return "just now";

    const date = typeof value === "string" ? new Date(value) : value;
    const diffMs = Math.max(0, nowTick - date.getTime());
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const loadApplications = async () => {
    if (!hasAccess) {
      setApplications([]);
      setApplicationsLoading(false);
      return;
    }

    setApplicationsLoading(true);
    try {
      const data = await apiFetch<LoanApplication[]>("/micro-loans/applications");
      setApplications(data);
    } catch (error) {
      toast.error(`Failed to load loan applications: ${(error as Error).message}`);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!hasAccess) {
      setLoanOffers([]);
      setLoanOffersLoading(false);
      return;
    }

    setLoanOffersLoading(true);
    try {
      const data = await apiFetch<Array<{
        id: string;
        product_type?: string | null;
        product_title: string;
        available_amount: number;
        speed: string | null;
        interest_rate: number | null;
        repayment_days: number | null;
        note: string | null;
      }>>("/micro-loans/offers");

      setLoanOffers(
        data.map((offer) => ({
          key: offer.id,
          productType: typeof offer.product_type === "string" ? offer.product_type : null,
          title: offer.product_title,
          rawAmount: offer.available_amount,
          amount: currency.format(offer.available_amount),
          detail: offer.note || "Published by admin and available to qualified borrowers.",
          speed: offer.speed || "Admin review",
          interestRate: Number(offer.interest_rate ?? 0),
          repaymentDays: Number(offer.repayment_days ?? 0),
          note: offer.note,
        })),
      );
    } catch (error) {
      toast.error(`Failed to load loan offers: ${(error as Error).message}`);
    } finally {
      setLoanOffersLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
    void loadOffers();
  }, [hasAccess]);

  useEffect(() => {
    if (!hasAccess) return;

    const interval = window.setInterval(() => {
      void refetchOrders();
      void refetchVerification();
      void refreshProfile();
      void loadApplications();
      void loadOffers();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [hasAccess, refetchOrders, refetchVerification, refreshProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOrders(), refetchVerification(), refreshProfile(), loadApplications(), loadOffers()]);
      setLastUpdated(new Date());
      toast.success("Micro loan data refreshed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleBorrow = async (offerId: string, amountLabel: string) => {
    setApplyingProduct(offerId);
    try {
      const amount = Number(amountLabel.replace(/[^\d.]/g, ""));
      await apiFetch<LoanApplication>("/micro-loans/applications", {
        method: "POST",
        body: {
          offerId,
          requestedAmount: amount,
        } as unknown as BodyInit,
      });
      toast.success("Loan application submitted successfully.");
      await loadApplications();
      await loadOffers();
      setLastUpdated(new Date());
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setApplyingProduct(null);
    }
  };

  const openRepaymentDialog = (application: LoanApplication) => {
    const remainingBalance = Number(application.loan_summary?.remainingBalance ?? 0);
    if (remainingBalance <= 0) {
      toast.success("This loan is already fully repaid.");
      return;
    }
    setRepaymentDialogLoan(application);
    setRepaymentAmount(String(Math.min(remainingBalance, application.loan_summary?.scheduledPayment ?? remainingBalance)));
    setRepaymentPhone(profile?.phone || profile?.payout_mpesa_number || "");
  };

  const handleRepayment = async () => {
    if (!repaymentDialogLoan) return;

    const amount = Number(repaymentAmount.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid repayment amount.");
      return;
    }

    if (!repaymentPhone.trim()) {
      toast.error("Enter the M-Pesa number to receive the STK prompt.");
      return;
    }

    setRepayingLoanId(repaymentDialogLoan.id);
    try {
      const response = await apiFetch<{ message: string; loan: LoanApplication }>(`/micro-loans/applications/${repaymentDialogLoan.id}/repay`, {
        method: "POST",
        body: {
          amount,
          phoneNumber: repaymentPhone,
        },
      });
      setApplications((current) => current.map((item) => (item.id === repaymentDialogLoan.id ? response.loan : item)));
      setSelectedLoanReceipt((current) => (current?.id === repaymentDialogLoan.id ? response.loan : current));
      toast.success(response.message);
      setLastUpdated(new Date());
      setRepaymentDialogLoan(null);
      setRepaymentAmount("");
      setRepaymentPhone("");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRepayingLoanId(null);
    }
  };

  const liveApplicationsCount = applications.filter((application) =>
    ["pending_review", "approved", "disbursed"].includes(application.status),
  ).length;
  const activeLoanTypes = new Set(
    applications
      .filter((application) => ["pending_review", "approved", "disbursed"].includes(application.status))
      .map((application) => application.product_type)
      .filter(Boolean),
  );
  const loanSteps = [
    {
      title: "Prepare Profile",
      detail: "Only needed if readiness items are still missing.",
    },
    {
      title: "Choose Product",
      detail: "Review financing products and borrow.",
    },
    {
      title: "Manage Loan",
      detail: "Open receipts, follow schedule, and repay.",
    },
  ];

  const normalizedLoanListSearch = loanListSearch.trim().toLowerCase();
  const filteredApplications = applications.filter((application) => {
    if (!normalizedLoanListSearch) return true;
    const haystack = [
      application.id,
      application.product_title,
      application.status,
      application.note,
      application.repayments.map((repayment) => repayment.payment_ref).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedLoanListSearch);
  });
  const activeApplications = filteredApplications.filter((application) => application.status !== "repaid" && application.status !== "rejected");
  const closedApplications = filteredApplications.filter((application) => application.status === "repaid" || application.status === "rejected");
  const latestApplication = applications[0] ?? null;
  const latestActiveApplication = activeApplications[0] ?? null;
  const requestedSection = searchParams.get("section");
  const isBorrowSection = !requestedSection || requestedSection === "borrow";
  const isRepaySection = requestedSection === "repay";
  const isStatusSection = requestedSection === "status";
  const isFocusedActionSection = isRepaySection || isStatusSection;
  const showHeroOverview = false;
  const showSummaryCards = false;
  const showStepsPanel = false;
  const showPrepareProfileSection = isBorrowSection && !eligibility.isEligible;
  const showBorrowLoanSection = isBorrowSection;
  const showManageLoanSection = isFocusedActionSection;
  const focusedSectionIntro = isBorrowSection
    ? {
        title: "Borrow Loan",
        detail: "Choose a financing product, review terms, and submit your loan request from here.",
      }
    : isRepaySection
      ? {
          title: "Repay Loan",
          detail: "Open active loans, check balances, and make repayments quickly from this page.",
        }
      : isStatusSection
        ? {
            title: "Loan Status",
            detail: "Track current and closed loan status clearly, with balances, repayment progress, and receipts.",
          }
        : null;

  useEffect(() => {
    if (!requestedSection || requestedSection === "borrow") {
      setCurrentLoanStep(1);
      return;
    }

    if (requestedSection === "repay") {
      setCurrentLoanStep(2);
      setLoanSidebarView("active");
      return;
    }

    if (requestedSection === "status") {
      setCurrentLoanStep(2);
      setLoanSidebarView("active");
      return;
    }

    if (!hasAccess) {
      setCurrentLoanStep(1);
      return;
    }

    if (applications.length > 0) {
      setCurrentLoanStep(2);
      return;
    }

    if (eligibility.isEligible) {
      setCurrentLoanStep(1);
      return;
    }

    setCurrentLoanStep(0);
  }, [applications.length, eligibility.isEligible, hasAccess, requestedSection]);

  useEffect(() => {
    if (loanSidebarView === "active" && !activeApplications.length && closedApplications.length) {
      setLoanSidebarView("closed");
      return;
    }

    if (loanSidebarView === "closed" && !closedApplications.length && activeApplications.length) {
      setLoanSidebarView("active");
    }
  }, [activeApplications.length, closedApplications.length, loanSidebarView]);

  return (
    <div className="space-y-5">
      {showHeroOverview ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.45rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.18),_transparent_40%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--primary)/0.06))] p-5 shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <CreditCard className="h-3.5 w-3.5" />
                  Growth Finance
                </span>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                    {isEnterprise
                      ? "Capital planning for procurement cycles and supply networks."
                      : "Revenue-linked financing built around actual farm performance."}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                    {hasAccess
                      ? isEnterprise
                        ? "Track financing readiness, loan activity, and enterprise review timelines from one place."
                        : "See what you qualify for now, what is blocking approval, and what changes as your farm performance grows."
                      : "Move to a paid plan to unlock micro-loans, credit scoring, and financing readiness tracking."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  {loading
                    ? "Syncing live data..."
                    : isEnterprise
                      ? "Enterprise loan access"
                      : "Live financing data"}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl bg-background/80"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[1.15rem] border border-border/70 bg-background/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Current Decision
                </p>
                <p className="mt-3 font-display text-2xl font-bold text-foreground">{decision.title}</p>
                <p className="mt-1 text-lg font-semibold text-primary">{decision.amount}</p>
                <p className="mt-2 text-sm text-muted-foreground">{decision.detail}</p>
              </div>

              <div className="rounded-[1.15rem] border border-border/70 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Readiness Meter
                  </p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                    {loading ? "Syncing..." : `${readinessScore}% ready`}
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      decision.tone === "emerald"
                        ? "bg-[linear-gradient(90deg,#10b981,#0ea5e9)]"
                        : decision.tone === "amber"
                          ? "bg-[linear-gradient(90deg,#f59e0b,#f97316)]"
                          : decision.tone === "red"
                            ? "bg-[linear-gradient(90deg,#ef4444,#f97316)]"
                            : "bg-[linear-gradient(90deg,#64748b,#94a3b8)]"
                    }`}
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {hasAccess
                    ? "Eligibility updates automatically as your revenue and financing profile improve."
                    : "Unlock this score on a paid plan and start building financing readiness."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {lastUpdated ? `Last updated ${formatRelativeTime(lastUpdated)}` : "Waiting for first sync"}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bento-card"
          >
            <div className="mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Finance Snapshot
                </p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  {isEnterprise
                    ? "Buyer Enterprise"
                    : lastUpdated
                      ? `Synced ${formatRelativeTime(lastUpdated)}`
                      : "Live"}
                </span>
              </div>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">What lenders will see</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1rem] border border-border bg-background/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Live Pulse</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  <p className="text-sm font-semibold text-foreground">
                    {liveApplicationsCount
                      ? `${liveApplicationsCount} active loan request${liveApplicationsCount > 1 ? "s" : ""}`
                      : "Ready for your first live loan"}
                  </p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  This tab refreshes financing signals every minute and immediately after manual refresh.
                </p>
              </div>

              <div className="rounded-[1rem] border border-border bg-background/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Review Window</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {!hasAccess ? "Unavailable" : eligibility.nextReviewWindow}
                </p>
              </div>

              <div className="rounded-[1rem] border border-border bg-background/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Average Monthly Revenue</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">
                  {loading ? "Loading..." : currency.format(eligibility.averageMonthlyRevenue)}
                </p>
              </div>

              <div className="rounded-[1rem] border border-border bg-background/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Plan Access</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {hasAccess ? (isEnterprise ? "Buyer Enterprise" : "Farmer Pro") : "Farmer Free"}
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}

      {showSummaryCards ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.05 }}
              className="bento-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">{card.label}</p>
              <p className="mt-1 break-words font-display text-lg font-bold leading-tight text-foreground sm:text-xl">
                {card.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p>
            </motion.div>
          ))}
        </div>
      ) : null}

      {focusedSectionIntro ? (
        <section className="rounded-[1.2rem] border border-sky-200/70 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(255,255,255,0.96))] p-4 shadow-[0_16px_28px_-24px_rgba(14,165,233,0.35)] dark:bg-card/90">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">Micro Loans</p>
              <h2 className="mt-3 font-display text-2xl font-bold text-foreground">{focusedSectionIntro.title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{focusedSectionIntro.detail}</p>
            </div>
            <div className="rounded-[0.95rem] border border-sky-200/70 bg-white/80 px-4 py-3 dark:border-sky-500/20 dark:bg-background/70">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {isBorrowSection ? "Loan Ceiling" : isRepaySection ? "Outstanding" : "Tracked Loans"}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {isBorrowSection
                  ? currency.format(netEligibleAmount)
                  : isRepaySection
                    ? currency.format(activeLoanBalance)
                    : String(applications.length)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {showStepsPanel ? (
        <section className="rounded-[1.1rem] border border-border/70 bg-white/90 p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Micro Loan Steps</p>
              <p className="text-sm text-muted-foreground">
                {applications.length
                  ? "You already have loan activity, so the flow opens directly on loan management."
                  : eligibility.isEligible
                    ? "Your profile is already ready, so you can go straight to financing products."
                    : "Complete the missing readiness checks, then move to products and repayment."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-9 rounded-xl px-4" disabled={currentLoanStep === 0} onClick={() => setCurrentLoanStep((step) => Math.max(step - 1, 0))}>
                Back
              </Button>
              <Button type="button" className="h-9 rounded-xl px-4" disabled={currentLoanStep === loanSteps.length - 1} onClick={() => setCurrentLoanStep((step) => Math.min(step + 1, loanSteps.length - 1))}>
                Next
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
            {loanSteps.map((step, index) => {
              const active = currentLoanStep === index;
              const complete = currentLoanStep > index;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setCurrentLoanStep(index)}
                  className={`rounded-[0.95rem] border px-3.5 py-3 text-left transition-colors ${
                    active
                      ? "border-emerald-400 bg-emerald-600 text-white"
                      : complete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-border bg-background text-foreground"
                  }`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${active ? "text-white/80" : "text-muted-foreground"}`}>
                    Step {index + 1}
                  </p>
                  <p className="mt-2 font-semibold">{step.title}</p>
                  <p className={`mt-1 text-sm ${active ? "text-white/85" : "text-muted-foreground"}`}>{step.detail}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {showPrepareProfileSection ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="rounded-[1.1rem] border border-border/70 bg-white/90 p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-primary/10">
                <HandCoins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Step 1: Prepare Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Use the financing checks below to improve approval odds.
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">
              {hasAccess
                ? isEnterprise
                  ? "Enterprise financing uses revenue history, readiness signals, and supply-side patterns to estimate credit capacity."
                  : "Your financing estimate is driven by recent platform revenue and updates as more qualifying orders come in."
                : "Upgrade your plan to unlock financing readiness tracking and live credit estimates from this dashboard."}
            </p>

            {hasAccess && !loading && !eligibility.isEligible && eligibility.missingRequirements.length > 0 && (
              <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                  <CircleAlert className="h-4 w-4" />
                  Missing requirements
                </div>
                <div className="mt-3 space-y-2">
                  {eligibility.missingRequirements.map((requirement) => (
                    <p key={requirement.label} className="text-sm text-amber-900 dark:text-amber-100">
                      {requirement.label}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {isEnterprise && (
              <div className="mt-4 rounded-[1rem] border border-border bg-background/70 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Enterprise credit notes
                </p>
                <div className="mt-3 space-y-3">
                  {enterpriseBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 text-sm text-foreground">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {hasAccess ? (
                <>
                  <Button asChild className="rounded-xl">
                    <Link to="/dashboard/profile?section=payout">
                      {eligibility.isEligible ? "Update Financing Profile" : "Prepare Financing Profile"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/dashboard/profile?section=verification">Open Verification</Link>
                  </Button>
                </>
              ) : (
                <Button asChild className="rounded-xl">
                  <Link to="/dashboard/upgrade">
                    Upgrade Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="rounded-[1.1rem] border border-border/70 bg-white/90 p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">Loan Readiness</h3>
                  <p className="text-sm text-muted-foreground">The operational checks that shape approval.</p>
                </div>
              </div>

              <div className="space-y-3">
                {eligibility.readinessChecks.map((item, index) => {
                  const Icon = readinessIcons[index] ?? BadgeCheck;
                  return (
                    <div
                      key={item.label}
                      className="flex flex-wrap items-center gap-3 rounded-[0.95rem] border border-border bg-background/70 px-3.5 py-2.5"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          item.met ? "bg-emerald-100 dark:bg-emerald-500/10" : "bg-amber-100 dark:bg-amber-500/10"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            item.met ? "text-primary" : "text-amber-600 dark:text-amber-300"
                          }`}
                        />
                      </div>
                      <span className="min-w-0 flex-1 text-sm leading-6 text-foreground">{item.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          item.met
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        }`}
                      >
                        {item.met ? "Ready" : "Missing"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.1rem] border border-border/70 bg-white/90 p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
              <h3 className="font-display text-xl font-bold text-foreground">Why This Score Moves</h3>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Paid and completed orders strengthen your financing history and raise the revenue ceiling.</p>
                <p>Verified identity and complete payout details reduce approval friction for disbursement.</p>
                <p>Contact details and county information improve lender confidence in your operating profile.</p>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}

      {showBorrowLoanSection ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[1.1rem] border border-sky-100/80 bg-white/95 p-3.5 shadow-[0_16px_28px_-24px_rgba(14,165,233,0.22)] dark:border-sky-500/20 dark:bg-card/90"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-sky-100">
                <Banknote className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Borrow Loan</h3>
                <p className="text-sm text-muted-foreground">
                  Review financing products and borrow the right option.
                </p>
              </div>
            </div>

            <div className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-muted-foreground">
              {eligibility.isEligible
                ? "Financing window open"
                : hasAccess
                  ? "Complete readiness to unlock more"
                  : "Upgrade to unlock live financing"}
            </div>
          </div>

          {loanOffersLoading ? (
            <div className="rounded-[1rem] border border-border bg-background/60 p-4 text-sm text-muted-foreground">
              Loading published loan offers...
            </div>
          ) : fundingOptions.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-sky-200 bg-sky-50/60 p-4 text-sm text-muted-foreground">
              No published loan offers are live yet. Once admin creates one, it will appear here for qualified borrowers.
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {fundingOptions.map((option, index) => {
              const optionHasDuplicate = Boolean(option.productType && activeLoanTypes.has(option.productType));
              const accentTone =
                index === 0
                  ? "border-emerald-200/80 from-emerald-50 via-white to-emerald-100/70 dark:border-emerald-500/30 dark:from-emerald-500/12 dark:via-slate-950/95 dark:to-emerald-500/8"
                  : index === 1
                    ? "border-teal-200/80 from-teal-50 via-white to-cyan-100/70 dark:border-cyan-500/30 dark:from-cyan-500/12 dark:via-slate-950/95 dark:to-teal-500/8"
                    : "border-lime-200/80 from-lime-50 via-white to-emerald-100/70 dark:border-lime-500/30 dark:from-lime-500/12 dark:via-slate-950/95 dark:to-emerald-500/8";

              return (
                <div
                  key={option.title}
                  className="flex h-full min-w-0 flex-col rounded-[1rem] border border-border/70 bg-white/95 p-3.5 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-foreground/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:bg-white/5 dark:text-slate-300">
                      Product
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">{option.speed}</span>
                  </div>

                  <p className="mt-3 max-w-full break-words font-display text-[1.25rem] font-bold leading-tight text-foreground sm:text-[1.4rem]">
                    {option.title}
                  </p>

                  <div className={`mt-3 rounded-[0.95rem] border bg-gradient-to-br p-3.5 ${accentTone}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-200/80">
                      Amount Available
                    </p>
                    <p className="mt-2 break-words font-display text-[1.45rem] font-black leading-tight tracking-tight text-emerald-950 sm:text-[1.7rem] dark:text-white">
                      {option.amount}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-emerald-900/70 dark:text-slate-300">
                      Published by admin and adjusted to your current eligibility limit.
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.detail}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/80">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Interest
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{option.interestRate}% p.a.</p>
                    </div>
                    <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/80">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Repayment
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-foreground">
                        {option.repaymentDays} days
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/80">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Speed
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{option.speed}</p>
                      </div>
                      <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5 dark:border-white/10 dark:bg-slate-950/80">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Status
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-foreground">
                          {optionHasDuplicate ? "Already applied" : eligibility.isEligible ? "Available" : hasAccess ? "Needs readiness" : "Plan locked"}
                        </p>
                      </div>
                    </div>

                    {optionHasDuplicate ? (
                      <div className="mt-4 rounded-[0.85rem] border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                        You already have this loan type in progress. You can still apply for another posted loan.
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      className="mt-4 w-full rounded-xl"
                      disabled={!eligibility.isEligible || optionHasDuplicate || option.rawAmount <= 0 || applyingProduct === option.key}
                      onClick={() => void handleBorrow(option.key, option.amount)}
                    >
                      {applyingProduct === option.key ? "Submitting..." : "Borrow This Loan"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </motion.section>
      ) : null}

      {showManageLoanSection ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div className={`grid gap-4 ${isFocusedActionSection ? "grid-cols-1" : "xl:grid-cols-[300px_minmax(0,1fr)]"}`}>
            {!isFocusedActionSection ? (
            <aside className="rounded-[1.1rem] border border-border/70 bg-[linear-gradient(180deg,rgba(14,116,144,0.08),rgba(255,255,255,0.96))] p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
              <div className="rounded-[1rem] border border-cyan-200/70 bg-cyan-500 px-4 py-4 text-white shadow-[0_18px_30px_-24px_rgba(6,182,212,0.65)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">Micro Loan</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Loan Sidebar</h3>
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      Jump between active and closed loans, then open the next action quickly.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-white/15">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Loan Menu</p>
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setLoanSidebarView("active")}
                    className={`flex w-full items-center justify-between rounded-[0.95rem] border px-3 py-3 text-left transition-colors ${
                      loanSidebarView === "active"
                        ? "border-cyan-300 bg-cyan-50 text-cyan-950"
                        : "border-border bg-white/80 text-foreground hover:bg-background dark:border-white/10 dark:bg-background/70 dark:hover:bg-background/90"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-[0.8rem] ${loanSidebarView === "active" ? "bg-cyan-500 text-white" : "bg-primary/10 text-primary"}`}>
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">Active Loans</span>
                        <span className={`block text-xs ${loanSidebarView === "active" ? "text-cyan-800/80" : "text-muted-foreground"}`}>
                          Current balances and repayment actions
                        </span>
                      </span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${loanSidebarView === "active" ? "bg-cyan-500 text-white" : "bg-muted text-foreground"}`}>
                      {activeApplications.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoanSidebarView("closed")}
                    className={`flex w-full items-center justify-between rounded-[0.95rem] border px-3 py-3 text-left transition-colors ${
                      loanSidebarView === "closed"
                        ? "border-slate-300 bg-slate-100 text-slate-950 dark:border-slate-600 dark:bg-slate-800"
                        : "border-border bg-white/80 text-foreground hover:bg-background dark:border-white/10 dark:bg-background/70 dark:hover:bg-background/90"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-[0.8rem] ${loanSidebarView === "closed" ? "bg-slate-700 text-white dark:bg-slate-600" : "bg-primary/10 text-primary"}`}>
                        <Clock3 className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">Closed Loans</span>
                        <span className={`block text-xs ${loanSidebarView === "closed" ? "text-slate-700/80 dark:text-slate-300" : "text-muted-foreground"}`}>
                          Completed and rejected records
                        </span>
                      </span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${loanSidebarView === "closed" ? "bg-slate-700 text-white dark:bg-slate-600" : "bg-muted text-foreground"}`}>
                      {closedApplications.length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-border/70 bg-white/85 p-3 dark:border-white/10 dark:bg-background/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick Summary</p>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between rounded-[0.85rem] bg-background px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                    <span className="text-sm font-semibold text-foreground">{currency.format(activeLoanBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.85rem] bg-background px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">Total Borrowed</span>
                    <span className="text-sm font-semibold text-foreground">{currency.format(totalBorrowedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[0.85rem] bg-background px-3 py-2.5">
                    <span className="text-sm text-muted-foreground">Latest Loan</span>
                    <span className="text-sm font-semibold text-foreground">
                      {latestApplication ? latestApplication.id.slice(0, 8).toUpperCase() : "None"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1rem] border border-border/70 bg-white/85 p-3 dark:border-white/10 dark:bg-background/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick Actions</p>
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    disabled={!latestApplication}
                    onClick={() => latestApplication && setSelectedLoanReceipt(latestApplication)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Receipt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start rounded-xl"
                    disabled={!latestApplication}
                    onClick={() => latestApplication && downloadLoanReceipt(latestApplication)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </Button>
                  <Button
                    type="button"
                    className="w-full justify-start rounded-xl"
                    disabled={!latestActiveApplication || repayingLoanId === latestActiveApplication?.id}
                    onClick={() => latestActiveApplication && openRepaymentDialog(latestActiveApplication)}
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    Make Repayment
                  </Button>
                </div>
              </div>
            </aside>
            ) : null}

            <div className="rounded-[1.1rem] border border-border/70 bg-white/90 p-3.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-[0.9rem] ${isRepaySection ? "bg-sky-100" : "bg-primary/10"}`}>
                  <CreditCard className={`h-5 w-5 ${isRepaySection ? "text-sky-700" : "text-primary"}`} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{isRepaySection ? "Repay Loan" : "Loan Status"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRepaySection
                      ? "Use this page for repayment actions on active loans only."
                      : "Use this page to monitor the current status of all your loans."}
                  </p>
                </div>
              </div>

              <div className={`mb-3 rounded-[0.95rem] border p-3 ${isRepaySection ? "border-sky-100 bg-sky-50/60 dark:border-sky-500/20 dark:bg-sky-500/10" : "border-border/70 bg-background/70 dark:border-white/10 dark:bg-background/60"}`}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">{isRepaySection ? "Repayment Center" : "Loan Status Center"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRepaySection
                        ? "Search active loans, check balances, and pay the next installment."
                        : "Search loans, review balances, and track active or closed loan status."}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{isRepaySection ? "Repayable" : "Active"}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{activeApplications.length}</p>
                      </div>
                      <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Outstanding</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{currency.format(activeLoanBalance)}</p>
                      </div>
                      <div className="rounded-[0.85rem] border border-border bg-background px-3 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{isRepaySection ? "Latest Loan" : "Borrowed"}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{isRepaySection ? (latestActiveApplication ? latestActiveApplication.id.slice(0, 8).toUpperCase() : "None") : currency.format(totalBorrowedAmount)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full xl:max-w-sm">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={loanListSearch}
                        onChange={(event) => setLoanListSearch(event.target.value)}
                        placeholder={isRepaySection ? "Search active loans" : "Search loans"}
                        className="h-10 rounded-xl pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

            <Tabs value={isRepaySection ? "active" : loanSidebarView} onValueChange={(value) => !isRepaySection && setLoanSidebarView(value as "active" | "closed")} className="w-full">
              {!isRepaySection ? (
                <TabsList className="grid w-full grid-cols-2 rounded-[0.85rem] bg-muted p-1">
                  <TabsTrigger value="active" className="rounded-[0.8rem]">Active Loans</TabsTrigger>
                  <TabsTrigger value="closed" className="rounded-[0.8rem]">Closed Loans</TabsTrigger>
                </TabsList>
              ) : null}

              <TabsContent value="active" className="mt-5 space-y-3">
                {applicationsLoading ? (
                  <div className="rounded-[0.95rem] border border-border bg-background/70 p-3 text-sm text-muted-foreground">
                    Loading active loans...
                  </div>
                ) : !activeApplications.length ? (
                  <div className="rounded-[0.95rem] border border-dashed border-border bg-background/50 p-3 text-sm text-muted-foreground">
                    {loanListSearch ? "No active loans match that search." : "No active loans yet. Borrow a product in Step 2 to manage it here."}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[0.95rem] border border-border/70 bg-white/95 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-card/90 dark:shadow-[0_12px_24px_-24px_rgba(0,0,0,0.45)]">
                    <table className="w-full min-w-[1180px] border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-sky-50/70 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:bg-primary/5">
                          <th className="px-3 py-3">#</th>
                          <th className="px-3 py-3">Loan No</th>
                          <th className="px-3 py-3">Loan Date</th>
                          <th className="px-3 py-3">Product</th>
                          <th className="px-3 py-3">Loan Amt</th>
                          <th className="px-3 py-3">Int P.A</th>
                          <th className="px-3 py-3">Balance</th>
                          <th className="px-3 py-3">Repay</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeApplications.map((application, index) => (
                          <tr key={application.id} className="border-b border-border/70 align-middle last:border-b-0 hover:bg-muted/20">
                            <td className="px-3 py-3 text-sm font-semibold text-foreground">{index + 1}</td>
                            <td className="px-3 py-3 text-sm font-medium text-foreground">{application.id.slice(0, 8).toUpperCase()}</td>
                            <td className="px-3 py-3 text-sm text-muted-foreground">
                              {formatScheduleDate(application.loan_summary.startDate)}
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-medium text-foreground">{application.product_title}</p>
                              <p className="text-xs text-muted-foreground">
                                {application.repayment_days ?? 0} day term
                              </p>
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-foreground">
                              {currency.format(application.approved_amount ?? application.requested_amount)}
                            </td>
                            <td className="px-3 py-3 text-sm text-foreground">
                              {application.interest_rate !== null ? `${application.interest_rate}%` : "Pending"}
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-sm font-semibold text-foreground">{currency.format(application.loan_summary.remainingBalance)}</p>
                              <p className="text-xs text-muted-foreground">
                                Repaid {currency.format(application.loan_summary.totalRepaid)}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-sm font-semibold text-foreground">{currency.format(application.loan_summary.scheduledPayment)}</p>
                              <p className="text-xs text-muted-foreground">
                                {application.loan_summary.actualNumberOfPayments} payment{application.loan_summary.actualNumberOfPayments === 1 ? "" : "s"}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                {application.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => setSelectedLoanReceipt(application)}
                                  title="Open receipt"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => downloadLoanReceipt(application)}
                                  title="Download receipt"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  disabled={repayingLoanId === application.id}
                                  onClick={() => openRepaymentDialog(application)}
                                  title="Pay loan"
                                >
                                  <Banknote className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {!isRepaySection ? (
              <TabsContent value="closed" className="mt-5 space-y-3">
                {applicationsLoading ? (
                  <div className="rounded-[0.95rem] border border-border bg-background/70 p-3 text-sm text-muted-foreground">
                    Loading closed loans...
                  </div>
                ) : !closedApplications.length ? (
                  <div className="rounded-[0.95rem] border border-dashed border-border bg-background/50 p-3 text-sm text-muted-foreground">
                    {loanListSearch ? "No closed loans match that search." : "Closed or fully repaid loans will appear here."}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[0.95rem] border border-border/70 bg-white/95 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-card/90 dark:shadow-[0_12px_24px_-24px_rgba(0,0,0,0.45)]">
                    <table className="w-full min-w-[1080px] border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:bg-primary/5">
                          <th className="px-3 py-3">#</th>
                          <th className="px-3 py-3">Loan No</th>
                          <th className="px-3 py-3">Product</th>
                          <th className="px-3 py-3">Amount</th>
                          <th className="px-3 py-3">Total Repaid</th>
                          <th className="px-3 py-3">Closed On</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedApplications.map((application, index) => (
                          <tr key={application.id} className="border-b border-border/70 align-middle last:border-b-0 hover:bg-muted/20">
                            <td className="px-3 py-3 text-sm font-semibold text-foreground">{index + 1}</td>
                            <td className="px-3 py-3 text-sm font-medium text-foreground">{application.id.slice(0, 8).toUpperCase()}</td>
                            <td className="px-3 py-3">
                              <p className="font-medium text-foreground">{application.product_title}</p>
                              <p className="text-xs text-muted-foreground">
                                Started {formatScheduleDate(application.loan_summary.startDate)}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-sm font-semibold text-foreground">
                              {currency.format(application.approved_amount ?? application.requested_amount)}
                            </td>
                            <td className="px-3 py-3 text-sm text-foreground">
                              {currency.format(application.loan_summary.totalRepaid)}
                            </td>
                            <td className="px-3 py-3 text-sm text-muted-foreground">
                              {application.repaid_at ? formatScheduleDate(application.repaid_at) : "Closed"}
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                {application.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => setSelectedLoanReceipt(application)}
                                  title="Open receipt"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => downloadLoanReceipt(application)}
                                  title="Download receipt"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              ) : null}
            </Tabs>
            </div>
          </div>
        </motion.section>
      ) : null}

      <Dialog open={Boolean(selectedLoanReceipt)} onOpenChange={(open) => !open && setSelectedLoanReceipt(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Loan Receipt</DialogTitle>
            <DialogDescription>
              Full loan schedule, repayment history, and downloadable receipt details.
            </DialogDescription>
          </DialogHeader>

          {selectedLoanReceipt ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">{selectedLoanReceipt.product_title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Requested {currency.format(selectedLoanReceipt.requested_amount)}
                    {selectedLoanReceipt.approved_amount ? ` | Approved ${currency.format(selectedLoanReceipt.approved_amount)}` : ""}
                  </p>
                </div>
                  <div className="flex flex-wrap gap-2">
                  {selectedLoanReceipt.status !== "rejected" && selectedLoanReceipt.status !== "repaid" ? (
                    <Button type="button" className="rounded-xl" onClick={() => { setSelectedLoanReceipt(null); openRepaymentDialog(selectedLoanReceipt); }}>
                      Pay with M-Pesa
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => downloadLoanReceipt(selectedLoanReceipt)}>
                    Download Receipt
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Loan Balance</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{currency.format(selectedLoanReceipt.loan_summary.remainingBalance)}</p>
                </div>
                <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Scheduled Payment</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{currency.format(selectedLoanReceipt.loan_summary.scheduledPayment)}</p>
                </div>
                <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Repaid</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{currency.format(selectedLoanReceipt.loan_summary.totalRepaid)}</p>
                </div>
                <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Start Date</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatScheduleDate(selectedLoanReceipt.loan_summary.startDate)}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-foreground">Loan Amortization Schedule</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A receipt-style repayment schedule based on your approved amount, interest, and term.
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    {selectedLoanReceipt.interest_rate !== null
                      ? `${selectedLoanReceipt.interest_rate}% p.a. | ${(selectedLoanReceipt.interest_rate / 12).toFixed(2)}% monthly`
                      : "Interest pending"}
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        <th className="px-3 py-2">Payment #</th>
                        <th className="px-3 py-2">Payment Date</th>
                        <th className="px-3 py-2">Beginning Balance</th>
                        <th className="px-3 py-2">Scheduled Payment</th>
                        <th className="px-3 py-2">Principal</th>
                        <th className="px-3 py-2">Interest</th>
                        <th className="px-3 py-2">Ending Balance</th>
                        <th className="px-3 py-2">Cumulative Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoanReceipt.amortization_schedule.map((row) => (
                        <tr key={`${selectedLoanReceipt.id}-${row.paymentNumber}`} className="border-b border-border/60 last:border-b-0">
                          <td className="px-3 py-2.5">{row.paymentNumber}</td>
                          <td className="px-3 py-2.5">{formatScheduleDate(row.paymentDate)}</td>
                          <td className="px-3 py-2.5">{currency.format(row.beginningBalance)}</td>
                          <td className="px-3 py-2.5">{currency.format(row.scheduledPayment)}</td>
                          <td className="px-3 py-2.5">{currency.format(row.principal)}</td>
                          <td className="px-3 py-2.5">{currency.format(row.interest)}</td>
                          <td className="px-3 py-2.5">{currency.format(row.endingBalance)}</td>
                          <td className="px-3 py-2.5">{currency.format(row.cumulativeInterest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Loan amount</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{currency.format(selectedLoanReceipt.loan_summary.principal)}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Scheduled payments</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedLoanReceipt.loan_summary.scheduledNumberOfPayments}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Actual repayments</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{selectedLoanReceipt.loan_summary.actualNumberOfPayments}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border bg-background px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total interest</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{currency.format(selectedLoanReceipt.loan_summary.totalInterest)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Repayment History</p>
                  <div className="mt-3 space-y-2">
                    {selectedLoanReceipt.repayments.length ? selectedLoanReceipt.repayments.map((repayment) => (
                      <div key={repayment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-border bg-background px-4 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-foreground">{currency.format(repayment.amount)}</p>
                          <p className="text-muted-foreground">{repayment.payment_ref || "Manual repayment"}</p>
                        </div>
                        <div className="text-left text-muted-foreground md:text-right">
                          <p>{formatScheduleDate(repayment.created_at)}</p>
                          <p>{repayment.phone_number || repayment.payment_method || "Repayment"}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[1rem] border border-dashed border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                        No repayments posted yet. Use the Pay with M-Pesa button to record the next payment.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(repaymentDialogLoan)} onOpenChange={(open) => !open && setRepaymentDialogLoan(null)}>
        <DialogContent className="rounded-[2rem] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Repay Loan via M-Pesa</DialogTitle>
            <DialogDescription>
              Enter the amount and the phone number that should receive the STK push prompt on the SIM card.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-border bg-background/70 p-4 text-sm">
              <p className="font-semibold text-foreground">{repaymentDialogLoan?.product_title}</p>
              <p className="mt-1 text-muted-foreground">
                Current balance: {currency.format(repaymentDialogLoan?.loan_summary.remainingBalance ?? 0)}
              </p>
              <p className="mt-1 text-muted-foreground">
                Interest: {repaymentDialogLoan?.interest_rate !== null && repaymentDialogLoan?.interest_rate !== undefined
                  ? `${repaymentDialogLoan.interest_rate}% per annum`
                  : "Pending"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="repayment-amount">Amount to pay</label>
              <input
                id="repayment-amount"
                value={repaymentAmount}
                onChange={(event) => setRepaymentAmount(event.target.value)}
                placeholder="KES amount"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="repayment-phone">M-Pesa number</label>
              <input
                id="repayment-phone"
                value={repaymentPhone}
                onChange={(event) => setRepaymentPhone(event.target.value)}
                placeholder="07XXXXXXXX"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRepaymentDialogLoan(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={repayingLoanId === repaymentDialogLoan?.id} onClick={() => void handleRepayment()}>
              {repayingLoanId === repaymentDialogLoan?.id ? "Sending prompt..." : "Send M-Pesa Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MicroLoans() {
  const { role } = useAuth();
  const hasAccess = role === "farmer_pro" || role === "buyer_enterprise";

  return <DashboardShell title="Micro Loans">{hasAccess ? <MicroLoansDashboard /> : <ProGate />}</DashboardShell>;
}
