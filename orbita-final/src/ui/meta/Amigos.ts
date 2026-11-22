import { PATENTES } from "../../data/comandante";
import { nuvem, type Amigo, type ComandanteBusca, type MensagemGlobal, type MensagemPrivada } from "../../core/Nuvem";
import { audio } from "../../core/Audio";
import { fmtInt, h, toast } from "../dom";
import { ic, icT } from "../Icones";
import { avatarComMoldura, insignia, nomeComandante } from "./Hub";
import { tela, type Nav } from "./Screens";

/** Amigo aberto na conversa (tela "conversa"). */
let conversaCom: Amigo | null = null;
let conversaTimer = 0;
let abaSocial: "amigos" | "global" = "amigos";
const denunciadas = new Set<number>();

function aviso(txt: string, icone = "alerta"): HTMLElement {
  return h("div", { class: "cartao desc rank-aviso" }, h("span", { html: ic(icone) }), h("span", { html: txt }));
}

/** "online agora" (até 3 min), "visto há 2 h", "visto há 3 dias". */
function visto(iso: string): { txt: string; online: boolean } {
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 3) return { txt: "online agora", online: true };
  if (min < 60) return { txt: `visto há ${Math.round(min)} min`, online: false };
  if (min < 48 * 60) return { txt: `visto há ${Math.round(min / 60)} h`, online: false };
  return { txt: `visto há ${Math.round(min / 1440)} dias`, online: false };
}

function cabecalho(nome: string, avatarN: number, patente: number, extra: string): HTMLElement[] {
  return [
    avatarComMoldura(avatarN, false),
    h("div", { class: "rank-nome" }, nomeComandante(nome, false),
      h("small", null, insignia(patente, "insignia micro"), h("span", { text: extra }))),
  ];
}

