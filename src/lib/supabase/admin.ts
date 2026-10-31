import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/**
 * Cliente com a chave SECRETA (ignora o RLS!).
 * Use SOMENTE no servidor e só quando for indispensável — por exemplo, para
 * criar pedidos recalculando preços (Etapa 3) ou enviar notificações.
 * Nunca importe este arquivo em um Client Component.
 */
export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnv.supabaseUrl || !secretKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local",
    );
  }

  return createClient<Database>(publicEnv.supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
