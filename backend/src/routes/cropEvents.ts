import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

function normalizeCropEventPayload(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const crop = String(body.crop ?? "").trim();
  const type = String(body.type ?? "").trim();
  const eventDate = String(body.event_date ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (!title) return { error: "Event title is required." };
  if (!crop) return { error: "Crop is required." };
  if (!type) return { error: "Activity type is required." };
  if (type.length > 20) return { error: "Activity type must be 20 characters or less." };
  if (!eventDate) return { error: "Scheduled date is required." };

  return {
    title,
    crop,
    type,
    event_date: eventDate,
    notes: notes || null,
  };
}

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

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const payload = normalizeCropEventPayload(req.body as Record<string, unknown>);

  if ("error" in payload) {
    return res.status(400).json({ error: payload.error });
  }

  const { data, error } = await supabase
    .from("crop_events")
    .insert({
      farmer_id: req.userId!,
      ...payload,
      done: false,
    })
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
});

router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const updates: Record<string, unknown> = { ...req.body };

  if ("done" in updates && typeof updates.done !== "boolean") {
    return res.status(400).json({ error: "Invalid done status." });
  }

  const hasEditableFields =
    "title" in updates || "crop" in updates || "type" in updates || "event_date" in updates || "notes" in updates;

  if (hasEditableFields) {
    const payload = normalizeCropEventPayload({
      title: updates.title,
      crop: updates.crop,
      type: updates.type,
      event_date: updates.event_date,
      notes: updates.notes,
    });

    if ("error" in payload) {
      return res.status(400).json({ error: payload.error });
    }

    Object.assign(updates, payload);
  }

  const { data, error } = await supabase
    .from("crop_events")
    .update(updates)
    .eq("id", req.params.id)
    .eq("farmer_id", req.userId!)
    .select()
    .single();

  if (error) {
    return res.status(403).json({ error: "Not authorized or event not found" });
  }

  res.json(data);
});

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
