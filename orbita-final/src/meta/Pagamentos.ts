import { PASSE_PREMIUM, PRODUTOS, type Produto } from "../data/monetizacao";
import type { SaveData } from "../core/Save";
import { darPremio, nivelPasse, temporadaAtual } from "./Comandante";
import { nuvem } from "../core/Nuvem";
import type { Chip } from "../data/types";

/**
 * Pagamentos com dinheiro real.
 *  - Modo TESTE (padrão): simula a compra e entrega na hora — nada é cobrado.
 *  - Modo Mercado Pago: `VITE_PAGAMENTOS=mercadopago` + Supabase configurado. O servidor cria o checkout,
 *    o Mercado Pago confirma por webhook e o jogo busca as compras aprovadas (`sincronizarCompras`).
 */
export const MODO_PAGAMENTO: "teste" | "mercadopago" = import.meta.env.VITE_PAGAMENTOS === "mercadopago" && nuvem.configurada ? "mercadopago" : "teste";

export function produtoDisponivel(s: SaveData, p: Produto): boolean {
  if (p.unico && s.monet.unicosComprados.includes(p.id)) return false;
  if (p.especial === "passe_premium" && s.monet.passePremium === temporadaAtual()) return false;
  if (p.especial === "sem_anuncios" && s.monet.semAnuncios) return false;
  return true;
}

/** Entrega o produto (chamado pelo modo teste ou ao sincronizar uma compra aprovada). Idempotente por `idPagamento`. */
export function entregarProduto(s: SaveData, produtoId: string, idPagamento: string): { chip: Chip | null } | null {
  if (s.monet.comprasAplicadas.includes(idPagamento)) return null;
  const p = PRODUTOS.find((x) => x.id === produtoId);
  if (!p) return null;
  s.monet.comprasAplicadas.push(idPagamento);
  if (p.unico) s.monet.unicosComprados.push(p.id);
  if (p.especial === "passe_premium") s.monet.passePremium = temporadaAtual();
  if (p.especial === "sem_anuncios") s.monet.semAnuncios = true;
  if (p.skin && !s.skins.possui.includes(p.skin)) s.skins.possui.push(p.skin);
  return { chip: p.premio ? darPremio(s, p.premio) : null };
}

/** Inicia a compra. No modo teste resolve na hora; no real redireciona para o checkout. */
export async function iniciarCompra(s: SaveData, produtoId: string): Promise<{ ok: boolean; msg: string; chip?: Chip | null }> {
  const p = PRODUTOS.find((x) => x.id === produtoId);
  if (!p || !produtoDisponivel(s, p)) return { ok: false, msg: "Produto indisponível." };
  if (MODO_PAGAMENTO === "teste") {
    const r = entregarProduto(s, p.id, `teste-${Date.now()}`);
    return { ok: !!r, msg: `${p.nome}: compra de TESTE concluída.`, chip: r?.chip };
  }
  if (!nuvem.logado()) return { ok: false, msg: "Entre na sua conta (Ajustes → Conta) para comprar." };
  try {
    const url = await nuvem.criarCheckout(p.id);
    window.location.href = url;
    return { ok: true, msg: "Abrindo pagamento…" };
  } catch (e) {
    return { ok: false, msg: `Não foi possível abrir o pagamento: ${(e as Error).message}` };
  }
}

/** Busca compras aprovadas no servidor e entrega as que ainda não foram aplicadas neste save. */
export async function sincronizarCompras(s: SaveData): Promise<number> {
  if (MODO_PAGAMENTO !== "mercadopago" || !nuvem.logado()) return 0;
  const compras = await nuvem.comprasAprovadas();
  let n = 0;
  for (const c of compras) if (entregarProduto(s, c.produto, c.id)) n++;
  return n;
}

// ------------------------------------------------------------- passe premium

export function temPremium(s: SaveData): boolean {
  return s.monet.passePremium === temporadaAtual();
}

export function resgatarPremium(s: SaveData, nivel: number): { chip: Chip | null; skin?: string } | null {
  if (!temPremium(s) || nivelPasse(s).nivel < nivel || s.monet.premiumResgatados.includes(nivel)) return null;
  s.monet.premiumResgatados.push(nivel);
  const p = PASSE_PREMIUM[nivel - 1];
  if (p.skin && !s.skins.possui.includes(p.skin)) s.skins.possui.push(p.skin);
  return { chip: darPremio(s, p), skin: p.skin };
}

export function premiumProntos(s: SaveData): number {
  if (!temPremium(s)) return 0;
  const { nivel } = nivelPasse(s);
  let n = 0;
  for (let i = 1; i <= nivel; i++) if (!s.monet.premiumResgatados.includes(i)) n++;
  return n;
}
