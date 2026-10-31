import { publicEnv } from "@/lib/env";

/** URL pública de um arquivo do bucket "products" (fotos, banners, categorias). */
export function productImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${publicEnv.supabaseUrl}/storage/v1/object/public/products/${path.replace(/^\/+/, "")}`;
}
