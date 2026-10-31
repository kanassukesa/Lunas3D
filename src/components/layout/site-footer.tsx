import Link from "next/link";
import { Clock, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";
import { formatCEP, formatPhoneBR, whatsappLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/site-settings";
import { mainNav } from "./nav-links";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { pickup_address: addr } = settings;
  const addressLine = [addr.street, addr.neighborhood, `${addr.city} - ${addr.state}`, addr.cep && formatCEP(addr.cep)]
    .filter(Boolean)
    .join(", ");
  const instagram = settings.instagram.replace(/^@/, "");

  return (
    <footer className="mt-auto bg-brand-navy text-white/80">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <Logo size="lg" />
          <p className="max-w-xs text-sm leading-relaxed">{settings.tagline}</p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-brand-yellow uppercase">Loja</h2>
          <ul className="space-y-2.5 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white hover:underline underline-offset-4">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/conta" className="hover:text-white hover:underline underline-offset-4">
                Minha conta
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-brand-yellow uppercase">Contato</h2>
          <ul className="space-y-3 text-sm">
            {settings.whatsapp && (
              <li>
                <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-white">
                  <WhatsAppIcon className="size-4 text-[#25D366]" /> {formatPhoneBR(settings.whatsapp)}
                </a>
              </li>
            )}
            {settings.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2.5 break-all hover:text-white">
                  <Mail className="size-4 shrink-0 text-brand-blue-sky" aria-hidden="true" /> {settings.contact_email}
                </a>
              </li>
            )}
            {instagram && (
              <li>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-white">
                  <InstagramIcon className="size-4 text-brand-blue-sky" /> @{instagram}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-brand-yellow uppercase">Retirada</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
              <span>
                {addressLine}
                {addr.notes && <span className="mt-1 block text-white/60">{addr.notes}</span>}
              </span>
            </li>
            {settings.business_hours && (
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                <span>{settings.business_hours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-1 py-5 text-xs text-white/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.store_name}. Todos os direitos reservados.</p>
          <p>Feito camada por camada em Fortaleza-CE.</p>
        </div>
      </div>
    </footer>
  );
}
