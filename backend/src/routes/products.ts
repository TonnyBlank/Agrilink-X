import { Router } from "express";
import { createSupabaseClient } from "../lib/supabase";
import { resolveAppRole } from "../lib/roles";
import { authenticate, AuthRequest } from "../middleware/auth";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// GET /api/products — All available products (public)
router.get("/", async (_req, res) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, profiles(full_name, county)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.json(data);
});

// GET /api/products/mine — Farmer's own products (protected)
router.get("/mine", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("farmer_id", req.userId!)
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.json(data);
});

// GET /api/products/:id — Single product
router.get("/:id", async (req, res) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: "Product not found" });
  res.json(data);
});

// POST /api/products — Create product (protected)
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { name, category, price_per_unit, unit, stock, description, image_emoji, video_url, is_organic, location } = req.body;

  if (!name || !category || !unit) {
    return res.status(400).json({ error: "Name, category, and unit are required" });
  }

  const normalizedPrice = Number(price_per_unit);
  const normalizedStock = Number(stock);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    return res.status(400).json({ error: "Price must be a valid non-negative number" });
  }

  if (!Number.isFinite(normalizedStock) || normalizedStock < 0) {
    return res.status(400).json({ error: "Stock must be a valid non-negative number" });
  }

  const role = await resolveAppRole(supabase, req.userId!, req.requestedRole);
  if (role === "farmer_free") {
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("farmer_id", req.userId!);

    if (countError) throw countError;

    if ((count || 0) >= 10) {
      return res.status(403).json({
        error: "Free plan reached the 10 product limit. Upgrade to Pro for unlimited listings.",
      });
    }
  }

  const payload = {
    farmer_id: req.userId!,
    name: String(name).trim(),
    category: String(category).trim(),
    price_per_unit: normalizedPrice,
    unit: String(unit).trim(),
    stock: normalizedStock,
    description: description ? String(description).trim() : null,
    image_emoji: image_emoji ? String(image_emoji).trim() : null,
    video_url: video_url ? String(video_url).trim() : null,
    is_organic: Boolean(is_organic),
    location: location ? String(location).trim() : null,
  };

  const { data, error } = await supabase.from("products").insert(payload).select().single();
  if (error) {
    console.error("[products.create] Supabase insert failed:", error);
    return res.status(400).json({ error: error.message || "Failed to create product" });
  }
  res.status(201).json(data);
});

// PATCH /api/products/:id — Update product (protected + owner-only)
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { data, error } = await supabase
    .from("products")
    .update(req.body)
    .eq("id", req.params.id)
    .eq("farmer_id", req.userId!)
    .select()
    .single();
  if (error) return res.status(403).json({ error: "Not authorized or product not found" });
  res.json(data);
});

// DELETE /api/products/:id — Delete product (protected + owner-only)
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", req.params.id)
    .eq("farmer_id", req.userId!);
  if (error) throw error;
  res.json({ success: true });
});

// POST /api/products/upload-video — Upload product video to Supabase Storage
router.post("/upload-video", authenticate, upload.single("video"), async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(req.file.mimetype)) {
    return res.status(400).json({ error: "Only MP4, WebM, and MOV videos are allowed" });
  }
  const filePath = `${req.userId}/${Date.now()}_${req.file.originalname}`;
  const { error } = await supabase.storage
    .from("product-media")
    .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });
  if (error) {
    console.error("[products.upload-video] Storage upload failed:", error);
    return res.status(400).json({ error: error.message || "Failed to upload video" });
  }
  const { data } = supabase.storage.from("product-media").getPublicUrl(filePath);
  res.json({ url: data.publicUrl });
});

export default router;