export function telaAmigos(nav: Nav): HTMLElement {
  clearInterval(conversaTimer);
  const corpo = h("div", { class: "amigos-corpo" });
  const el = tela(nav, "AMIGOS", corpo);
  if (!nuvem.configurada) { corpo.append(aviso("Os amigos ligam quando o servidor do jogo estiver ativo.")); return el; }
  if (!nuvem.logado()) {
    corpo.append(aviso("Entre na sua conta para adicionar amigos e conversar.", "usuario"),
      h("button", { class: "btn primario", html: icT("usuario", "Entrar ou criar conta"), onclick: () => nav.ir("entrada") }));
    return el;
  }
  if (!nav.save.perfil.nome) { corpo.append(aviso("Crie o seu comandante primeiro.", "usuario")); return el; }

  // abas: Amigos | Chat global
  corpo.append(h("div", { class: "abas-rank cla-abas" }, ...([["amigos", "grupo", "Amigos"], ["global", "correio", "Chat global"]] as const).map(([id, icone, nome]) =>
    h("button", { class: "aba-rank" + (abaSocial === id ? " ativa" : ""), onclick: () => { abaSocial = id; nav.ir("amigos"); } }, h("span", { html: ic(icone) }), h("small", { text: nome })))));
  if (abaSocial === "global") { corpo.append(...chatGlobal(nav)); return el; }

  // ---- adicionar amigo (busca pelo nome do comandante)
  const campo = h("input", { class: "campo", id: "amigo-busca", maxlength: "14", placeholder: "Nome do comandante", autocomplete: "off" }) as HTMLInputElement;
  const res = h("div", { class: "rank-lista" });
  const linhaBusca = (c: ComandanteBusca) => h("div", { class: "rank-linha" }, ...cabecalho(c.nome, c.avatar, c.patente, `${PATENTES[c.patente]?.nome ?? ""} · ${fmtInt(c.pontos)} pts`),
    c.amizade === "amigo" ? h("small", { class: "desc", html: icT("check", "Amigo") })
      : c.amizade === "enviado" ? h("small", { class: "desc", text: "Pedido enviado" })
      : h("button", { class: "btn ciano pequeno", text: c.amizade === "recebido" ? "Aceitar" : "Adicionar", onclick: async (ev: MouseEvent) => {
        const b = ev.currentTarget as HTMLButtonElement;
        b.disabled = true;
        try {
          const r = await nuvem.pedirAmizade(c.id);
          b.replaceWith(h("small", { class: "desc", html: r === "aceito" ? icT("check", "Amigo") : "Pedido enviado" }));
          toast(nav.root, r === "aceito" ? `Você e ${c.nome} agora são amigos!` : `Pedido enviado para ${c.nome}.`);
          if (r === "aceito") carregar();
        } catch (e) { b.disabled = false; toast(nav.root, (e as Error).message); }
      } }));
  let t = 0;
  campo.addEventListener("input", () => {
    clearTimeout(t);
    const v = campo.value.trim();
    if (v.length < 2) { res.replaceChildren(); return; }
    t = window.setTimeout(() => {
      nuvem.buscarComandantes(v)
        .then((cs) => res.replaceChildren(...(cs.length ? cs.map(linhaBusca) : [h("div", { class: "desc", text: "Nenhum comandante com esse nome." })])))
        .catch(() => res.replaceChildren(h("div", { class: "desc", text: "Não foi possível buscar agora." })));
    }, 400);
  });

  // ---- pedidos e lista de amigos
  const lista = h("div", { class: "amigos-lista" }, h("div", { class: "rank-carregando", text: "Carregando amigos…" }));
  const carregar = () => nuvem.meusAmigos().then((as) => {
    const recebidos = as.filter((a) => a.situacao === "recebido");
    const amigos = as.filter((a) => a.situacao === "amigo");
    const enviados = as.filter((a) => a.situacao === "enviado");
    nuvem.avisosAmigos = recebidos.length + amigos.reduce((n, a) => n + (a.nao_lidas || 0), 0);
    const blocos: HTMLElement[] = [];
    if (recebidos.length) {
      blocos.push(h("div", { class: "secao-titulo", text: `Pedidos de amizade (${recebidos.length})` }),
        ...recebidos.map((a) => h("div", { class: "rank-linha amigo-pedido" }, ...cabecalho(a.nome, a.avatar, a.patente, "quer ser seu amigo"),
          h("div", { class: "cla-acoes" },
            h("button", { class: "btn ciano pequeno", text: "Aceitar", onclick: async () => {
              try { await nuvem.responderAmizade(a.pedido, true); audio.sfx("nivel"); toast(nav.root, `Você e ${a.nome} agora são amigos!`); carregar(); } catch (e) { toast(nav.root, (e as Error).message); }
            } }),
            h("button", { class: "btn pequeno", "aria-label": "Recusar", html: ic("fechar"), onclick: async () => {
              try { await nuvem.responderAmizade(a.pedido, false); carregar(); } catch (e) { toast(nav.root, (e as Error).message); }
            } })))));
    }
    blocos.push(h("div", { class: "secao-titulo", text: `Amigos (${amigos.length})` }));
    if (!amigos.length) blocos.push(aviso("Você ainda não tem amigos aqui. Procure pelo nome do comandante acima.", "grupo"));
    for (const a of amigos) {
      const v = visto(a.visto_em);
      blocos.push(h("button", { class: "rank-linha amigo-linha" + (v.online ? " online" : ""), onclick: () => { conversaCom = a; nav.ir("conversa"); } },
        h("span", { class: "amigo-ponto" + (v.online ? " on" : "") }),
        ...cabecalho(a.nome, a.avatar, a.patente, v.txt),
        h("div", { class: "cla-linha-dir" },
          a.nao_lidas ? h("i", { class: "badge amigo-badge", text: String(a.nao_lidas) }) : null,
          h("span", { class: "amigo-chat", html: ic("correio") }))));
    }
    if (enviados.length) {
      blocos.push(h("div", { class: "secao-titulo", text: "Pedidos enviados" }),
        ...enviados.map((a) => h("div", { class: "rank-linha" }, ...cabecalho(a.nome, a.avatar, a.patente, "esperando resposta"),
          h("button", { class: "btn pequeno", text: "Cancelar", onclick: async () => { try { await nuvem.removerAmigo(a.id); carregar(); } catch (e) { toast(nav.root, (e as Error).message); } } }))));
    }
    lista.replaceChildren(...blocos);
  }).catch(() => lista.replaceChildren(aviso("Não foi possível carregar os amigos agora.")));
  carregar();

  corpo.append(
    h("div", { class: "cartao cla-convidar" }, h("div", { class: "nome", html: icT("mais", "Adicionar amigo") }), h("div", { class: "campo-linha" }, campo), res),
    lista);
  return el;
}

