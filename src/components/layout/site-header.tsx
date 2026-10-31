import Link from "next/link";
import { UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { SiteSettings } from "@/lib/site-settings";
import { AnnouncementBar } from "./announcement-bar";
import { CartButton } from "./cart-button";
import { MobileNav } from "./mobile-nav";
import { SearchForm } from "./search-form";
import { mainNav } from "./nav-links";

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar announcement={settings.announcement} />
      <div className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container-page flex h-16 items-center gap-2 lg:gap-6">
          <MobileNav whatsapp={settings.whatsapp} />

          <Logo className="mx-auto lg:mx-0" />

          <nav aria-label="Menu principal" className="hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 font-display text-[15px] font-medium text-brand-navy/80 transition hover:bg-secondary hover:text-brand-navy"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <SearchForm id="busca-desktop" className="ml-auto hidden w-full max-w-sm md:block" />

          <div className="flex items-center gap-0.5 md:ml-0">
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="hidden size-11 items-center justify-center rounded-full text-brand-navy transition hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:inline-flex"
            >
              <UserRound className="size-[22px]" aria-hidden="true" />
            </Link>
            <CartButton />
          </div>
        </div>

        {/* No celular a busca fica numa segunda linha, sempre visível */}
        <div className="container-page pb-3 md:hidden">
          <SearchForm id="busca-mobile" />
        </div>
      </div>
    </header>
  );
}
