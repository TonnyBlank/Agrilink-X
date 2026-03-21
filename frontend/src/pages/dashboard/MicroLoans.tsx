import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CircleAlert,
  Clock3,
  CreditCard,
  HandCoins,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
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

type LoanStatus = "pending_review" | "approved" | "rejected" | "disbursed";

type LoanApplication = {
  id: string;
  product_title: string;
  requested_amount: number;
  approved_amount: number | null;
  speed: string | null;
  interest_rate: number | null;
  repayment_days: number | null;
  status: LoanStatus;
  note: string | null;
  created_at: string;
};

type FundingOption = {
  key: string;
  title: string;
  amount: string;
  detail: string;
  speed: string;
  interestRate: number;
  repaymentDays: number;
};

function ProGate() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-lg overflow-hidden rounded-[2.25rem] border border-emerald-200/60 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,253,245,0.92))] p-10 text-center shadow-[0_25px_80px_-40px_rgba(5,150,105,0.5)] dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.97),rgba(17,24,39,0.96))]"
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-100 text-primary shadow-inner">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Micro Loans</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Upgrade to Pro to unlock revenue-based financing, loan readiness scoring, and faster access to working capital tools.
        </p>
        <div className="mt-6 grid gap-3 text-left text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 dark:border-white/10 dark:bg-background/60">
            <p className="font-semibold text-foreground">Financing readiness</p>
            <p className="mt-1">Track the exact profile, payout, and revenue checks lenders use.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 dark:border-white/10 dark:bg-background/60">
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
  const [applyingProduct, setApplyingProduct] = useState<string | null>(null);

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
            amount: currency.format(eligibility.eligibleAmount),
            detail: eligibility.nextReviewWindow,
            tone: "emerald",
          }
        : {
            title: "Not eligible yet",
            amount: currency.format(eligibility.eligibleAmount),
            detail: "Finish the missing checks below and keep growing revenue to unlock financing.",
            tone: "red",
          };

  const summaryCards = [
    {
      label: "Eligible Amount",
      value: !hasAccess ? "Locked" : loading ? "Loading..." : currency.format(eligibility.eligibleAmount),
      detail: "Live estimate based on recent revenue and readiness.",
      icon: CreditCard,
    },
    {
      label: "Past 90-Day Revenue",
      value: loading ? "Loading..." : currency.format(eligibility.revenue90),
      detail: "Revenue from paid or completed selling activity.",
      icon: TrendingUp,
    },
    {
      label: "Qualified Orders",
      value: loading ? "Loading..." : String(eligibility.totalQualifiedOrders),
      detail: "Successful or paid orders counted in the last 90 days.",
      icon: Banknote,
    },
    {
      label: "Readiness Score",
      value: loading ? "Loading..." : `${readinessScore}%`,
      detail: "Composite readiness across profile, payout, revenue, and ID checks.",
      icon: ShieldCheck,
    },
  ];

  const fundingOptions: FundingOption[] = [
    {
      key: "seasonal_working_capital",
      title: "Seasonal Working Capital",
      amount: currency.format(Math.max(eligibility.eligibleAmount * 0.35, isEnterprise ? 35000 : 15000)),
      detail: "Cover seed, fertilizer, labor, and transport before harvest payments land.",
      speed: isEnterprise ? "Same-day review" : "24-48h review",
      interestRate: isEnterprise ? 6.5 : 8.5,
      repaymentDays: isEnterprise ? 45 : 30,
    },
    {
      key: "equipment_top_up",
      title: "Equipment Top-Up",
      amount: currency.format(Math.max(eligibility.eligibleAmount * 0.65, isEnterprise ? 80000 : 30000)),
      detail: "Finance irrigation kits, greenhouses, cold storage, and post-harvest tools.",
      speed: isEnterprise ? "1 day release" : "2 day release",
      interestRate: isEnterprise ? 7.5 : 9.5,
      repaymentDays: isEnterprise ? 90 : 60,
    },
    {
      key: "buyer_contract_financing",
      title: "Buyer Contract Financing",
      amount: currency.format(Math.max(eligibility.eligibleAmount, isEnterprise ? 150000 : 50000)),
      detail: "Financing tied to supply contracts, delivery schedules, and verified order history.",
      speed: isEnterprise ? "Priority lane" : "Fast review",
      interestRate: isEnterprise ? 5.5 : 7.5,
      repaymentDays: isEnterprise ? 120 : 75,
    },
  ];

  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading, eligibility.eligibleAmount, eligibility.revenue90, readinessScore]);

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

  useEffect(() => {
    void loadApplications();
  }, [hasAccess]);

  useEffect(() => {
    if (!hasAccess) return;

    const interval = window.setInterval(() => {
      void refetchOrders();
      void refetchVerification();
      void refreshProfile();
      void loadApplications();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [hasAccess, refetchOrders, refetchVerification, refreshProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOrders(), refetchVerification(), refreshProfile(), loadApplications()]);
      setLastUpdated(new Date());
      toast.success("Micro loan data refreshed.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleBorrow = async (productType: string, amountLabel: string) => {
    setApplyingProduct(productType);
    try {
      const amount = Number(amountLabel.replace(/[^\d.]/g, ""));
      await apiFetch<LoanApplication>("/micro-loans/applications", {
        method: "POST",
        body: {
          productType,
          requestedAmount: amount,
        } as unknown as BodyInit,
      });
      toast.success("Loan application submitted successfully.");
      await loadApplications();
      setLastUpdated(new Date());
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setApplyingProduct(null);
    }
  };

  const liveApplicationsCount = applications.filter((application) =>
    ["pending_review", "approved", "disbursed"].includes(application.status),
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.18),_transparent_40%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--primary)/0.06))] p-6 shadow-card"
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

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Current Decision
              </p>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">{decision.title}</p>
              <p className="mt-1 text-lg font-semibold text-primary">{decision.amount}</p>
              <p className="mt-2 text-sm text-muted-foreground">{decision.detail}</p>
            </div>

            <div className="rounded-[1.75rem] border border-border/70 bg-background/80 p-5 shadow-sm">
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
            <div className="rounded-2xl border border-border bg-background/70 p-4">
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

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Review Window</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {!hasAccess ? "Unavailable" : eligibility.nextReviewWindow}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Average Monthly Revenue</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">
                {loading ? "Loading..." : currency.format(eligibility.averageMonthlyRevenue)}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Plan Access</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {hasAccess ? (isEnterprise ? "Buyer Enterprise" : "Farmer Pro") : "Farmer Free"}
              </p>
            </div>
          </div>
        </motion.aside>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]"
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Financing Products</h3>
              <p className="text-sm text-muted-foreground">
                Indicative financing ranges based on your current live ceiling.
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {fundingOptions.map((option, index) => {
            const accentTone =
              index === 0
                ? "border-emerald-200/80 from-emerald-50 via-white to-emerald-100/70 dark:border-emerald-500/30 dark:from-emerald-500/12 dark:via-slate-950/95 dark:to-emerald-500/8"
                : index === 1
                  ? "border-teal-200/80 from-teal-50 via-white to-cyan-100/70 dark:border-cyan-500/30 dark:from-cyan-500/12 dark:via-slate-950/95 dark:to-teal-500/8"
                  : "border-lime-200/80 from-lime-50 via-white to-emerald-100/70 dark:border-lime-500/30 dark:from-lime-500/12 dark:via-slate-950/95 dark:to-emerald-500/8";

            return (
              <div
                key={option.title}
                className="flex h-full min-w-0 flex-col rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))] dark:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-foreground/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:bg-white/5 dark:text-slate-300">
                    Product
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{option.speed}</span>
                </div>

                <p className="mt-4 max-w-full break-words font-display text-[1.45rem] font-bold leading-tight text-foreground sm:text-[1.65rem]">
                  {option.title}
                </p>

                <div className={`mt-4 rounded-[1.5rem] border bg-gradient-to-br p-5 ${accentTone}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-800/70 dark:text-emerald-200/80">
                    Amount Available
                  </p>
                  <p className="mt-3 break-words font-display text-[1.75rem] font-black leading-tight tracking-tight text-emerald-950 sm:text-[2rem] dark:text-white">
                    {option.amount}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-900/70 dark:text-slate-300">
                    Estimated offer based on your current financing ceiling.
                  </p>
                </div>

                <p className="mt-4 text-sm leading-7 text-muted-foreground">{option.detail}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[1rem] border border-border bg-background px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Interest
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{option.interestRate}%</p>
                  </div>
                  <div className="rounded-[1rem] border border-border bg-background px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
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
                    <div className="rounded-[1rem] border border-border bg-background px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Speed
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{option.speed}</p>
                    </div>
                    <div className="rounded-[1rem] border border-border bg-background px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-foreground">
                        {eligibility.isEligible ? "Available" : hasAccess ? "Needs readiness" : "Plan locked"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 w-full rounded-xl"
                    disabled={!eligibility.isEligible || applyingProduct === option.key}
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
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <HandCoins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Next Step</h3>
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
              <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
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
              <div className="mt-4 rounded-[1.5rem] border border-border bg-background/70 p-4">
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

          <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Loan Applications</h3>
                <p className="text-sm text-muted-foreground">Live requests submitted from this financing tab.</p>
              </div>
            </div>

            <div className="space-y-3">
              {applicationsLoading ? (
                <div className="rounded-2xl border border-border bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                  Loading loan applications...
                </div>
              ) : applications.length ? (
                applications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{application.product_title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Requested {currency.format(application.requested_amount)}
                          {application.approved_amount
                            ? ` | Approved ${currency.format(application.approved_amount)}`
                            : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        {application.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">
                      {application.note || "Loan request created from live financing eligibility."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border bg-background px-3 py-1">
                        {application.interest_rate !== null
                          ? `${application.interest_rate}% interest`
                          : "Interest pending"}
                      </span>
                      <span className="rounded-full border border-border bg-background px-3 py-1">
                        {application.repayment_days !== null
                          ? `${application.repayment_days} day repayment`
                          : "Repayment pending"}
                      </span>
                      <span className="rounded-full border border-border bg-background px-3 py-1">
                        {application.speed || "Review speed not set"}
                      </span>
                      <span className="rounded-full border border-border bg-background px-3 py-1">
                        Created {formatRelativeTime(application.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/50 px-4 py-5 text-sm text-muted-foreground">
                  No loan applications yet. Choose a financing product above to borrow live.
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
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
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3"
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

          <div className="rounded-[2rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)] dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
            <h3 className="font-display text-xl font-bold text-foreground">Why This Score Moves</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Paid and completed orders strengthen your financing history and raise the revenue ceiling.</p>
              <p>Verified identity and complete payout details reduce approval friction for disbursement.</p>
              <p>Contact details and county information improve lender confidence in your operating profile.</p>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

export default function MicroLoans() {
  const { role } = useAuth();
  const hasAccess = role === "farmer_pro" || role === "buyer_enterprise";

  return <DashboardShell title="Micro Loans">{hasAccess ? <MicroLoansDashboard /> : <ProGate />}</DashboardShell>;
}
