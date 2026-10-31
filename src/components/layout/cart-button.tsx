"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartCount } from "@/lib/cart/storage";
import { cn } from "@/lib/utils";

export function CartButton({ className }: { className?: string }) {
  const count = useCartCount();
  const label = count > 0 ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho vazio";

  return (
    <Link
      href="/carrinho"
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full text-brand-navy transition hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <ShoppingBag className="size-[22px]" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] leading-5 font-bold text-accent-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