/** Chat com todo mundo (atualiza a cada 4 s). Palavrão vira ***; 3 denúncias escondem a mensagem. */
function chatGlobal(nav: Nav): HTMLElement[] {
  const lista = h("div", { class: "cla-chat-lista conversa-lista global-lista" }, h("div", { class: "desc", text: "Carregando…" }));
  const campo = h("input", { class: "campo", id: "msg-global", maxlength: "150", placeholder: "Mensagem para todos", autocomplete: "off" }) as HTMLInputElement;
  let ultimo = -1;
  const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const atualizar = (forcar = false) => nuvem.lerGlobal().then((ms: MensagemGlobal[]) => {
    const fim = ms.at(-1)?.id ?? 0;
    if (fim === ultimo && !forcar) return;
    const noFim = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 60 || ultimo === -1;
    ultimo = fim;
    lista.replaceChildren(...(ms.length ? ms.filter((m) => !denunciadas.has(m.id)).map((m) => h("div", { class: "cla-msg global-msg" + (m.eu ? " eu" : "") },
      h("small", null, m.eu ? null : insignia(m.patente, "insignia micro"), h("b", { class: m.elite ? "nome-elite" : "", text: m.eu ? "Você" : m.nome }), h("span", { text: ` · ${hora(m.criado_em)}` }),
        m.eu ? null : h("button", { class: "global-denunciar", "aria-label": "Denunciar mensagem", title: "Denunciar", html: ic("alerta"), onclick: async () => {
          try { await nuvem.denunciarGlobal(m.id); denunciadas.add(m.id); toast(nav.root, "Mensagem denunciada. Obrigado!"); void atualizar(true); } catch (e) { toast(nav.root, (e as Error).message); }
        } })),
      h("span", { text: m.texto })))
      : [h("div", { class: "desc", text: "Ninguém falou ainda. Diga oi para todo mundo!" })]));
    if (noFim) lista.scrollTop = lista.scrollHeight;
  }).catch(() => lista.replaceChildren(h("div", { class: "desc", text: "Não foi possível carregar o chat agora." })));
  const enviar = async () => {
    const t = campo.value.trim();
    if (!t) return;
    campo.value = "";
    try { await nuvem.enviarGlobal(t); ultimo = -2; await atualizar(); lista.scrollTop = lista.scrollHeight; } catch (e) { toast(nav.root, (e as Error).message); campo.value = t; }
  };
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") void enviar(); });
  void atualizar();
  conversaTimer = window.setInterval(() => {
    if (nav.telaAtual() !== "amigos" || abaSocial !== "global" || !lista.isConnected) { clearInterval(conversaTimer); return; }
    void atualizar();
  }, 4000);
  return [
    h("div", { class: "desc global-regras", html: `${ic("alerta")} Seja gentil. Palavrão é escondido e mensagens com 3 denúncias somem.` }),
    lista,
    h("div", { class: "cla-chat-envio" }, h("div", { class: "campo-linha" }, campo), h("button", { class: "btn ciano", "aria-label": "Enviar", html: ic("play"), onclick: enviar })),
  ];
}

/** Conversa privada com um amigo (atualiza a cada 4 s). */
export function telaConversa(nav: Nav): HTMLElement {
  clearInterval(conversaTimer);
  const a = conversaCom;
  if (!a) return telaAmigos(nav);
  const lista = h("div", { class: "cla-chat-lista conversa-lista" });
  const campo = h("input", { class: "campo", id: "msg-amigo", maxlength: "200", placeholder: `Mensagem para ${a.nome}`, autocomplete: "off" }) as HTMLInputElement;
  let ultimo = -1;
  const hora = (iso: string) => {
    const d = new Date(iso);
    const hoje = d.toDateString() === new Date().toDateString();
    return hoje ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };
  const atualizar = () => nuvem.lerConversa(a.id).then((ms: MensagemPrivada[]) => {
    const fim = ms.at(-1)?.id ?? 0;
    if (fim === ultimo) return;
    ultimo = fim;
    lista.replaceChildren(...(ms.length ? ms.map((m) => h("div", { class: "cla-msg" + (m.eu ? " eu" : "") },
      h("small", { text: `${m.eu ? "Você" : a.nome} · ${hora(m.criado_em)}` }), h("span", { text: m.texto })))
      : [h("div", { class: "desc", text: `Comece a conversa com ${a.nome}!` })]));
    lista.scrollTop = lista.scrollHeight;
  }).catch(() => {});
  const enviar = async () => {
    const t = campo.value.trim();
    if (!t) return;
    campo.value = "";
    try { await nuvem.enviarMensagem(a.id, t); await atualizar(); } catch (e) { toast(nav.root, (e as Error).message); campo.value = t; }
  };
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter") void enviar(); });
  const v = visto(a.visto_em);
  const remover = h("button", { class: "btn-link conversa-remover", text: "Remover amigo", onclick: async () => {
    if (!remover.dataset.confirma) { remover.dataset.confirma = "1"; remover.textContent = "Toque de novo para remover"; return; }
    try { await nuvem.removerAmigo(a.id); toast(nav.root, `${a.nome} foi removido dos amigos.`); nav.ir("amigos"); } catch (e) { toast(nav.root, (e as Error).message); }
  } });
  const el = tela(nav, "CONVERSA",
    h("div", { class: "rank-linha conversa-topo" }, h("span", { class: "amigo-ponto" + (v.online ? " on" : "") }), ...cabecalho(a.nome, a.avatar, a.patente, v.txt),
      h("button", { class: "btn pequeno", html: icT("voltar", "Amigos"), onclick: () => nav.ir("amigos") })),
    lista,
    h("div", { class: "cla-chat-envio" }, h("div", { class: "campo-linha" }, campo), h("button", { class: "btn ciano", "aria-label": "Enviar", html: ic("play"), onclick: enviar })),
    remover);
  void atualizar();
  conversaTimer = window.setInterval(() => {
    if (nav.telaAtual() !== "conversa" || !lista.isConnected) { clearInterval(conversaTimer); return; }
    void atualizar();
  }, 4000);
  return el;
}
