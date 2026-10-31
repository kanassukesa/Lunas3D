import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <section className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-brand-lilac">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-muted-foreground">
        Esta página não existe ou ainda está sendo construída. Volte para a página inicial e continue explorando.
      </p>
      <Button asChild>
        <Link href="/">Ir para a página inicial</Link>
      </Button>
    </section>
  );
}
