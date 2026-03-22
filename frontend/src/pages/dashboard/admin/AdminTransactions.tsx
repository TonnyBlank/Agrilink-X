import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Download, Receipt, Search, Wallet } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { AdminOrder, downloadReceiptsCsv, formatCount, formatDateTime, formatMoney } from "./shared";

const TRANSACTIONS_PER_PAGE = 10;
const RANGE_OPTIONS = [
  { label: "1 Day", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "12 Months", days: 365 },
];

function totalOrderValue(order: AdminOrder) {
  return (order.total_price ?? 0) + Number(order.delivery_fee ?? 0);
}

function matchesDateRange(order: AdminOrder, days: number) {
  const orderDate = new Date(order.paid_at || order.created_at);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return orderDate >= cutoff;
}

function PaginationControls({
  page,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / TRANSACTIONS_PER_PAGE));
  const startItem = totalItems === 0 ? 0 : (page - 1) * TRANSACTIONS_PER_PAGE + 1;
  const endItem = Math.min(page * TRANSACTIONS_PER_PAGE, totalItems);

  if (totalItems <= TRANSACTIONS_PER_PAGE) return null;

  return (
    <div className="flex flex-col gap-3 rounded-[1rem] border border-border/70 bg-white/90 p-4 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center sm:justify-between dark:bg-card/90">
      <p className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {totalItems} transactions
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" className="rounded-xl" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="text-sm font-medium text-foreground">
          Page {page} of {totalPages}
        </span>
        <Button type="button" className="rounded-xl" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function TransactionsDesktopTable({
  orders,
  startIndex,
}: {
  orders: AdminOrder[];
  startIndex: number;
}) {
  return (
    <div className="overflow-x-auto rounded-[1rem] border border-border/70 bg-white/90 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
      <table className="w-full min-w-[1220px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/25 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <th className="px-4 py-3">No.</th>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Farmer</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Receipt Ref</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Timeline</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={order.id} className="border-b border-border/70 align-top text-sm last:border-b-0">
              <td className="px-4 py-3.5 font-semibold text-foreground">{startIndex + index + 1}</td>
              <td className="px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{order.product?.name || "Product order"}</p>
                  <p className="truncate text-xs text-muted-foreground">Order {order.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-foreground">{order.buyer_profile?.full_name || "Unknown buyer"}</p>
                <p className="text-xs text-muted-foreground">Buyer</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-foreground">{order.farmer_profile?.full_name || "Unknown farmer"}</p>
                <p className="text-xs text-muted-foreground">Farmer</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-semibold text-foreground">{formatMoney(totalOrderValue(order))}</p>
                <p className="text-xs text-muted-foreground">Order plus delivery</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-foreground">{order.payment_ref || "No receipt ref"}</p>
                <p className="text-xs text-muted-foreground">{order.payment_ref ? "Receipt captured" : "Awaiting receipt"}</p>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex max-w-[170px] flex-wrap gap-1.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                      order.payment_status === "paid"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm text-foreground">Created {formatDateTime(order.created_at)}</p>
                <p className="text-xs text-muted-foreground">
                  {order.paid_at ? `Paid ${formatDateTime(order.paid_at)}` : "Payment pending"}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionCard({ order }: { order: AdminOrder }) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-white/90 p-3 shadow-[0_12px_22px_-24px_rgba(15,23,42,0.18)] lg:hidden dark:bg-card/90">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                order.payment_status === "paid"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              {order.payment_status}
            </span>
          </div>
          <h4 className="mt-2 font-display text-base font-bold leading-tight text-foreground">{order.product?.name || "Product order"}</h4>
          <p className="mt-1 text-sm text-muted-foreground">Buyer: {order.buyer_profile?.full_name || "Unknown buyer"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Farmer: {order.farmer_profile?.full_name || "Unknown farmer"}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">Receipt {order.payment_ref || "No receipt ref"}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground">{formatMoney(totalOrderValue(order))}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-background px-3 py-1">{order.id.slice(0, 8).toUpperCase()}</span>
        <span className="rounded-full border border-border bg-background px-3 py-1">Created {formatDateTime(order.created_at)}</span>
        <span className="rounded-full border border-border bg-background px-3 py-1">
          {order.paid_at ? `Paid ${formatDateTime(order.paid_at)}` : "Payment pending"}
        </span>
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [activeRangeDays, setActiveRangeDays] = useState<number>(30);
  const [page, setPage] = useState(1);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<AdminOrder[]>("/admin/orders")
      .then((data) => setOrders(data))
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "Failed to load transactions."));
  }, []);

  const normalizedSearch = transactionSearch.trim().toLowerCase();
  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => matchesDateRange(order, activeRangeDays))
        .filter((order) => {
          if (!normalizedSearch) return true;
          const haystack = [
            order.id,
            order.product?.name,
            order.payment_ref,
            order.payment_status,
            order.buyer_profile?.full_name,
            order.farmer_profile?.full_name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        })
        .sort((a, b) => new Date(b.paid_at || b.created_at).getTime() - new Date(a.paid_at || a.created_at).getTime()),
    [orders, activeRangeDays, normalizedSearch],
  );

  useEffect(() => {
    setPage(1);
  }, [transactionSearch, activeRangeDays, filteredOrders.length]);

  const paidOrders = filteredOrders.filter((order) => order.payment_status === "paid");
  const pendingOrders = filteredOrders.filter((order) => order.payment_status !== "paid");
  const totalRevenue = paidOrders.reduce((sum, order) => sum + totalOrderValue(order), 0);
  const paginatedOrders = filteredOrders.slice((page - 1) * TRANSACTIONS_PER_PAGE, page * TRANSACTIONS_PER_PAGE);

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

  return (
    <DashboardShell title="Transactions">
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Paid Value</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{formatMoney(totalRevenue)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Revenue from paid transactions in the selected period.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10">
              <CheckCircle2 className="h-5 w-5 text-sky-600" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Paid Orders</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{formatCount(paidOrders.length)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Orders with completed payment in the filtered result set.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pending Flow</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{formatCount(pendingOrders.length)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Transactions still waiting on payment confirmation.</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10">
              <Receipt className="h-5 w-5 text-rose-600" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Receipt References</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{formatCount(filteredOrders.filter((order) => Boolean(order.payment_ref)).length)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Transactions that already have a receipt reference attached.</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] dark:border-border/70 dark:bg-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300">
                <Receipt className="h-3.5 w-3.5" />
                Transaction Control
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-foreground">Transactions desk</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review payment flow like the orders page, filter by time range, and move through transactions in clean pages.
              </p>
            </div>
            <Button type="button" variant="outline" className="rounded-xl bg-background/80" onClick={() => void handleDownload()} disabled={savingKey === "download-csv"}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
          {errorMessage ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{errorMessage}</div> : null}

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={transactionSearch}
                onChange={(event) => setTransactionSearch(event.target.value)}
                placeholder="Search by receipt number, buyer, farmer, product, transaction ID, or payment status"
                className="h-11 rounded-xl pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.days}
                  type="button"
                  variant={activeRangeDays === option.days ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setActiveRangeDays(option.days)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">{formatCount(filteredOrders.length)} transactions found</p>
        </section>

        <section className="space-y-4">
          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
            <h3 className="font-display text-xl font-bold text-foreground">Transactions List</h3>
            <p className="mt-1 text-sm text-muted-foreground">Structured like orders so admins can scan buyer, farmer, value, payment status, and receipt details faster.</p>

            <div className="mt-4 hidden lg:block">
              <TransactionsDesktopTable orders={paginatedOrders} startIndex={(page - 1) * TRANSACTIONS_PER_PAGE} />
            </div>

            <div className="mt-4 space-y-3 lg:hidden">
              {paginatedOrders.map((order) => (
                <TransactionCard key={order.id} order={order} />
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="mt-4 rounded-[1.25rem] border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">
                No transactions match that search or time range.
              </div>
            ) : null}
          </div>

          <PaginationControls page={page} totalItems={filteredOrders.length} onPageChange={setPage} />
        </section>
      </div>
    </DashboardShell>
  );
}
