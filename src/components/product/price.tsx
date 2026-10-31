import { effectivePrice, formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  promoPrice,
  promoEndsAt,
  className,
}: {
  price: number;
  promoPrice: number | null;
  promoEndsAt: string | null;
  className?: string;
}) {
  const current = effectivePrice({ price, promo_price: promoPrice, promo_ends_at: promoEndsAt });
  const onSale = current < price;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      {onSale && (
        <span className="text-sm text-muted-foreground line-through">
          <span className="sr-only">De </span>
          {formatBRL(price)}
        </span>
      )}
      <span className="font-display text-lg font-bold text-brand-night">
        {onSale && <span className="sr-only">Por </span>}
        {formatBRL(current)}
      </span>
    </p>
  );
}
