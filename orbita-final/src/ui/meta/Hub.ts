import { AVATARES, CORREIO, LOGIN_DIAS, LOJA, BONUS_DIARIAS, PASSE, PASSE_PREMIOS, PATENTES, SKINS, type SkinDef } from "../../data/comandante";
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SLOTS, CHIP_SLOT_NOME } from "../../data/chips";
import { SENTINEL_IDS } from "../../data/sentinels";
import { STAGES } from "../../data/stages";
import { audio } from "../../core/Audio";
import type { Chip } from "../../data/types";
import {
  atualizarDia, comprar, comprarSkin, diariasProntas, loginDisponivel, mensagensNovas, missoesDoDia, nivelPasse, passeProntos, patenteDe,
  resgatarBonusDiario, resgatarDiaria, resgatarLogin, resgatarMensagem, resgatarPasse, temporadaAtual, textoPremio, usarSkin,
} from "../../meta/Comandante";
import { desafioDoDia, formatStat, hojeStr, missoesProntas, semanaStr } from "../../meta/Meta";
import { urlArte } from "../../render/Sprites";
import { PASSE_PREMIUM, PRODUTOS, ANUNCIOS, precoBRL } from "../../data/monetizacao";
import { MODO_PAGAMENTO, iniciarCompra, produtoDisponivel, premiumProntos, resgatarPremium, temPremium } from "../../meta/Pagamentos";
import { MODO_ANUNCIO, anunciosRestantes, bauAnuncio } from "../../meta/Anuncios";
import { fmtInt, fmtTempo, h, ICONE_MOEDA, iconeImg, toast } from "../dom";
import { ic, icT } from "../Icones";
import { celebrar } from "../Premio";
import { telaBau } from "../Bau";
const ret = (ev: MouseEvent) => (ev.currentTarget as HTMLElement).getBoundingClientRect();
import { moedas, proximaFase, tela, type Nav } from "./Screens";

// ------------------------------------------------------------------ peças

function seloTeste(): HTMLElement | null {
  const partes: string[] = [];
  if (MODO_PAGAMENTO === "teste") partes.push("pagamentos");
  if (MODO_ANUNCIO === "teste") partes.push("anúncios");
  return partes.length ? h("div", { class: "selo-teste", text: `MODO TESTE (${partes.join(" e ")}): nada é cobrado de verdade.` }) : null;
}

function cartaoProduto(nav: Nav, id: string, destaque = ""): HTMLElement | null {
  const s = nav.save;
  const p = PRODUTOS.find((x) => x.id === id);
  if (!p) return null;
  const disp = produtoDisponivel(s, p);
  return h("div", { class: "loja-item neon produto " + destaque + (disp ? "" : " comprado") },
    p.selo ? h("span", { class: "selo", text: p.selo }) : null,
    h("span", { class: "loja-ic", html: iconeImg(p.icone, ic("presente"), "loja-img") }),
    h("div", { class: "loja-txt" }, h("b", { text: p.nome }), h("span", { text: p.desc })),
    h("button", { class: "btn-preco real", disabled: !disp, html: disp ? precoBRL(p.centavos) : ic("check"),
      onclick: async (ev: MouseEvent) => {
        const o = ret(ev);
        const r = await iniciarCompra(s, p.id);
        if (!r.ok || MODO_PAGAMENTO !== "teste") { toast(nav.root, r.msg); return; }
        nav.persistir();
        nav.ir(nav.telaAtual());
        if (p.premio) celebrar(nav.root, o, p.premio, r.chip ?? null, p.nome.toUpperCase());
        else { audio.sfx("vitoria"); toast(nav.root, r.msg); }
      } }));
}

/** Imagem grande de um prêmio (pilha de moedas/cristais/chip) para as telas de recompensa. */
function imgPremio(p: { creditos?: number; nucleos?: number; cristais?: number; chip?: number }): string {
  const id = p.chip !== undefined ? "premio_chip" : p.cristais ? "premio_cristais" : p.nucleos ? "premio_nucleos" : "premio_moedas";
  const reserva = p.chip !== undefined ? "chip_vortice" : p.cristais ? "moeda_cristais" : p.nucleos ? "moeda_nucleos" : "moeda_creditos";
  return iconeImg(id, iconeImg(reserva, "", "premio-img"), "premio-img");
}

function banner(id: string): HTMLElement | null {
  const u = urlArte(id);
  return u ? h("img", { class: "banner", src: u, alt: "" }) : null;
}

function pedestal(): HTMLElement | null {
  const u = urlArte("pedestal");
  return u ? h("img", { class: "pedestal", src: u, alt: "" }) : null;
}

export function avatar(n: number, classe = "avatar"): HTMLElement {
  const url = urlArte(`avatar_${n}`);
  const cor = AVATARES.find((a) => a.id === n)?.cor ?? "#4fd6ff";
  return h("span", { class: classe, style: `--cor:${cor}`, html: url ? `<img src="${url}" alt="">` : ic("usuario") });
}

/** Insígnia da patente (arte final `patente_N`), ou null. */
export function insignia(indice: number, classe = "insignia"): HTMLElement | null {
  const u = urlArte(`patente_${indice + 1}`);
  return u ? h("img", { class: classe, src: u, alt: "" }) : null;
}

