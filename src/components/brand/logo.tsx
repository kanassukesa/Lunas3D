import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import logo from "../../../public/brand/logo.png";

/**
 * Logo oficial da Lunas 3D (public/brand/logo.png — versão recortada e com
 * fundo transparente do arquivo original ./logo.png). Funciona sobre fundos
 * claros e escuros.
 */
export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <Link
      href="/"
      aria-label="Lunas 3D — página inicial"
      className={cn("inline-flex shrink-0 items-center rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
    >
      <Image
        src={logo}
        alt="Lunas 3D"
        priority
        sizes={size === "lg" ? "200px" : "130px"}
        className={cn("w-auto", size === "lg" ? "h-20" : "h-11 sm:h-12")}
      />
    </Link>
  );
}
