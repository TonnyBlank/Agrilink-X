import { Router } from "express";
import { createSupabaseClient } from "../lib/supabase";
import { AppRole, isAppRole, resolveAppRole } from "../lib/roles";
import { authenticate, AuthRequest } from "../middleware/auth";
import multer from "multer";
import { getSupabaseAdmin } from "../lib/supabaseAdmin";

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
    .select("full_name, county, farm_size, main_crops, bio, photo_url")
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

  const {
    full_name,
    county,
    farm_size,
    main_crops,
    bio,
    phone,
    payout_method,
    payout_mpesa_number,
    bank_name,
    bank_account_name,
    bank_account_number,
  } = req.body;

  const normalizedPayoutMethod =
    payout_method === "mpesa" || payout_method === "bank" ? payout_method : null;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name,
      county,
      farm_size,
      main_crops,
      bio,
      phone,
      payout_method: normalizedPayoutMethod,
      payout_mpesa_number: normalizedPayoutMethod === "mpesa" ? payout_mpesa_number || null : null,
      bank_name: normalizedPayoutMethod === "bank" ? bank_name || null : null,
      bank_account_name: normalizedPayoutMethod === "bank" ? bank_account_name || null : null,
      bank_account_number: normalizedPayoutMethod === "bank" ? bank_account_number || null : null,
      payout_details_updated_at: normalizedPayoutMethod ? new Date().toISOString() : null,
    })
    .eq("user_id", req.userId!)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
});

router.patch("/me/role", authenticate, async (req: AuthRequest, res) => {
  const nextRole = req.body?.role;

  if (!isAppRole(nextRole)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  if (nextRole === "admin") {
    return res.status(403).json({ error: "Admin access can only be granted from the admin panel." });
  }

  try {
    const admin = getSupabaseAdmin();

    const { error: deleteError } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", req.userId!);

    if (deleteError) throw deleteError;

    const { error: insertError } = await admin
      .from("user_roles")
      .insert({ user_id: req.userId!, role: nextRole as AppRole });

    if (insertError) throw insertError;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const hint =
      message.includes("SUPABASE_SERVICE_ROLE_KEY") || message.includes("Invalid API key")
        ? "Role update failed because the backend service role key is missing or invalid."
        : message.includes("relation") && message.includes("user_roles")
          ? "Role update failed because the Supabase user_roles table is missing. Apply the role migration first."
          : "Failed to update plan role.";

    return res.status(500).json({ error: hint });
  }

  res.json({ role: nextRole });
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