function perfilCard(nav: Nav): HTMLElement {
  const s = nav.save;
  const pt = patenteDe(s);
  return h("button", { class: "perfil", onclick: () => nav.ir("progresso") },
    h("span", { class: "perfil-av" }, avatar(s.perfil.avatar), insignia(pt.indice, "insignia mini")),
    h("span", { class: "perfil-txt" },
      h("b", { text: `Cmd. ${s.perfil.nome || "Comandante"}` }),
      h("span", { class: "perfil-pat", html: `<em>${pt.atual.nome}</em> · ${fmtInt(s.pontos)} pts` }),
      h("span", { class: "perfil-barra" }, h("i", { style: `width:${Math.round(pt.frac * 100)}%` }))));
}

const emBreve = (nav: Nav, nome: string) => () => toast(nav.root, `${nome}: em breve!`);

function lateral(icone: string, nome: string, onclick: () => void, badge = 0, classe = ""): HTMLElement {
  return h("button", { class: "lat " + classe, onclick },
    h("span", { class: "lat-ic", html: ic(icone) }), h("span", { class: "lat-nome", text: nome }),
    badge ? h("i", { class: "badge", text: "!" }) : null);
}

export function barraInferior(nav: Nav, ativa: string): HTMLElement {
  const item = (id: string, icone: string, nome: string, acao: () => void) =>
    h("button", { class: "nav-item" + (ativa === id ? " ativa" : ""), onclick: acao }, h("span", { html: ic(icone) }), h("small", { text: nome }));
  return h("nav", { class: "nav-inferior" },
    item("hub", "casa", "Início", () => nav.ir("hub")),
    item("progresso", "grafico", "Progresso", () => nav.ir("progresso")),
    item("inventario", "caixa", "Inventário", () => nav.ir("inventario")),
    item("cla", "grupo", "Clã", emBreve(nav, "Clã")),
    item("ranking", "ranking", "Ranking", emBreve(nav, "Ranking")));
}

// ------------------------------------------------------------------ HUB

export function telaHub(nav: Nav): HTMLElement {
  const s = nav.save;
  atualizarDia(s);
  const idx = proximaFase(s);
  const st = STAGES[idx];
  const estrelasFase = s.campanha.normal[idx];
  const totalEstrelas = s.campanha.normal.reduce((x, y) => x + y, 0);
  const vencidas = s.campanha.normal.filter((x) => x > 0).length;
  const desbloq = SENTINEL_IDS.filter((id) => s.sentinelas[id].desbloqueada).length;
  const talentos = Object.values(s.talentos).reduce((x, y) => x + y, 0);
  const equip = Object.keys(s.equipados).length;
  const diarias = diariasProntas(s);
  const conquistas = missoesProntas(s);
  const d = desafioDoDia();

  const tile = (icone: string, nome: string, info: string, alvo: string, cor: string, arte: string, badge = 0) => {
    const img = urlArte(`tile_${alvo}`) ?? urlArte(arte);
    return h("button", { class: "tile", style: `--acc:${cor}`, onclick: () => nav.ir(alvo) },
      h("span", { class: "tile-borda" }),
      img ? h("img", { class: "tile-arte", src: img, alt: "" }) : null,
      h("span", { class: "tile-ic", html: ic(icone) }),
      h("span", { class: "tile-nome", text: nome }),
      h("span", { class: "tile-info", text: info }),
      badge ? h("i", { class: "badge", text: "!" }) : null);
  };

  const estrelas = [1, 2, 3].map((i) => ic("estrela", "ic-estrela" + (i <= estrelasFase ? "" : " off"))).join("");
  const el = h("div", { class: "tela hub" },
    h("div", { class: "hub-topo" }, perfilCard(nav), moedas(nav)),
    h("div", { class: "hub-palco" },
      urlArte("logo")
        ? h("div", { class: "logo-img" }, h("img", { src: urlArte("logo")!, alt: "Órbita Final" }), h("small", { text: "DEFESA PLANETÁRIA" }))
        : h("div", { class: "logo", html: "ÓRBITA FINAL<small>DEFESA PLANETÁRIA</small>" }),
      h("div", { class: "lat-col esq" },
        lateral("correio", "Correio", () => nav.ir("correio"), mensagensNovas(s)),
        lateral("calendario", "Eventos", () => nav.ir("eventos"), s.diario.data === hojeStr() && s.diario.concluido ? 0 : 1),
        lateral("trofeu", "Conquistas", () => nav.ir("conquistas"), conquistas)),
      h("div", { class: "hub-vitrine", "data-vitrine": "1" }),
      h("div", { class: "lat-col dir" },
        lateral("config", "Ajustes", () => nav.ir("config")),
        lateral("presente", "Recompensas", () => nav.ir("recompensas"), loginDisponivel(s) ? 1 : 0),
        lateral("passe", "Passe de Batalha", () => nav.ir("passe"), passeProntos(s) + premiumProntos(s)),
        lateral("carrinho", "Loja", () => nav.ir("loja"), s.dia.lojaGratis ? 0 : 1, "lat-ouro"))),
    h("button", { class: "btn-batalha" + (urlArte("botao_batalha") ? " com-arte" : ""), style: urlArte("botao_batalha") ? `--arte:url("${urlArte("botao_batalha")}")` : "", onclick: () => nav.jogarCampanha(idx, false) },
      h("span", { class: "bb-play", html: ic("play") }),
      h("span", { class: "bb-corpo" },
        h("span", { class: "bb-seta", html: "&#10095;&#10095;" }),
        h("span", { class: "bb-txt" },
          h("b", { text: "BATALHA" }),
          h("small", { text: `Fase ${st.id} · ${st.nome}` }),
          h("span", { class: "bb-estrelas", html: estrelas })),
        h("span", { class: "bb-seta esq", html: "&#10094;&#10094;" }))),
    h("div", { class: "grade" },
      tile("mapa", "Fases", `${vencidas}/${STAGES.length} · ${totalEstrelas} estrelas`, "mapa", "#4fd6ff", "carta_radar"),
      tile("hangar", "Hangar", `${desbloq}/${SENTINEL_IDS.length} sentinelas`, "hangar", "#ff9a3c", "carta_canhao"),
      tile("chip", "Chips", `${equip}/${CHIP_SLOTS.length} equipados`, "chips", "#b36bff", "carta_dados"),
      tile("planeta", "Planeta", `${talentos} melhorias`, "planeta", "#49e07a", "carta_hp"),
      tile("missoes", "Missões", diarias ? `${diarias} para resgatar` : "missões do dia", "missoes", "#ffc23d", "carta_crit", diarias),
      tile("modos", "Modos", `Diário: ${d.mod.nome}`, "modos", "#ff5aa5", "carta_gravidade")),
    barraInferior(nav, "hub"));
  return el;
}

