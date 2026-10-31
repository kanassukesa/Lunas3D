import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { productImageUrl } from "@/lib/storage";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  price: number;
  promoPrice: number | null;
  promoEndsAt: string | null;
  madeToOrder: boolean;
  inStock: boolean;
  categoryName: string | null;
  imageUrl: string | null;
  imageAlt: string;
  colors: { name: string; hex: string }[];
};

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
};

const PRODUCT_CARD_SELECT = `
  id, name, slug, short_description, price, promo_price, promo_ends_at,
  stock_mode, stock_quantity, is_featured, sort_order,
  category:categories ( name ),
  images:product_images ( storage_path, alt, is_cover, sort_order ),
  product_colors ( is_available, color:colors ( name, hex, sort_order, is_active ) )
` as const;

type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  promo_price: number | null;
  promo_ends_at: string | null;
  stock_mode: "in_stock" | "made_to_order";
  stock_quantity: number;
  category: { name: string } | null;
  images: { storage_path: string; alt: string | null; is_cover: boolean; sort_order: number }[];
  product_colors: {
    is_available: boolean;
    color: { name: string; hex: string; sort_order: number; is_active: boolean } | null;
  }[];
};

function toCard(row: ProductCardRow): ProductCardData {
  const images = [...row.images].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
  const cover = images[0];
  const colors = row.product_colors
    .filter((pc) => pc.is_available && pc.color?.is_active)
    .map((pc) => pc.color!)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ name, hex }) => ({ name, hex }));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description,
    price: Number(row.price),
    promoPrice: row.promo_price == null ? null : Number(row.promo_price),
    promoEndsAt: row.promo_ends_at,
    madeToOrder: row.stock_mode === "made_to_order",
    inStock: row.stock_mode === "made_to_order" || row.stock_quantity > 0,
    categoryName: row.category?.name ?? null,
    imageUrl: productImageUrl(cover?.storage_path),
    imageAlt: cover?.alt ?? row.name,
    colors,
  };
}

/** Produtos em destaque para a home. */
export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_CARD_SELECT)
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("sort_order")
      .limit(limit)
      .overrideTypes<ProductCardRow[], { merge: false }>();
    if (error) throw error;
    return (data ?? []).map(toCard);
  } catch (err) {
    console.error("[catalog] getFeaturedProducts", err);
    return [];
  }
}

/** Categorias ativas, na ordem definida no painel. */
export async function getActiveCategories(): Promise<CategoryData[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_path")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: productImageUrl(c.image_path),
    }));
  } catch (err) {
    console.error("[catalog] getActiveCategories", err);
    return [];
  }
}
