import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Layers, PackageCheck, Sparkles, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { getActiveCategories, getFeaturedProducts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/site-settings";
import { isSupabaseConfigured } from "@/lib/env";
import { productImageUrl } from "@/lib/storage";

// HOME PROVISÓRIA (Etapa 1). Conteúdo vem do banco (site_settings, categorias e produtos).
export default async function HomePage() {
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    getActiveCategories(),
    getFeaturedProducts(8),
  ]);
  const banner = settings.home_banners[0];
  const bannerImage = productImageUrl(banner?.image_path);
  const stepIcons = [Sparkles, PackageCheck, Layers, Truck];

  return (
    <>
      {!isSupabaseConfigured() && (
        <div className="border-b border-warning/30 bg-amber-50 text-amber-900">
          <p className="container-page py-2.5 text-sm">
            <strong>Modo de desenvolvimento:</strong> o Supabase ainda não foi configurado no <code>.env.local</code>.
            O site está usando textos padrão e sem produtos. Veja <code>docs/README.md</code>.
          </p>
        </div>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-night text-white">
        <div className="bg-print-grid absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -top-24 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#c7cbff_0%,#6f74ee_45%,transparent_70%)] opacity-40 blur-2xl"
          aria-hidden="true"
        />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-lilac">
              <Box className="size-3.5" aria-hidden="true" /> Impressão 3D em Fortaleza-CE
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold text-balance sm:text-5xl lg:text-6xl">
              {banner?.title ?? settings.tagline}
            </h1>
            {banner?.subtitle && <p className="max-w-xl text-lg text-white/75 text-pretty">{banner.subtitle}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href={banner?.cta_href || "/produtos"}>
                  {banner?.cta_label || "Ver produtos"} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
                <Link href="/personalizado">Quero uma peça personalizada</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
            {bannerImage ? (
              <Image src={bannerImage} alt="" fill priority sizes="448px" className="rounded-3xl object-cover" />
            ) : (
              <Image src="/brand/logo-mark.svg" alt="" fill priority sizes="448px" className="rounded-[3rem] shadow-2xl" />
            )}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section aria-label="Vantagens" className="border-b bg-surface">
        <ul className="container-page grid grid-cols-1 gap-4 py-6 text-sm sm:grid-cols-3">
          <li className="flex items-center gap-3">
            <Store className="size-5 text-primary" aria-hidden="true" /> Retirada no local em Fortaleza
          </li>
          <li className="flex items-center gap-3">
            <Truck className="size-5 text-primary" aria-hidden="true" /> Envio para todo o Brasil
          </li>
          <li className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary" aria-hidden="true" /> Peças sob medida para você
          </li>
        </ul>
      </section>

      {/* CATEGORIAS */}
      {categories.length > 0 && (
        <section className="container-page py-12 sm:py-16">
          <SectionTitle title="Categorias" href="/produtos" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/produtos?categoria=${category.slug}`}
                  className="group flex h-full flex-col gap-1 rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-hover"
                >
                  <span className="flex items-center justify-between font-display text-lg font-semibold">
                    {category.name}
                    <ArrowRight className="size-4 text-primary transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  {category.description && <span className="text-sm text-muted-foreground">{category.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DESTAQUES */}
      <section className="container-page pb-12 sm:pb-16">
        <SectionTitle title="Destaques da vitrine" href="/produtos" />
        {products.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, i) => (
              <li key={product.id} className="flex">
                <ProductCard product={product} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            Nenhum produto publicado ainda.
          </p>
        )}
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-surface bg-layer-lines py-12 sm:py-16">
        <div className="container-page">
          <h2 className="mb-8 text-2xl font-bold sm:text-3xl">Como funciona</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {settings.how_it_works.map((step, i) => {
              const Icon = stepIcons[i % stepIcons.length];
              return (
                <li key={step.title} className="rounded-2xl border bg-card p-5 shadow-card">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-semibold text-muted-foreground">Passo {i + 1}</span>
                  </div>
                  <h3 className="mb-1 font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* CTA PERSONALIZADO */}
      <section className="container-page py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-12 sm:py-14">
          <div className="bg-print-grid absolute inset-0" aria-hidden="true" />
          <div className="relative max-w-2xl space-y-4">
            <h2 className="text-3xl font-bold sm:text-4xl">Tem uma ideia? A gente imprime.</h2>
            <p className="text-white/85">
              Envie fotos de referência, medidas e cores. Analisamos e respondemos com preço e prazo na sua conta.
            </p>
            <Button asChild size="lg" variant="accent">
              <Link href="/personalizado">
                Pedir orçamento <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4">
          Ver tudo <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
