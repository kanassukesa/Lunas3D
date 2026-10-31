import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Renova a sessão do Supabase em toda requisição (o token de login expira
 * e precisa ser atualizado nos cookies). Chamado por src/proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: não coloque código entre createServerClient e getClaims().
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  // Checagem "otimista": áreas restritas exigem login. A checagem de verdade
  // (inclusive se é admin) acontece no servidor de cada página e no RLS.
  const { pathname } = request.nextUrl;
  const needsLogin = pathname.startsWith("/conta") || pathname.startsWith("/admin");
  if (needsLogin && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
