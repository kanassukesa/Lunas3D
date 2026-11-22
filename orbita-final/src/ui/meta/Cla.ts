import { PATENTES, type Premio } from "../../data/comandante";
import { BOSSES } from "../../data/bosses";
import { hashString } from "../../core/Rng";
import { semanaStr } from "../../meta/Meta";
import { darPremio } from "../../meta/Comandante";
import { urlArte } from "../../render/Sprites";
import { celebrar } from "../Premio";
import { nuvem, type Cla, type ConviteCla, type JogadorBusca, type MembroCla, type MensagemCla } from "../../core/Nuvem";
import { audio } from "../../core/Audio";
import { fmtInt, h, ICONE_MOEDA, toast } from "../dom";
import { ic, icT } from "../Icones";
import { avatarComMoldura, barraInferior, insignia, nomeComandante } from "./Hub";
import { tela, type Nav } from "./Screens";
import { tocarParaPerfil } from "./Perfil";

/** Emblemas do clã (índice 1-8 no banco): ícone + cor. */
export const EMBLEMAS: { icone: string; cor: string }[] = [
  { icone: "escudo", cor: "#4fd6ff" },
  { icone: "coroa", cor: "#ffc23d" },
  { icone: "raio", cor: "#b36bff" },
  { icone: "estrela", cor: "#ffe07a" },
  { icone: "espadas", cor: "#ff5d72" },
  { icone: "sol", cor: "#ff9a3c" },
  { icone: "diamante", cor: "#7df9ff" },
  { icone: "bandeira", cor: "#49e07a" },
];

function emblema(n: number, classe = "cla-emblema"): HTMLElement {
  const e = EMBLEMAS[(n - 1 + EMBLEMAS.length) % EMBLEMAS.length];
  return h("span", { class: classe, style: `--cor:${e.cor}`, html: ic(e.icone) });
}

const CARGO_NOME = { lider: "Líder", oficial: "Oficial", membro: "Membro" } as const;
const MAX_MEMBROS = 30;
/** Preço para fundar um clã (diamantes = cristais do jogo). */
export const CUSTO_CLA = 50;

let aba: "membros" | "chat" | "chefe" | "ranking" = "membros";
let busca = "";
let chatTimer = 0;

function aviso(txt: string, icone = "alerta"): HTMLElement {
  return h("div", { class: "cartao desc rank-aviso" }, h("span", { html: ic(icone) }), h("span", { html: txt }));
}

/** Executa uma ação do clã com aviso de erro e recarrega a tela. */
async function acao(nav: Nav, fn: () => Promise<unknown>, ok?: string): Promise<boolean> {
  try {
    await fn();
    if (ok) toast(nav.root, ok);
    nav.ir("cla");
    return true;
  } catch (e) {
    toast(nav.root, (e as Error).message);
    return false;
  }
}

export function telaCla(nav: Nav): HTMLElement {
  clearInterval(chatTimer);
  const corpo = h("div", { class: "cla-corpo" });
  const el = tela(nav, "CLÃ", corpo);
  el.append(barraInferior(nav, "cla"));

  if (!nuvem.configurada) {
    corpo.append(aviso("O clã liga quando o servidor do jogo estiver ativo."));
    return el;
  }
  if (!nuvem.logado()) {
    corpo.append(
      h("div", { class: "cartao neon cla-intro" },
        emblema(1, "cla-emblema grande"),
        h("div", { class: "nome", text: "Entre num clã" }),
        h("div", { class: "desc", text: "Jogue junto com outros comandantes, converse no chat e suba no ranking de clãs. Para isso, entre com a sua conta." })),
      h("button", { class: "btn primario", html: icT("usuario", "Entrar ou criar conta"), onclick: () => nav.ir("entrada") }));
    return el;
  }
  if (!nav.save.perfil.nome) {
    corpo.append(aviso("Crie o seu comandante primeiro (nome de usuário) para entrar num clã.", "usuario"));
    return el;
  }

  corpo.append(h("div", { class: "rank-carregando", text: "Carregando clã…" }));
  nuvem.meuCla()
    .then((m) => {
      if (nav.telaAtual() !== "cla") return;
      corpo.replaceChildren(...(m ? meuClaView(nav, m.cla, m.posicao) : semClaView(nav)));
    })
    .catch((e) => corpo.replaceChildren(aviso(`Não foi possível carregar o clã agora. ${(e as Error).message}`)));
  return el;
}

