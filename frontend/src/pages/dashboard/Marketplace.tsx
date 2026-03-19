import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BadgeCheck, Heart, MapPin, MessageCircle, PackageCheck, PlayCircle, Search, ShoppingCart, Sprout, Star, Video } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMarketplaceProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const categories = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Poultry", "Herbs"];

export default function Marketplace() {
  const { products, loading, toggleLike, rateProduct } = useMarketplaceProducts();
  const { placeOrder } = useOrders();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const filtered = useMemo(() => {
    return products
      .filter((product) => {
        const matchSearch =
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          (product.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (product.location || "").toLowerCase().includes(search.toLowerCase());
        const matchCategory = activeCategory === "All" || product.category === activeCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        const videoRank = Number(Boolean(b.video_url)) - Number(Boolean(a.video_url));
        if (videoRank !== 0) return videoRank;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [activeCategory, products, search]);

  const highlights = useMemo(() => {
    const withVideo = products.filter((product) => Boolean(product.video_url)).length;
    const organic = products.filter((product) => product.is_organic).length;
    const counties = new Set(products.map((product) => product.location || product.profiles?.county).filter(Boolean));

    return {
      withVideo,
      organic,
      counties: counties.size,
    };
  }, [products]);

  const syncedSelectedProduct = useMemo(() => {
    if (!selectedProduct) return null;
    return products.find((product) => product.id === selectedProduct.id) ?? selectedProduct;
  }, [products, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    const nextSelected = products.find((product) => product.id === selectedProduct.id);
    if (nextSelected) {
      setSelectedProduct(nextSelected);
    }
  }, [products, selectedProduct]);

  const parsedQuantity = Math.max(1, Number(quantity) || 1);
  const total = syncedSelectedProduct ? syncedSelectedProduct.price_per_unit * parsedQuantity + 50 : 0;
  const ratingChoices = [1, 2, 3, 4, 5];

  const handleBuy = async () => {
    if (!syncedSelectedProduct) return;
    if (!user) {
      toast.error("Please sign in before placing an order.");
      return;
    }

    setIsCheckingOut(true);
    const success = await placeOrder({
      product_id: syncedSelectedProduct.id,
      farmer_id: syncedSelectedProduct.farmer_id,
      quantity: parsedQuantity,
      unit: syncedSelectedProduct.unit,
      total_price: syncedSelectedProduct.price_per_unit * parsedQuantity,
      delivery_fee: 50,
    });
    setIsCheckingOut(false);

    if (success) {
      setSelectedProduct(null);
      setQuantity("1");
    }
  };

  return (
    <DashboardShell title="Marketplace">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.88))] p-6 shadow-[0_20px_60px_-28px_rgba(5,150,105,0.35)]">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sprout className="h-3.5 w-3.5" />
                Verified Harvests
              </span>
              <div>
                <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Shop produce with real seller media</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Fresh listings, direct farmer details, and farmer videos that help buyers judge quality before checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Video Listings</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{highlights.withVideo}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organic Picks</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{highlights.organic}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Counties</p>
                <p className="mt-2 font-display text-3xl font-bold text-foreground">{highlights.counties}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products, farmers, or county..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-white/70 bg-white/80 pl-10 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground shadow-glow-emerald"
                    : "bg-white/80 text-muted-foreground ring-1 ring-border hover:bg-muted"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bento-card text-sm text-muted-foreground">Loading marketplace products...</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group overflow-hidden rounded-[2rem] border border-border/70 bg-white/85 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur"
              >
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="block w-full text-left"
                >
                  <div className="relative">
                    {product.video_url ? (
                      <>
                        <video
                          src={product.video_url}
                          muted
                          playsInline
                          preload="metadata"
                          className="aspect-video max-h-40 w-full bg-slate-950 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent" />
                        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                          <Video className="h-3.5 w-3.5" />
                          Farmer Video
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-white/92 p-3 shadow-xl transition-transform duration-300 group-hover:scale-110">
                            <PlayCircle className="h-8 w-8 text-emerald-700" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.28),_transparent_42%),linear-gradient(135deg,rgba(236,253,245,1),rgba(255,255,255,0.92))] text-8xl">
                        {product.image_emoji || "🌾"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display text-xl font-bold text-foreground">{product.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      {product.is_organic && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Organic
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{product.location || product.profiles?.county || "Unknown county"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" />
                      <span>{product.profiles?.full_name || "Verified farmer"}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Heart className={`h-4 w-4 ${product.liked_by_me ? "fill-rose-500 text-rose-500" : ""}`} />
                        <span>{product.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{product.average_rating ? product.average_rating.toFixed(1) : "New"}</span>
                        <span className="text-xs">({product.ratings_count})</span>
                      </div>
                    </div>

                    {product.description && (
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] bg-muted/50 p-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Price</p>
                        <p className="mt-1 font-display text-lg font-bold text-primary">KES {product.price_per_unit}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Unit</p>
                        <p className="mt-1 text-base font-semibold text-foreground">{product.unit}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Stock</p>
                        <p className="mt-1 text-base font-semibold text-foreground">{product.stock}</p>
                      </div>
                    </div>
                  </div>
                </button>

                <div className="flex gap-2 px-5 pb-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl px-4"
                    onClick={() => void toggleLike(product.id)}
                  >
                    <Heart className={`h-4 w-4 ${product.liked_by_me ? "fill-rose-500 text-rose-500" : ""}`} />
                  </Button>
                  <Button
                    onClick={() => setSelectedProduct(product)}
                    className="w-full rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> View & Buy
                  </Button>
                </div>
              </motion.article>
            ))}

            {!filtered.length && (
              <div className="col-span-full rounded-[2rem] border border-dashed border-border bg-white/75 py-16 text-center shadow-sm">
                <PackageCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <h3 className="font-display text-xl font-bold text-foreground">No products match that search</h3>
                <p className="mt-2 text-sm text-muted-foreground">Try a different category, county, or seller name.</p>
                <p className="mt-1 text-xs text-muted-foreground">Farmer uploads published from the Upload & Sell page appear here automatically.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[2rem] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-2xl">{syncedSelectedProduct?.name}</DialogTitle>
            <DialogDescription className="text-center">
              Buy directly from {syncedSelectedProduct?.profiles?.full_name || "the farmer"} and review the listing media before checkout.
            </DialogDescription>
          </DialogHeader>

          {syncedSelectedProduct && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                {syncedSelectedProduct.video_url ? (
                  <div className="mx-auto max-w-lg overflow-hidden rounded-[1.75rem] border border-border bg-slate-950 shadow-lg">
                    <video src={syncedSelectedProduct.video_url} controls className="aspect-video max-h-[240px] w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-[1.75rem] border border-border bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.28),_transparent_42%),linear-gradient(135deg,rgba(236,253,245,1),rgba(255,255,255,0.92))] text-8xl">
                    {syncedSelectedProduct.image_emoji || "🌾"}
                  </div>
                )}

                <div className="rounded-[1.5rem] border border-border bg-muted/40 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">{syncedSelectedProduct.category}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {syncedSelectedProduct.stock} {syncedSelectedProduct.unit} available
                    </span>
                    {syncedSelectedProduct.is_organic && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Organic produce</span>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {syncedSelectedProduct.description || "This seller has not added a description yet, but you can message them directly before ordering."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Seller</p>
                      <p className="font-display text-xl font-bold text-foreground">{syncedSelectedProduct.profiles?.full_name || "Farmer"}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-muted/35 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className={`h-4 w-4 ${syncedSelectedProduct.liked_by_me ? "fill-rose-500 text-rose-500" : ""}`} />
                        <span>{syncedSelectedProduct.likes_count} likes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{syncedSelectedProduct.average_rating ? syncedSelectedProduct.average_rating.toFixed(1) : "New"}</span>
                        <span>({syncedSelectedProduct.ratings_count} ratings)</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => void toggleLike(syncedSelectedProduct.id)}
                      >
                        <Heart className={`mr-2 h-4 w-4 ${syncedSelectedProduct.liked_by_me ? "fill-rose-500 text-rose-500" : ""}`} />
                        {syncedSelectedProduct.liked_by_me ? "Liked" : "Like"}
                      </Button>
                      <div className="flex items-center gap-1">
                        {ratingChoices.map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => void rateProduct(syncedSelectedProduct.id, rating)}
                            className="rounded-full p-1 transition-transform hover:scale-110"
                            aria-label={`Rate ${rating} stars`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                (syncedSelectedProduct.my_rating ?? 0) >= rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium text-foreground">{syncedSelectedProduct.location || syncedSelectedProduct.profiles?.county || "Unknown county"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Unit price</span>
                      <span className="font-medium text-foreground">KES {syncedSelectedProduct.price_per_unit}</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium text-foreground">KES 50</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">KES {total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button asChild variant="outline" className="h-12 w-full rounded-xl">
                    <Link to="/dashboard/messages">
                      <MessageCircle className="mr-2 h-4 w-4" /> Message Farmer
                    </Link>
                  </Button>
                  <Button onClick={() => void handleBuy()} disabled={isCheckingOut} className="h-12 w-full rounded-xl">
                    {isCheckingOut ? "Processing..." : "Place Order"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
