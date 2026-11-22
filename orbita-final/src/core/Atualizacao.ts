import { listarArtes } from "../render/Sprites";

/**
 * Atualizações e imagens no celular:
 * - avisa quando sai uma versão nova do jogo (o site publica, o APK carrega o site);
 * - baixa as imagens com antecedência para o cache (APK: todas; site: as cartas);
 * - tenta de novo uma imagem que falhou ao carregar.
 */
const CACHE = "orbita-final-v2"; // o mesmo nome do public/sw.js

function scriptAtual(): string | null {
  const s = document.querySelector<HTMLScriptElement>('script[type="module"][src*="assets/index-"]');
  return s ? s.src.split("/").pop() ?? null : null;
}

/** Confere a cada 3 minutos (e ao voltar para o app) se o site tem um arquivo do jogo diferente do que está rodando. */
export function vigiarAtualizacao(aviso: () => void): void {
  if (import.meta.env.DEV) return;
  const meu = scriptAtual();
  if (!meu) return;
  let avisado = false;
  const checar = async () => {
    if (avisado) return;
    try {
      const r = await fetch(`./?verificar=${Date.now()}`, { cache: "no-store" });
      const m = (await r.text()).match(/assets\/(index-[^"']+\.js)/);
      if (m && m[1] !== meu) {
        avisado = true;
        aviso();
      }
    } catch { /* sem internet: tenta na próxima */ }
  };
  window.setInterval(checar, 3 * 60_000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void checar(); });
  window.setTimeout(checar, 20_000);
}

/** Baixa as imagens para o cache do aparelho, uma por vez, sem atrapalhar o jogo. */
export async function prebaixarArtes(todas: boolean): Promise<void> {
  if (import.meta.env.DEV || !("caches" in window)) return;
  const urls = listarArtes(todas ? null : /^carta_/);
  try {
    const c = await caches.open(CACHE);
    for (const u of urls) {
      const abs = new URL(u, location.href).href;
      if (await c.match(abs)) continue;
      try {
        const r = await fetch(abs);
        if (r.ok) await c.put(abs, r);
      } catch { /* sem internet: tenta na próxima vez que abrir */ }
      await new Promise((ok) => setTimeout(ok, 40));
    }
  } catch { /* cache indisponível (navegação privada): segue sem */ }
}

/** Imagem que falhou: tenta de novo até 3 vezes (1 s, 2 s, 3 s). */
export function retentarImagens(): void {
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.src || img.src.startsWith("data:")) return;
    const n = Number(img.dataset.tentativa ?? 0);
    if (n >= 3) return;
    img.dataset.tentativa = String(n + 1);
    const src = img.src;
    window.setTimeout(() => { img.removeAttribute("src"); img.src = src; }, 1000 * (n + 1));
  }, true);
}
