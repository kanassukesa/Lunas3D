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
import { arteSentinela } from "./CardArt";
import { audio } from "../core/Audio";
import { fogosDeArtificio } from "./Fogos";

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
  const mvp = b.sentinels.length > 1 ? b.sentinels.reduce((m, s) => (s.danoCausado > m.danoCausado ? s : m)) : null;
  for (const s of b.sentinels) {
    const destaque = mvp === s && s.danoCausado > 0;
    const pips = h("span", { class: "pips" });
    for (let k = 1; k <= 5; k++) pips.append(h("i", { class: k <= s.nivel ? "on" : "" }));
    p.append(
      h("div", { class: "sent-linha" + (destaque ? " mvp" : "") },
        // arte da arma (torre vista de cima), com a cor dela no contorno
        h("span", { class: "sent-arte" + (s.evoluido ? " evo" : ""), style: `--cor:${hex(s.def.cor)}` },
          h("img", { src: urlArte(`sentinela_${s.def.id}`) ?? arteSentinela(s.def.id, s.evoluido), alt: s.def.nome })),
        h("div", { style: "flex:1" },
          h("div", { style: "font-weight:800", html: s.evoluido ? `${ic("coroa", "ic ic-ouro")} ${s.def.evolucao.nome}` : s.def.nome }, pips),
          h("div", { style: "font-size:12px;color:var(--texto2)", text: `Dano ${fmtInt(s.stats.dano)} · ${s.stats.cadencia.toFixed(2)}/s · crít ${(s.stats.critChance * 100).toFixed(0)}%` }),
          evolucaoTexto(b, s.def.id)),
        h("div", { class: "sent-dano" }, destaque ? h("span", { class: "tag-mvp", text: "MVP" }) : null,
          h("b", { text: `${Math.round((s.danoCausado / total) * 100)}%` }),
          h("i", { class: "sent-dano-barra" }, h("i", { style: `width:${Math.round((s.danoCausado / total) * 100)}%` })))),
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
export function faixaTitulo(texto: string, extra?: HTMLElement | null, variante: "titulo" | "nivel" = "titulo"): HTMLElement {
  const arte = urlArte(`faixa_${variante}`);
  if (arte) {
    // arte pronta: placa com asas (o texto vai por cima da placa do meio)
    return h("div", { class: `faixa4 ${variante}`, style: `background-image:url('${arte}')` }, h("div", { class: "faixa4-txt" }, h("b", { text: texto }), extra ?? null));
  }
  return h("div", { class: "faixa3" }, h("span", { class: "faixa3-asa e" }), h("div", { class: "faixa3-placa" }, h("b", { text: texto }), extra ?? null), h("span", { class: "faixa3-asa d" }));
}

/** Janela "Teve atualização!" com o resumo do que mudou. */
export function telaNovidades(n: { versao: string; titulo: string; itens: string[] }, fechar: () => void): HTMLElement {
  return h("div", { class: "overlay ov3 novidades" },
    faixaTitulo("ATUALIZAÇÃO"),
    h("div", { class: "moldura3 novidades-painel" },
      h("div", { class: "novidades-cab" }, h("b", { text: n.titulo }), h("small", { text: `Versão ${n.versao}` })),
      h("ul", { class: "novidades-lista" }, ...n.itens.map((t) => h("li", null, h("span", { html: ic("check") }), h("span", { text: t }))))),
    botao3("laranja", "play", "Bora jogar!", fechar));
}

/** Fundo de tela (arte) atrás de um overlay, com escurecimento para o painel ler bem. */
export function comFundo(el: HTMLElement, nome: string): HTMLElement {
  const u = urlArte(nome);
  if (u) {
    el.classList.add("ov-fundo");
    el.style.setProperty("--fundo", `url('${u}')`);
  }
  return el;
}

/** Botão chanfrado grande (laranja / azul / vermelho / ouro). */
export function botao3(cor: "laranja" | "azul" | "vermelho" | "ouro", icone: string, texto: string, onclick: () => void): HTMLElement {
  return h("button", { class: "bt3 " + cor, onclick }, h("span", { class: "bt3-ic", html: ic(icone) }), h("span", { class: "bt3-txt", text: texto }));
}

export function telaBuild(b: Battle, fechar: () => void): HTMLElement {
  return comFundo(h("div", { class: "overlay ov3" },
    faixaTitulo("BUILD"),
    h("div", { class: "moldura3 build3" }, painelBuild(b)),
    botao3("azul", "voltar", "Voltar", fechar)), "fundo_build");
}

export function telaPausa(acoes: { continuar(): void; build(): void; config(): void; desistir: (() => void) | null }): HTMLElement {
  const planeta = urlArte("emblema_pausa") ?? urlArte("planeta");
  return comFundo(h("div", { class: "overlay ov3" },
    h("div", { class: "pausa3-wrap" },
      h("div", { class: "pausa3-emblema" + (urlArte("emblema_pausa") ? " arte" : "") },
        h("span", { class: "pausa3-asa e" }), planeta ? h("img", { src: planeta, alt: "" }) : h("i"), h("span", { class: "pausa3-asa d" })),
      h("div", { class: "moldura3 pausa3" },
        h("div", { class: "pausa3-titulo" }, h("b", { text: "PAUSADO" })),
        botao3("laranja", "play", "Continuar", acoes.continuar),
        botao3("azul", "cartas", "Ver build", acoes.build),
        botao3("azul", "config", "Configurações", acoes.config),
        acoes.desistir ? botao3("vermelho", "fechar", "Desistir", acoes.desistir) : h("small", { class: "pausa3-nota", text: "Tutorial: não dá para desistir desta partida." })))), "fundo_pausa");
}

export function telaResultado(
  b: Battle,
  rec: Recompensa,
  acoes: {
    hub(): void; repetir: (() => void) | null; proxima: (() => void) | null; reviver: (() => void) | null; cristais: number; custoReviver: number;
    dobrar?: (() => void) | null; semAnuncios?: boolean;
  },
): HTMLElement {
  const f = b.fim!;
  const inf = b.cfg.modo === "sobrevivencia";
  const est = h("div", { class: "estrelas" });
  // estrelas: as conquistadas acendem uma por vez (com som); as que faltaram ficam apagadas
  for (let i = 1; i <= 3; i++) {
    const ganhou = i <= f.estrelas;
    const arteEst = urlArte(ganhou ? "estrela_cheia" : "estrela_vazia");
    const el = h("span", { class: "est3" + (ganhou ? " ganhou" : " vazia"), style: `animation-delay:${0.35 + (i - 1) * 0.38}s`,
      html: arteEst ? `<img class="ic-estrela arte" src="${arteEst}" alt="">` : ic("estrela", "ic-estrela" + (ganhou ? "" : " off")) });
    est.append(el);
    if (ganhou) setTimeout(() => audio.sfx("nivel"), 350 + (i - 1) * 380);
  }
  const jornada = b.cfg.modo === "jornada";
  const titulo = inf ? "FIM DA LINHA" : jornada ? (f.vitoria ? "JORNADA COMPLETA" : `JORNADA: ${f.etapas}/${b.cfg.etapas?.length ?? 5} ETAPAS`) : f.vitoria ? "VITÓRIA" : "PLANETA PERDIDO";
  const emblema = urlArte(f.vitoria || inf ? "emblema_vitoria" : "emblema_derrota");
  const linhas: HTMLElement[] = [];
  if (emblema) linhas.push(h("img", { class: "res-emblema", src: emblema, alt: "" }));
  linhas.push(h("div", { class: "titulo res-titulo", style: `color:${f.vitoria ? "var(--ouro)" : inf ? "var(--ciano)" : "var(--vermelho)"}`, text: titulo }));
  if (!inf && !jornada) linhas.push(est);
  const dano = b.sentinels.reduce((a, s) => a + s.danoCausado, 0);
  const estat = (icone: string, reserva: string, valor: string, rotulo: string) =>
    h("div", { class: "res-est" }, h("span", { class: "res-est-ic", html: iconeImg(icone, ic(reserva), "res-ic") }), h("b", { text: valor }), h("small", { text: rotulo }));
  linhas.push(h("div", { class: "res-estats" },
    estat("icone_tempo", "relogio", fmtTempo(f.tempo), "Tempo"),
    estat("icone_abates", "mira", fmtInt(f.abates), "Abates"),
    estat("icone_nivel", "evoluir", String(f.nivel), "Nível"),
    estat("icone_dano", "bomba", fmtInt(Math.round(dano)), "Dano")));
  if (rec.recorde || rec.primeiraVez) {
    linhas.push(h("div", { class: "subtitulo res-destaque", text: [rec.recorde ? "NOVO RECORDE!" : "", rec.primeiraVez ? "1ª vitória!" : ""].filter(Boolean).join(" · ") }));
  }
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
  linhas.push(painel);
  const bts = h("div", { class: "linha" });
  if (acoes.reviver) {
    bts.append(h("button", { class: "btn ouro", disabled: acoes.cristais < acoes.custoReviver, html: `${ICONE_MOEDA.cristais} ${acoes.custoReviver} Reviver`, onclick: acoes.reviver }));
  }
  if (acoes.proxima) bts.append(h("button", { class: "btn primario", html: `<span>Próxima fase</span>${ic("play")}`, onclick: acoes.proxima }));
  if (acoes.repetir) bts.append(h("button", { class: "btn", html: icT("repetir", "Repetir"), onclick: acoes.repetir }));
  bts.append(h("button", { class: "btn ciano", html: acoes.repetir ? icT("casa", "Base") : icT("play", "Continuar"), onclick: acoes.hub }));
  linhas.push(bts);
  const tela = comFundo(h("div", { class: "overlay resultado", style: "justify-content:flex-start;overflow-y:auto" }, ...linhas), f.vitoria || inf ? "fundo_vitoria" : "fundo_derrota");
  // vitória: fogos de artifício animados no fundo
  if (f.vitoria) tela.prepend(fogosDeArtificio());
  return tela;
}
