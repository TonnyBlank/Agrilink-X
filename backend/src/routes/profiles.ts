import { Router } from "express";
import { createSupabaseClient } from "../lib/supabase";
import { resolveAppRole } from "../lib/roles";
import { authenticate, AuthRequest } from "../middleware/auth";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function ensureProfileExists(
  supabase: NonNullable<AuthRequest["supabase"]>,
  userId: string,
  fallbackFullName?: string | null,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .insert({ user_id: userId, full_name: fallbackFullName || null })
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data: authUserData } = await supabase.auth.getUser(req.accessToken);
  const fallbackFullName =
    typeof authUserData.user?.user_metadata?.full_name === "string"
      ? authUserData.user.user_metadata.full_name
      : null;
  const data = await ensureProfileExists(supabase, req.userId!, fallbackFullName);
  const role = await resolveAppRole(supabase, req.userId!, req.requestedRole);
  res.json({ profile: data, role });
});

router.get("/farmers", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, county, farm_size, main_crops, bio, photo_url")
    .neq("user_id", req.userId!)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const filtered = (data ?? []).filter((profile) => {
    const hasFarmerSignals =
      Boolean(profile.farm_size) ||
      Boolean(profile.county) ||
      Boolean(profile.bio) ||
      Boolean(profile.main_crops?.length);

    if (!hasFarmerSignals) return false;
    if (!query) return true;

    const haystack = [
      profile.full_name,
      profile.county,
      profile.farm_size,
      profile.bio,
      ...(profile.main_crops ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  res.json(filtered);
});

router.get("/:userId", async (req, res) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, county, farm_size, main_crops, bio, photo_url, phone")
    .eq("user_id", req.params.userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: "Profile not found" });

  const { data: videoProduct, error: videoError } = await supabase
    .from("products")
    .select("video_url")
    .eq("farmer_id", req.params.userId)
    .not("video_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (videoError) throw videoError;
  res.json({ ...data, video_url: videoProduct?.video_url || null });
});

router.patch("/me", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data: authUserData } = await supabase.auth.getUser(req.accessToken);
  const fallbackFullName =
    typeof authUserData.user?.user_metadata?.full_name === "string"
      ? authUserData.user.user_metadata.full_name
      : null;
  await ensureProfileExists(supabase, req.userId!, fallbackFullName);

  const { full_name, county, farm_size, main_crops, bio, phone } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, county, farm_size, main_crops, bio, phone })
    .eq("user_id", req.userId!)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
});

router.post("/me/photo", authenticate, upload.single("photo"), async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  if (!req.file) return res.status(400).json({ error: "No photo uploaded" });

  const { data: authUserData } = await supabase.auth.getUser(req.accessToken);
  const fallbackFullName =
    typeof authUserData.user?.user_metadata?.full_name === "string"
      ? authUserData.user.user_metadata.full_name
      : null;
  await ensureProfileExists(supabase, req.userId!, fallbackFullName);

  const filePath = `${req.userId!}/${Date.now()}_${req.file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
  const { data, error } = await supabase
    .from("profiles")
    .update({ photo_url: urlData.publicUrl })
    .eq("user_id", req.userId!)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
});

export default router;
