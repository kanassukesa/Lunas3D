import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getSiteSettings } from "@/lib/site-settings";

/** Layout da loja (todas as páginas públicas). O /admin terá layout próprio na Etapa 5. */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader settings={settings} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <WhatsAppFloat whatsapp={settings.whatsapp} />
    </>
  );
}