// ------------------------------------------------------------------ LOGIN

export function telaLogin(nav: Nav): HTMLElement {
  const s = nav.save;
  const editando = !!s.perfil.nome;
  let escolhido = s.perfil.avatar || 1;
  const input = h("input", { class: "campo", id: "nome-comandante", maxlength: "14", placeholder: "Seu nome de usuário", autocomplete: "off", value: s.perfil.nome }) as HTMLInputElement;
  const erro = h("div", { class: "erro-campo" });
  const grade = h("div", { class: "avatares" });
  const desenhar = () => {
    grade.replaceChildren(...AVATARES.map((a) => {
      const b = h("button", { class: "av-op" + (a.id === escolhido ? " sel" : ""), "aria-label": `Avatar ${a.id}`, onclick: () => { escolhido = a.id; desenhar(); } }, avatar(a.id, "avatar grande"));
      return b;
    }));
  };
  desenhar();
  const entrar = () => {
    const nome = input.value.trim().replace(/\s+/g, " ");
    if (nome.length < 3) { erro.textContent = "Use pelo menos 3 letras."; return; }
    if (!/^[\p{L}\p{N} _.-]+$/u.test(nome)) { erro.textContent = "Use só letras, números, espaço, ponto ou traço."; return; }
    s.perfil = { nome, avatar: escolhido };
    nav.persistir();
    audio.sfx("nivel");
    nav.ir("hub");
  };
  const tela = h("div", { class: "tela login" },
    urlArte("logo") ? h("div", { class: "logo-img" }, h("img", { src: urlArte("logo")!, alt: "Órbita Final" })) : h("div", { class: "logo", text: "ÓRBITA FINAL" }),
    h("form", { class: "login-painel", novalidate: "true" },
      h("div", { class: "login-titulo", text: editando ? "Editar comandante" : "Identifique-se, comandante" }),
      h("label", { for: "nome-comandante", text: "Nome de usuário" }),
      h("div", { class: "campo-linha" }, h("span", { class: "campo-pre", text: "Cmd." }), input),
      erro,
      h("label", { text: "Avatar" }),
      grade,
      h("button", { class: "btn primario", type: "submit", html: icT("play", editando ? "Salvar" : "Entrar") }),
      editando ? h("button", { class: "btn", type: "button", html: icT("voltar", "Voltar"), onclick: () => nav.ir("hub") }) : null,
      h("p", { class: "login-nota", text: "Seu perfil fica salvo neste aparelho." })));
  tela.querySelector("form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    entrar();
  });
  return tela;
}

// ------------------------------------------------------------------ CORREIO

export function telaCorreio(nav: Nav): HTMLElement {
  const s = nav.save;
  const itens = [...CORREIO].reverse().map((m) => {
    const lida = s.correio.lidas.includes(m.id);
    const pegou = s.correio.resgatadas.includes(m.id);
    if (!lida) s.correio.lidas.push(m.id);
    return h("div", { class: "cartao" + (lida && (!m.premio || pegou) ? " lida" : "") },
      h("div", { class: "cab" }, h("span", { class: "cartao-ic", html: ic(m.premio ? "presente" : "correio") }),
        h("div", { style: "flex:1;min-width:0" }, h("div", { class: "nome", text: m.titulo }), h("div", { class: "desc", text: m.data.split("-").reverse().join("/") }))),
      h("div", { class: "desc", text: m.texto }),
      m.premio ? h("div", { class: "acoes" },
        h("span", { class: "premio", html: textoPremio(m.premio, ICONE_MOEDA) }),
        h("button", { class: "btn ouro pequeno", disabled: pegou, html: pegou ? icT("check", "Resgatado") : icT("presente", "Resgatar"),
          onclick: (ev: MouseEvent) => { const o = ret(ev); if (resgatarMensagem(s, m.id)) { nav.persistir(); nav.ir("correio"); celebrar(nav.root, o, m.premio!); } } })) : null);
  });
  nav.persistir();
  return tela(nav, "CORREIO", ...itens);
}

// ------------------------------------------------------------------ EVENTOS

