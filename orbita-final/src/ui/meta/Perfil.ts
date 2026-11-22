import { AVATARES, PATENTES, SKINS, ULTIMATES, type UltId } from "../../data/comandante";
import { STAGES } from "../../data/stages";
import { nuvem, type PerfilJogador } from "../../core/Nuvem";
import { audio } from "../../core/Audio";
import { fmtInt, fmtTempo, h, toast } from "../dom";
import { ic, icT } from "../Icones";
import { avatarComMoldura, insignia, nomeComandante, previaSkin } from "./Hub";
import { EMBLEMAS } from "./Cla";
import { abrirConversa } from "./Amigos";
import type { Nav } from "./Screens";

/** Deixa uma linha (ranking, clã, chat...) abrir o perfil do jogador ao tocar (botões dentro dela continuam funcionando). */
export function tocarParaPerfil<T extends HTMLElement>(el: T, nav: Nav, id: string | null | undefined): T {
  if (!id) return el;
  el.classList.add("clicavel");
  el.addEventListener("click", (ev) => {
    if ((ev.target as HTMLElement).closest("button, input, a") && (ev.target as HTMLElement).closest("button, input, a") !== el) return;
    abrirPerfil(nav, id);
  });
  return el;
}

function visto(iso: string | null): string {
  if (!iso) return "";
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 3) return "online agora";
  if (min < 60) return `visto há ${Math.round(min)} min`;
  if (min < 48 * 60) return `visto há ${Math.round(min / 60)} h`;
  return `visto há ${Math.round(min / 1440)} dias`;
}

/** Janela com tudo do jogador: patente, Passe Premium, clã, comandante, recordes, estatísticas e skins. */
export function abrirPerfil(nav: Nav, id: string): void {
  document.querySelector(".perfil-jogador")?.remove();
  const caixa = h("div", { class: "moldura3 perfil-caixa" }, h("div", { class: "rank-carregando", text: "Carregando perfil…" }));
  const fechar = () => el.remove();
  const el = h("div", { class: "overlay ov3 perfil-jogador", onclick: (e: MouseEvent) => { if (e.target === el) fechar(); } },
    caixa, h("button", { class: "bt3 azul perfil-fechar", html: `<span class="bt3-ic">${ic("fechar")}</span><span class="bt3-txt">Fechar</span>`, onclick: fechar }));
  el.style.zIndex = "70";
  nav.root.append(el);
  if (!nuvem.configurada) { caixa.replaceChildren(h("div", { class: "desc", text: "Perfis ficam disponíveis com o servidor ligado." })); return; }
  nuvem.perfilJogador(id).then((p) => {
    if (!p) { caixa.replaceChildren(h("div", { class: "desc", text: "Jogador não encontrado." })); return; }
    caixa.replaceChildren(...conteudo(nav, p, fechar));
  }).catch(() => caixa.replaceChildren(h("div", { class: "desc", text: "Não foi possível carregar o perfil agora." })));
}

