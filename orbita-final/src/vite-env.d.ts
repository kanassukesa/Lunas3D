/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PAGAMENTOS?: "teste" | "mercadopago";
  readonly VITE_ADSENSE_CLIENT?: string;
}