function faltaAte(alvo: Date): string {
  const ms = Math.max(0, alvo.getTime() - Date.now());
  const hrs = Math.floor(ms / 3.6e6);
  const min = Math.floor((ms % 3.6e6) / 6e4);
  return hrs >= 24 ? `${Math.floor(hrs / 24)}d ${hrs % 24}h` : `${hrs}h ${String(min).padStart(2, "0")}min`;
}

export function telaEventos(nav: Nav): HTMLElement {
  const s = nav.save;
  const d = desafioDoDia();
  const meiaNoite = new Date();
  meiaNoite.setHours(24, 0, 0, 0);
  const segunda = new Date();
  segunda.setHours(24, 0, 0, 0);
  while (segunda.getDay() !== 1) segunda.setDate(segunda.getDate() + 1);
  const ev = (icone: string, cor: string, titulo: string, tempo: string, desc: string, status: string, acao: string, onclick: () => void) =>
    h("div", { class: "cartao evento", style: `--acc:${cor}` },
      h("div", { class: "cab" }, h("span", { class: "cartao-ic", html: ic(icone) }),
        h("div", { style: "flex:1" }, h("div", { class: "nome", text: titulo }), h("div", { class: "desc", html: `${ic("relogio")} termina em ${tempo}` }))),
      h("div", { class: "desc", text: desc }),
      h("div", { class: "desc", text: status }),
      h("div", { class: "acoes" }, h("button", { class: "btn primario pequeno", html: icT("play", acao), onclick })));
  return tela(nav, "EVENTOS",
    ev("calendario", "#4fd6ff", "Desafio Diário", faltaAte(meiaNoite), `${d.mod.nome}: ${d.mod.desc}`,
      s.diario.data === hojeStr() && s.diario.concluido ? "Concluído hoje" : "Ainda não concluído hoje", "Jogar", () => nav.jogarDiario()),
    ev("bussola", "#ff5aa5", "Jornada da Semana", faltaAte(segunda), "5 etapas seguidas, sem cura entre elas, com efeitos de campo da semana.",
      s.jornada.semana === semanaStr() ? `Melhor: ${s.jornada.melhor}/5 etapas` : "Ainda não jogada nesta semana", "Partir", () => nav.jogarJornada()),
    ev("infinito", "#b36bff", "Sobrevivência", "sempre aberto", "Ondas sem fim. Um chefe a cada 3 minutos.", `Recorde: ${fmtTempo(s.sobrevivenciaMelhor)}`, "Sobreviver", () => nav.jogarSobrevivencia()));
}

// ------------------------------------------------------------------ MISSÕES DIÁRIAS

export function telaDiarias(nav: Nav): HTMLElement {
  const s = nav.save;
  atualizarDia(s);
  const ms = missoesDoDia();
  const amanha = new Date();
  amanha.setHours(24, 0, 0, 0);
  const itens = ms.map((m) => {
    const v = s.dia.stats[m.stat] ?? 0;
    const feita = s.dia.resgatadas.includes(m.id);
    const pronta = !feita && v >= m.meta;
    return h("div", { class: "cartao" + (feita ? " lida" : "") },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", text: m.texto }), h("div", { class: "desc premio", html: textoPremio(m.premio, ICONE_MOEDA) })),
        pronta ? h("button", { class: "btn ouro pequeno", text: "Resgatar", onclick: (ev: MouseEvent) => { const o = ret(ev); if (resgatarDiaria(s, m.id)) { nav.persistir(); nav.ir("missoes"); celebrar(nav.root, o, m.premio); } } })
          : h("span", { class: "desc", html: feita ? ic("check") : `${fmtInt(Math.min(v, m.meta))}/${fmtInt(m.meta)}` })),
      h("div", { class: "prog" }, h("b", { style: `width:${Math.min(100, (v / m.meta) * 100)}%` })));
  });
  const todas = s.dia.resgatadas.length >= 3;
  return tela(nav, "MISSÕES",
    h("div", { class: "cartao desc", html: `${ic("relogio")} Novas missões em ${faltaAte(amanha)}` }),
    ...itens,
    h("div", { class: "cartao" },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", text: "Bônus: complete as 3" }), h("div", { class: "desc premio", html: textoPremio(BONUS_DIARIAS, ICONE_MOEDA) })),
        h("button", { class: "btn ouro pequeno", disabled: !todas || s.dia.bonus, html: s.dia.bonus ? icT("check", "Feito") : "Resgatar",
          onclick: (ev: MouseEvent) => { const o = ret(ev); if (resgatarBonusDiario(s)) { nav.persistir(); nav.ir("missoes"); celebrar(nav.root, o, BONUS_DIARIAS); } } }))),
    h("button", { class: "btn", html: icT("trofeu", "Ver conquistas"), onclick: () => nav.ir("conquistas") }));
}

// ------------------------------------------------------------------ RECOMPENSAS (login de 7 dias)

