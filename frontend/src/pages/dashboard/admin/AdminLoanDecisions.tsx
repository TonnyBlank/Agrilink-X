import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Search, Trash2, Wallet } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { AdminLoan, LoanProductType, LOAN_PRODUCT_TITLES, LOAN_STATUS_OPTIONS, formatCount, formatDateTime, formatMoney } from "./shared";

const LOANS_PER_PAGE = 10;

function inferLoanType(loan: AdminLoan): LoanProductType {
  if (loan.product_type) return loan.product_type;
  const title = loan.product_title.trim().toLowerCase();
  if (title.includes("equipment")) return "equipment_top_up";
  if (title.includes("contract") || title.includes("buyer")) return "buyer_contract_financing";
  return "seasonal_working_capital";
}

function loanTypeTone(type: LoanProductType) {
  if (type === "equipment_top_up") return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (type === "buyer_contract_financing") return "bg-violet-500/10 text-violet-700 dark:text-violet-300";
  return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

function LoanDecisionsTable({
  loans,
  startIndex,
  selectedLoanId,
  onSelect,
}: {
  loans: AdminLoan[];
  startIndex: number;
  selectedLoanId: string | null;
  onSelect: (loanId: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[1rem] border border-border/70 bg-white/90 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
      <table className="w-full min-w-[1280px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/25 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <th className="px-4 py-3">No.</th>
            <th className="px-4 py-3">Loan</th>
            <th className="px-4 py-3">Applicant</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Terms</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Timeline</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan, index) => (
            <tr key={loan.id} onClick={() => onSelect(loan.id)} className={`cursor-pointer border-b border-border/70 align-top text-sm last:border-b-0 ${selectedLoanId === loan.id ? "bg-sky-50/70 dark:bg-sky-500/10" : "hover:bg-muted/20"}`}>
              <td className="px-4 py-3.5 font-semibold text-foreground">{startIndex + index + 1}</td>
              <td className="px-4 py-3.5">
                <p className="font-semibold text-foreground">{loan.product_title}</p>
                <p className="text-xs text-muted-foreground">Loan {loan.id.slice(0, 8).toUpperCase()}</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-foreground">{loan.profile?.full_name || "Unknown applicant"}</p>
                <p className="text-xs text-muted-foreground">{loan.profile?.county || "County not set"}</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-semibold text-foreground">{formatMoney(loan.requested_amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {loan.approved_amount !== null ? `Approved ${formatMoney(loan.approved_amount)}` : "Awaiting approval"}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-medium text-foreground">{loan.interest_rate !== null ? `${loan.interest_rate}% interest` : "Interest pending"}</p>
                <p className="text-xs text-muted-foreground">{loan.repayment_days !== null ? `${loan.repayment_days} day repayment` : "Repayment term pending"}</p>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex max-w-[170px] flex-wrap gap-1.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${loanTypeTone(inferLoanType(loan))}`}>
                    {LOAN_PRODUCT_TITLES[inferLoanType(loan)]}
                  </span>
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {loan.status.replace("_", " ")}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm text-foreground">Created {formatDateTime(loan.created_at)}</p>
                <p className="text-xs text-muted-foreground">{loan.note || "Borrower created this application from a published loan offer."}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminLoanDecisions() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [loanSearch, setLoanSearch] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState<"all" | LoanProductType>("all");
  const [loanPage, setLoanPage] = useState(1);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPage = async () => {
    setErrorMessage(null);
    try {
      const loansData = await apiFetch<AdminLoan[]>("/admin/loans");
      setLoans(loansData);
      setLastUpdated(new Date());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load admin loans.");
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadPage();
    }, 30000);

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        void loadPage();
      }
    };

    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPage();
    } finally {
      setRefreshing(false);
    }
  };

  const updateLoan = async (loan: AdminLoan) => {
    setSavingKey(`loan-${loan.id}`);
    try {
      const updated = await apiFetch<AdminLoan>(`/admin/loans/${loan.id}`, {
        method: "PATCH",
        body: {
          status: loan.status,
          note: loan.note,
          approved_amount: loan.approved_amount,
          interest_rate: loan.interest_rate,
          repayment_days: loan.repayment_days,
        },
      });
      setLoans((current) => current.map((item) => (item.id === loan.id ? { ...item, ...updated } : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update loan.");
      await loadPage();
    } finally {
      setSavingKey(null);
    }
  };

  const deleteLoan = async (loanId: string) => {
    setSavingKey(`delete-loan-${loanId}`);
    try {
      await apiFetch(`/admin/loans/${loanId}`, { method: "DELETE" });
      setLoans((current) => current.filter((loan) => loan.id !== loanId));
      setSelectedLoanId((current) => (current === loanId ? null : current));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not delete loan.");
    } finally {
      setSavingKey(null);
    }
  };

  const normalizedLoanSearch = loanSearch.trim().toLowerCase();
  const filteredLoans = useMemo(() => loans.filter((loan) => {
    const type = inferLoanType(loan);
    const haystack = [loan.id, loan.product_title, loan.status, loan.note, loan.profile?.full_name, loan.profile?.county, LOAN_PRODUCT_TITLES[type]]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (!normalizedLoanSearch || haystack.includes(normalizedLoanSearch)) && (loanTypeFilter === "all" || type === loanTypeFilter);
  }), [loanTypeFilter, loans, normalizedLoanSearch]);

  const pendingLoans = filteredLoans.filter((loan) => loan.status === "pending_review");
  const approvedLoans = filteredLoans.filter((loan) => loan.status === "approved" || loan.status === "disbursed");
  const repaidLoans = filteredLoans.filter((loan) => loan.status === "repaid");
  const approvedValue = approvedLoans.reduce((sum, loan) => sum + Number(loan.approved_amount ?? 0), 0);
  const paginatedLoans = filteredLoans.slice((loanPage - 1) * LOANS_PER_PAGE, loanPage * LOANS_PER_PAGE);
  const loanTypeCounts = useMemo(() => ({
    seasonal_working_capital: filteredLoans.filter((loan) => inferLoanType(loan) === "seasonal_working_capital").length,
    equipment_top_up: filteredLoans.filter((loan) => inferLoanType(loan) === "equipment_top_up").length,
    buyer_contract_financing: filteredLoans.filter((loan) => inferLoanType(loan) === "buyer_contract_financing").length,
  }), [filteredLoans]);
  const selectedLoan = loans.find((loan) => loan.id === selectedLoanId) ?? paginatedLoans[0] ?? null;

  useEffect(() => {
    setLoanPage(1);
  }, [loanSearch, loanTypeFilter, filteredLoans.length]);

  useEffect(() => {
    if (!paginatedLoans.length) {
      setSelectedLoanId(null);
      return;
    }
    if (!selectedLoanId || !filteredLoans.some((loan) => loan.id === selectedLoanId)) {
      setSelectedLoanId(paginatedLoans[0].id);
    }
  }, [filteredLoans, paginatedLoans, selectedLoanId]);

  return (
    <DashboardShell title="Loan Decisions">
      <div className="space-y-6">
        {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{errorMessage}</div> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10"><Wallet className="h-5 w-5 text-sky-600" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Loan Volume</p><p className="mt-2 font-display text-3xl font-bold text-foreground">{formatCount(filteredLoans.length)}</p><p className="mt-1 text-sm text-muted-foreground">Applications in the current search result set.</p></div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10"><Clock3 className="h-5 w-5 text-amber-600" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pending Review</p><p className="mt-2 font-display text-3xl font-bold text-foreground">{formatCount(pendingLoans.length)}</p><p className="mt-1 text-sm text-muted-foreground">Applications still waiting on an admin decision.</p></div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Approved Value</p><p className="mt-2 font-display text-3xl font-bold text-foreground">{formatMoney(approvedValue)}</p><p className="mt-1 text-sm text-muted-foreground">Approved or disbursed amount in the filtered loan set.</p></div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10"><CheckCircle2 className="h-5 w-5 text-primary" /></div><p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Repaid Loans</p><p className="mt-2 font-display text-3xl font-bold text-foreground">{formatCount(repaidLoans.length)}</p><p className="mt-1 text-sm text-muted-foreground">Applications that have already completed repayment.</p></div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] dark:bg-card/90">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">Loan Decision Center</h3>
              <p className="mt-1 text-sm text-muted-foreground">Review borrower applications, select one record, and make the final loan decision from a dedicated admin workspace.</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Live updates every 30 seconds{lastUpdated ? ` • Last updated ${formatDateTime(lastUpdated.toISOString())}` : ""}
              </p>
            </div>
            <Button type="button" variant="outline" className="rounded-xl" disabled={refreshing} onClick={() => void handleRefresh()}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setLoanTypeFilter("all")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${loanTypeFilter === "all" ? "bg-foreground text-background" : "border border-border bg-background text-foreground"}`}>All Types {formatCount(filteredLoans.length)}</button>
            <button type="button" onClick={() => setLoanTypeFilter("seasonal_working_capital")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${loanTypeFilter === "seasonal_working_capital" ? "bg-emerald-600 text-white" : "border border-border bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>Seasonal {formatCount(loanTypeCounts.seasonal_working_capital)}</button>
            <button type="button" onClick={() => setLoanTypeFilter("equipment_top_up")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${loanTypeFilter === "equipment_top_up" ? "bg-sky-600 text-white" : "border border-border bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"}`}>Equipment {formatCount(loanTypeCounts.equipment_top_up)}</button>
            <button type="button" onClick={() => setLoanTypeFilter("buyer_contract_financing")} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${loanTypeFilter === "buyer_contract_financing" ? "bg-violet-600 text-white" : "border border-border bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"}`}>Contract {formatCount(loanTypeCounts.buyer_contract_financing)}</button>
          </div>
          <div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={loanSearch} onChange={(event) => setLoanSearch(event.target.value)} placeholder="Search loan applications" className="h-11 rounded-xl pl-10" /></div>
          <p className="mt-3 text-xs text-muted-foreground">{formatCount(filteredLoans.length)} loans found</p>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
          <div className="hidden lg:block">
            <LoanDecisionsTable loans={paginatedLoans} startIndex={(loanPage - 1) * LOANS_PER_PAGE} selectedLoanId={selectedLoan?.id ?? null} onSelect={setSelectedLoanId} />
          </div>

          <div className="space-y-3 lg:hidden">
            {paginatedLoans.map((loan) => (
              <button key={loan.id} type="button" onClick={() => setSelectedLoanId(loan.id)} className={`w-full rounded-[1rem] border border-border/70 bg-white/90 p-3 text-left shadow-[0_12px_22px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90 dark:shadow-[0_12px_22px_-24px_rgba(0,0,0,0.45)] ${selectedLoan?.id === loan.id ? "ring-2 ring-sky-300 dark:ring-sky-400/60" : ""}`}>
                <p className="font-display text-base font-bold text-foreground">{loan.product_title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{loan.profile?.full_name || "Unknown applicant"}{loan.profile?.county ? ` | ${loan.profile.county}` : ""}</p>
              </button>
            ))}
          </div>

          {selectedLoan ? (
            <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-background/70 p-4 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{selectedLoan.product_title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedLoan.profile?.full_name || "Unknown applicant"}{selectedLoan.profile?.county ? ` | ${selectedLoan.profile.county}` : ""}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Decision Panel</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-3 py-1">{selectedLoan.id.slice(0, 8).toUpperCase()}</span>
                <span className={`rounded-full px-3 py-1 font-semibold uppercase tracking-[0.14em] ${loanTypeTone(inferLoanType(selectedLoan))}`}>{LOAN_PRODUCT_TITLES[inferLoanType(selectedLoan)]}</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-primary">{selectedLoan.status.replace("_", " ")}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input value={selectedLoan.approved_amount ?? ""} onChange={(event) => setLoans((current) => current.map((item) => (item.id === selectedLoan.id ? { ...item, approved_amount: event.target.value ? Number(event.target.value) : null } : item)))} placeholder="Approved amount" className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                <input value={selectedLoan.interest_rate ?? ""} onChange={(event) => setLoans((current) => current.map((item) => (item.id === selectedLoan.id ? { ...item, interest_rate: event.target.value ? Number(event.target.value) : null } : item)))} placeholder="Interest rate" className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                <input value={selectedLoan.repayment_days ?? ""} onChange={(event) => setLoans((current) => current.map((item) => (item.id === selectedLoan.id ? { ...item, repayment_days: event.target.value ? Number(event.target.value) : null } : item)))} placeholder="Repayment days" className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
              </div>
              <textarea value={selectedLoan.note ?? ""} onChange={(event) => setLoans((current) => current.map((item) => (item.id === selectedLoan.id ? { ...item, note: event.target.value } : item)))} placeholder="Admin review note" className="mt-3 min-h-[96px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <select value={selectedLoan.status} onChange={(event) => setLoans((current) => current.map((item) => (item.id === selectedLoan.id ? { ...item, status: event.target.value } : item)))} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground md:w-[220px]">{LOAN_STATUS_OPTIONS.map((statusOption) => <option key={statusOption} value={statusOption}>{statusOption}</option>)}</select>
                <div className="flex gap-2 md:justify-end">
                  <Button type="button" variant="outline" className="rounded-xl" disabled={savingKey === `delete-loan-${selectedLoan.id}`} onClick={() => void deleteLoan(selectedLoan.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  <Button type="button" className="rounded-xl" disabled={savingKey === `loan-${selectedLoan.id}`} onClick={() => void updateLoan(selectedLoan)}>Save Loan Decision</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.25rem] border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">No loans available for decision right now.</div>
          )}

          {filteredLoans.length > LOANS_PER_PAGE ? <div className="mt-4 flex flex-col gap-3 rounded-[1rem] border border-border/70 bg-white/90 p-4 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] sm:flex-row sm:items-center sm:justify-between dark:bg-card/90 dark:shadow-[0_12px_24px_-24px_rgba(0,0,0,0.45)]"><p className="text-sm text-muted-foreground">Showing {(loanPage - 1) * LOANS_PER_PAGE + 1}-{Math.min(loanPage * LOANS_PER_PAGE, filteredLoans.length)} of {filteredLoans.length} loans</p><div className="flex items-center gap-2"><Button type="button" variant="outline" className="rounded-xl" disabled={loanPage === 1} onClick={() => setLoanPage((page) => page - 1)}>Previous</Button><span className="text-sm font-medium text-foreground">Page {loanPage} of {Math.max(1, Math.ceil(filteredLoans.length / LOANS_PER_PAGE))}</span><Button type="button" className="rounded-xl" disabled={loanPage >= Math.ceil(filteredLoans.length / LOANS_PER_PAGE)} onClick={() => setLoanPage((page) => page + 1)}>Next</Button></div></div> : null}
        </section>
      </div>
    </DashboardShell>
  );
}
