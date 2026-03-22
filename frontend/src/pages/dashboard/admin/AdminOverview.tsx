import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeCheck, ClipboardList, CreditCard, Download, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { AdminAnalytics, AdminOrder, AdminOverview as AdminOverviewType, downloadReceiptsCsv, formatCount, formatMoney } from "./shared";

export default function AdminOverview() {
  const cropDemandPalette = [
    "hsl(204, 88%, 60%)",
    "hsl(18, 84%, 58%)",
    "hsl(152, 62%, 42%)",
    "hsl(44, 92%, 56%)",
    "hsl(268, 65%, 62%)",
    "hsl(338, 78%, 62%)",
  ];

  const [overview, setOverview] = useState<AdminOverviewType | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPage = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [overviewData, analyticsData, ordersData] = await Promise.all([
        apiFetch<AdminOverviewType>("/admin/overview"),
        apiFetch<AdminAnalytics>("/admin/analytics"),
        apiFetch<AdminOrder[]>("/admin/orders"),
      ]);
      setOverview(overviewData);
      setAnalytics(analyticsData);
      setOrders(ordersData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load admin overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const summaryCards = overview
    ? [
        { label: "Users", value: String(overview.usersCount), detail: `${overview.adminCount} admins`, icon: Users },
        { label: "Orders", value: String(overview.ordersCount), detail: `${overview.productsCount} products live`, icon: ClipboardList },
        { label: "Loans", value: String(overview.loansCount), detail: `${overview.pendingLoansCount} need review`, icon: CreditCard },
        { label: "Verification", value: String(overview.pendingVerificationsCount), detail: `Loan value ${formatMoney(overview.totalApprovedLoanValue)}`, icon: BadgeCheck },
      ]
    : [];

  const handleDownload = async () => {
    setSavingKey("download-csv");
    try {
      await downloadReceiptsCsv();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not download CSV.");
    } finally {
      setSavingKey(null);
    }
  };

  const paidOrders = orders.filter((order) => order.payment_status === "paid");
  const activeSellingOrders = orders.filter((order) => order.payment_status === "paid" || order.payment_status === "initiated");
  const uniqueBuyers = new Set(orders.map((order) => order.buyer_profile?.full_name || order.id)).size;
  const uniqueSellers = new Set(orders.map((order) => order.farmer_profile?.full_name || order.id)).size;
  const buyingRate = orders.length ? Math.round((paidOrders.length / orders.length) * 100) : 0;
  const sellingRate = orders.length ? Math.round((activeSellingOrders.length / orders.length) * 100) : 0;
  const averageBuyerOrders = uniqueBuyers ? (orders.length / uniqueBuyers).toFixed(1) : "0.0";
  const averageSellerOrders = uniqueSellers ? (orders.length / uniqueSellers).toFixed(1) : "0.0";

  return (
    <DashboardShell title="Admin Overview">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-sky-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.99),rgba(240,249,255,0.96))] p-6 shadow-[0_20px_50px_-28px_rgba(56,189,248,0.28)] dark:border-sky-500/20 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(24,24,27,0.95))]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-sky-300/70 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/30 dark:text-sky-300">Admin Workspace</div>
              <h2 className="mt-4 font-display text-3xl font-bold text-foreground">Admin command center</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Overview first, then jump into loans, transactions, receipts CSV, or role control from the admin sidebar.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" className="rounded-xl border-sky-200 bg-white/85 hover:bg-sky-50 dark:border-sky-500/20 dark:bg-background/70 dark:hover:bg-sky-500/10" onClick={() => void handleDownload()} disabled={savingKey === "download-csv"}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button type="button" variant="outline" className="rounded-xl border-sky-200 bg-white/85 hover:bg-sky-50 dark:border-sky-500/20 dark:bg-background/70 dark:hover:bg-sky-500/10" onClick={() => void loadPage()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
          {errorMessage ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{errorMessage}</div> : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{loading ? "..." : card.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Crop demand and loan signals</h3>
                <p className="mt-1 text-sm text-muted-foreground">Use real order demand to decide which farmers and crops need capital fastest.</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Top Crop</p>
                <p className="mt-1 font-display text-lg font-bold text-foreground">{analytics?.topCrop?.crop || "No demand yet"}</p>
                <p className="text-xs text-muted-foreground">{analytics?.topCrop ? `${analytics.topCrop.orders} orders • ${formatCount(analytics.topCrop.quantity)} units` : "Waiting for orders"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Revenue trend</p>
                <div className="mt-4 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.orderTrend ?? []}>
                      <defs>
                        <linearGradient id="overviewLoanRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(166, 65%, 38%)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(166, 65%, 38%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(value: number) => formatMoney(value)} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(166, 65%, 38%)" fill="url(#overviewLoanRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">Most demanded crops</p>
                <div className="mt-4 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.cropDemand ?? []} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="crop" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(value: number) => formatCount(value)} />
                      <Bar dataKey="orders" radius={[0, 8, 8, 0]}>
                        {(analytics?.cropDemand ?? []).map((entry, index) => (
                          <Cell key={`${entry.crop}-${index}`} fill={cropDemandPalette[index % cropDemandPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
            <h3 className="font-display text-xl font-bold text-foreground">Admin Areas</h3>
            <div className="mt-4 space-y-3">
              {[
                { to: "/dashboard/admin/loans", title: "Loan Analytics", detail: "Publish and manage live loan offers for borrowers." },
                { to: "/dashboard/admin/loan-decisions", title: "Loan Decisions", detail: "Review applications and make final loan decisions." },
                { to: "/dashboard/admin/transactions", title: "Transactions", detail: "Search by receipt, product, buyer, farmer, or payment status." },
                { to: "/dashboard/admin/users", title: "User Roles", detail: "Update roles and keep admin permissions under control." },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="block rounded-[1.25rem] border border-border bg-background/70 p-4 transition-colors hover:bg-background">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Order Rates</h3>
              <p className="mt-1 text-sm text-muted-foreground">A quick view of platform buying and selling activity based on current orders.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Buying Rate</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{buyingRate}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Paid orders out of total marketplace orders.</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selling Rate</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{sellingRate}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Paid or active orders moving through seller flow.</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Buyer Order Rate</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{averageBuyerOrders}</p>
              <p className="mt-1 text-sm text-muted-foreground">Average orders placed per buyer.</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Seller Order Rate</p>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{averageSellerOrders}</p>
              <p className="mt-1 text-sm text-muted-foreground">Average orders handled per seller.</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
