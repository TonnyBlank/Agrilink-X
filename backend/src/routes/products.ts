import { Router } from "express";
import { createSupabaseClient } from "../lib/supabase";
import { resolveAppRole } from "../lib/roles";
import { authenticate, AuthRequest } from "../middleware/auth";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

type MarketplaceProduct = {
  id: string;
  farmer_id: string;
  name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  stock: number;
  description: string | null;
  image_emoji: string | null;
  video_url: string | null;
  is_organic: boolean;
  is_available: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; county: string | null } | null;
};

async function buildMarketplaceProducts(
  supabase: ReturnType<typeof createSupabaseClient>,
  currentUserId?: string | null,
) {
  const { data, error } = await supabase
    .from("products")
    .select("*, profiles(full_name, county)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const products = (data ?? []) as MarketplaceProduct[];
  const productIds = products.map((product) => product.id);

  if (!productIds.length) {
    return [];
  }

  const { data: likeRows, error: likesError } = await supabase
    .from("product_likes")
    .select("product_id, user_id")
    .in("product_id", productIds);
  if (likesError) throw likesError;

  const { data: ratingRows, error: ratingsError } = await supabase
    .from("product_ratings")
    .select("product_id, user_id, rating")
    .in("product_id", productIds);
  if (ratingsError) throw ratingsError;

  const likesCountByProduct = new Map<string, number>();
  const likedByUser = new Set<string>();
  for (const row of likeRows ?? []) {
    likesCountByProduct.set(row.product_id, (likesCountByProduct.get(row.product_id) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      likedByUser.add(row.product_id);
    }
  }

  const ratingsSummaryByProduct = new Map<string, { total: number; count: number }>();
  const myRatingByProduct = new Map<string, number>();
  for (const row of ratingRows ?? []) {
    const current = ratingsSummaryByProduct.get(row.product_id) ?? { total: 0, count: 0 };
    ratingsSummaryByProduct.set(row.product_id, { total: current.total + row.rating, count: current.count + 1 });
    if (currentUserId && row.user_id === currentUserId) {
      myRatingByProduct.set(row.product_id, row.rating);
    }
  }

  return products.map((product) => {
    const ratingSummary = ratingsSummaryByProduct.get(product.id);
    const ratingsCount = ratingSummary?.count ?? 0;
    const averageRating = ratingsCount ? Number((ratingSummary!.total / ratingsCount).toFixed(1)) : 0;

    return {
      ...product,
      likes_count: likesCountByProduct.get(product.id) ?? 0,
      liked_by_me: likedByUser.has(product.id),
      ratings_count: ratingsCount,
      average_rating: averageRating,
      my_rating: myRatingByProduct.get(product.id) ?? null,
    };
  });
}

// GET /api/products — All available products
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
  const supabase = createSupabaseClient(token);

  let currentUserId: string | null = null;
  if (token) {
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    currentUserId = user?.id ?? null;
  }

  const products = await buildMarketplaceProducts(supabase, currentUserId);
  res.json(products);
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

router.post("/:id/like", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const userId = req.userId!;
  const productId = req.params.id;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) throw productError;
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { data: existingLike, error: existingLikeError } = await supabase
    .from("product_likes")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingLikeError) throw existingLikeError;

  let liked: boolean;
  if (existingLike) {
    const { error } = await supabase
      .from("product_likes")
      .delete()
      .eq("id", existingLike.id);
    if (error) throw error;
    liked = false;
  } else {
    const { error } = await supabase
      .from("product_likes")
      .insert({ product_id: productId, user_id: userId });
    if (error) throw error;
    liked = true;
  }

  const { count, error: countError } = await supabase
    .from("product_likes")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  if (countError) throw countError;

  res.json({ liked, likes_count: count ?? 0 });
});

router.post("/:id/rate", authenticate, async (req: AuthRequest, res) => {
  const supabase = req.supabase!;
  const userId = req.userId!;
  const productId = req.params.id;
  const normalizedRating = Number(req.body?.rating);

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
    return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) throw productError;
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { error } = await supabase
    .from("product_ratings")
    .upsert(
      { product_id: productId, user_id: userId, rating: normalizedRating },
      { onConflict: "product_id,user_id" },
    );
  if (error) throw error;

  const { data: ratingRows, error: ratingsError } = await supabase
    .from("product_ratings")
    .select("rating")
    .eq("product_id", productId);
  if (ratingsError) throw ratingsError;

  const ratingsCount = ratingRows?.length ?? 0;
  const averageRating = ratingsCount
    ? Number(((ratingRows ?? []).reduce((sum, row) => sum + row.rating, 0) / ratingsCount).toFixed(1))
    : 0;

  res.json({
    my_rating: normalizedRating,
    average_rating: averageRating,
    ratings_count: ratingsCount,
  });
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
