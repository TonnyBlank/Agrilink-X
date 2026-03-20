import { ChangeEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgePlus, Edit3, ImagePlus, LoaderCircle, Package, Plus, Trash2, Upload, Video, Wheat } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useMyProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const initialForm = {
  name: "",
  category: "Vegetables",
  price_per_unit: "",
  unit: "kg",
  stock: "",
  image_emoji: "",
  cover_image_url: "",
  video_url: "",
  description: "",
  is_organic: true,
};

const featuredCategories = ["Vegetables", "Fruits", "Grains", "Dairy", "Herbs", "Poultry"];

export default function MyProducts() {
  const { role, profile } = useAuth();
  const { products, loading, addProduct, updateProduct, deleteProduct, uploadProductVideo, uploadProductImage } = useMyProducts();
  const limit = role === "farmer_free" ? 10 : Infinity;
  const limitReached = role === "farmer_free" && products.length >= 10;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState(initialForm);

  const catalogSummary = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const videoListings = products.filter((product) => product.video_url).length;
    return {
      totalStock,
      videoListings,
    };
  }, [products]);

  const missingProfileFields = useMemo(() => {
    return [
      !profile?.full_name?.trim() ? "full name" : null,
      !profile?.phone?.trim() ? "phone number" : null,
      !profile?.county?.trim() ? "county" : null,
      !profile?.farm_size?.trim() ? "farm size" : null,
      !profile?.main_crops?.length ? "main crops" : null,
      !profile?.bio?.trim() ? "bio" : null,
      !profile?.payout_method ? "payout method" : null,
      profile?.payout_method === "mpesa" && !profile?.payout_mpesa_number?.trim() ? "M-Pesa payout number" : null,
      profile?.payout_method === "bank" && !profile?.bank_name?.trim() ? "bank name" : null,
      profile?.payout_method === "bank" && !profile?.bank_account_name?.trim() ? "bank account name" : null,
      profile?.payout_method === "bank" && !profile?.bank_account_number?.trim() ? "bank account number" : null,
    ].filter(Boolean) as string[];
  }, [profile]);

  const profileReadyToSell = missingProfileFields.length === 0;

  const resetForm = () => {
    setNewProduct(initialForm);
    setVideoFile(null);
    setVideoPreview(null);
    setImageFile(null);
    setImagePreview(null);
    setEditingProductId(null);
  };

  const handleEditProduct = (product: (typeof products)[number]) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      category: product.category,
      price_per_unit: String(product.price_per_unit),
      unit: product.unit,
      stock: String(product.stock),
      image_emoji: product.image_emoji || "",
      cover_image_url: product.cover_image_url || "",
      video_url: product.video_url || "",
      description: product.description || "",
      is_organic: product.is_organic,
    });
    setVideoFile(null);
    setVideoPreview(product.video_url || null);
    setImageFile(null);
    setImagePreview(product.cover_image_url || null);
    setIsAddOpen(true);
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setVideoFile(file);
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
      setNewProduct((current) => ({ ...current, video_url: "" }));
    } else {
      setVideoPreview(null);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setNewProduct((current) => ({ ...current, cover_image_url: "" }));
    } else {
      setImagePreview(null);
    }
  };

  const handleAddProduct = async () => {
    if ((limitReached && !editingProductId) || isSaving) return;
    if (!editingProductId && !profileReadyToSell) {
      toast.error(`Complete your profile before publishing. Missing: ${missingProfileFields.join(", ")}.`);
      return;
    }

    if (!newProduct.name.trim() || !newProduct.category.trim() || !newProduct.unit.trim()) {
      toast.error("Please fill in product name, category, and unit before publishing.");
      return;
    }

    setIsSaving(true);
    let finalVideoUrl = newProduct.video_url.trim();
    let finalCoverImageUrl = newProduct.cover_image_url.trim();

    if (imageFile) {
      const uploadedUrl = await uploadProductImage(imageFile);
      if (!uploadedUrl) {
        setIsSaving(false);
        return;
      }
      finalCoverImageUrl = uploadedUrl;
    }

    if (videoFile) {
      const uploadedUrl = await uploadProductVideo(videoFile);
      if (!uploadedUrl) {
        setIsSaving(false);
        return;
      }
      finalVideoUrl = uploadedUrl;
    }

    const payload = {
      name: newProduct.name.trim(),
      category: newProduct.category.trim(),
      price_per_unit: Number(newProduct.price_per_unit) || 0,
      unit: newProduct.unit.trim(),
      stock: Number(newProduct.stock) || 0,
      description: newProduct.description.trim() || undefined,
      image_emoji: newProduct.image_emoji.trim() || undefined,
      cover_image_url: finalCoverImageUrl || undefined,
      video_url: finalVideoUrl || undefined,
      is_organic: newProduct.is_organic,
    };

    let success = false;
    if (editingProductId) {
      success = await updateProduct(editingProductId, payload);
    } else {
      success = await addProduct(payload);
    }

    setIsSaving(false);

    if (!success) return;

    setIsAddOpen(false);
    resetForm();
  };

  return (
    <DashboardShell title="Upload & Sell">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Wheat className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-[0.22em]">Seller Studio</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Upload a farmer video and publish it to the marketplace</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                When you upload a product video here, the listing goes live in the marketplace so every buyer can watch it and place an order.
              </p>
            </div>
          </div>
        </section>

        {!profileReadyToSell && (
          <div className="rounded-[1.5rem] border border-amber-300/70 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm font-semibold text-amber-900">Complete your profile before you upload and sell.</p>
            <p className="mt-1 text-sm text-amber-800">
              Missing: {missingProfileFields.join(", ")}.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-background/70 dark:text-amber-100 dark:hover:bg-amber-500/10">
                <Link to="/dashboard/farm">Complete Farm Profile</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-background/70 dark:text-amber-100 dark:hover:bg-amber-500/10">
                <Link to="/dashboard/profile">Complete Personal & Payout Details</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {products.length} / {limit === Infinity ? "Unlimited" : limit} products listed
            </p>
            {limitReached && (
              <p className="mt-1 text-xs text-amber-700">
                Free plan limit reached. Upgrade to Pro to unlock unlimited listings and richer media.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/dashboard/marketplace">Open Marketplace</Link>
            </Button>
            <Dialog
              open={isAddOpen}
              onOpenChange={(open) => {
                setIsAddOpen(open);
                if (!open) {
                  resetForm();
                  setIsSaving(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-emerald-gradient text-primary-foreground" disabled={limitReached || !profileReadyToSell}>
                  <Plus className="mr-2 h-4 w-4" /> Upload & Publish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[2rem] sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {editingProductId ? "Edit Marketplace Listing" : "Create Marketplace Listing"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProductId
                      ? "Update your listing details, media, and stock before buyers view it."
                      : "Your video listing will appear in the marketplace for all buyers as soon as you publish it."}
                  </DialogDescription>
                </DialogHeader>

              <div className="my-4 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Fresh tomatoes"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-category">Category</Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                    >
                      <SelectTrigger id="product-category" className="rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                      {featuredCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="product-price">Price (KES)</Label>
                    <Input
                      id="product-price"
                      type="number"
                      min="0"
                      value={newProduct.price_per_unit}
                      onChange={(e) => setNewProduct({ ...newProduct, price_per_unit: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-unit">Unit</Label>
                    <Input
                      id="product-unit"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-stock">Stock Available</Label>
                    <Input
                      id="product-stock"
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-emoji">Emoji / Icon</Label>
                    <Input
                      id="product-emoji"
                      value={newProduct.image_emoji}
                      onChange={(e) => setNewProduct({ ...newProduct, image_emoji: e.target.value })}
                      placeholder="🍅"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-video-url">Video URL</Label>
                    <Input
                      id="product-video-url"
                      value={newProduct.video_url}
                      onChange={(e) => {
                        setNewProduct({ ...newProduct, video_url: e.target.value });
                        if (e.target.value) {
                          setVideoFile(null);
                          setVideoPreview(null);
                        }
                      }}
                      placeholder="https://..."
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-cover-url">Cover Image URL</Label>
                  <Input
                    id="product-cover-url"
                    value={newProduct.cover_image_url}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, cover_image_url: e.target.value });
                      if (e.target.value) {
                        setImageFile(null);
                        setImagePreview(null);
                      }
                    }}
                    placeholder="https://..."
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">This image is the cover photo buyers see in the marketplace.</p>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-emerald-300/80 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-foreground">Upload a cover image</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG, or WebP. Use a clear product photo that can act as the listing thumbnail.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Choose Cover
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>

                  {(imagePreview || newProduct.cover_image_url) && (
                    <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-[1.25rem] border border-emerald-200 bg-white dark:border-emerald-500/30 dark:bg-card">
                      <img
                        src={imagePreview || newProduct.cover_image_url}
                        alt="Product cover preview"
                        className="aspect-video max-h-[280px] w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-emerald-300/80 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-foreground">Upload a product video</p>
                      <p className="text-sm text-muted-foreground">MP4, MOV, or WebM up to 100MB. After publish, this video is shown to everyone in the marketplace so they can buy from you.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Video
                      <input type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleVideoChange} />
                    </label>
                  </div>

                  {(videoPreview || newProduct.video_url) && (
                    <div className="mx-auto mt-4 max-w-xl overflow-hidden rounded-[1.25rem] border border-emerald-200 bg-black/90">
                      <video
                        src={videoPreview || newProduct.video_url}
                        controls
                        className="aspect-video max-h-[280px] w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-description">Description</Label>
                  <Textarea
                    id="product-description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Share freshness, size, sourcing, or packaging details buyers should know."
                    className="min-h-[110px] rounded-xl"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={newProduct.is_organic}
                    onChange={(e) => setNewProduct({ ...newProduct, is_organic: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Mark this listing as organic produce</span>
                </label>
              </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={() => void handleAddProduct()} className="rounded-xl" disabled={isSaving}>
                    {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <BadgePlus className="mr-2 h-4 w-4" />}
                    {isSaving ? (editingProductId ? "Saving..." : "Publishing...") : editingProductId ? "Save Changes" : "Publish to Marketplace"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="bento-card text-sm text-muted-foreground">Loading your products...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-lg border border-border/70 bg-white/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-card/90 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]"
              >
                {product.cover_image_url ? (
                    <div className="relative">
                      <img src={product.cover_image_url} alt={product.name} className="aspect-[4/3] max-h-40 w-full object-cover" />
                      <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                        {product.video_url ? "Cover + Video" : "Cover Photo"}
                      </div>
                    </div>
                ) : product.video_url ? (
                    <div className="relative">
                      <video src={product.video_url} controls className="aspect-[4/3] max-h-40 w-full bg-slate-950 object-cover" />
                      <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      Live in Marketplace
                      </div>
                    </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_42%),linear-gradient(135deg,rgba(236,253,245,1),rgba(240,253,250,0.7))] text-6xl dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.94))]">
                    {product.image_emoji || "🌾"}
                  </div>
                )}

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="line-clamp-2 font-display text-lg font-bold leading-snug text-foreground">{product.name}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    {product.is_organic && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Organic
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{product.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Price</p>
                      <p className="mt-1 font-display text-base font-bold text-primary">
                        KES {product.price_per_unit}
                        <span className="ml-1 text-xs font-medium text-muted-foreground">/{product.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Stock</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{product.stock}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Media</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Video className="h-4 w-4 text-indigo-500" />
                        {product.cover_image_url && product.video_url ? "Cover + Video" : product.video_url ? "Video" : product.cover_image_url ? "Cover Photo" : "Photo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg text-xs"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit3 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs text-destructive"
                      onClick={() => void deleteProduct(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}

            {!products.length && (
              <div className="col-span-full rounded-[2rem] border border-dashed border-border bg-white/75 py-16 text-center shadow-sm dark:bg-card/80">
                <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">You have not listed any products yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
