import { WhatsAppIcon } from "@/components/brand/icons";
import { whatsappLink } from "@/lib/format";

/** Botão flutuante de WhatsApp (canto inferior direito). */
export function WhatsAppFloat({ whatsapp }: { whatsapp: string }) {
  if (!whatsapp) return null;
  return (
    <a
      href={whatsappLink(whatsapp, "Olá, Lunas 3D! Vim pelo site.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-card-hover transition hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25D366]/40 focus-visible:outline-none sm:right-6 sm:bottom-6"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
