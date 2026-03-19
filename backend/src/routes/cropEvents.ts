import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/crop-events — All events for current farmer
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("crop_events")
    .select("*")
    .eq("farmer_id", req.userId!)
    .order("event_date", { ascending: true });
  if (error) throw error;
  res.json(data);
});

// POST /api/crop-events — Create new event
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { title, crop, type, event_date, notes } = req.body;
  const { data, error } = await supabase
    .from("crop_events")
    .insert({ farmer_id: req.userId!, title, crop, type, event_date, notes, done: false })
    .select()
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

// PATCH /api/crop-events/:id — Update event (edit or mark done)
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("crop_events")
    .update(req.body)
    .eq("id", req.params.id)
    .eq("farmer_id", req.userId!)
    .select()
    .single();
  if (error) return res.status(403).json({ error: "Not authorized or event not found" });
  res.json(data);
});

// DELETE /api/crop-events/:id — Delete event
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { error } = await supabase
    .from("crop_events")
    .delete()
    .eq("id", req.params.id)
    .eq("farmer_id", req.userId!);
  if (error) throw error;
  res.json({ success: true });
});

export default router;
