import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/messages/conversations — All conversations for current user
router.get("/conversations", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
    .order("last_at", { ascending: false });
  if (error) throw error;
  res.json(data);
});

// GET /api/messages/conversations/:convId — Messages in a conversation
router.get("/conversations/:convId", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;
  // Verify user is a participant
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", req.params.convId)
    .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
    .single();
  if (!conv) return res.status(403).json({ error: "Not a participant" });

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", req.params.convId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  res.json(data);
});

// POST /api/messages/conversations — Start / get existing conversation
router.post("/conversations", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;
  const { other_user_id } = req.body;
  if (!other_user_id) return res.status(400).json({ error: "other_user_id required" });

  // Check for existing
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_a.eq.${uid},participant_b.eq.${other_user_id}),and(participant_a.eq.${other_user_id},participant_b.eq.${uid})`
    )
    .maybeSingle();
  if (existing) return res.json(existing);

  const { data, error } = await supabase
    .from("conversations")
    .insert({ participant_a: uid, participant_b: other_user_id })
    .select()
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

// POST /api/messages/conversations/:convId/send — Send a message
router.post("/conversations/:convId/send", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: "Message body required" });

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: req.params.convId, sender_id: uid, body: body.trim() })
    .select()
    .single();
  if (error) throw error;

  // Update conversation preview
  await supabase
    .from("conversations")
    .update({ last_message: body.trim(), last_at: new Date().toISOString() })
    .eq("id", req.params.convId);

  res.status(201).json(data);
});

export default router;