export function telaRecompensas(nav: Nav): HTMLElement {
  const s = nav.save;
  const pode = loginDisponivel(s);
  const hojeIdx = s.login.dias % LOGIN_DIAS.length;
  const ciclo = Math.floor(s.login.dias / LOGIN_DIAS.length) * LOGIN_DIAS.length;
  const dias = LOGIN_DIAS.map((p, i) => {
    const feito = s.login.dias - ciclo > i;
    const atual = i === hojeIdx && pode;
    return h("div", { class: "dia neon" + (feito ? " feito" : "") + (atual ? " atual" : "") + (i === 6 ? " grande roxo" : "") },
      h("small", { text: `Dia ${i + 1}` }),
      h("span", { class: "dia-img", html: imgPremio(p) }),
      h("span", { class: "dia-premio", html: textoPremio(p, ICONE_MOEDA).replace(/ &nbsp;/g, "<br>") }),
      feito ? h("span", { class: "dia-ok", html: ic("check") }) : null);
  });
  return tela(nav, "RECOMPENSAS",
    banner("banner_recompensas"),
    h("div", { class: "cartao desc neon centro", text: "Entre todo dia para resgatar. O 7º dia dá um chip épico garantido." }),
    h("div", { class: "dias" }, ...dias),
    h("button", { class: "btn ouro", disabled: !pode, html: pode ? icT("presente", "Resgatar recompensa de hoje") : icT("check", "Volte amanhã"),
      onclick: (ev: MouseEvent) => {
        const o = ret(ev);
        const r = resgatarLogin(s);
        if (!r) return;
        nav.persistir();
        nav.ir("recompensas");
        celebrar(nav.root, o, r.premio, r.chip, `DIA ${((s.login.dias - 1) % 7) + 1}`);
      } }),
    (() => {
      const resta = anunciosRestantes(s, "bau");
      const pr = ANUNCIOS.recompensa.bau.premio;
      return h("div", { class: "cartao neon roxo bau-ad" },
        h("span", { class: "loja-ic", html: iconeImg("loja_creditos", ic("presente"), "loja-img") }),
        h("div", { class: "loja-txt" }, h("b", { text: "Baú bônus" }), h("span", { html: `${s.monet.semAnuncios ? "Sem anúncio (VIP)" : "Assista a um anúncio"}: ${textoPremio(pr, ICONE_MOEDA)} · ${resta}/${ANUNCIOS.recompensa.bau.limite} hoje` })),
        h("button", { class: "btn ouro pequeno", disabled: resta <= 0, html: icT("play", "Abrir"),
          onclick: async () => {
            if (await bauAnuncio(s, nav.root)) {
              nav.persistir();
              nav.ir("recompensas");
              const el = telaBau({ creditos: pr.creditos ?? 0, nucleos: pr.nucleos ?? 0, cristais: pr.cristais ?? 0, titulo: "BAÚ BÔNUS" }, () => {
                el.remove();
                celebrar(nav.root, null, pr);
              });
              nav.root.append(el);
            }
          } }));
    })(),
    pedestal());
}

// ------------------------------------------------------------------ LOJA

export function telaLoja(nav: Nav): HTMLElement {
  const s = nav.save;
  atualizarDia(s);
  const itens = LOJA.map((it) => {
    const gratisUsado = !it.custo && s.dia.lojaGratis;
    const podePagar = !it.custo || s[it.custo.moeda] >= it.custo.valor;
    const preco = it.custo ? `${ICONE_MOEDA[it.custo.moeda]} ${fmtInt(it.custo.valor)}` : "Grátis";
    return h("div", { class: "loja-item neon" + (it.custo ? "" : " gratis ouro") },
      h("span", { class: "loja-ic", html: iconeImg(`loja_${it.id}`, iconeImg(it.icone, ic("caixa"), "loja-img"), "loja-img") }),
      h("div", { class: "loja-txt" }, h("b", { text: it.nome }), h("span", { text: it.desc })),
      h("button", { class: it.custo ? "btn-preco" : "btn ouro pequeno", disabled: gratisUsado || !podePagar, html: gratisUsado ? "Amanhã" : preco,
        onclick: (ev: MouseEvent) => {
          const o = ret(ev);
          const r = comprar(s, it.id);
          if (!r.ok) { toast(nav.root, r.msg); return; }
          nav.persistir();
          nav.ir("loja");
          celebrar(nav.root, o, it.premio, r.chip ?? null, it.nome.toUpperCase());
        } }));
  });
  const skins = SKINS.filter((k) => k.preco && skinDisponivel(k)).map((k) => {
    const tem = s.skins.possui.includes(k.id);
    return h("div", { class: "loja-item neon" + (tem ? "" : " roxo") },
      h("span", { class: "loja-ic", html: previaSkin(k) }),
      h("div", { class: "loja-txt" }, h("b", { text: k.nome }), h("span", { text: k.tipo === "escudo" ? "Cor do escudo hexagonal." : "Aparência do planeta." })),
      h("button", { class: "btn-preco", disabled: tem || s.cristais < (k.preco ?? 0), html: tem ? "Comprado" : `${ICONE_MOEDA.cristais} ${k.preco}`,
        onclick: () => { if (comprarSkin(s, k.id)) { usarSkin(s, k.id); audio.sfx("vitoria"); nav.persistir(); toast(nav.root, `${k.nome} equipado!`); nav.ir("loja"); } } }));
  });
  return tela(nav, "LOJA", banner("banner_loja"), seloTeste(),
    h("div", { class: "secao-titulo", text: "Ofertas" }),
    cartaoProduto(nav, "inicial", "ouro"),
    cartaoProduto(nav, "passe_premium", "roxo"),
    cartaoProduto(nav, "sem_anuncios"),
    h("div", { class: "secao-titulo", text: "Cristais" }),
    ...["cristais_60", "cristais_330", "cristais_900", "cristais_2000"].map((id) => cartaoProduto(nav, id)),
    h("div", { class: "secao-titulo", text: "Com moedas do jogo" }), ...itens,
    skins.length ? h("div", { class: "secao-titulo", text: "Skins" }) : null, ...skins, pedestal());
}

