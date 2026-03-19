import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/orders/selling — Orders where I am the farmer
router.get("/selling", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("orders")
    .select("*, product:products(name, image_emoji)")
    .eq("farmer_id", req.userId!)
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.json(data);
});

// GET /api/orders/buying — Orders where I am the buyer
router.get("/buying", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("orders")
    .select("*, product:products(name, image_emoji)")
    .eq("buyer_id", req.userId!)
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.json(data);
});

// POST /api/orders — Place a new order (buyer)
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { product_id, farmer_id, quantity, unit, total_price, delivery_fee, notes } = req.body;
  const { data, error } = await supabase.from("orders").insert({
    buyer_id: req.userId!,
    product_id, farmer_id, quantity, unit, total_price,
    delivery_fee: delivery_fee ?? 50,
    notes,
    status: "pending",
    payment_method: "mpesa",
  }).select().single();
  if (error) throw error;
  res.status(201).json(data);
});

// PATCH /api/orders/:id/status — Update order status (farmer or buyer)
router.patch("/:id/status", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status value" });

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", req.params.id)
    .or(`farmer_id.eq.${req.userId},buyer_id.eq.${req.userId}`)
    .select()
    .single();
  if (error) return res.status(403).json({ error: "Not authorized" });
  res.json(data);
});

export default router;
