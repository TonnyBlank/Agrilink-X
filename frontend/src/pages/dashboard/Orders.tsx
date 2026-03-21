import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  CreditCard,
  Download,
  Eye,
  LoaderCircle,
  MessageCircle,
  Package,
  RefreshCw,
  Settings2,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useOrders, type Order } from "@/hooks/useOrders";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  pending: "bg-gold-500/15 text-gold-600 border-gold-500/20",
  confirmed: "bg-primary/15 text-primary border-primary/20",
  processing: "bg-steel-500/15 text-steel-500 border-steel-500/20",
  shipped: "bg-sky-500/15 text-sky-600 border-sky-500/20",
  delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

const emojiFallback = "Produce";
const exportRanges = [
  { label: "1 day", days: 1 },
  { label: "1 week", days: 7 },
  { label: "30 days", days: 30 },
  { label: "1 year", days: 365 },
];
const receiptCompany = {
  name: "AgriLink X",
  legal: "AgriLink X Marketplace Ltd.",
  location: "Kakamega, Kenya",
  email: "agrilinkxkenya@gmail.com",
  phone: "0793900080",
};

function normalizeSearchValue(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesTransactionSearch(order: Order, searchTerm: string) {
  const normalizedSearch = normalizeSearchValue(searchTerm);
  if (!normalizedSearch) return true;

  return [
    order.payment_ref,
    order.checkout_request_id,
    order.merchant_request_id,
    order.id,
  ].some((value) => normalizeSearchValue(value).includes(normalizedSearch));
}

function getTransactionReference(order: Order) {
  return order.payment_ref || order.checkout_request_id || order.merchant_request_id || order.id;
}

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildReceiptHtml(order: Order) {
  const totalPaid = Number(order.total_price) + Number(order.delivery_fee || 0);
  const itemTotal = Number(order.total_price);
  const deliveryFee = Number(order.delivery_fee || 0);
  const unitPrice = order.quantity > 0 ? itemTotal / order.quantity : itemTotal;
  const receiptReference = order.payment_ref || order.checkout_request_id || "Pending";
  const paymentMethod = order.payment_method || "M-Pesa";
  const issuedAt = order.paid_at ? new Date(order.paid_at) : new Date(order.created_at);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AgriLink X Invoice ${order.id}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px 18px; background: #eef4f0; font-family: Arial, sans-serif; color: #153126; }
    .sheet { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe8df; border-radius: 28px; overflow: hidden; box-shadow: 0 28px 60px rgba(15, 23, 42, 0.08); }
    .hero { padding: 30px 34px; background: linear-gradient(135deg, #0d5b31, #1f8a4d); color: #ffffff; }
    .hero-top { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
    .brand-kicker { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; opacity: 0.82; }
    .brand-name { margin-top: 10px; font-size: 34px; font-weight: 800; line-height: 1; }
    .brand-legal { margin-top: 10px; max-width: 320px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.85); }
    .invoice-panel { min-width: 220px; border-radius: 22px; padding: 18px 20px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.16); }
    .invoice-label { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; opacity: 0.82; }
    .invoice-title { margin-top: 10px; font-size: 28px; font-weight: 800; }
    .invoice-meta { margin-top: 14px; display: grid; gap: 10px; }
    .invoice-meta-row { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
    .content { padding: 28px 34px 34px; }
    .party-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .party-card { border: 1px solid #e2ebe5; border-radius: 22px; padding: 18px; background: #fbfcfb; }
    .section-kicker { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #6b7f74; font-weight: 700; }
    .section-title { margin-top: 10px; font-size: 18px; font-weight: 700; color: #10231a; }
    .section-copy { margin-top: 8px; font-size: 14px; line-height: 1.65; color: #557062; }
    .line-table { width: 100%; margin-top: 22px; border-collapse: collapse; border: 1px solid #e4ece7; border-radius: 20px; overflow: hidden; }
    .line-table th { background: #f5faf7; padding: 10px 14px; text-align: left; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #5c7065; }
    .line-table td { padding: 10px 14px; border-top: 1px solid #ecf2ee; font-size: 13px; color: #183125; line-height: 1.35; }
    .right { text-align: right; }
    .summary-wrap { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; margin-top: 22px; }
    .note-box { border: 1px solid #e4ece7; border-radius: 22px; padding: 18px; background: #fbfcfb; }
    .total-box { border: 1px solid #d6ebe0; border-radius: 22px; padding: 18px 20px; background: linear-gradient(180deg, #f5fcf8, #edf8f1); }
    .total-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; font-size: 14px; color: #315244; }
    .grand { margin-top: 8px; padding-top: 14px; border-top: 1px solid #cfe2d7; font-size: 18px; font-weight: 800; color: #0f2b1d; }
    .footer { margin-top: 24px; border-top: 1px dashed #dbe6df; padding-top: 16px; font-size: 13px; line-height: 1.7; color: #64786d; }
    @media (max-width: 680px) {
      .hero, .content { padding: 22px 18px; }
      .hero-top, .party-grid, .summary-wrap { display: block; }
      .invoice-panel, .party-card, .note-box, .total-box { margin-top: 16px; }
      .brand-name { font-size: 28px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="hero">
      <div class="hero-top">
        <div>
          <div class="brand-kicker">Marketplace Invoice</div>
          <div class="brand-name">${receiptCompany.name}</div>
          <div class="brand-legal">
            ${receiptCompany.legal}<br />
            ${receiptCompany.location}<br />
            ${receiptCompany.email}<br />
            ${receiptCompany.phone}
          </div>
        </div>
        <div class="invoice-panel">
          <div class="invoice-label">Invoice</div>
          <div class="invoice-title">Order Receipt</div>
          <div class="invoice-meta">
            <div class="invoice-meta-row"><span>Reference</span><strong>${receiptReference}</strong></div>
            <div class="invoice-meta-row"><span>Issued</span><strong>${issuedAt.toLocaleDateString()}</strong></div>
            <div class="invoice-meta-row"><span>Status</span><strong>${order.payment_status === "paid" ? "Paid" : order.payment_status}</strong></div>
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="party-grid">
        <div class="party-card">
          <div class="section-kicker">Bill To</div>
          <div class="section-title">${order.buyer_profile?.full_name || "Buyer"}</div>
          <div class="section-copy">
            Buyer marketplace account<br />
            Payment method: ${paymentMethod}<br />
            Order ID: ${order.id}
          </div>
        </div>
        <div class="party-card">
          <div class="section-kicker">Paid To</div>
          <div class="section-title">${order.farmer_profile?.full_name || "Farmer"}</div>
          <div class="section-copy">
            Seller marketplace account<br />
            Settlement channel: ${receiptCompany.name}<br />
            Created: ${new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <table class="line-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th class="right">Unit Price</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${order.product?.name || "Product order"}</td>
            <td>${order.quantity}</td>
            <td>${order.unit}</td>
            <td class="right">KES ${unitPrice.toLocaleString()}</td>
            <td class="right">KES ${itemTotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Delivery and handling</td>
            <td>1</td>
            <td>service</td>
            <td class="right">KES ${deliveryFee.toLocaleString()}</td>
            <td class="right">KES ${deliveryFee.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div class="summary-wrap">
        <div class="note-box">
          <div class="section-kicker">Receipt Note</div>
          <div class="section-copy">
            This invoice confirms payment processed through ${receiptCompany.name} for the marketplace order above.
            Keep this file for supplier reconciliation, buyer support, and internal records.
          </div>
        </div>
        <div class="total-box">
          <div class="total-row"><span>Subtotal</span><strong>KES ${itemTotal.toLocaleString()}</strong></div>
          <div class="total-row"><span>Delivery</span><strong>KES ${deliveryFee.toLocaleString()}</strong></div>
          <div class="total-row grand"><span>Total Paid</span><span>KES ${totalPaid.toLocaleString()}</span></div>
        </div>
      </div>
      <div class="footer">
        Generated by ${receiptCompany.legal}. For billing support, contact ${receiptCompany.email}.
      </div>
    </div>
  </div>
</body>
</html>`;
}

function downloadReceipt(order: Order) {
  const blob = new Blob([buildReceiptHtml(order)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `agrilink-receipt-${order.id.slice(0, 8)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ReceiptDialog({ order, onOpenChange }: { order: Order | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-[1.4rem] p-0">
        <DialogHeader>
          <div className="px-6 pt-6">
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>View the payment details and download a formal receipt file.</DialogDescription>
          </div>
        </DialogHeader>
        {order && (
          <div className="space-y-4 px-6 pb-6">
            <div className="overflow-hidden rounded-[1.25rem] border border-emerald-200/70 bg-white dark:border-emerald-500/30 dark:bg-card">
              <div className="bg-[linear-gradient(135deg,#0d5b31,#1f8a4d)] px-5 py-5 text-white">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">Marketplace Invoice</p>
                    <h3 className="mt-3 font-display text-2xl font-bold">{receiptCompany.name}</h3>
                    <p className="mt-3 max-w-sm text-xs leading-5 text-white/80">
                      {receiptCompany.legal}
                      <br />
                      {receiptCompany.location}
                      <br />
                      {receiptCompany.email}
                      <br />
                      {receiptCompany.phone}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/15 bg-white/10 px-4 py-3 sm:min-w-[220px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">Invoice</p>
                    <p className="mt-2 font-display text-xl font-bold">Order Receipt</p>
                    <div className="mt-4 space-y-2 text-xs text-white/85">
                      <div className="flex items-center justify-between gap-4">
                        <span>Reference</span>
                        <strong>{order.payment_ref || order.checkout_request_id || "Pending"}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Status</span>
                        <strong>{order.payment_status === "paid" ? "Paid" : order.payment_status}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Issued</span>
                        <strong>{(order.paid_at ? new Date(order.paid_at) : new Date(order.created_at)).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-border bg-muted/20 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bill To</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{order.buyer_profile?.full_name || "Buyer"}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Buyer marketplace account
                      <br />
                      Payment method: {order.payment_method || "M-Pesa"}
                      <br />
                      Order ID: {order.id}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border bg-muted/20 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Paid To</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{order.farmer_profile?.full_name || "Farmer"}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Seller marketplace account
                      <br />
                      Settlement channel: {receiptCompany.name}
                      <br />
                      Created: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1rem] border border-border">
                  <div className="grid grid-cols-[1.5fr_0.55fr_0.7fr_0.8fr] gap-3 border-b border-border bg-muted/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="grid grid-cols-[1.5fr_0.55fr_0.7fr_0.8fr] gap-3 border-b border-border px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{order.product?.name || "Product order"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Unit price: KES {(order.quantity > 0 ? Number(order.total_price) / order.quantity : Number(order.total_price)).toLocaleString()}</p>
                    </div>
                    <span className="font-medium text-foreground">{order.quantity}</span>
                    <span className="font-medium text-foreground">{order.unit}</span>
                    <span className="text-right font-semibold text-foreground">KES {Number(order.total_price).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-[1.5fr_0.55fr_0.7fr_0.8fr] gap-3 px-3 py-2.5 text-sm">
                    <div className="font-medium text-foreground">Delivery and handling</div>
                    <span className="text-muted-foreground">1</span>
                    <span className="text-muted-foreground">service</span>
                    <span className="text-right font-semibold text-foreground">KES {Number(order.delivery_fee || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1rem] border border-border bg-muted/20 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Receipt Note</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      This invoice confirms payment processed through {receiptCompany.name} for the marketplace order above.
                      Keep it for supplier reconciliation, buyer support, and internal records.
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">KES {Number(order.total_price).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-semibold text-foreground">KES {Number(order.delivery_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="mt-3 border-t border-emerald-200/80 pt-3 dark:border-emerald-500/20">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-foreground">Total paid</span>
                        <span className="font-display text-xl font-bold text-foreground">
                          KES {(Number(order.total_price) + Number(order.delivery_fee || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="rounded-xl" onClick={() => downloadReceipt(order)}>
                <Download className="mr-2 h-4 w-4" /> Download Receipt
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrderActions({ order, view, busy, onChangeStatus }: { order: Order; view: "selling" | "buying"; busy: boolean; onChangeStatus: (status: string) => void; }) {
  if (view === "selling") {
    if (order.status === "pending") return <><Button size="sm" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" disabled={busy} onClick={() => onChangeStatus("confirmed")}>{busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />} Accept</Button><Button size="sm" variant="outline" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs text-destructive" disabled={busy} onClick={() => onChangeStatus("cancelled")}><X className="mr-1 h-3 w-3" /> Decline</Button></>;
    if (order.status === "confirmed") return <><Button size="sm" variant="outline" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" disabled={busy} onClick={() => onChangeStatus("processing")}><Settings2 className="mr-1 h-3 w-3" /> Process</Button><Button size="sm" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" disabled={busy} onClick={() => onChangeStatus("shipped")}>{busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Truck className="mr-1 h-3 w-3" />} Ship</Button></>;
    if (order.status === "processing") return <Button size="sm" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" disabled={busy} onClick={() => onChangeStatus("shipped")}>{busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Truck className="mr-1 h-3 w-3" />} Ship</Button>;
  }
  if (view === "buying") {
    if (order.status === "pending") return <Button size="sm" variant="outline" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs text-destructive" disabled={busy} onClick={() => onChangeStatus("cancelled")}>{busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />} Cancel</Button>;
    if (order.status === "shipped") return <Button size="sm" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" disabled={busy} onClick={() => onChangeStatus("delivered")}>{busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />} Mark Received</Button>;
  }
  return null;
}

function ReceiptActions({ order, onView }: { order: Order; onView: (order: Order) => void }) {
  if (!order.paid_at) return null;
  return <><Button size="sm" variant="outline" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" onClick={() => onView(order)}><Eye className="mr-1 h-3 w-3" /> View Receipt</Button><Button size="sm" variant="outline" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs" onClick={() => downloadReceipt(order)}><Download className="mr-1 h-3 w-3" /> Download</Button></>;
}

function OrderEmptyState({ icon: Icon, title, detail }: { icon: typeof Package; title: string; detail: string }) {
  return <div className="rounded-[1.75rem] border border-dashed border-border bg-white/80 py-14 text-center shadow-sm dark:bg-card/80"><Icon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="font-display text-xl font-bold text-foreground">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{detail}</p></div>;
}

function OrdersDesktopTable(props: {
  orders: Order[];
  view: "selling" | "buying";
  busyOrderId: string | null;
  paymentPhoneByOrder: Record<string, string>;
  onPhoneChange: (orderId: string, value: string) => void;
  onChangeStatus: (orderId: string, status: string) => void;
  onStartPayment: (orderId: string) => void;
  onRefreshPayment: (orderId: string) => void;
  onViewReceipt: (order: Order) => void;
}) {
  const { orders, view, busyOrderId, paymentPhoneByOrder, onPhoneChange, onChangeStatus, onStartPayment, onRefreshPayment, onViewReceipt } = props;

  return (
    <div className="hidden overflow-x-auto rounded-[1rem] border border-border/70 bg-white/90 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] lg:block dark:bg-card/90">
      <table className="w-full min-w-[1220px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/25 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Counterparty</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Unit</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Delivery</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const personLabel = view === "selling" ? "Buyer" : "Seller";
            const personName =
              view === "selling" ? order.buyer_profile?.full_name || "Buyer" : order.farmer_profile?.full_name || "Farmer";
            const shippingState =
              order.status === "shipped"
                ? "In transit"
                : order.status === "processing"
                  ? "Preparing dispatch"
                  : order.status === "delivered"
                    ? "Delivered"
                    : "Awaiting shipment";
            const paidLabel = order.paid_at ? "Paid" : order.payment_status;
            const busy = busyOrderId === order.id;

            return (
              <tr key={order.id} className="border-b border-border/70 align-top text-sm last:border-b-0">
                <td className="px-4 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-primary/10 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                      {order.product?.image_emoji || emojiFallback}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{order.product?.name || "Product"}</p>
                      <p className="truncate text-xs text-muted-foreground">Order {order.id.slice(0, 8)} | {new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="truncate text-xs text-muted-foreground">Transaction {getTransactionReference(order)}</p>
                      {order.notes && <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">{order.notes}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-medium text-foreground">{personName}</p>
                  <p className="text-xs text-muted-foreground">{personLabel}</p>
                </td>
                <td className="px-4 py-3.5 font-medium text-foreground">{order.quantity}</td>
                <td className="px-4 py-3.5 text-foreground">{order.unit}</td>
                <td className="px-4 py-3.5 font-semibold text-foreground">KES {Number(order.total_price).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-foreground">KES {Number(order.delivery_fee || 0).toLocaleString()}</td>
                <td className="px-4 py-3.5">
                  <div className="flex max-w-[170px] flex-wrap gap-1.5">
                    <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status] || ""}`}>{order.status}</Badge>
                    <Badge variant="outline" className="rounded-full text-[10px]">{paidLabel}</Badge>
                    <Badge variant="outline" className="rounded-full text-[10px]">{shippingState}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 whitespace-nowrap rounded-xl px-3 text-xs">
                      <Link to="/dashboard/messages">
                        <MessageCircle className="mr-1 h-3 w-3" /> {view === "selling" ? "Buyer" : "Seller"}
                      </Link>
                    </Button>
                    <OrderActions order={order} view={view} busy={busy} onChangeStatus={(status) => onChangeStatus(order.id, status)} />
                    <ReceiptActions order={order} onView={onViewReceipt} />
                  </div>
                  {view === "buying" && order.payment_status !== "paid" && order.status !== "cancelled" && (
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <Input value={paymentPhoneByOrder[order.id] ?? ""} onChange={(event) => onPhoneChange(order.id, event.target.value)} placeholder="2547XXXXXXXX" className="h-8 w-[160px] rounded-xl" />
                      <Button size="sm" className="h-8 rounded-xl px-3 text-xs" disabled={busy} onClick={() => onStartPayment(order.id)}>
                        {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <CreditCard className="mr-1 h-3 w-3" />}
                        Pay Now
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-xl px-3 text-xs" disabled={busy || !order.checkout_request_id} onClick={() => onRefreshPayment(order.id)}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Check
                      </Button>
                    </div>
                  )}
                  {order.payment_error && <p className="mt-2 text-right text-xs text-destructive">{order.payment_error}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ShippingDesktopTable(props: {
  orders: Order[];
  sellingOrders: Order[];
}) {
  const { orders, sellingOrders } = props;

  return (
    <div className="hidden overflow-x-auto rounded-[1rem] border border-border/70 bg-white/90 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] lg:block dark:bg-card/90">
      <table className="w-full min-w-[1040px] border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/25 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Lane</th>
            <th className="px-4 py-3">Counterparty</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Shipping</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isSelling = sellingOrders.some((sellingOrder) => sellingOrder.id === order.id);
            const counterparty = isSelling ? order.buyer_profile?.full_name || "Buyer" : order.farmer_profile?.full_name || "Farmer";
            const shippingCopy =
              order.status === "delivered" ? "Completed delivery" : order.status === "shipped" ? "In transit" : "Preparing shipment";

            return (
              <tr key={order.id} className="border-b border-border/70 align-top text-sm last:border-b-0">
                <td className="px-4 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] bg-primary/10 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                      {order.product?.image_emoji || emojiFallback}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{order.product?.name || "Product"}</p>
                      <p className="truncate text-xs text-muted-foreground">Order {order.id.slice(0, 8)} | {new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="truncate text-xs text-muted-foreground">Transaction {getTransactionReference(order)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-foreground">{isSelling ? "Selling" : "Buying"}</td>
                <td className="px-4 py-3.5 font-medium text-foreground">{counterparty}</td>
                <td className="px-4 py-3.5 text-foreground">{order.quantity} {order.unit}</td>
                <td className="px-4 py-3.5 font-semibold text-foreground">KES {Number(order.total_price).toLocaleString()}</td>
                <td className="px-4 py-3.5 text-foreground">{shippingCopy}</td>
                <td className="px-4 py-3.5">
                  <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status] || ""}`}>{order.status}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderCard(props: {
  order: Order;
  view: "selling" | "buying";
  busy: boolean;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  onChangeStatus: (status: string) => void;
  onStartPayment: () => void;
  onRefreshPayment: () => void;
  onViewReceipt: (order: Order) => void;
}) {
  const {
    order,
    view,
    busy,
    phoneNumber,
    onPhoneChange,
    onChangeStatus,
    onStartPayment,
    onRefreshPayment,
    onViewReceipt,
  } = props;

  const personLabel = view === "selling" ? "Buyer" : "Seller";
  const personName =
    view === "selling" ? order.buyer_profile?.full_name || "Buyer" : order.farmer_profile?.full_name || "Farmer";
  const shippingState =
    order.status === "shipped"
      ? "In transit"
      : order.status === "processing"
        ? "Preparing dispatch"
        : order.status === "delivered"
          ? "Delivered"
        : "Awaiting shipment";
  const paidLabel = order.paid_at ? "Paid" : order.payment_status;
  const createdDate = new Date(order.created_at).toLocaleDateString();
  const transactionReference = getTransactionReference(order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1rem] border border-border/70 bg-white/90 p-3 shadow-[0_12px_22px_-24px_rgba(15,23,42,0.18)] lg:hidden dark:bg-card/90 dark:shadow-[0_12px_22px_-24px_rgba(0,0,0,0.4)]"
    >
        <div className="hidden min-w-[1080px] items-center gap-3 lg:grid lg:grid-cols-[minmax(220px,2fr)_minmax(140px,1.2fr)_90px_120px_110px_170px_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-primary/10 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
            {order.product?.image_emoji || emojiFallback}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold text-foreground">{order.product?.name || "Product"}</p>
            <p className="truncate text-xs text-muted-foreground">Order {order.id.slice(0, 8)} • {createdDate}</p>
            <p className="truncate text-xs text-muted-foreground">Transaction {transactionReference}</p>
            {order.notes && <p className="truncate text-xs text-muted-foreground">{order.notes}</p>}
          </div>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{personName}</p>
          <p className="truncate text-xs text-muted-foreground">{personLabel}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">{order.quantity} {order.unit}</p>
          <p className="text-xs text-muted-foreground">Quantity</p>
        </div>

        <div>
          <p className="text-sm font-bold text-foreground">KES {Number(order.total_price).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Order value</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">KES {Number(order.delivery_fee || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Delivery</p>
        </div>

          <div className="flex min-w-0 flex-wrap gap-1.5">
            <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status] || ""}`}>
              {order.status}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[10px]">{paidLabel}</Badge>
            <Badge variant="outline" className="rounded-full text-[10px]">{shippingState}</Badge>
          </div>

          <div className="flex flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-1">
            <Button asChild size="sm" variant="outline" className="h-8 shrink-0 whitespace-nowrap rounded-xl px-3 text-xs">
              <Link to="/dashboard/messages">
                <MessageCircle className="mr-1 h-3 w-3" /> {view === "selling" ? "Buyer" : "Seller"}
              </Link>
            </Button>
            <OrderActions order={order} view={view} busy={busy} onChangeStatus={onChangeStatus} />
            <ReceiptActions order={order} onView={onViewReceipt} />
          </div>
        </div>

      <div className="space-y-3 lg:hidden">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-primary/10 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
            {order.product?.image_emoji || emojiFallback}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {view === "selling" ? "Selling" : "Buying"}
              </span>
              <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status] || ""}`}>
                {order.status}
              </Badge>
            </div>
            <h4 className="mt-2 font-display text-base font-bold leading-tight text-foreground">{order.product?.name || "Product"}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{personLabel}: {personName}</p>
            <p className="mt-1 break-all text-xs text-muted-foreground">Transaction {transactionReference}</p>
            <p className="mt-1 text-xs text-muted-foreground">Qty {order.quantity} {order.unit} • {createdDate}</p>
          </div>
        </div>

        {order.notes && (
          <div className="rounded-[0.8rem] border border-border/60 bg-muted/25 px-3 py-2">
            <p className="text-sm leading-5 text-muted-foreground">{order.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border/70 pt-2">
          <Button asChild size="sm" variant="outline" className="h-8 rounded-xl px-3">
            <Link to="/dashboard/messages">
              <MessageCircle className="mr-1 h-3 w-3" /> {view === "selling" ? "Message Buyer" : "Message Seller"}
            </Link>
          </Button>
          <ReceiptActions order={order} onView={onViewReceipt} />
          <OrderActions order={order} view={view} busy={busy} onChangeStatus={onChangeStatus} />
        </div>
      </div>

      {view === "buying" && order.payment_status !== "paid" && order.status !== "cancelled" && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-2.5 sm:flex-row sm:flex-wrap">
          <Input value={phoneNumber} onChange={(event) => onPhoneChange(event.target.value)} placeholder="2547XXXXXXXX" className="h-8 rounded-xl sm:max-w-[180px]" />
          <Button size="sm" className="h-8 rounded-xl px-3" disabled={busy} onClick={onStartPayment}>
            {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <CreditCard className="mr-1 h-3 w-3" />}
            Pay Now
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-xl px-3" disabled={busy || !order.checkout_request_id} onClick={onRefreshPayment}>
            <RefreshCw className="mr-1 h-3 w-3" /> Check Payment
          </Button>
        </div>
      )}

      {order.payment_error && <p className="mt-2 text-xs text-destructive">{order.payment_error}</p>}
    </motion.div>
  );
}

export default function Orders() {
  const { sellingOrders, buyingOrders, loading, updateOrderStatus, initiateMpesaPayment, refreshMpesaPaymentStatus } = useOrders();
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [paymentPhoneByOrder, setPaymentPhoneByOrder] = useState<Record<string, string>>({});
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [activeExportRange, setActiveExportRange] = useState<number>(30);
  const [transactionSearch, setTransactionSearch] = useState("");

  const shippingOrders = useMemo(
    () =>
      [...sellingOrders, ...buyingOrders].filter((order, index, all) => {
        const unique = all.findIndex((entry) => entry.id === order.id) === index;
        return unique && ["processing", "shipped", "delivered"].includes(order.status);
      }),
    [sellingOrders, buyingOrders],
  );

  const filteredSellingOrders = useMemo(
    () => sellingOrders.filter((order) => matchesTransactionSearch(order, transactionSearch)),
    [sellingOrders, transactionSearch],
  );

  const filteredBuyingOrders = useMemo(
    () => buyingOrders.filter((order) => matchesTransactionSearch(order, transactionSearch)),
    [buyingOrders, transactionSearch],
  );

  const filteredShippingOrders = useMemo(
    () => shippingOrders.filter((order) => matchesTransactionSearch(order, transactionSearch)),
    [shippingOrders, transactionSearch],
  );

  const summaryCards = useMemo(() => {
    const totalSellingValue = sellingOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
    const totalBuyingValue = buyingOrders.reduce((sum, order) => sum + Number(order.total_price), 0);
    const inTransit = shippingOrders.filter((order) => order.status === "shipped").length;
    const pendingPayments = buyingOrders.filter((order) => order.payment_status !== "paid" && order.status !== "cancelled").length;

    return [
      { label: "Selling", value: String(sellingOrders.length), detail: `KES ${totalSellingValue.toLocaleString()} total order value`, icon: Package },
      { label: "Buying", value: String(buyingOrders.length), detail: `KES ${totalBuyingValue.toLocaleString()} committed`, icon: ShoppingBag },
      { label: "Shipping", value: String(inTransit), detail: "Orders currently in transit", icon: Truck },
      { label: "Payments Pending", value: String(pendingPayments), detail: "Buying orders still awaiting payment", icon: CreditCard },
    ];
  }, [buyingOrders, sellingOrders, shippingOrders]);

  const transactionExportData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - activeExportRange);

    return [...sellingOrders, ...buyingOrders]
      .filter((order, index, all) => all.findIndex((entry) => entry.id === order.id) === index)
      .filter((order) => new Date(order.created_at) >= cutoff)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeExportRange, buyingOrders, sellingOrders]);

  const handleChangeStatus = async (orderId: string, status: string) => {
    setBusyOrderId(orderId);
    await updateOrderStatus(orderId, status);
    setBusyOrderId(null);
  };

  const handleStartPayment = async (orderId: string) => {
    setBusyOrderId(orderId);
    await initiateMpesaPayment(orderId, paymentPhoneByOrder[orderId] || "");
    setBusyOrderId(null);
  };

  const handleRefreshPayment = async (orderId: string) => {
    setBusyOrderId(orderId);
    await refreshMpesaPaymentStatus(orderId);
    setBusyOrderId(null);
  };

  const handleDownloadTransactions = () => {
    const totalValue = transactionExportData.reduce((sum, order) => sum + Number(order.total_price), 0);
    const totalDelivery = transactionExportData.reduce((sum, order) => sum + Number(order.delivery_fee || 0), 0);
    const paidCount = transactionExportData.filter((order) => order.payment_status === "paid").length;
    const tableRows = transactionExportData
      .map((order) => {
        const isSelling = sellingOrders.some((sellingOrder) => sellingOrder.id === order.id);
        const counterparty = isSelling
          ? order.buyer_profile?.full_name || "Buyer"
          : order.farmer_profile?.full_name || "Farmer";

        return `
          <tr>
            <td>${order.product?.name || "Product"}</td>
            <td>${isSelling ? "Selling" : "Buying"}</td>
            <td>${counterparty}</td>
            <td>${order.quantity} ${order.unit}</td>
            <td>KES ${Number(order.total_price).toLocaleString()}</td>
            <td>${order.status}</td>
            <td>${order.payment_status}</td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
          </tr>
        `;
      })
      .join("");

    const reportHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AgriLink X Transactions ${activeExportRange} Days</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 30px 18px; background: #eef4f0; font-family: Arial, sans-serif; color: #153126; }
    .sheet { max-width: 980px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe8df; border-radius: 28px; overflow: hidden; box-shadow: 0 28px 60px rgba(15, 23, 42, 0.08); }
    .hero { padding: 28px 32px; background: linear-gradient(135deg, #0d5b31, #1f8a4d); color: #ffffff; }
    .hero-top { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; }
    .kicker { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; opacity: .82; }
    .brand { margin-top: 10px; font-size: 34px; font-weight: 800; }
    .sub { margin-top: 10px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.84); }
    .panel { min-width: 240px; border-radius: 22px; padding: 18px 20px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.16); }
    .panel-title { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; opacity: .82; }
    .panel-main { margin-top: 10px; font-size: 28px; font-weight: 800; }
    .panel-copy { margin-top: 12px; display: grid; gap: 8px; font-size: 13px; }
    .content { padding: 26px 32px 32px; }
    .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .stat { border: 1px solid #e2ebe5; border-radius: 20px; padding: 16px; background: #fbfcfb; }
    .stat-label { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #6b7f74; font-weight: 700; }
    .stat-value { margin-top: 10px; font-size: 24px; font-weight: 800; color: #10231a; }
    .stat-copy { margin-top: 6px; font-size: 13px; color: #597062; }
    table { width: 100%; margin-top: 20px; border-collapse: collapse; border: 1px solid #e4ece7; border-radius: 20px; overflow: hidden; }
    th { background: #f5faf7; padding: 10px 12px; text-align: left; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: #5c7065; }
    td { padding: 10px 12px; border-top: 1px solid #ecf2ee; font-size: 13px; color: #183125; line-height: 1.35; }
    .totals { margin-top: 20px; margin-left: auto; width: 100%; max-width: 360px; border: 1px solid #d6ebe0; border-radius: 22px; padding: 18px 20px; background: linear-gradient(180deg, #f5fcf8, #edf8f1); }
    .total-row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; font-size: 14px; color: #315244; }
    .grand { margin-top: 8px; padding-top: 14px; border-top: 1px solid #cfe2d7; font-size: 18px; font-weight: 800; color: #0f2b1d; }
    .footer { margin-top: 20px; border-top: 1px dashed #dbe6df; padding-top: 16px; font-size: 13px; line-height: 1.7; color: #64786d; }
    @media (max-width: 760px) {
      .hero-top, .stats { display: block; }
      .panel, .stat { margin-top: 14px; }
      .hero, .content { padding: 22px 18px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="hero">
      <div class="hero-top">
        <div>
          <div class="kicker">Transaction Statement</div>
          <div class="brand">${receiptCompany.name}</div>
          <div class="sub">
            ${receiptCompany.legal}<br />
            ${receiptCompany.location}<br />
            ${receiptCompany.email}<br />
            ${receiptCompany.phone}
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">Statement Range</div>
          <div class="panel-main">${activeExportRange} Days</div>
          <div class="panel-copy">
            <div>Generated: ${new Date().toLocaleDateString()}</div>
            <div>Transactions: ${transactionExportData.length}</div>
            <div>Paid Orders: ${paidCount}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Transactions</div>
          <div class="stat-value">${transactionExportData.length}</div>
          <div class="stat-copy">Orders included in this statement</div>
        </div>
        <div class="stat">
          <div class="stat-label">Order Value</div>
          <div class="stat-value">KES ${totalValue.toLocaleString()}</div>
          <div class="stat-copy">Combined order total</div>
        </div>
        <div class="stat">
          <div class="stat-label">Delivery Fees</div>
          <div class="stat-value">KES ${totalDelivery.toLocaleString()}</div>
          <div class="stat-copy">Logistics and handling</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Lane</th>
            <th>Counterparty</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || `<tr><td colspan="8">No transactions found in this range.</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Order value</span><strong>KES ${totalValue.toLocaleString()}</strong></div>
        <div class="total-row"><span>Delivery fees</span><strong>KES ${totalDelivery.toLocaleString()}</strong></div>
        <div class="total-row grand"><span>Total volume</span><span>KES ${(totalValue + totalDelivery).toLocaleString()}</span></div>
      </div>

      <div class="footer">
        Generated by ${receiptCompany.legal}. Keep this statement for reconciliation, reporting, and support follow-up.
      </div>
    </div>
  </div>
</body>
</html>`;

    downloadHtml(`agrilink-transactions-${activeExportRange}-days.html`, reportHtml);
  };

  return (
    <DashboardShell title="Orders">
      <ReceiptDialog order={receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)} />

      <div className="space-y-5">
        <section className="rounded-[1.3rem] border border-border/70 bg-white/90 p-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Transaction Downloads</p>
              <p className="text-sm text-muted-foreground">Download orders by time range for reporting and reconciliation.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex flex-wrap gap-2">
                {exportRanges.map((range) => (
                  <Button
                    key={range.days}
                    type="button"
                    variant={activeExportRange === range.days ? "default" : "outline"}
                    className="h-9 rounded-xl px-4"
                    onClick={() => setActiveExportRange(range.days)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                className="h-9 rounded-xl"
                disabled={!transactionExportData.length}
                onClick={handleDownloadTransactions}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Transactions
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {transactionExportData.length} transaction{transactionExportData.length === 1 ? "" : "s"} ready in the last {activeExportRange} day{activeExportRange === 1 ? "" : "s"}.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[1.3rem] border border-border/70 bg-white/90 p-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-primary/10">
                <card.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p>
            </motion.div>
          ))}
        </section>

        <Tabs defaultValue="selling" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-[0.95rem] bg-muted p-1">
            <TabsTrigger value="selling" className="rounded-[0.8rem]">Selling</TabsTrigger>
            <TabsTrigger value="buying" className="rounded-[0.8rem]">Buying</TabsTrigger>
            <TabsTrigger value="shipping" className="rounded-[0.8rem]">Shipping</TabsTrigger>
          </TabsList>

          <div className="mt-4 rounded-[1.1rem] border border-border/70 bg-white/90 p-4 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.18)] dark:bg-card/90">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Search by transaction ID</p>
                <p className="text-xs text-muted-foreground">
                  Find an order using receipt number, checkout request ID, merchant request ID, or order ID.
                </p>
              </div>
              <div className="w-full sm:max-w-md">
                <Input
                  value={transactionSearch}
                  onChange={(event) => setTransactionSearch(event.target.value)}
                  placeholder="Enter transaction ID"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

            <TabsContent value="selling" className="mt-5 space-y-3">
              {loading && <div className="rounded-[1.2rem] border border-border bg-white/85 p-4 text-sm text-muted-foreground">Loading selling orders...</div>}
              {!loading && !filteredSellingOrders.length && (
                <OrderEmptyState
                  icon={Package}
                  title={transactionSearch ? "No matching selling orders" : "No selling orders yet"}
                  detail={
                    transactionSearch
                      ? "Try another transaction ID, receipt number, or checkout reference."
                      : "Incoming buyer requests will appear here once customers place orders."
                  }
                />
              )}
              {!!filteredSellingOrders.length && (
                <OrdersDesktopTable
                  orders={filteredSellingOrders}
                  view="selling"
                  busyOrderId={busyOrderId}
                  paymentPhoneByOrder={paymentPhoneByOrder}
                  onPhoneChange={(orderId, value) => setPaymentPhoneByOrder((current) => ({ ...current, [orderId]: value }))}
                  onChangeStatus={(orderId, status) => void handleChangeStatus(orderId, status)}
                  onStartPayment={(orderId) => void handleStartPayment(orderId)}
                  onRefreshPayment={(orderId) => void handleRefreshPayment(orderId)}
                  onViewReceipt={setReceiptOrder}
                />
              )}
            </TabsContent>

            <TabsContent value="buying" className="mt-5 space-y-3">
              {loading && <div className="rounded-[1.2rem] border border-border bg-white/85 p-4 text-sm text-muted-foreground">Loading buying orders...</div>}
              {!loading && !filteredBuyingOrders.length && (
                <OrderEmptyState
                  icon={ShoppingBag}
                  title={transactionSearch ? "No matching purchase orders" : "No purchase orders yet"}
                  detail={
                    transactionSearch
                      ? "Try another transaction ID, receipt number, or checkout reference."
                      : "Orders you place as a buyer will be organized here."
                  }
                />
              )}
              {!!filteredBuyingOrders.length && (
                <OrdersDesktopTable
                  orders={filteredBuyingOrders}
                  view="buying"
                  busyOrderId={busyOrderId}
                  paymentPhoneByOrder={paymentPhoneByOrder}
                  onPhoneChange={(orderId, value) => setPaymentPhoneByOrder((current) => ({ ...current, [orderId]: value }))}
                  onChangeStatus={(orderId, status) => void handleChangeStatus(orderId, status)}
                  onStartPayment={(orderId) => void handleStartPayment(orderId)}
                  onRefreshPayment={(orderId) => void handleRefreshPayment(orderId)}
                  onViewReceipt={setReceiptOrder}
                />
              )}
            </TabsContent>

          <TabsContent value="shipping" className="mt-5 space-y-3">
            {loading && <div className="rounded-[1.2rem] border border-border bg-white/85 p-4 text-sm text-muted-foreground">Loading shipping activity...</div>}
            {!loading && !filteredShippingOrders.length && (
              <OrderEmptyState
                icon={Truck}
                title={transactionSearch ? "No matching shipping orders" : "No shipping activity yet"}
                detail={
                  transactionSearch
                    ? "Try another transaction ID, receipt number, or checkout reference."
                    : "Orders in processing, shipped, or delivered states will appear here."
                }
              />
            )}
            {!!filteredShippingOrders.length && <ShippingDesktopTable orders={filteredShippingOrders} sellingOrders={sellingOrders} />}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
