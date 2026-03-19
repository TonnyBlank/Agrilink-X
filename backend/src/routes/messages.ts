import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

function normalizeConversationParticipants(userA: string, userB: string) {
  return userA < userB
    ? { participant_a: userA, participant_b: userB }
    : { participant_a: userB, participant_b: userA };
}

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

router.get("/conversations/:convId", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;

  const { data: conv, error: conversationError } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .eq("id", req.params.convId)
    .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
    .single();

  if (conversationError) throw conversationError;
  if (!conv) return res.status(403).json({ error: "Not a participant" });

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", req.params.convId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const unreadUpdate = conv.participant_a === uid ? { unread_a: 0 } : { unread_b: 0 };
  await supabase
    .from("conversations")
    .update(unreadUpdate)
    .eq("id", req.params.convId);

  res.json(data);
});

router.delete("/conversations/:convId", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b, unread_a, unread_b")
    .eq("id", req.params.convId)
    .single();

  if (conversationError) throw conversationError;
  if (!conversation || (conversation.participant_a !== uid && conversation.participant_b !== uid)) {
    return res.status(403).json({ error: "Not a participant" });
  }

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", req.params.convId);

  if (error) throw error;
  res.status(204).send();
});

router.post("/conversations", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;
  const { other_user_id } = req.body;

  if (!other_user_id) return res.status(400).json({ error: "other_user_id required" });
  if (other_user_id === uid) return res.status(400).json({ error: "Cannot start a conversation with yourself" });

  const normalizedParticipants = normalizeConversationParticipants(uid, other_user_id);

  const { data: existingRows, error: existingError } = await supabase
    .from("conversations")
    .select("id, created_at")
    .or(
      `and(participant_a.eq.${uid},participant_b.eq.${other_user_id}),and(participant_a.eq.${other_user_id},participant_b.eq.${uid})`,
    )
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingError) throw existingError;
  if (existingRows?.length) return res.json({ id: existingRows[0].id });

  const { data, error } = await supabase
    .from("conversations")
    .insert(normalizedParticipants)
    .select()
    .single();

  if (error) {
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from("conversations")
      .select("id, created_at")
      .or(
        `and(participant_a.eq.${uid},participant_b.eq.${other_user_id}),and(participant_a.eq.${other_user_id},participant_b.eq.${uid})`,
      )
      .order("created_at", { ascending: true })
      .limit(1);

    if (fallbackError) throw fallbackError;
    if (fallbackRows?.length) return res.json({ id: fallbackRows[0].id });
    throw error;
  }

  res.status(201).json(data);
});

router.post("/conversations/:convId/send", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const uid = req.userId!;
  const { body } = req.body;

  if (!body?.trim()) return res.status(400).json({ error: "Message body required" });

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b, unread_a, unread_b")
    .eq("id", req.params.convId)
    .single();

  if (conversationError) throw conversationError;
  if (!conversation || (conversation.participant_a !== uid && conversation.participant_b !== uid)) {
    return res.status(403).json({ error: "Not a participant" });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: req.params.convId, sender_id: uid, body: body.trim() })
    .select()
    .single();

  if (error) throw error;

  const conversationUpdate =
    conversation.participant_a === uid
      ? {
          last_message: body.trim(),
          last_at: new Date().toISOString(),
          unread_a: 0,
          unread_b: (conversation.unread_b ?? 0) + 1,
        }
      : {
          last_message: body.trim(),
          last_at: new Date().toISOString(),
          unread_b: 0,
          unread_a: (conversation.unread_a ?? 0) + 1,
        };

  await supabase
    .from("conversations")
    .update(conversationUpdate)
    .eq("id", req.params.convId);

  res.status(201).json(data);
});

export default router;