// ------------------------------------------------------------------ PROGRESSO (perfil e patentes)

export function telaProgresso(nav: Nav): HTMLElement {
  const s = nav.save;
  const pt = patenteDe(s);
  const e = s.estatisticas;
  const est = (icone: string, k: string, v: string) => h("div", { class: "est-item neon" }, h("span", { class: "est-ic", html: ic(icone) }), h("b", { text: v }), h("small", { text: k }));
  const el = tela(nav, "PROGRESSO",
    h("div", { class: "cartao perfil-grande neon" },
      h("span", { class: "perfil-av" }, avatar(s.perfil.avatar, "avatar grande"), insignia(pt.indice, "insignia media")),
      h("div", { style: "flex:1;min-width:0" },
        h("div", { class: "nome", text: `Cmd. ${s.perfil.nome || "Comandante"}` }),
        h("div", { class: "pat-nome", text: pt.atual.nome }),
        pt.prox ? h("div", { class: "pat-prox" }, h("span", { text: "Próxima:" }), insignia(pt.indice + 1, "insignia micro"), h("b", { text: pt.prox.nome })) : null,
        h("div", { class: "perfil-barra" }, h("i", { style: `width:${Math.round(pt.frac * 100)}%` })),
        h("div", { class: "desc", text: pt.prox ? `${fmtInt(s.pontos)} / ${fmtInt(pt.prox.pontos)} pontos para ${pt.prox.nome}` : `${fmtInt(s.pontos)} pontos · patente máxima` }),
        pt.trava ? h("div", { class: "pat-trava", html: `${ic("cadeado")} ${pt.trava}` }) : null),
      h("button", { class: "btn icone", html: ic("usuario"), "aria-label": "Editar perfil", onclick: () => nav.ir("login") })),
    h("button", { class: "cartao neon roxo skins-atalho", onclick: () => nav.ir("skins") },
      h("span", { class: "skins-atalho-ic", html: previaSkin(SKINS.find((k) => k.id === s.skins.planeta) ?? SKINS[0]) }),
      h("div", { style: "flex:1;text-align:left" }, h("div", { class: "nome", text: "Skins" }),
        h("div", { class: "desc", text: `${SKINS.filter((k) => k.preco === 0 || s.skins.possui.includes(k.id)).length}/${SKINS.length} desbloqueadas · troque o visual do planeta e do escudo` })),
      h("span", { html: ic("play") })),
    h("div", { class: "estatisticas" },
      est("espadas", "Partidas", fmtInt(e.partidas ?? 0)), est("mira", "Abates", fmtInt(e.abates ?? 0)), est("coroa2", "Chefes", fmtInt(e.chefes ?? 0)),
      est("estrela", "Estrelas", fmtInt(e.estrelas ?? 0)), est("evoluir", "Evoluções", fmtInt(e.evolucoes ?? 0)), est("trofeu", "Melhor partida", `${fmtInt(e.melhorPartida ?? 0)} pts`),
      est("ampulheta", "Sobrevivência", fmtTempo(s.sobrevivenciaMelhor)), est("camadas", "Jornadas", fmtInt(e.jornadas ?? 0)), est("bandeira", "Desafios", fmtInt(e.diarios ?? 0))),
    h("div", { class: "cartao neon patentes" }, h("div", { class: "nome", style: "margin-bottom:6px", text: "Patentes" }),
      ...PATENTES.map((p, i) => h("div", { class: "pat-linha" + (i <= pt.indice ? " ok" : "") + (i === pt.indice ? " atual" : "") },
        h("span", { class: "pat-ic", html: urlArte(`patente_${i + 1}`) ? `<img src="${urlArte(`patente_${i + 1}`)}" alt="">` : i <= pt.indice ? ic("estrela", "ic-estrela") : ic("cadeado") }),
        h("b", { text: p.nome }), h("small", { text: p.fase ? `${fmtInt(p.pontos)} pts · Fase ${p.fase}` : `${fmtInt(p.pontos)} pts` })))));
  el.append(barraInferior(nav, "progresso"));
  return el;
}

// ------------------------------------------------------------------ INVENTÁRIO

