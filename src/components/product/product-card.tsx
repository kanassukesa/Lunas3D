import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { effectivePrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";
import { Price } from "./price";
import { ProductImagePlaceholder } from "./product-image-placeholder";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const current = effectivePrice({
    price: product.price,
    promo_price: product.promoPrice,
    promo_ends_at: product.promoEndsAt,
  });
  const discount = current < product.price ? Math.round((1 - current / product.price) * 100) : 0;
  const maxSwatches = 5;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative aspect-square overflow-hidden bg-surface">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductImagePlaceholder name={product.name} />
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && <Badge>-{discount}%</Badge>}
          {product.madeToOrder && <Badge variant="blue">Sob encomenda</Badge>}
          {!product.inStock && <Badge variant="outline" className="bg-background">Esgotado</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        {product.categoryName && (
          <p className="text-[11px] font-bold tracking-wider text-brand-blue-700 uppercase">{product.categoryName}</p>
        )}
        <h3 className="line-clamp-2 text-[15px] leading-snug font-bold sm:text-base">
          <Link href={`/produtos/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>

        {product.colors.length > 0 && (
          <div className="flex items-center gap-1" aria-label={`Cores: ${product.colors.map((c) => c.name).join(", ")}`}>
            {product.colors.slice(0, maxSwatches).map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="size-4 rounded-full border border-black/10 shadow-inner"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {product.colors.length > maxSwatches && (
              <span className="text-xs text-muted-foreground">+{product.colors.length - maxSwatches}</span>
            )}
          </div>
        )}

        <Price className="mt-auto pt-1" price={product.price} promoPrice={product.promoPrice} promoEndsAt={product.promoEndsAt} />
      </div>
    </article>
  );
}