function conteudo(nav: Nav, p: PerfilJogador, fechar: () => void): HTMLElement[] {
  const pf = p.perfil ?? {};
  const e = pf.e ?? {};
  const cmd = AVATARES.find((a) => a.id === p.avatar);
  const ult = pf.ult ? ULTIMATES[pf.ult as UltId] : null;
  const skin = (sid?: string) => (sid ? SKINS.find((k) => k.id === sid) : undefined);
  const possui = (pf.skins ?? []).map((sid) => skin(sid)).filter((k): k is NonNullable<typeof k> => !!k);
  const est = (icone: string, rotulo: string, valor: string) =>
    h("div", { class: "pj-est" }, h("span", { html: ic(icone) }), h("b", { text: valor }), h("small", { text: rotulo }));
  const out: HTMLElement[] = [];

  // topo: avatar, nome, patente
  out.push(h("div", { class: "pj-topo" + (p.elite ? " elite" : "") },
    avatarComMoldura(p.avatar, p.elite, "avatar grande"),
    h("div", { class: "pj-id" },
      nomeComandante(p.nome, p.elite, "div"),
      h("div", { class: "pj-patente" }, insignia(p.patente, "insignia micro"), h("span", { text: PATENTES[p.patente]?.nome ?? "" }), h("b", { text: `${fmtInt(p.pontos)} pts` })),
      h("small", { class: "pj-visto" + (visto(p.visto_em) === "online agora" ? " on" : ""), text: p.eu ? "Você" : visto(p.visto_em) }))));

  // Passe Premium
  out.push(p.elite
    ? h("div", { class: "pj-premium", html: `${ic("coroa")}<div><b>Passe Premium ativo</b><small>Comandante ELITE desta temporada</small></div>` })
    : h("div", { class: "pj-premium sem", html: `${ic("passe")}<div><b>Passe gratuito</b><small>Sem o Passe Premium nesta temporada</small></div>` }));

  // clã e comandante
  const linhas: HTMLElement[] = [];
  if (p.cla_nome) {
    const emb = EMBLEMAS[((p.cla_emblema ?? 1) - 1 + EMBLEMAS.length) % EMBLEMAS.length];
    linhas.push(h("div", { class: "pj-linha" }, h("span", { class: "cla-emblema", style: `--cor:${emb.cor}`, html: ic(emb.icone) }),
      h("div", null, h("b", { html: `${p.cla_nome.replace(/[<>&]/g, "")} <span class="cla-tag">[${(p.cla_tag ?? "").replace(/[<>&]/g, "")}]</span>` }),
        h("small", { text: { lider: "Líder do clã", oficial: "Oficial do clã", membro: "Membro do clã" }[p.cla_cargo ?? "membro"] ?? "Clã" }))));
  } else linhas.push(h("div", { class: "pj-linha" }, h("span", { class: "pj-ic", html: ic("grupo") }), h("div", null, h("b", { text: "Sem clã" }), h("small", { text: "Ainda não entrou em um clã" }))));
  if (cmd) {
    linhas.push(h("div", { class: "pj-linha" }, h("span", { class: "pj-ic", style: `color:${cmd.cor}`, html: ic(ult?.icone ?? "usuario") }),
      h("div", null, h("b", { text: cmd.nome ?? "Comandante" }), h("small", { text: ult ? `Ultimate: ${ult.nome}` : "Comandante em campo" }))));
  }
  out.push(h("div", { class: "pj-bloco" }, ...linhas));

  // recordes e progresso
  out.push(h("div", { class: "secao-titulo", text: "Progresso" }),
    h("div", { class: "pj-grade" },
      est("bandeira", "Fases vencidas", `${pf.fases ?? 0}/${STAGES.length}`),
      est("estrela", "Estrelas", fmtInt(p.estrelas)),
      est("coroa2", "Difícil", `${pf.fasesDificil ?? 0}/${STAGES.length}`),
      est("ampulheta", "Sobrevivência", p.sobrevivencia ? fmtTempo(p.sobrevivencia) : "—"),
      est("camadas", "Melhor jornada", p.jornada ? `${p.jornada}/5` : "—"),
      est("trofeu", "Melhor partida", e.melhorPartida ? `${fmtInt(e.melhorPartida)}` : "—")));
  out.push(h("div", { class: "secao-titulo", text: "Estatísticas" }),
    h("div", { class: "pj-grade" },
      est("espadas", "Partidas", fmtInt(e.partidas ?? 0)),
      est("mira", "Abates", fmtInt(e.abates ?? 0)),
      est("coroa2", "Chefes", fmtInt(e.chefes ?? 0)),
      est("evoluir", "Evoluções", fmtInt(e.evolucoes ?? 0)),
      est("camadas", "Jornadas", fmtInt(e.jornadas ?? 0)),
      est("calendario", "Desafios", fmtInt(e.diarios ?? 0))));

  // skins
  const emUso = [skin(pf.skinPlaneta), skin(pf.skinEscudo)].filter((k): k is NonNullable<typeof k> => !!k);
  out.push(h("div", { class: "secao-titulo", text: `Skins (${possui.length}/${SKINS.length})` }));
  if (emUso.length) {
    out.push(h("div", { class: "pj-skins-uso" }, ...emUso.map((k) => h("div", { class: "pj-skin uso" }, h("span", { html: previaSkin(k) }), h("small", { text: k.nome }), h("i", { text: "em uso" })))));
  }
  const outras = possui.filter((k) => !emUso.includes(k));
  if (outras.length) out.push(h("div", { class: "pj-skins" }, ...outras.map((k) => h("div", { class: "pj-skin" }, h("span", { html: previaSkin(k) }), h("small", { text: k.nome })))));

  // ações
  if (!p.eu && nuvem.logado()) {
    const acoes = h("div", { class: "pj-acoes" });
    if (p.amizade === "amigo") {
      acoes.append(h("button", { class: "btn ciano", html: icT("correio", "Conversar"), onclick: () => { fechar(); abrirConversa(nav, p); } }));
    } else if (p.amizade === "enviado") {
      acoes.append(h("div", { class: "desc", html: icT("check", "Pedido de amizade enviado") }));
    } else {
      const b = h("button", { class: "btn primario", html: icT("mais", p.amizade === "recebido" ? "Aceitar amizade" : "Adicionar amigo"), onclick: async () => {
        b.disabled = true;
        try {
          const r = await nuvem.pedirAmizade(p.id);
          audio.sfx("nivel");
          b.replaceWith(h("div", { class: "desc", html: icT("check", r === "aceito" ? "Vocês agora são amigos!" : "Pedido de amizade enviado") }));
        } catch (err) { b.disabled = false; toast(nav.root, (err as Error).message); }
      } });
      acoes.append(b);
    }
    out.push(acoes);
  }
  return out;
}
