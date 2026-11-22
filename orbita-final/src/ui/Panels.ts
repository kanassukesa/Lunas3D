import type { Battle } from "../battle/Battle";
import type { Recompensa } from "../meta/Meta";
import type { SentinelId } from "../data/types";
import { RARIDADE_COR } from "../data/balance";
import { CARD_MAP } from "../data/cards";
import { CHIP_RARIDADE_COR, CHIP_SET_MAP, CHIP_SLOT_NOME } from "../data/chips";
import { formatStat } from "../meta/Meta";
import { fmtInt, fmtTempo, h, hex, ICONE_MOEDA, iconeImg } from "./dom";
import { ic, icT } from "./Icones";
import { urlArte } from "../render/Sprites";

/** Linha "Supremo" do painel de build: o que falta para evoluir. */
function evolucaoTexto(b: Battle, id: SentinelId): HTMLElement | null {
  const ev = b.cards.evolucaoDe(id);
  if (!ev || ev.evoluido) return null;
  const falta: string[] = [];
  if (ev.nivel < 5) falta.push(`nível ${ev.nivel}/5`);
  if (!ev.temPassiva) falta.push(`carta ${ev.passiva}`);
  return h("div", { class: "build-evo" + (falta.length ? "" : " pronta"),
    html: `${ic("coroa")} Supremo ${ev.nome}: ${falta.length ? "falta " + falta.join(" e ") : "pronto! Aparece no próximo nível"}` });
}

function painelBuild(b: Battle): HTMLElement {
  const p = h("div", { class: "painel" });
  p.append(h("h3", { text: `Sentinelas (${b.sentinels.length}/${b.slots()})` }));
  const total = b.sentinels.reduce((a, s) => a + s.danoCausado, 0) || 1;
  for (const s of b.sentinels) {
    const pips = h("span", { class: "pips" });
    for (let k = 1; k <= 5; k++) pips.append(h("i", { class: k <= s.nivel ? "on" : "" }));
    p.append(
      h("div", { class: "sent-linha" },
        h("i", { class: "dot", style: `background:${hex(s.def.cor)}` }),
        h("div", { style: "flex:1" },
          h("div", { style: "font-weight:800", html: s.evoluido ? `${ic("coroa", "ic ic-ouro")} ${s.def.evolucao.nome}` : s.def.nome }, pips),
          h("div", { style: "font-size:12px;color:var(--texto2)", text: `Dano ${fmtInt(s.stats.dano)} · ${s.stats.cadencia.toFixed(2)}/s · crít ${(s.stats.critChance * 100).toFixed(0)}%` }),
          evolucaoTexto(b, s.def.id)),
        h("div", { style: "font-size:12px;text-align:right;color:var(--texto2)", text: `${Math.round((s.danoCausado / total) * 100)}%` })),
    );
  }
  p.append(h("h3", { text: "Cartas" }));
  const cont = new Map<string, number>();
  for (const id of b.cards.pegas) cont.set(id, (cont.get(id) ?? 0) + 1);
  const mini = h("div", { class: "chips-mini" });
  for (const [id, n] of cont) {
    const c = CARD_MAP[id];
    if (!c) continue;
    mini.append(h("span", { class: "chip-mini", style: `--cor:${RARIDADE_COR[c.raridade]}`, text: `${c.nome}${n > 1 ? " ×" + n : ""}` }));
  }
  if (!cont.size) mini.append(h("span", { class: "subtitulo", text: "Nenhuma carta ainda." }));
  p.append(mini);
  return p;
}

/** Faixa de título com asas douradas (padrão das telas de batalha). */
export function faixaTitulo(texto: string, extra?: HTMLElement | null): HTMLElement {
  return h("div", { class: "faixa3" }, h("span", { class: "faixa3-asa e" }), h("div", { class: "faixa3-placa" }, h("b", { text: texto }), extra ?? null), h("span", { class: "faixa3-asa d" }));
}

/** Botão chanfrado grande (laranja / azul / vermelho / ouro). */
export function botao3(cor: "laranja" | "azul" | "vermelho" | "ouro", icone: string, texto: string, onclick: () => void): HTMLElement {
  return h("button", { class: "bt3 " + cor, onclick }, h("span", { class: "bt3-ic", html: ic(icone) }), h("span", { class: "bt3-txt", text: texto }));
}

export function telaBuild(b: Battle, fechar: () => void): HTMLElement {
  return h("div", { class: "overlay ov3" },
    faixaTitulo("BUILD"),
    h("div", { class: "moldura3 build3" }, painelBuild(b)),
    botao3("azul", "voltar", "Voltar", fechar));
}

export function telaPausa(acoes: { continuar(): void; config(): void; desistir(): void }): HTMLElement {
  const planeta = urlArte("emblema_pausa") ?? urlArte("planeta");
  return h("div", { class: "overlay ov3" },
    h("div", { class: "pausa3-wrap" },
      h("div", { class: "pausa3-emblema" + (urlArte("emblema_pausa") ? " arte" : "") },
        h("span", { class: "pausa3-asa e" }), planeta ? h("img", { src: planeta, alt: "" }) : h("i"), h("span", { class: "pausa3-asa d" })),
      h("div", { class: "moldura3 pausa3" },
        h("div", { class: "pausa3-titulo" }, h("b", { text: "PAUSADO" })),
        botao3("laranja", "play", "Continuar", acoes.continuar),
        botao3("azul", "config", "Configurações", acoes.config),
        botao3("vermelho", "fechar", "Desistir", acoes.desistir))));
}

