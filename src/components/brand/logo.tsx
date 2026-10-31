import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo da Lunas 3D.
 * PROVISÓRIO: símbolo em /public/brand/logo-mark.svg + nome em texto.
 * Quando a logo oficial (logo.png) for adicionada ao projeto, troque o
 * símbolo aqui — o resto do site acompanha. Veja docs/identidade-visual.md.
 */
export function Logo({
  className,
  variant = "dark",
  showText = true,
}: {
  className?: string;
  variant?: "dark" | "light";
  showText?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Lunas 3D — página inicial"
      className={cn("inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
    >
      <Image src="/brand/logo-mark.svg" alt="" width={36} height={36} priority className="size-9" />
      {showText && (
        <span
          className={cn(
            "font-display text-xl font-bold leading-none tracking-tight",
            variant === "dark" ? "text-brand-night" : "text-white",
          )}
        >
          Lunas<span className="text-brand-orange">3D</span>
        </span>
      )}
    </Link>
  );
}
