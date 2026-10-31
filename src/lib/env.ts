/**
 * Variáveis de ambiente PÚBLICAS (podem ir para o navegador).
 * Os valores vêm do arquivo .env.local — veja .env.example.
 *
 * Obs.: o Next.js só embute no navegador variáveis acessadas de forma literal
 * (process.env.NEXT_PUBLIC_...), por isso não usamos acesso dinâmico aqui.
 */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  // Chave "publishable" (nova) ou "anon" (formato antigo) — as duas funcionam.
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
};

/** true quando o .env.local já tem a URL e a chave do Supabase. */
export function isSupabaseConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
}