export function telaResultado(
  b: Battle,
  rec: Recompensa,
  acoes: {
    hub(): void; repetir(): void; proxima: (() => void) | null; reviver: (() => void) | null; cristais: number; custoReviver: number;
    dobrar?: (() => void) | null; semAnuncios?: boolean;
  },
): HTMLElement {
  const f = b.fim!;
  const inf = b.cfg.modo === "sobrevivencia";
  const est = h("div", { class: "estrelas" });
  for (let i = 1; i <= 3; i++) est.append(h("span", { class: i <= f.estrelas ? "" : "off", html: ic("estrela", "ic-estrela") }));
  const jornada = b.cfg.modo === "jornada";
  const titulo = inf ? "FIM DA LINHA" : jornada ? (f.vitoria ? "JORNADA COMPLETA" : `JORNADA: ${f.etapas}/${b.cfg.etapas?.length ?? 5} ETAPAS`) : f.vitoria ? "VITÓRIA" : "PLANETA PERDIDO";
  const linhas: HTMLElement[] = [
    h("div", { class: "titulo", style: `color:${f.vitoria ? "var(--ouro)" : inf ? "var(--ciano)" : "var(--vermelho)"}`, text: titulo }),
  ];
  if (!inf && !jornada) linhas.push(est);
  linhas.push(h("div", { class: "subtitulo", text: `${fmtTempo(f.tempo)} · ${fmtInt(f.abates)} abates · nível ${f.nivel}${rec.recorde ? " · NOVO RECORDE!" : ""}${rec.primeiraVez ? " · 1ª vitória!" : ""}` }));
  if (!f.vitoria && !inf && b.boss === null && !f.chefeDerrotado) {
    linhas.push(h("div", { class: "subtitulo", text: `Chegou a ${Math.min(100, Math.round((f.tempo / 280) * 100))}% da fase` }));
  }
  if (rec.pontos) {
    linhas.push(h("div", { class: "pontos-ganhos", html: `+${fmtInt(rec.pontos)} pontos${rec.novaPatente ? ` · ${ic("estrela", "ic-estrela")} Nova patente: <b>${rec.novaPatente}</b>` : ""}` }));
  }
  if (rec.perdaDesistencia || rec.perdaPontos) {
    linhas.push(h("div", { class: "penalidade", html: `${ic("alerta")} Penalidade por desistir: <b>-${fmtInt(rec.perdaDesistencia ?? 0)}</b> créditos · <b>-${fmtInt(rec.perdaPontos ?? 0)}</b> pontos · sem núcleos e chip` }));
  }
  linhas.push(
    h("div", { class: "recompensas" },
      h("span", { class: "moeda", html: `${ICONE_MOEDA.creditos} +${fmtInt(rec.creditos)}` }),
      rec.nucleos ? h("span", { class: "moeda", html: `${ICONE_MOEDA.nucleos} +${rec.nucleos}` }) : null),
  );
  if (rec.chip) {
    const c = rec.chip;
    linhas.push(
      h("div", { class: "chip", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]};width:min(94vw,320px)` },
        h("span", { class: "chip-ic", html: iconeImg(`chip_${c.set}`, "") }),
        h("b", { text: `Novo chip: ${CHIP_SET_MAP[c.set]?.nome} · ${CHIP_SLOT_NOME[c.slot]}` }),
        h("div", { text: formatStat(c.principal.stat, c.principal.valor) })),
    );
  }
  if (acoes.dobrar) {
    linhas.push(h("button", { class: "btn ouro btn-dobrar", html: `${ic("play")}<span>${acoes.semAnuncios ? "Dobrar recompensa (VIP)" : "Dobrar recompensa · assistir anúncio"}</span>`, onclick: acoes.dobrar }));
  }
  const painel = painelBuild(b);
  painel.style.maxHeight = "34vh";
  linhas.push(painel);
  const bts = h("div", { class: "linha" });
  if (acoes.reviver) {
    bts.append(h("button", { class: "btn ouro", disabled: acoes.cristais < acoes.custoReviver, html: `${ICONE_MOEDA.cristais} ${acoes.custoReviver} Reviver`, onclick: acoes.reviver }));
  }
  if (acoes.proxima) bts.append(h("button", { class: "btn primario", html: `<span>Próxima fase</span>${ic("play")}`, onclick: acoes.proxima }));
  bts.append(h("button", { class: "btn", html: icT("repetir", "Repetir"), onclick: acoes.repetir }));
  bts.append(h("button", { class: "btn ciano", html: icT("casa", "Base"), onclick: acoes.hub }));
  linhas.push(bts);
  return h("div", { class: "overlay", style: "justify-content:flex-start;overflow-y:auto" }, ...linhas);
}
