import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

type OrderRow = {
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
};

type ProductRef = {
  id: string;
  name: string;
  image_emoji: string | null;
};

async function attachOrderMeta(supabase: AuthRequest["supabase"], orders: OrderRow[]) {
  if (!supabase || !orders.length) return orders;

  const productIds = Array.from(new Set(orders.map((order) => order.product_id)));
  const profileIds = Array.from(new Set(orders.flatMap((order) => [order.buyer_id, order.farmer_id])));

  const [{ data: productRows, error: productsError }, { data: profileRows, error: profilesError }] = await Promise.all([
    supabase.from("products").select("id, name, image_emoji").in("id", productIds),
    supabase.from("profiles").select("user_id, full_name").in("user_id", profileIds),
  ]);

  if (productsError) throw productsError;
  if (profilesError) throw profilesError;

  const productsById = new Map<string, ProductRef>((productRows ?? []).map((product) => [product.id, product as ProductRef]));
  const profilesByUserId = new Map<string, { full_name: string | null }>(
    (profileRows ?? []).map((profile) => [profile.user_id, { full_name: profile.full_name }]),
  );

  return orders.map((order) => ({
    ...order,
    product: productsById.get(order.product_id)
      ? {
          name: productsById.get(order.product_id)!.name,
          image_emoji: productsById.get(order.product_id)!.image_emoji,
        }
      : null,
    buyer_profile: profilesByUserId.get(order.buyer_id) ?? null,
    farmer_profile: profilesByUserId.get(order.farmer_id) ?? null,
  }));
}

function getAllowedStatuses(currentStatus: string, isFarmer: boolean) {
  if (isFarmer) {
    if (currentStatus === "pending") return ["confirmed", "cancelled"];
    if (currentStatus === "confirmed") return ["processing", "shipped", "cancelled"];
    if (currentStatus === "processing") return ["shipped", "cancelled"];
    if (currentStatus === "shipped") return [];
    return [];
  }

  if (currentStatus === "pending") return ["cancelled"];
  if (currentStatus === "shipped") return ["delivered"];
  return [];
}

// GET /api/orders/selling - Orders where I am the farmer
router.get("/selling", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("farmer_id", req.userId!)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const orders = await attachOrderMeta(supabase, (data ?? []) as OrderRow[]);
  res.json(orders);
});

// GET /api/orders/buying - Orders where I am the buyer
router.get("/buying", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_id", req.userId!)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const orders = await attachOrderMeta(supabase, (data ?? []) as OrderRow[]);
  res.json(orders);
});

// POST /api/orders - Place a new order (buyer)
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const quantity = Number(req.body?.quantity);
  const deliveryFee = req.body?.delivery_fee == null ? 50 : Number(req.body.delivery_fee);
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : null;

  if (!req.body?.product_id) {
    return res.status(400).json({ error: "Product is required" });
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than 0" });
  }

  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    return res.status(400).json({ error: "Delivery fee must be 0 or more" });
  }

  const { data, error } = await supabase.rpc("place_marketplace_order", {
    p_product_id: req.body.product_id,
    p_quantity: quantity,
    p_unit: typeof req.body?.unit === "string" ? req.body.unit : null,
    p_delivery_fee: deliveryFee,
    p_notes: notes,
  });

  if (error) {
    const message = error.message || "Failed to place order";
    const lowered = message.toLowerCase();
    const statusCode =
      lowered.includes("not found") ? 404 :
      lowered.includes("stock") || lowered.includes("available") || lowered.includes("your own") || lowered.includes("quantity") ? 400 :
      500;
    return res.status(statusCode).json({ error: message });
  }

  const orderRows = Array.isArray(data) ? data : data ? [data] : [];
  const [order] = await attachOrderMeta(supabase, orderRows as OrderRow[]);
  res.status(201).json(order);
});

// PATCH /api/orders/:id/status - Update order status
router.patch("/:id/status", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .or(`farmer_id.eq.${req.userId},buyer_id.eq.${req.userId}`)
    .maybeSingle();

  if (existingOrderError) throw existingOrderError;
  if (!existingOrder) {
    return res.status(404).json({ error: "Order not found" });
  }

  const isFarmer = existingOrder.farmer_id === req.userId;
  const nextAllowedStatuses = getAllowedStatuses(existingOrder.status, isFarmer);

  if (!nextAllowedStatuses.includes(status)) {
    return res.status(400).json({
      error: `You cannot change an order from ${existingOrder.status} to ${status}.`,
    });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", req.params.id)
    .select("*")
    .single();

  if (error) throw error;

  const [order] = await attachOrderMeta(supabase, [data as OrderRow]);
  res.json(order);
});

export default router;
