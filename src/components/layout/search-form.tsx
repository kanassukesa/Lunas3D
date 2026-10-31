import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Busca de produtos. É um <form method="get"> comum: funciona mesmo antes do
 * JavaScript carregar e leva para /produtos?q=termo (página da Etapa 2).
 */
export function SearchForm({ className, id = "busca" }: { className?: string; id?: string }) {
  return (
    <form action="/produtos" method="get" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Buscar produtos
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Buscar peças, presentes, utilidades..."
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-xl border border-input bg-muted/60 pr-3 pl-10 text-base outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-[3px] focus:ring-ring/30 md:text-sm"
      />
    </form>
  );
}
