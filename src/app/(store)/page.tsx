import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Layers, PackageCheck, Sparkles, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { Sparkle } from "@/components/brand/sparkle";
import logo from "../../../public/brand/logo.png";
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
  const stepColors = [
    "bg-brand-pink-50 text-brand-pink-600",
    "bg-brand-blue-50 text-brand-blue-700",
    "bg-amber-100 text-brand-maroon",
    "bg-brand-blue-50 text-brand-blue-700",
  ];

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

      {/* HERO — fundo azul-céu da logo, grade de impressão e estrelas */}
      <section className="relative overflow-hidden bg-brand-sky">
        <div className="bg-print-grid absolute inset-0" aria-hidden="true" />
        <Sparkle className="absolute top-8 right-[8%] size-8 text-brand-yellow drop-shadow-sm sm:size-12" />
        <Sparkle className="absolute top-[38%] right-[3%] size-5 text-brand-blue-sky" />
        <Sparkle className="absolute bottom-10 left-[46%] hidden size-6 text-brand-yellow lg:block" />
        <Sparkle className="absolute top-10 left-[42%] hidden size-4 text-brand-pink lg:block" />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 font-display text-sm font-medium text-brand-blue-700 shadow-sm">
              <Box className="size-4" aria-hidden="true" /> Impressão 3D em Fortaleza-CE
            </p>
            <h1 className="text-4xl leading-[1.05] font-semibold text-balance text-brand-navy sm:text-5xl lg:text-6xl">
              {banner?.title ?? settings.tagline}
            </h1>
            {banner?.subtitle && <p className="max-w-xl text-lg text-brand-navy/75 text-pretty">{banner.subtitle}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={banner?.cta_href || "/produtos"}>
                  {banner?.cta_label || "Ver produtos"} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/personalizado">Quero uma peça personalizada</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-lg lg:block">
            {bannerImage ? (
              <div className="relative aspect-square">
                <Image src={bannerImage} alt="" fill priority sizes="512px" className="rounded-[2.5rem] border-4 border-white object-cover shadow-card-hover" />
              </div>
            ) : (
              <Image src={logo} alt="" priority sizes="512px" className="h-auto w-full -rotate-3 drop-shadow-xl" />
            )}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section aria-label="Vantagens" className="border-b bg-white">
        <ul className="container-page grid grid-cols-1 gap-4 py-6 text-sm sm:grid-cols-3">
          <li className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary"><Store className="size-5 text-brand-blue-700" aria-hidden="true" /></span> Retirada no local em Fortaleza
          </li>
          <li className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary"><Truck className="size-5 text-brand-blue-700" aria-hidden="true" /></span> Envio para todo o Brasil
          </li>
          <li className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary"><Sparkles className="size-5 text-brand-blue-700" aria-hidden="true" /></span> Peças sob medida para você
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
                  className="group flex h-full flex-col gap-1 rounded-3xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-blue/50 hover:shadow-card-hover"
                >
                  <span className="flex items-center justify-between font-display text-lg font-semibold">
                    {category.name}
                    <ArrowRight className="size-4 text-brand-pink-600 transition group-hover:translate-x-1" aria-hidden="true" />
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
          <h2 className="mb-8 text-2xl font-semibold sm:text-3xl">Como funciona</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {settings.how_it_works.map((step, i) => {
              const Icon = stepIcons[i % stepIcons.length];
              return (
                <li key={step.title} className="rounded-3xl border bg-card p-5 shadow-card">
                  <div className="mb-4 flex items-center gap-3">
                    <span className={`flex size-11 items-center justify-center rounded-2xl ${stepColors[i % stepColors.length]}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-medium text-muted-foreground">Passo {i + 1}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* CTA PERSONALIZADO */}
      <section className="container-page py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="bg-print-grid-light absolute inset-0" aria-hidden="true" />
          <Sparkle className="absolute top-6 right-8 size-10 text-brand-yellow sm:size-16" />
          <Sparkle className="absolute right-[22%] bottom-8 hidden size-6 text-white/70 sm:block" />
          <div className="relative max-w-2xl space-y-4">
            <h2 className="text-3xl font-semibold sm:text-4xl">Tem uma ideia? A gente imprime.</h2>
            <p className="text-lg text-white">
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
      <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 font-display text-sm font-semibold text-brand-blue-700 hover:underline underline-offset-4">
          Ver tudo <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
