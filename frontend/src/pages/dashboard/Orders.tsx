import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, CreditCard, LoaderCircle, MessageCircle, Package, RefreshCw, Settings2, Truck, X } from "lucide-react";
import { useState } from "react";
import { useOrders, type Order } from "@/hooks/useOrders";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors: Record<string, string> = {
  pending: "bg-gold-500/15 text-gold-600 border-gold-500/20",
  confirmed: "bg-primary/15 text-primary border-primary/20",
  processing: "bg-steel-500/15 text-steel-500 border-steel-500/20",
  shipped: "bg-primary/15 text-primary border-primary/20",
  delivered: "bg-primary/20 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

const emojiFallback = "🌾";

function OrderActions({
  order,
  view,
  busy,
  onChangeStatus,
}: {
  order: Order;
  view: "selling" | "buying";
  busy: boolean;
  onChangeStatus: (status: string) => void;
}) {
  if (view === "selling") {
    if (order.status === "pending") {
      return (
        <>
          <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => onChangeStatus("confirmed")}>
            {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />} Accept
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl text-destructive" disabled={busy} onClick={() => onChangeStatus("cancelled")}>
            <X className="mr-1 h-3 w-3" /> Decline
          </Button>
        </>
      );
    }

    if (order.status === "confirmed") {
      return (
        <>
          <Button size="sm" variant="outline" className="rounded-xl" disabled={busy} onClick={() => onChangeStatus("processing")}>
            <Settings2 className="mr-1 h-3 w-3" /> Process
          </Button>
          <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => onChangeStatus("shipped")}>
            {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Truck className="mr-1 h-3 w-3" />} Ship
          </Button>
        </>
      );
    }

    if (order.status === "processing") {
      return (
        <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => onChangeStatus("shipped")}>
          {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Truck className="mr-1 h-3 w-3" />} Ship
        </Button>
      );
    }
  }

  if (view === "buying") {
    if (order.status === "pending") {
      return (
        <Button size="sm" variant="outline" className="rounded-xl text-destructive" disabled={busy} onClick={() => onChangeStatus("cancelled")}>
          {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />} Cancel
        </Button>
      );
    }

    if (order.status === "shipped") {
      return (
        <Button size="sm" className="rounded-xl" disabled={busy} onClick={() => onChangeStatus("delivered")}>
          {busy ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />} Mark Received
        </Button>
      );
    }
  }

  return null;
}

export default function Orders() {
  const { sellingOrders, buyingOrders, loading, updateOrderStatus, initiateMpesaPayment, refreshMpesaPaymentStatus } = useOrders();
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [paymentPhoneByOrder, setPaymentPhoneByOrder] = useState<Record<string, string>>({});

  const handleChangeStatus = async (orderId: string, status: string) => {
    setBusyOrderId(orderId);
    await updateOrderStatus(orderId, status);
    setBusyOrderId(null);
  };

  const handleStartPayment = async (orderId: string) => {
    setBusyOrderId(orderId);
    const phoneNumber = paymentPhoneByOrder[orderId] || "";
    await initiateMpesaPayment(orderId, phoneNumber);
    setBusyOrderId(null);
  };

  const handleRefreshPayment = async (orderId: string) => {
    setBusyOrderId(orderId);
    await refreshMpesaPaymentStatus(orderId);
    setBusyOrderId(null);
  };

  return (
    <DashboardShell title="Orders">
      <Tabs defaultValue="selling" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl bg-muted">
          <TabsTrigger value="selling" className="rounded-xl">Selling</TabsTrigger>
          <TabsTrigger value="buying" className="rounded-xl">Buying</TabsTrigger>
        </TabsList>

        <TabsContent value="selling">
          <div className="space-y-3">
            {loading && <div className="bento-card text-sm text-muted-foreground">Loading selling orders...</div>}
            {sellingOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bento-card flex flex-col gap-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                    <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status]}`}>
                      {order.status}
                    </Badge>
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      payment: {order.payment_status}
                    </Badge>
                  </div>
                    <h4 className="font-display text-sm font-bold text-foreground">
                      {order.product?.image_emoji || emojiFallback} {order.product?.name || "Product"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Buyer: {order.buyer_profile?.full_name || "Buyer"} · Qty {order.quantity} {order.unit}
                    </p>
                    {order.notes && <p className="mt-1 text-xs text-muted-foreground">Note: {order.notes}</p>}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-display font-bold text-foreground">KES {order.total_price}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link to="/dashboard/messages">
                      <MessageCircle className="mr-1 h-3 w-3" /> Message Buyer
                    </Link>
                  </Button>
                  <OrderActions
                    order={order}
                    view="selling"
                    busy={busyOrderId === order.id}
                    onChangeStatus={(status) => void handleChangeStatus(order.id, status)}
                  />
                </div>
              </motion.div>
            ))}

            {!loading && !sellingOrders.length && (
              <div className="bento-card py-12 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No selling orders yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="buying">
          <div className="space-y-3">
            {loading && <div className="bento-card text-sm text-muted-foreground">Loading buying orders...</div>}
            {buyingOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bento-card flex flex-col gap-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                      <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status]}`}>
                        {order.status}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        payment: {order.payment_status}
                      </Badge>
                    </div>
                    <h4 className="font-display text-sm font-bold text-foreground">
                      {order.product?.image_emoji || emojiFallback} {order.product?.name || "Product"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Seller: {order.farmer_profile?.full_name || "Farmer"} · Qty {order.quantity} {order.unit}
                    </p>
                    {order.notes && <p className="mt-1 text-xs text-muted-foreground">Note: {order.notes}</p>}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-display font-bold text-primary">KES {order.total_price}</p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link to="/dashboard/messages">
                      <MessageCircle className="mr-1 h-3 w-3" /> Message Seller
                    </Link>
                  </Button>
                  {order.payment_status !== "paid" && order.status !== "cancelled" && (
                    <>
                      <Input
                        value={paymentPhoneByOrder[order.id] ?? ""}
                        onChange={(event) =>
                          setPaymentPhoneByOrder((current) => ({ ...current, [order.id]: event.target.value }))
                        }
                        placeholder="2547XXXXXXXX"
                        className="h-9 rounded-xl sm:max-w-[180px]"
                      />
                      <Button size="sm" className="rounded-xl" disabled={busyOrderId === order.id} onClick={() => void handleStartPayment(order.id)}>
                        {busyOrderId === order.id ? <LoaderCircle className="mr-1 h-3 w-3 animate-spin" /> : <CreditCard className="mr-1 h-3 w-3" />}
                        Pay Now
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" disabled={busyOrderId === order.id || !order.checkout_request_id} onClick={() => void handleRefreshPayment(order.id)}>
                        <RefreshCw className="mr-1 h-3 w-3" /> Check Payment
                      </Button>
                    </>
                  )}
                  <OrderActions
                    order={order}
                    view="buying"
                    busy={busyOrderId === order.id}
                    onChangeStatus={(status) => void handleChangeStatus(order.id, status)}
                  />
                </div>
                {order.payment_error && <p className="text-xs text-destructive">{order.payment_error}</p>}
                {order.paid_at && <p className="text-xs text-emerald-700">Paid on {new Date(order.paid_at).toLocaleString()}</p>}
              </motion.div>
            ))}

            {!loading && !buyingOrders.length && (
              <div className="bento-card py-12 text-center">
                <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
