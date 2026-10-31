"use client";

import { Button } from "@/components/ui/button";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">Não conseguimos carregar esta página. Tente novamente em instantes.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </section>
  );
}
