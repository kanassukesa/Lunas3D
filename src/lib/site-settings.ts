import "server-only";

import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Configurações editáveis do site (tabela site_settings: chave → JSON).
 * Cada chave tem um schema Zod e um valor padrão. Se o banco ainda não estiver
 * configurado (ou a chave não existir), o site usa os padrões abaixo.
 */
const bannerSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional().default(""),
  cta_label: z.string().optional().default(""),
  cta_href: z.string().optional().default("/produtos"),
  image_path: z.string().nullable().optional().default(null),
});

const settingsSchema = z.object({
  store_name: z.string(),
  tagline: z.string(),
  whatsapp: z.string(),
  contact_email: z.string(),
  instagram: z.string(),
  pickup_address: z.object({
    street: z.string(),
    neighborhood: z.string().optional().default(""),
    city: z.string(),
    state: z.string(),
    cep: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  }),
  origin_cep: z.string(),
  business_hours: z.string(),
  announcement: z.object({
    enabled: z.boolean(),
    text: z.string(),
    href: z.string().optional().default(""),
  }),
  home_banners: z.array(bannerSchema),
  about_text: z.string(),
  how_it_works: z.array(z.object({ title: z.string(), text: z.string() })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
});

export type SiteSettings = z.infer<typeof settingsSchema>;
export type HomeBanner = z.infer<typeof bannerSchema>;

export const defaultSettings: SiteSettings = {
  store_name: "Lunas 3D",
  tagline: "Impressão 3D sob medida em Fortaleza",
  whatsapp: "5585988669361",
  contact_email: "contato@lunas3d.com.br",
  instagram: "lunas3d",
  pickup_address: {
    street: "Endereço a definir",
    neighborhood: "",
    city: "Fortaleza",
    state: "CE",
    cep: "",
    notes: "Retirada com horário combinado pelo WhatsApp",
  },
  origin_cep: "60000000",
  business_hours: "Seg a Sex, 9h às 18h · Sáb, 9h às 13h",
  announcement: {
    enabled: true,
    text: "Peças personalizadas sob encomenda — peça seu orçamento!",
    href: "/personalizado",
  },
  home_banners: [
    {
      title: "Ideias que ganham forma, camada por camada",
      subtitle: "Peças em impressão 3D prontas para entrega ou feitas sob medida para você.",
      cta_label: "Ver produtos",
      cta_href: "/produtos",
      image_path: null,
    },
  ],
  about_text:
    "A Lunas 3D é um estúdio de impressão 3D em Fortaleza-CE. Criamos peças decorativas, utilitárias e colecionáveis, além de projetos sob medida.",
  how_it_works: [
    { title: "Escolha ou descreva", text: "Escolha uma peça da vitrine ou envie a sua ideia com fotos de referência." },
    { title: "Combine o pagamento", text: "Finalize o pedido e combine o pagamento direto no WhatsApp." },
    { title: "Produção", text: "Imprimimos e fazemos o acabamento da sua peça com cuidado." },
    { title: "Receba", text: "Retire no local ou receba pelos Correios." },
  ],
  faq: [],
};

type SettingKey = keyof SiteSettings;

/** Lê todas as configurações públicas (1 consulta por requisição, graças ao cache()). */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return defaultSettings;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error || !data) {
      if (error) console.error("[site_settings]", error.message);
      return defaultSettings;
    }

    const merged: Record<string, unknown> = { ...defaultSettings };
    for (const row of data) {
      if (!(row.key in settingsSchema.shape)) continue;
      const parsed = settingsSchema.shape[row.key as SettingKey].safeParse(row.value);
      if (parsed.success) merged[row.key] = parsed.data;
      else console.warn(`[site_settings] valor inválido em "${row.key}", usando padrão.`);
    }
    return merged as SiteSettings;
  } catch (err) {
    console.error("[site_settings]", err);
    return defaultSettings;
  }
});
