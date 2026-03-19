import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

export type Order = {
  id: string;
  product_id: string;
  buyer_id: string;
  farmer_id: string;
  quantity: number;
  unit: string;
  total_price: number;
  delivery_fee: number;
  status: string;
  payment_method: string | null;
  payment_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: { name: string; image_emoji: string | null } | null;
  buyer_profile?: { full_name: string | null } | null;
  farmer_profile?: { full_name: string | null } | null;
};

export function useOrders() {
  const { user } = useAuth();
  const [sellingOrders, setSellingOrders] = useState<Order[]>([]);
  const [buyingOrders, setBuyingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [sellingData, buyingData] = await Promise.all([
        apiFetch<Order[]>("/orders/selling"),
        apiFetch<Order[]>("/orders/buying"),
      ]);
      setSellingOrders(sellingData);
      setBuyingOrders(buyingData);
    } catch (error) {
      console.error("Failed to load orders", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const placeOrder = async (payload: {
    product_id: string;
    farmer_id: string;
    quantity: number;
    unit: string;
    total_price: number;
    delivery_fee?: number;
    notes?: string;
  }) => {
    if (!user) return false;
    try {
      await apiFetch<Order>("/orders", {
        method: "POST",
        body: payload as unknown as BodyInit,
      });
      toast.success("Order placed successfully!");
      await load();
      return true;
    } catch (error) {
      toast.error("Order failed: " + (error as Error).message);
      return false;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiFetch<Order>(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status } as unknown as BodyInit,
      });
      toast.success(`Order ${status}`);
      await load();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return { sellingOrders, buyingOrders, loading, placeOrder, updateOrderStatus, refetch: load };
}