// ------------------------------------------------------------------ sem clã: criar ou procurar

function semClaView(nav: Nav): HTMLElement[] {
  let emb = 1;
  const nome = h("input", { class: "campo", id: "cla-nome", maxlength: "16", placeholder: "Nome do clã (3 a 16 letras)" }) as HTMLInputElement;
  const tag = h("input", { class: "campo cla-tag-campo", id: "cla-tag", maxlength: "4", placeholder: "TAG" }) as HTMLInputElement;
  tag.addEventListener("input", () => { tag.value = tag.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
  const desc = h("input", { class: "campo", id: "cla-desc", maxlength: "80", placeholder: "Frase do clã (opcional)" }) as HTMLInputElement;
  const escolha = h("div", { class: "cla-emblemas" });
  const pintar = () => escolha.replaceChildren(...EMBLEMAS.map((_, i) =>
    h("button", { class: "cla-emb-op" + (emb === i + 1 ? " ativo" : ""), "aria-label": `Emblema ${i + 1}`, onclick: () => { emb = i + 1; pintar(); } }, emblema(i + 1))));
  pintar();
  const criar = h("div", { class: "cartao neon cla-criar" },
    h("div", { class: "nome", html: icT("mais", "Criar um clã") }),
    h("div", { class: "cla-nome-linha" }, h("div", { class: "campo-linha" }, nome), h("div", { class: "campo-linha cla-tag-linha" }, tag)),
    h("div", { class: "campo-linha" }, desc),
    h("small", { class: "desc", text: "Emblema" }), escolha,
    h("button", { class: "btn primario", html: `${ic("check")}<span>Criar clã · ${ICONE_MOEDA.cristais} ${CUSTO_CLA}</span>`, onclick: async () => {
      const n = nome.value.trim(), t = tag.value.trim();
      if (n.length < 3) { toast(nav.root, "O nome precisa ter pelo menos 3 letras."); return; }
      if (t.length < 2) { toast(nav.root, "A tag precisa ter de 2 a 4 letras ou números."); return; }
      if (nav.save.cristais < CUSTO_CLA) { toast(nav.root, `Faltam ${CUSTO_CLA - nav.save.cristais} diamantes para criar um clã.`); return; }
      try {
        await nuvem.criarCla(n, t, desc.value.trim(), emb);
        nav.save.cristais -= CUSTO_CLA;  // só cobra depois que o servidor criou
        nav.persistir();
        audio.sfx("vitoria");
        toast(nav.root, `Clã ${n} criado! Você é o líder. Convide jogadores na aba Membros.`);
        nav.ir("cla");
      } catch (e) { toast(nav.root, (e as Error).message); }
    } }),
    h("small", { class: "desc", text: `Seus diamantes: ${fmtInt(nav.save.cristais)}. O clã nasce fechado: só entra quem você convidar (dá para abrir depois).` }));

  const lista = h("div", { class: "rank-lista" }, h("div", { class: "rank-carregando", text: "Procurando clãs…" }));
  const campoBusca = h("input", { class: "campo", id: "cla-busca", placeholder: "Buscar por nome ou tag", value: busca }) as HTMLInputElement;
  const carregar = () => {
    nuvem.listarClas(busca)
      .then((cs) => lista.replaceChildren(...(cs.length ? cs.map((c, i) => linhaCla(nav, c, i + 1, true)) : [aviso("Nenhum clã encontrado. Crie o primeiro!")])))
      .catch(() => lista.replaceChildren(aviso("Não foi possível carregar os clãs agora.")));
  };
  let t = 0;
  campoBusca.addEventListener("input", () => { clearTimeout(t); t = window.setTimeout(() => { busca = campoBusca.value; carregar(); }, 400); });
  carregar();
  const convites = h("div", { class: "cla-convites" });
  nuvem.meusConvites().then((cs) => {
    if (!cs.length) return;
    convites.replaceChildren(h("div", { class: "secao-titulo", text: `Convites para você (${cs.length})` }), ...cs.map((c) => linhaConvite(nav, c)));
  }).catch(() => {});
  return [
    convites,
    h("div", { class: "cartao neon cla-intro" }, emblema(1, "cla-emblema grande"),
      h("div", { class: "nome", text: "Você ainda não tem clã" }),
      h("div", { class: "desc", text: "Crie o seu ou entre num clã aberto. Os pontos de todos os membros somam no ranking de clãs." })),
    criar,
    h("div", { class: "secao-titulo", text: "Clãs para entrar" }),
    h("div", { class: "campo-linha" }, campoBusca),
    lista,
  ];
}

function linhaConvite(nav: Nav, c: ConviteCla): HTMLElement {
  return h("div", { class: "rank-linha cla-linha cla-convite" },
    emblema(c.emblema),
    h("div", { class: "rank-nome" }, h("b", { html: `${esc(c.nome)} <span class="cla-tag">[${esc(c.tag)}]</span>` }),
      h("small", { text: `Convite de ${c.de_nome} · ${c.membros}/${MAX_MEMBROS} membros` })),
    h("div", { class: "cla-acoes" },
      h("button", { class: "btn ciano pequeno", text: "Aceitar", onclick: async () => {
        if (await acao(nav, () => nuvem.aceitarConvite(c.id), `Bem-vindo ao clã ${c.nome}!`)) audio.sfx("nivel");
      } }),
      h("button", { class: "btn pequeno", "aria-label": "Recusar", html: ic("fechar"), onclick: () => acao(nav, () => nuvem.recusarConvite(c.id), "Convite recusado.") })));
}

function linhaCla(nav: Nav, c: Cla, pos: number, comBotao: boolean): HTMLElement {
  const cheio = c.membros >= MAX_MEMBROS;
  return h("div", { class: "rank-linha cla-linha" + (c.meu ? " eu" : "") + (pos <= 3 ? ` top${pos}` : "") },
    h("span", { class: "rank-pos", text: String(pos) }),
    emblema(c.emblema),
    h("div", { class: "rank-nome" }, h("b", { html: `${esc(c.nome)} <span class="cla-tag">[${esc(c.tag)}]</span>` }),
      h("small", { text: `${c.membros}/${MAX_MEMBROS} membros${c.descricao ? " · " + c.descricao : ""}` })),
    h("div", { class: "cla-linha-dir" }, h("b", { class: "rank-val", text: fmtInt(c.pontos) }),
      comBotao ? (c.aberto && !cheio
        ? h("button", { class: "btn ciano pequeno", text: "Entrar", onclick: () => acao(nav, () => nuvem.entrarCla(c.id), `Bem-vindo ao clã ${c.nome}!`) })
        : h("small", { class: "desc", text: cheio ? "Cheio" : "Só convite" })) : null));
}

function esc(t: string): string {
  return t.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}

// ------------------------------------------------------------------ com clã: membros, chat, ranking

function meuClaView(nav: Nav, c: Cla, posicao: number): HTMLElement[] {
  const topo = h("div", { class: "cartao neon cla-topo", style: `--cor:${EMBLEMAS[(c.emblema - 1) % 8].cor}` },
    emblema(c.emblema, "cla-emblema grande"),
    h("div", { class: "cla-topo-txt" },
      h("div", { class: "cla-topo-nome", html: `${esc(c.nome)} <span class="cla-tag">[${esc(c.tag)}]</span>` }),
      c.descricao ? h("div", { class: "desc", text: c.descricao }) : null,
      h("div", { class: "cla-numeros" },
        h("span", { html: `${ic("grupo")} <b>${c.membros}/${MAX_MEMBROS}</b>` }),
        h("span", { html: `${ic("estrela", "ic ic-ouro")} <b>${fmtInt(c.pontos)}</b> pts` }),
        h("span", { html: `${ic("ranking")} <b>#${posicao}</b>` }),
        h("span", { class: "cla-estado", html: c.aberto ? `${ic("grupo")} Aberto` : `${ic("cadeado")} Só convite` }))));
  const abas = h("div", { class: "abas-rank cla-abas" }, ...([["membros", "grupo", "Membros"], ["chat", "correio", "Chat"], ["chefe", "espadas", "Chefe"], ["ranking", "ranking", "Clãs"]] as const).map(([id, icone, nome]) =>
    h("button", { class: "aba-rank" + (aba === id ? " ativa" : ""), onclick: () => { aba = id; nav.ir("cla"); } }, h("span", { html: ic(icone) }), h("small", { text: nome }))));
  const conteudo = h("div", { class: "cla-conteudo" }, h("div", { class: "rank-carregando", text: "Carregando…" }));
  if (aba === "membros") abaMembros(nav, conteudo, c);
  else if (aba === "chat") abaChat(nav, conteudo);
  else if (aba === "chefe") abaChefe(nav, conteudo);
  else abaRanking(nav, conteudo);
  const sair = h("button", { class: "btn pequeno cla-sair", html: icT("sair", "Sair do clã"), onclick: () => {
    if (sair.dataset.confirma) { void acao(nav, () => nuvem.sairCla(), "Você saiu do clã."); return; }
    sair.dataset.confirma = "1";
    sair.innerHTML = icT("alerta", "Toque de novo para sair");
    setTimeout(() => { delete sair.dataset.confirma; sair.innerHTML = icT("sair", "Sair do clã"); }, 3000);
  } });
  return [topo, abas, conteudo, sair];
}

function abaMembros(nav: Nav, alvo: HTMLElement, cla: Cla): void {
  nuvem.membrosCla().then((ms) => {
    const eu = ms.find((m) => m.eu);
    const manda = eu && eu.cargo !== "membro";
    const linha = (m: MembroCla, pos: number) => {
      const podeExpulsar = eu && !m.eu && m.cargo !== "lider" && (eu.cargo === "lider" || (eu.cargo === "oficial" && m.cargo === "membro"));
      const podePromover = eu?.cargo === "lider" && !m.eu;
      return tocarParaPerfil(h("div", { class: "rank-linha" + (m.eu ? " eu" : "") + (m.elite ? " elite" : "") },
        h("span", { class: "rank-pos", text: String(pos) }),
        avatarComMoldura(m.avatar, m.elite),
        h("div", { class: "rank-nome" }, nomeComandante(m.nome, m.elite),
          h("small", null, insignia(m.patente, "insignia micro"), h("span", { text: PATENTES[m.patente]?.nome ?? "" }))),
        h("div", { class: "cla-linha-dir" },
          h("span", { class: "cla-cargo " + m.cargo, text: CARGO_NOME[m.cargo] }),
          h("b", { class: "rank-val", text: fmtInt(m.pontos) }),
          podePromover || podeExpulsar ? h("div", { class: "cla-acoes" },
            podePromover ? h("button", { class: "btn pequeno", "aria-label": "Promover", html: ic(m.cargo === "oficial" ? "voltar" : "evoluir"),
              onclick: () => acao(nav, () => nuvem.alternarOficial(m.id), m.cargo === "oficial" ? `${m.nome} voltou a membro.` : `${m.nome} agora é oficial.`) }) : null,
            podeExpulsar ? h("button", { class: "btn pequeno", "aria-label": "Expulsar", style: "color:var(--vermelho)", html: ic("fechar"),
              onclick: () => acao(nav, () => nuvem.expulsar(m.id), `${m.nome} foi expulso.`) }) : null) : null)), nav, m.id);
    };
    const extras: HTMLElement[] = [];
    if (manda) extras.push(caixaConvidar(nav));
    if (eu?.cargo === "lider") extras.push(h("button", { class: "btn pequeno cla-abrir", html: cla.aberto ? icT("cadeado", "Fechar: só por convite") : icT("grupo", "Abrir para qualquer um entrar"),
        onclick: () => acao(nav, () => nuvem.editarCla(cla.descricao, !cla.aberto), cla.aberto ? "Agora só entra por convite." : "Clã aberto: qualquer um pode entrar.") }));
    alvo.replaceChildren(...extras, h("div", { class: "rank-lista" }, ...ms.map((m, i) => linha(m, i + 1))));
  }).catch(() => alvo.replaceChildren(aviso("Não foi possível carregar os membros.")));
}

/** Líder/oficial procura um comandante pelo nome e manda o convite (o jogador vê na tela do clã). */
function caixaConvidar(nav: Nav): HTMLElement {
  const campo = h("input", { class: "campo", id: "cla-convidar", maxlength: "14", placeholder: "Nome do comandante", autocomplete: "off" }) as HTMLInputElement;
  const res = h("div", { class: "cla-busca-res" });
  const linha = (j: JogadorBusca) => tocarParaPerfil(h("div", { class: "rank-linha" },
    avatarComMoldura(j.avatar, !!j.elite),
    h("div", { class: "rank-nome" }, nomeComandante(j.nome, !!j.elite),
      h("small", null, insignia(j.patente, "insignia micro"), h("span", { text: `${PATENTES[j.patente]?.nome ?? ""} · ${fmtInt(j.pontos)} pts` }))),
    j.tem_cla ? h("small", { class: "desc", text: "Já tem clã" })
      : j.convidado ? h("small", { class: "desc", html: icT("check", "Convidado") })
      : h("button", { class: "btn ciano pequeno", text: "Convidar", onclick: async (ev: MouseEvent) => {
        const b = ev.currentTarget as HTMLButtonElement;
        b.disabled = true;
        try { await nuvem.convidar(j.id); b.replaceWith(h("small", { class: "desc", html: icT("check", "Convidado") })); toast(nav.root, `Convite enviado para ${j.nome}!`); }
        catch (e) { b.disabled = false; toast(nav.root, (e as Error).message); }
      } })), nav, j.id);
  let t = 0;
  campo.addEventListener("input", () => {
    clearTimeout(t);
    const v = campo.value.trim();
    if (v.length < 2) { res.replaceChildren(); return; }
    t = window.setTimeout(() => {
      nuvem.buscarJogadores(v)
        .then((js) => res.replaceChildren(...(js.length ? js.map(linha) : [h("div", { class: "desc", text: "Nenhum comandante com esse nome." })])))
        .catch(() => res.replaceChildren(h("div", { class: "desc", text: "Não foi possível buscar agora." })));
    }, 400);
  });
  return h("div", { class: "cartao cla-convidar" },
    h("div", { class: "nome", html: icT("mais", "Convidar jogador") }),
    h("div", { class: "campo-linha" }, campo), res);
}

function abaChat(nav: Nav, alvo: HTMLElement): void {
  const lista = h("div", { class: "cla-chat-lista" });
  const campo = h("input", { class: "campo", id: "cla-msg", maxlength: "200", placeholder: "Mensagem para o clã", autocomplete: "off" }) as HTMLInputElement;
  let ultimo = -1;
  const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const atualizar = () => nuvem.chatCla().then((ms: MensagemCla[]) => {
    const fim = ms.at(-1)?.id ?? 0;
    if (fim === ultimo) return;
    ultimo = fim;
    lista.replaceChildren(...(ms.length ? ms.map((m) => h("div", { class: "cla-msg" + (m.eu ? " eu" : "") },
      h("small", { text: `${m.eu ? "Você" : m.nome} · ${hora(m.criado_em)}` }), h("span", { text: m.texto })))
      : [h("div", { class: "desc", text: "Nenhuma mensagem ainda. Diga oi para o clã!" })]));
    lista.scrollTop = lista.scrollHeight;
  }).catch(() => {});
  const enviar = async () => {
    const t = campo.value.trim();
    if (!t) return;
    campo.value = "";
    try { await nuvem.enviarChat(t); await atualizar(); } catch (e) { toast(nav.root, (e as Error).message); campo.value = t; }
  };
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") void enviar(); });
  alvo.replaceChildren(lista, h("div", { class: "cla-chat-envio" }, h("div", { class: "campo-linha" }, campo), h("button", { class: "btn ciano", "aria-label": "Enviar", html: ic("play"), onclick: enviar })));
  void atualizar();
  // novas mensagens a cada 5 s enquanto o chat estiver aberto
  chatTimer = window.setInterval(() => {
    if (nav.telaAtual() !== "cla" || aba !== "chat" || !alvo.isConnected) { clearInterval(chatTimer); return; }
    void atualizar();
  }, 5000);
}

// ------------------------------------------------------------------ Chefe do Clã (raid semanal)

/** Prêmio de quem ajudou a derrubar o chefe (top 3 de dano ganha diamantes extras). */
export function premioRaid(posicao: number): Premio {
  const extra = posicao === 1 ? 20 : posicao <= 3 ? 10 : 0;
  return { creditos: 2000, nucleos: 10, cristais: 20 + extra };
}

/** Chefe da semana: um dos chefes da campanha, sorteado pela semana (igual para todos os clãs). */
export function chefeDaSemana(semana = semanaStr()): { id: string; nome: string } {
  const ids = Object.keys(BOSSES);
  const id = ids[hashString("raid-" + semana) % ids.length];
  return { id, nome: BOSSES[id].nome };
}

function abaChefe(nav: Nav, alvo: HTMLElement): void {
  const semana = semanaStr();
  const chefe = chefeDaSemana(semana);
  const segunda = new Date();
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(segunda.getDate() + (((8 - segunda.getDay()) % 7) || 7));
  const dias = Math.max(0, Math.ceil((segunda.getTime() - Date.now()) / 864e5));
  nuvem.raidDoCla(semana).then((ls) => {
    const base = ls[0];
    const vida = Number(base?.vida ?? 0);
    const dano = Math.min(vida, Number(base?.dano ?? 0));
    const derrotado = !!base?.derrotado;
    const membros = ls.filter((l) => l.membro && Number(l.dano_membro) > 0);
    const eu = membros.find((l) => l.eu);
    const arte = urlArte(`chefe_${chefe.id}`);
    const frac = vida ? 1 - dano / vida : 1;
    const premio = premioRaid(99);  // prêmio base (sem o bônus de top 3)
    const cartao = h("div", { class: "cartao neon raid-cartao" + (derrotado ? " derrotado" : "") },
      h("div", { class: "raid-topo" },
        arte ? h("img", { class: "raid-arte", src: arte, alt: chefe.nome }) : h("span", { class: "raid-arte", html: ic("espadas") }),
        h("div", { class: "raid-txt" },
          h("small", { text: `CHEFE DA SEMANA · termina em ${dias} dia${dias === 1 ? "" : "s"}` }),
          h("b", { text: chefe.nome }),
          h("div", { class: "raid-barra" }, h("i", { style: `width:${Math.max(0, frac * 100).toFixed(1)}%` }),
            h("span", { text: derrotado ? "DERROTADO!" : `${fmtInt(vida - dano)} / ${fmtInt(vida)}` })))),
      h("p", { class: "desc", text: derrotado
        ? "O clã derrubou o chefe desta semana! Quem causou dano ganha o prêmio."
        : "Todo dano que as suas sentinelas causam nas partidas soma contra o chefe. Derrubem juntos até segunda-feira!" }),
      h("div", { class: "raid-premio", html: `Prêmio: ${ICONE_MOEDA.cristais} ${premio.cristais} · ${ICONE_MOEDA.creditos} ${fmtInt(premio.creditos!)} · ${ICONE_MOEDA.nucleos} ${premio.nucleos} <small>(top 1: +20 💎, top 3: +10 💎)</small>` }));
    if (derrotado && eu && !eu.premio_pego) {
      cartao.append(h("button", { class: "btn ouro", html: icT("presente", "Resgatar prêmio"), onclick: async (ev: MouseEvent) => {
        const o = (ev.currentTarget as HTMLElement).getBoundingClientRect();
        try {
          const pos = await nuvem.resgatarRaid(semana);
          const p = premioRaid(pos);
          darPremio(nav.save, p);
          nav.persistir();
          nav.ir("cla");
          celebrar(nav.root, o, p, null, `CHEFE DO CLÃ · ${pos}º EM DANO`);
        } catch (e) { toast(nav.root, (e as Error).message); }
      } }));
    } else if (derrotado && eu?.premio_pego) {
      cartao.append(h("div", { class: "desc", html: icT("check", "Prêmio resgatado. Volte na segunda para o próximo chefe!") }));
    } else if (derrotado && !eu) {
      cartao.append(h("div", { class: "desc", text: "Você não causou dano neste chefe, então ficou sem o prêmio desta vez." }));
    }
    const lista = h("div", { class: "rank-lista" }, ...(membros.length ? membros.map((l, i) =>
      tocarParaPerfil(h("div", { class: "rank-linha" + (l.eu ? " eu" : "") + (i < 3 ? ` top${i + 1}` : "") },
        h("span", { class: "rank-pos", text: String(i + 1) }),
        avatarComMoldura(l.avatar, !!l.elite),
        h("div", { class: "rank-nome" }, nomeComandante(l.nome, !!l.elite), h("small", { text: `${(Number(l.dano_membro) / Math.max(1, dano) * 100).toFixed(0)}% do dano` })),
        h("b", { class: "rank-val", text: fmtInt(Number(l.dano_membro)) })), nav, l.membro))
      : [aviso("Ninguém atacou ainda. Jogue uma partida para causar o primeiro dano!", "espadas")]));
    alvo.replaceChildren(cartao, h("div", { class: "secao-titulo", text: "Dano dos membros" }), lista);
  }).catch(() => alvo.replaceChildren(aviso("Não foi possível carregar o chefe do clã agora.")));
}

function abaRanking(nav: Nav, alvo: HTMLElement): void {
  nuvem.listarClas().then((cs) => {
    alvo.replaceChildren(h("div", { class: "rank-lista" }, ...(cs.length ? cs.map((c, i) => linhaCla(nav, c, i + 1, false)) : [aviso("Nenhum clã ainda.")])));
  }).catch(() => alvo.replaceChildren(aviso("Não foi possível carregar o ranking de clãs.")));
}
