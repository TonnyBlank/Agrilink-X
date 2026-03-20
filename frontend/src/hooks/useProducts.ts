import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const PRODUCTS_CHANGED_EVENT = "agrilink:products-changed";

function notifyProductsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PRODUCTS_CHANGED_EVENT));
}

async function loadProfilesByUserId(userIds: string[]) {
  if (!userIds.length) return new Map<string, { full_name: string | null; county: string | null }>();

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, county")
    .in("user_id", userIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((profile) => [
      profile.user_id,
      {
        full_name: profile.full_name,
        county: profile.county,
      },
    ]),
  );
}

async function loadProductsFromSupabase(userId?: string | null) {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("farmer_id", userId);
  } else {
    query = query.eq("is_available", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  const farmerIds = Array.from(new Set((data ?? []).map((product) => product.farmer_id).filter(Boolean)));
  const profilesByUserId = await loadProfilesByUserId(farmerIds);

  return (data ?? []).map((product) => ({
    ...product,
    profiles: profilesByUserId.get(product.farmer_id) ?? null,
  })) as Product[];
}

export type Product = {
  id: string;
  farmer_id: string;
  name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  stock: number;
  description: string | null;
  image_emoji: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  is_organic: boolean;
  is_available: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  liked_by_me: boolean;
  ratings_count: number;
  average_rating: number;
  my_rating: number | null;
  profiles?: {
    full_name: string | null;
    county: string | null;
  } | null;
};

export function useMarketplaceProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Product[]>("/products");
      setProducts(data);
    } catch (error) {
      console.error("Failed to load marketplace products from API, falling back to Supabase", error);
      try {
        const fallbackData = await loadProductsFromSupabase();
        setProducts(fallbackData);
      } catch (fallbackError) {
        console.error("Failed to load marketplace products from Supabase", fallbackError);
        toast.error("Failed to load products");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleProductsChanged = () => {
      void load();
    };

    window.addEventListener(PRODUCTS_CHANGED_EVENT, handleProductsChanged);
    return () => window.removeEventListener(PRODUCTS_CHANGED_EVENT, handleProductsChanged);
  }, [load]);

  const toggleLike = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to like products");
      return false;
    }

    try {
      const data = await apiFetch<{ liked: boolean; likes_count: number }>(`/products/${productId}/like`, {
        method: "POST",
      });
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, liked_by_me: data.liked, likes_count: data.likes_count }
            : product,
        ),
      );
      return true;
    } catch (error) {
      toast.error("Failed to update like: " + (error as Error).message);
      return false;
    }
  };

  const rateProduct = async (productId: string, rating: number) => {
    if (!user) {
      toast.error("Please sign in to rate products");
      return false;
    }

    try {
      const data = await apiFetch<{ my_rating: number; average_rating: number; ratings_count: number }>(
        `/products/${productId}/rate`,
        {
          method: "POST",
          body: { rating } as unknown as BodyInit,
        },
      );
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? {
                ...product,
                my_rating: data.my_rating,
                average_rating: data.average_rating,
                ratings_count: data.ratings_count,
              }
            : product,
        ),
      );
      return true;
    } catch (error) {
      toast.error("Failed to rate product: " + (error as Error).message);
      return false;
    }
  };

  return { products, loading, refetch: load, toggleLike, rateProduct };
}

export function useMyProducts() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch<Product[]>("/products/mine");
      setProducts(data);
    } catch (error) {
      console.error("Failed to load your products from API, falling back to Supabase", error);
      try {
        const fallbackData = await loadProductsFromSupabase(user.id);
        setProducts(fallbackData);
      } catch (fallbackError) {
        console.error("Failed to load your products from Supabase", fallbackError);
        toast.error("Failed to load your products");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleProductsChanged = () => {
      void load();
    };

    window.addEventListener(PRODUCTS_CHANGED_EVENT, handleProductsChanged);
    return () => window.removeEventListener(PRODUCTS_CHANGED_EVENT, handleProductsChanged);
  }, [load]);

  const addProduct = async (payload: {
    name: string;
    category: string;
    price_per_unit: number;
    unit: string;
    stock: number;
    description?: string;
    image_emoji?: string;
    cover_image_url?: string;
    video_url?: string;
    is_organic: boolean;
  }) => {
    if (!user) return false;
    try {
      await apiFetch<Product>("/products", {
        method: "POST",
        body: {
          ...payload,
          location: profile?.county || null,
        } as unknown as BodyInit,
      });
      toast.success("Listing published to marketplace!");
      notifyProductsChanged();
      await load();
      return true;
    } catch (error) {
      toast.error(`Failed to add product: ${(error as Error).message}`);
      return false;
    }
  };

  const uploadProductVideo = async (file: File) => {
    if (!user) return null;

    const formData = new FormData();
    formData.append("video", file);

    try {
      const data = await apiFetch<{ url: string }>("/products/upload-video", {
        method: "POST",
        body: formData,
      });
      toast.success("Video uploaded successfully!");
      return data.url;
    } catch (error) {
      toast.error(`Failed to upload video: ${(error as Error).message}`);
      return null;
    }
  };

  const uploadProductImage = async (file: File) => {
    if (!user) return null;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const data = await apiFetch<{ url: string }>("/products/upload-image", {
        method: "POST",
        body: formData,
      });
      toast.success("Cover image uploaded successfully!");
      return data.url;
    } catch (error) {
      toast.error(`Failed to upload cover image: ${(error as Error).message}`);
      return null;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await apiFetch<Product>(`/products/${id}`, {
        method: "PATCH",
        body: updates as unknown as BodyInit,
      });
      toast.success("Product updated!");
      notifyProductsChanged();
      await load();
      return true;
    } catch (error) {
      toast.error("Failed to update product");
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/products/${id}`, {
        method: "DELETE",
      });
      toast.success("Product deleted");
      notifyProductsChanged();
      await load();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return { products, loading, addProduct, updateProduct, deleteProduct, uploadProductVideo, uploadProductImage, refetch: load };
}