export function telaInventario(nav: Nav): HTMLElement {
  const s = nav.save;
  const moeda = (icone: string, nome: string, v: number, desc: string) =>
    h("div", { class: "loja-item" }, h("span", { class: "loja-ic", html: icone.replace("ic-moeda", "loja-img") }),
      h("div", { class: "loja-txt" }, h("b", { text: `${nome}: ${fmtInt(v)}` }), h("span", { text: desc })));
  const porRar = [0, 1, 2, 3].map((r) => s.chips.filter((c) => c.raridade === r).length);
  const chipsLista = [...s.chips].sort((a, b) => b.raridade - a.raridade).slice(0, 12).map((c: Chip) =>
    h("div", { class: "chip", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}` },
      h("span", { class: "chip-ic", html: iconeImg(`chip_${c.set}`, "") }),
      h("b", { text: `${CHIP_SET_MAP[c.set]?.nome} · ${CHIP_SLOT_NOME[c.slot]}` }),
      h("div", { text: formatStat(c.principal.stat, c.principal.valor) })));
  const el = tela(nav, "INVENTÁRIO",
    moeda(ICONE_MOEDA.creditos, "Créditos", s.creditos, "Melhoram sentinelas no hangar e talentos do planeta."),
    moeda(ICONE_MOEDA.nucleos, "Núcleos", s.nucleos, "Desbloqueiam sentinelas e talentos especiais."),
    moeda(ICONE_MOEDA.cristais, "Cristais", s.cristais, "Moeda rara: loja e reviver na batalha."),
    h("div", { class: "cartao" },
      h("div", { class: "nome", text: `Chips: ${s.chips.length}` }),
      h("div", { class: "desc", html: porRar.map((n, r) => `<span style="color:${CHIP_RARIDADE_COR[r]}">${CHIP_RARIDADES[r]}: ${n}</span>`).join(" · ") }),
      h("div", { class: "acoes" }, h("button", { class: "btn pequeno", html: icT("chip", "Gerenciar chips"), onclick: () => nav.ir("chips") }))),
    s.chips.length ? h("div", { class: "lista-chips" }, ...chipsLista) : null);
  el.append(barraInferior(nav, "inventario"));
  return el;
}

// ------------------------------------------------------------------ SKINS (aparência)

export function skinDisponivel(k: SkinDef): boolean {
  if (k.tipo === "escudo" || k.id === "planeta_terra") return true;
  return !!urlArte(`planeta_mapa_${k.id.replace("planeta_", "")}`);
}

export function previaSkin(k: SkinDef): string {
  if (k.tipo === "escudo") {
    const u = urlArte("escudo");
    const cor = k.cor === 0xffffff ? "#6fd6ff" : "#" + (k.cor ?? 0xffffff).toString(16).padStart(6, "0");
    // a grade hexagonal do escudo vira máscara pintada na cor da skin
    return `<span class="previa-escudo" style="--cor:${cor}"><i style="${u ? `-webkit-mask-image:url('${u}');mask-image:url('${u}')` : ""}"></i></span>`;
  }
  const u = urlArte(k.id === "planeta_terra" ? "planeta_mapa" : `planeta_mapa_${k.id.replace("planeta_", "")}`);
  return `<span class="previa-planeta" style="${u ? `background-image:url('${u}')` : ""}"></span>`;
}

/** De onde vem cada skin (texto curto + para onde o botão leva). */
function origemSkin(k: SkinDef): { texto: string; destino: string } {
  if (k.preco === 0) return { texto: "Padrão", destino: "" };
  if (k.preco !== null) return { texto: `Loja · ${k.preco} cristais`, destino: "loja" };
  const nf = PASSE_PREMIOS.findIndex((p) => p.skin === k.id);
  if (nf >= 0) return { texto: `Passe grátis · nível ${nf + 1}`, destino: "passe" };
  const np = PASSE_PREMIUM.findIndex((p) => p.skin === k.id);
  if (np >= 0) return { texto: `Passe Premium · nível ${np + 1}`, destino: "passe" };
  const prod = PRODUTOS.find((p) => p.skin === k.id);
  if (prod) return { texto: prod.nome, destino: "loja" };
  return { texto: "Evento", destino: "" };
}

let abaSkins: "escudo" | "planeta" = "escudo";

/** Tela de skins (aberta pelo Progresso): vitrine com o planeta girando + coleção por tipo. */
export function telaSkins(nav: Nav): HTMLElement {
  const s = nav.save;
  const lista = SKINS.filter((k) => k.tipo === abaSkins);
  const possui = lista.filter((k) => s.skins.possui.includes(k.id) || k.preco === 0).length;
  const card = (k: SkinDef) => {
    const tem = s.skins.possui.includes(k.id) || k.preco === 0;
    const emUso = s.skins.escudo === k.id || s.skins.planeta === k.id;
    const disp = skinDisponivel(k);
    const o = origemSkin(k);
    let botao: HTMLElement;
    if (emUso) botao = h("span", { class: "skin-tag uso", html: icT("check", "Em uso") });
    else if (tem) botao = h("button", { class: "btn ciano pequeno", text: "Equipar", onclick: () => {
      if (!s.skins.possui.includes(k.id)) s.skins.possui.push(k.id);
      usarSkin(s, k.id); nav.persistir(); audio.sfx("carta"); toast(nav.root, `${k.nome} equipado!`); nav.ir("skins");
    } });
    else if (!disp) botao = h("span", { class: "skin-tag", text: "Em breve" });
    else botao = h("button", { class: "btn pequeno", html: icT("cadeado", "Obter"), onclick: () => o.destino && nav.ir(o.destino) });
    return h("div", { class: "skin-card neon" + (emUso ? " ouro sel" : "") + (tem ? "" : " bloq") },
      h("span", { class: "skin-previa", html: previaSkin(k) }),
      h("b", { text: k.nome }),
      h("small", { text: tem ? (emUso ? "Equipado" : "Desbloqueado") : o.texto }),
      botao);
  };
  const abas = h("div", { class: "abas-v2" },
    h("button", { class: "aba" + (abaSkins === "escudo" ? " ativa" : ""), html: icT("escudo", "Escudos"), onclick: () => { abaSkins = "escudo"; nav.ir("skins"); } }),
    h("button", { class: "aba" + (abaSkins === "planeta" ? " ativa" : ""), html: icT("planeta", "Planetas"), onclick: () => { abaSkins = "planeta"; nav.ir("skins"); } }));
  const el = tela(nav, "SKINS",
    h("div", { class: "aparencia-vitrine skins-vitrine", "data-vitrine": "1" }),
    abas,
    h("div", { class: "desc", style: "text-align:center", text: `Coleção: ${possui}/${lista.length}` }),
    h("div", { class: "skins-grade" }, ...lista.map(card)));
  el.append(barraInferior(nav, "progresso"));
  return el;
}

// ------------------------------------------------------------------ PASSE DE BATALHA

export function telaPasse(nav: Nav): HTMLElement {
  const s = nav.save;
  const { nivel, frac } = nivelPasse(s);
  const fimMes = new Date();
  fimMes.setMonth(fimMes.getMonth() + 1, 1);
  fimMes.setHours(0, 0, 0, 0);
  const dias = Math.max(0, Math.ceil((fimMes.getTime() - Date.now()) / 864e5));
  const [ano, mes] = temporadaAtual().split("-");
  const nomeSkin = (id?: string) => SKINS.find((k) => k.id === id)?.nome ?? "";
  const premium = temPremium(s);
  const celPremium = (n: number, alcancado: boolean) => {
    const pp = PASSE_PREMIUM[n - 1];
    const pegou = s.monet.premiumResgatados.includes(n);
    const skin = pp.skin ? SKINS.find((k) => k.id === pp.skin) : null;
    return h("div", { class: "passe-prem" + (premium ? "" : " travado") + (pegou ? " pegou" : "") },
      h("span", { class: "passe-ic", html: skin ? previaSkin(skin) : imgPremio(pp) }),
      h("small", { html: skin ? skin.nome : textoPremio(pp, ICONE_MOEDA) }),
      !premium ? h("span", { class: "cad", html: ic("cadeado") })
        : pegou ? h("span", { class: "passe-ok", html: ic("check") })
        : h("button", { class: "btn ouro pequeno", disabled: !alcancado, html: alcancado ? "Pegar" : ic("cadeado"),
          onclick: (ev: MouseEvent) => {
            const o = ret(ev);
            const r = resgatarPremium(s, n);
            if (!r) return;
            nav.persistir();
            nav.ir("passe");
            if (r.skin) { audio.sfx("vitoria"); toast(nav.root, `Skin desbloqueada: ${nomeSkin(r.skin)}!`); }
            celebrar(nav.root, o, pp, r.chip, `PREMIUM · NÍVEL ${n}`);
          } }));
  };
  const linhas = PASSE_PREMIOS.map((p, i) => {
    const n = i + 1;
    const alcancado = nivel >= n;
    const pegou = s.passe.resgatados.includes(n);
    const destaque = !!p.skin || n % 10 === 0;
    return h("div", { class: "passe-nivel neon" + (destaque ? " ouro" : "") + (alcancado ? "" : " futuro") + (pegou ? " pegou" : "") },
      h("span", { class: "passe-n", text: String(n) }),
      h("span", { class: "passe-ic", html: p.skin ? previaSkin(SKINS.find((k) => k.id === p.skin)!) : imgPremio(p) }),
      h("div", { class: "loja-txt" }, h("b", { html: p.skin ? `Skin: ${nomeSkin(p.skin)}` : textoPremio(p, ICONE_MOEDA) }), p.skin && (p.cristais || p.chip !== undefined) ? h("span", { html: textoPremio(p, ICONE_MOEDA) }) : null),
      pegou ? h("span", { class: "passe-ok", html: ic("check") })
        : h("button", { class: "btn ouro pequeno", disabled: !alcancado, html: alcancado ? "Resgatar" : ic("cadeado"),
          onclick: (ev: MouseEvent) => {
            const o = ret(ev);
            const r = resgatarPasse(s, n);
            if (!r) return;
            nav.persistir();
            nav.ir("passe");
            if (r.skin) { audio.sfx("vitoria"); toast(nav.root, `Skin desbloqueada: ${nomeSkin(r.skin)}!`); }
            celebrar(nav.root, o, p, r.chip, `PASSE · NÍVEL ${n}`);
          } }));
  }).map((linhaGratis, i) => h("div", { class: "passe-linha" }, linhaGratis, celPremium(i + 1, nivel >= i + 1)));
  const produtoPremium = PRODUTOS.find((x) => x.id === "passe_premium")!;
  return tela(nav, "PASSE DE BATALHA",
    h("div", { class: "cartao neon roxo passe-topo" },
      h("div", { class: "nome", text: `Temporada ${mes}/${ano} · Gratuito` }),
      h("div", { class: "pat-nome", text: `Nível ${nivel} de ${PASSE.niveis}` }),
      h("div", { class: "perfil-barra" }, h("i", { style: `width:${Math.round(frac * 100)}%` })),
      h("div", { class: "desc", html: `${ic("relogio")} termina em ${dias} dia${dias === 1 ? "" : "s"} · cada nível = ${fmtInt(PASSE.pontosPorNivel)} pontos de partida` }),
      premium ? h("div", { class: "premium-ativo", html: `${ic("coroa", "ic ic-ouro")} Premium ativo nesta temporada` })
        : h("button", { class: "btn ouro", html: `${ic("coroa")}<span>Liberar Premium · ${precoBRL(produtoPremium.centavos)}</span>`,
          onclick: async () => {
            const r = await iniciarCompra(s, "passe_premium");
            toast(nav.root, r.msg);
            if (r.ok && MODO_PAGAMENTO === "teste") { audio.sfx("vitoria"); nav.persistir(); nav.ir("passe"); }
          } })),
    seloTeste(),
    h("div", { class: "passe-cab" }, h("span", { text: "GRÁTIS" }), h("span", { text: "PREMIUM" })),
    ...linhas);
}
