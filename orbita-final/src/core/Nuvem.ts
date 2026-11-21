import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveData } from "./Save";

/**
 * Conta na nuvem (Supabase): login por e-mail (link mágico), progresso salvo no servidor e compras.
 * Só liga com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; sem isso o jogo funciona 100% local.
 * O cliente do Supabase é carregado sob demanda (não pesa no jogo local).
 */
const URL_SB = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const CHAVE = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

class Nuvem {
  readonly configurada = !!(URL_SB && CHAVE);
  private sb: SupabaseClient | null = null;
  private userId: string | null = null;
  email: string | null = null;

  private async cliente(): Promise<SupabaseClient> {
    if (!this.sb) {
      const { createClient } = await import("@supabase/supabase-js");
      this.sb = createClient(URL_SB!, CHAVE!, { auth: { persistSession: true, detectSessionInUrl: true } });
    }
    return this.sb;
  }

  /** Restaura a sessão (inclusive a volta do link mágico). */
  async iniciar(): Promise<void> {
    if (!this.configurada) return;
    const sb = await this.cliente();
    const { data } = await sb.auth.getSession();
    this.userId = data.session?.user.id ?? null;
    this.email = data.session?.user.email ?? null;
    sb.auth.onAuthStateChange((_e, sess) => {
      this.userId = sess?.user.id ?? null;
      this.email = sess?.user.email ?? null;
    });
  }

  logado(): boolean {
    return !!this.userId;
  }

  async entrarEmail(email: string): Promise<void> {
    const sb = await this.cliente();
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
  }

  async sair(): Promise<void> {
    const sb = await this.cliente();
    await sb.auth.signOut();
    this.userId = this.email = null;
  }

  /** Cria o checkout no servidor (Edge Function) e devolve a URL de pagamento. */
  async criarCheckout(produto: string): Promise<string> {
    const sb = await this.cliente();
    const { data, error } = await sb.functions.invoke("criar-checkout", { body: { produto, retorno: location.origin + location.pathname } });
    if (error) throw error;
    return (data as { url: string }).url;
  }

  async comprasAprovadas(): Promise<{ id: string; produto: string }[]> {
    const sb = await this.cliente();
    const { data, error } = await sb.from("compras").select("id, produto").eq("status", "aprovado");
    if (error) throw error;
    return (data ?? []) as { id: string; produto: string }[];
  }

  async salvar(save: SaveData): Promise<void> {
    if (!this.userId) return;
    const sb = await this.cliente();
    await sb.from("saves").upsert({ user_id: this.userId, dados: save, atualizado_em: new Date().toISOString() });
  }

  async carregar(): Promise<SaveData | null> {
    if (!this.userId) return null;
    const sb = await this.cliente();
    const { data } = await sb.from("saves").select("dados").eq("user_id", this.userId).maybeSingle();
    return (data?.dados as SaveData | undefined) ?? null;
  }
}

export const nuvem = new Nuvem();
