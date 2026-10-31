import { cn } from "@/lib/utils";

/** Mostrado quando o produto ainda não tem foto cadastrada. */
export function ProductImagePlaceholder({ name, className }: { name: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${name} — foto em breve`}
      className={cn("flex size-full flex-col items-center justify-center gap-2 bg-surface bg-layer-lines text-muted-foreground", className)}
    >
      <svg viewBox="0 0 48 48" className="size-12 opacity-60" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path d="M24 5 41 14.5v19L24 43 7 33.5v-19L24 5Z" />
        <path d="M7 14.5 24 24l17-9.5M24 24v19" />
      </svg>
      <span className="text-xs font-medium">Foto em breve</span>
    </div>
  );
}
