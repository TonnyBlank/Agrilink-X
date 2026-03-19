import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, MessageCircle, Package, Truck, X } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  pending: "bg-gold-500/15 text-gold-600 border-gold-500/20",
  confirmed: "bg-primary/15 text-primary border-primary/20",
  processing: "bg-steel-500/15 text-steel-500 border-steel-500/20",
  shipped: "bg-primary/15 text-primary border-primary/20",
  delivered: "bg-primary/20 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

export default function Orders() {
  const { sellingOrders, buyingOrders, loading, updateOrderStatus } = useOrders();

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
                className="bento-card flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                    <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status]}`}>
                      {order.status}
                    </Badge>
                  </div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    {order.product?.image_emoji || "🌾"} {order.product?.name || "Product"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Qty {order.quantity} {order.unit}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-display font-bold text-foreground">KES {order.total_price}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link to="/dashboard/messages">
                      <MessageCircle className="mr-1 h-3 w-3" /> Message
                    </Link>
                  </Button>
                  {order.status === "pending" && (
                    <>
                      <Button size="sm" className="rounded-xl" onClick={() => void updateOrderStatus(order.id, "confirmed")}>
                        <Check className="mr-1 h-3 w-3" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => void updateOrderStatus(order.id, "cancelled")}>
                        <X className="mr-1 h-3 w-3" /> Decline
                      </Button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void updateOrderStatus(order.id, "shipped")}>
                      <Truck className="mr-1 h-3 w-3" /> Ship
                    </Button>
                  )}
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
                className="bento-card flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                    <Badge variant="outline" className={`rounded-full text-[10px] ${statusColors[order.status]}`}>
                      {order.status}
                    </Badge>
                  </div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    {order.product?.image_emoji || "🌾"} {order.product?.name || "Product"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Qty {order.quantity} {order.unit}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-display font-bold text-primary">KES {order.total_price}</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <Button asChild size="sm" variant="outline" className="h-7 rounded-xl px-2 text-[10px]">
                    <Link to="/dashboard/messages">
                      <MessageCircle className="mr-1 h-3 w-3" /> Message Seller
                    </Link>
                  </Button>
                </div>
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
