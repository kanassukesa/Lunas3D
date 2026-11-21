import { ANUNCIOS, type MotivoAnuncio } from "../data/monetizacao";
import type { SaveData } from "../core/Save";
import { atualizarDia, darPremio, statDia } from "./Comandante";
import { hojeStr } from "./Meta";
import { h } from "../ui/dom";

/**
 * Anúncios.
 *  - Com `VITE_ADSENSE_CLIENT` (ex.: ca-pub-123…): Google H5 Games Ads (Ad Placement API: adBreak/adConfig).
 *  - Sem isso: anúncio de TESTE (tela de 5 s), para desenvolver o fluxo.
 * Quem comprou "Sem anúncios" recebe as recompensas direto e não vê intersticiais.
 */
const CLIENTE = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
export const MODO_ANUNCIO: "teste" | "google" = CLIENTE ? "google" : "teste";

type AdBreak = (o: Record<string, unknown>) => void;
let carregado: Promise<void> | null = null;
function carregarGoogle(): Promise<void> {
  if (!CLIENTE) return Promise.resolve();
  if (!carregado) {
    carregado = new Promise((res) => {
      const w = window as unknown as { adsbygoogle: unknown[]; adBreak: AdBreak; adConfig: AdBreak };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adBreak = w.adConfig = (o) => (w.adsbygoogle as unknown[]).push(o);
      const sc = document.createElement("script");
      sc.async = true;
      sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENTE}`;
      sc.crossOrigin = "anonymous";
      sc.dataset.adFrequencyHint = "30s";
      if (import.meta.env.DEV) sc.dataset.adbreakTest = "on";
      sc.onload = sc.onerror = () => res();
      document.head.append(sc);
      w.adConfig({ preloadAdBreaks: "on", sound: "on" });
    });
  }
  return carregado;
}

export function anunciosRestantes(s: SaveData, motivo: MotivoAnuncio): number {
  atualizarDia(s);
  return Math.max(0, ANUNCIOS.recompensa[motivo].limite - (s.dia.stats[`ad_${motivo}`] ?? 0));
}

function anuncioTeste(root: HTMLElement, recompensado: boolean): Promise<boolean> {
  return new Promise((res) => {
    let t = 5;
    const cont = h("b", { text: String(t) });
    const pular = h("button", { class: "btn pequeno", text: recompensado ? "Fechar (sem recompensa)" : "Pular", onclick: () => fim(!recompensado) });
    const el = h("div", { class: "overlay ad-teste" },
      h("small", { text: "ANÚNCIO DE TESTE" }),
      h("div", { class: "ad-caixa" }, h("span", { text: "Aqui aparece o vídeo do anunciante" }), cont),
      pular);
    root.append(el);
    const id = setInterval(() => {
      t--;
      cont.textContent = String(t);
      if (t <= 0) fim(true);
    }, 1000);
    function fim(ok: boolean) {
      clearInterval(id);
      el.remove();
      res(ok);
    }
  });
}

/** Mostra um anúncio com recompensa. Resolve `true` se o jogador ganhou a recompensa. */
export async function anuncioRecompensado(s: SaveData, root: HTMLElement, motivo: MotivoAnuncio): Promise<boolean> {
  if (anunciosRestantes(s, motivo) <= 0) return false;
  let ok: boolean;
  if (s.monet.semAnuncios) ok = true;
  else if (MODO_ANUNCIO === "teste") ok = await anuncioTeste(root, true);
  else {
    await carregarGoogle();
    ok = await new Promise<boolean>((res) => {
      let ganhou = false;
      (window as unknown as { adBreak: AdBreak }).adBreak({
        type: "reward",
        name: motivo,
        beforeReward: (mostrar: () => void) => mostrar(),
        adViewed: () => (ganhou = true),
        adDismissed: () => (ganhou = false),
        adBreakDone: () => res(ganhou),
      });
    });
  }
  if (ok) statDia(s, `ad_${motivo}`, 1);
  return ok;
}

/** Baú diário de anúncio (Recompensas). */
export async function bauAnuncio(s: SaveData, root: HTMLElement): Promise<boolean> {
  if (!(await anuncioRecompensado(s, root, "bau"))) return false;
  darPremio(s, ANUNCIOS.recompensa.bau.premio);
  return true;
}

/** Intersticial entre partidas (com limite de frequência). Nunca no primeiro dia nem para quem comprou "Sem anúncios". */
export async function talvezIntersticial(s: SaveData, root: HTMLElement): Promise<void> {
  const m = s.monet;
  if (!m.primeiroDia) m.primeiroDia = hojeStr();
  m.partidasDesdeAnuncio++;
  if (m.semAnuncios || m.primeiroDia === hojeStr()) return;
  if (m.partidasDesdeAnuncio < ANUNCIOS.intersticialCadaPartidas) return;
  if (Date.now() - m.ultimoAnuncio < ANUNCIOS.intersticialMinSegundos * 1000) return;
  m.partidasDesdeAnuncio = 0;
  m.ultimoAnuncio = Date.now();
  if (MODO_ANUNCIO === "teste") {
    await anuncioTeste(root, false);
    return;
  }
  await carregarGoogle();
  await new Promise<void>((res) => (window as unknown as { adBreak: AdBreak }).adBreak({ type: "next", name: "entre_partidas", adBreakDone: () => res() }));
}
