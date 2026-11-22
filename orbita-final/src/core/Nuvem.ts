import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveData } from "./Save";

/**
 * Conta na nuvem (Supabase): login por código de 6 dígitos (e-mail ou SMS), progresso salvo no servidor,
 * compras, ranking e clãs.
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
  telefone: string | null = null;

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
    this.telefone = data.session?.user.phone || null;
    sb.auth.onAuthStateChange((_e, sess) => {
      this.userId = sess?.user.id ?? null;
      this.email = sess?.user.email ?? null;
      this.telefone = sess?.user.phone || null;
    });
  }

  logado(): boolean {
    return !!this.userId;
  }

  /** Nome da conta para mostrar (e-mail ou celular). */
  conta(): string {
    return this.email || (this.telefone ? "+" + this.telefone.replace(/^\+/, "") : "") || "conectado";
  }

  /** Envia o código de 6 dígitos (por e-mail, ou SMS se `destino` for um celular +55...). */
  async enviarCodigo(destino: string): Promise<void> {
    const sb = await this.cliente();
    const { error } = destino.includes("@")
      ? await sb.auth.signInWithOtp({ email: destino, options: { shouldCreateUser: true } })
      : await sb.auth.signInWithOtp({ phone: destino, options: { shouldCreateUser: true } });
    if (error) throw error;
  }

  /** Confere o código digitado e entra na conta. */
  async confirmarCodigo(destino: string, codigo: string): Promise<void> {
    const sb = await this.cliente();
    const { data, error } = destino.includes("@")
      ? await sb.auth.verifyOtp({ email: destino, token: codigo, type: "email" })
      : await sb.auth.verifyOtp({ phone: destino, token: codigo, type: "sms" });
    if (error) throw error;
    this.userId = data.session?.user.id ?? data.user?.id ?? null;
    this.email = data.user?.email || null;
    this.telefone = data.user?.phone || null;
  }

  async sair(): Promise<void> {
    const sb = await this.cliente();
    await sb.auth.signOut();
    this.userId = this.email = this.telefone = null;
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

  /** Publica os recordes do jogador no ranking global (chamado junto com o salvamento na nuvem). */
  async publicarRanking(save: SaveData, linha: LinhaRankingEnvio): Promise<void> {
    if (!this.userId || !save.perfil.nome) return;
    const sb = await this.cliente();
    await sb.from("ranking").upsert({ user_id: this.userId, ...linha, atualizado_em: new Date().toISOString() });
  }

  /** Top 50 de um modo + a posição do próprio jogador. */
  async ranking(modo: ModoRanking, filtro?: string): Promise<{ linhas: LinhaRanking[]; minhaPosicao: number | null }> {
    const sb = await this.cliente();
    const col = COLUNA_RANKING[modo];
    let q = sb.from("ranking_publico").select("*").gt(col, 0).order(col, { ascending: false }).limit(50);
    if (modo === "jornada") q = q.eq("jornada_semana", filtro ?? "");
    if (modo === "diario") q = q.eq("diario_dia", filtro ?? "");
    const { data, error } = await q;
    if (error) throw error;
    const linhas = (data ?? []) as LinhaRanking[];
    let minhaPosicao: number | null = null;
    const i = linhas.findIndex((l) => l.eu);
    if (i >= 0) minhaPosicao = i + 1;
    else if (this.userId) {
      const { data: eu } = await sb.from("ranking_publico").select(col).eq("eu", true).maybeSingle();
      const meu = eu ? Number((eu as unknown as Record<string, unknown>)[col]) : 0;
      if (meu > 0) {
        let c = sb.from("ranking_publico").select("id", { count: "exact", head: true }).gt(col, meu);
        if (modo === "jornada") c = c.eq("jornada_semana", filtro ?? "");
        if (modo === "diario") c = c.eq("diario_dia", filtro ?? "");
        const { count } = await c;
        minhaPosicao = (count ?? 0) + 1;
      }
    }
    return { linhas, minhaPosicao };
  }

  // ---------------------------------------------------------------- clãs

  private async rpc(nome: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const sb = await this.cliente();
    const { data, error } = await sb.rpc(nome, args);
    if (error) throw new Error(error.message);
    return data;
  }

  /** Meu clã (ou null) + posição dele no ranking de clãs. */
  async meuCla(): Promise<{ cla: Cla; posicao: number } | null> {
    const sb = await this.cliente();
    const { data, error } = await sb.from("clas_ranking").select("*").eq("meu", true).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const cla = data as Cla;
    const { count } = await sb.from("clas_ranking").select("id", { count: "exact", head: true }).gt("pontos", cla.pontos);
    return { cla, posicao: (count ?? 0) + 1 };
  }

  /** Ranking de clãs (top 50), com busca opcional por nome ou tag. */
  async listarClas(busca = ""): Promise<Cla[]> {
    const sb = await this.cliente();
    let q = sb.from("clas_ranking").select("*").order("pontos", { ascending: false }).limit(50);
    const b = busca.trim().replace(/[%,()]/g, "");
    if (b) q = q.or(`nome.ilike.%${b}%,tag.ilike.%${b}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as Cla[];
  }

  async membrosCla(): Promise<MembroCla[]> {
    const sb = await this.cliente();
    const { data, error } = await sb.from("cla_membros_publico").select("*").order("pontos", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MembroCla[];
  }

  async chatCla(): Promise<MensagemCla[]> {
    const sb = await this.cliente();
    const { data, error } = await sb.from("cla_chat_publico").select("*").order("id", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return ((data ?? []) as MensagemCla[]).reverse();
  }

  criarCla(nome: string, tag: string, descricao: string, emblema: number): Promise<unknown> {
    return this.rpc("criar_cla", { p_nome: nome, p_tag: tag, p_descricao: descricao, p_emblema: emblema });
  }
  entrarCla(id: string): Promise<unknown> { return this.rpc("entrar_cla", { p_cla: id }); }
  sairCla(): Promise<unknown> { return this.rpc("sair_cla"); }
  expulsar(membro: string): Promise<unknown> { return this.rpc("expulsar_membro", { p_membro: membro }); }
  alternarOficial(membro: string): Promise<unknown> { return this.rpc("alternar_oficial", { p_membro: membro }); }
  editarCla(descricao: string, aberto: boolean): Promise<unknown> { return this.rpc("editar_cla", { p_descricao: descricao, p_aberto: aberto }); }
  enviarChat(texto: string): Promise<unknown> { return this.rpc("enviar_chat", { p_texto: texto }); }

  async carregar(): Promise<SaveData | null> {
    if (!this.userId) return null;
    const sb = await this.cliente();
    const { data } = await sb.from("saves").select("dados").eq("user_id", this.userId).maybeSingle();
    return (data?.dados as SaveData | undefined) ?? null;
  }
}

export type ModoRanking = "elo" | "campanha" | "sobrevivencia" | "jornada" | "diario";
const COLUNA_RANKING: Record<ModoRanking, string> = { elo: "pontos", campanha: "estrelas", sobrevivencia: "sobrevivencia", jornada: "jornada", diario: "diario" };

export interface LinhaRankingEnvio {
  nome: string; avatar: number; patente: number; pontos: number; estrelas: number; sobrevivencia: number;
  jornada_semana: string; jornada: number; diario_dia: string; diario: number;
}
export interface LinhaRanking extends LinhaRankingEnvio { id: string; eu: boolean; elite: boolean }

export const nuvem = new Nuvem();

export interface Cla { id: string; nome: string; tag: string; descricao: string; emblema: number; aberto: boolean; membros: number; pontos: number; estrelas: number; meu: boolean }
export interface MembroCla { id: string; eu: boolean; cargo: "lider" | "oficial" | "membro"; nome: string; avatar: number; elite: boolean; patente: number; pontos: number }
export interface MensagemCla { id: number; autor: string; eu: boolean; nome: string; texto: string; criado_em: string }
