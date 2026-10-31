"use client";

import Link from "next/link";
import { Menu, UserRound } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/brand/icons";
import { whatsappLink } from "@/lib/format";
import { mainNav } from "./nav-links";

export function MobileNav({ whatsapp }: { whatsapp: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal da loja</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal" className="flex flex-col px-3">
          {mainNav.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link href={item.href} className="rounded-2xl px-3 py-3.5 font-display text-lg font-medium hover:bg-secondary">
                {item.label}
              </Link>
            </SheetClose>
          ))}
          <SheetClose asChild>
            <Link href="/conta" className="flex items-center gap-2 rounded-2xl px-3 py-3.5 font-display text-lg font-medium hover:bg-secondary">
              <UserRound className="size-5" aria-hidden="true" /> Minha conta
            </Link>
          </SheetClose>
        </nav>
        <div className="mt-auto border-t p-5">
          <Button asChild variant="whatsapp" className="w-full">
            <a href={whatsappLink(whatsapp, "Olá, Lunas 3D! Vim pelo site.")} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-5" /> Falar no WhatsApp
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
