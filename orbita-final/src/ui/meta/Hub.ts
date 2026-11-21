import { AVATARES, CORREIO, LOGIN_DIAS, LOJA, BONUS_DIARIAS, PATENTES } from "../../data/comandante";
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SLOTS, CHIP_SLOT_NOME } from "../../data/chips";
import { SENTINEL_IDS } from "../../data/sentinels";
import { STAGES } from "../../data/stages";
import { audio } from "../../core/Audio";
import type { Chip } from "../../data/types";
import {
  atualizarDia, comprar, diariasProntas, loginDisponivel, mensagensNovas, missoesDoDia, patenteDe, resgatarBonusDiario,
  resgatarDiaria, resgatarLogin, resgatarMensagem, textoPremio,
} from "../../meta/Comandante";
import { desafioDoDia, formatStat, hojeStr, missoesProntas, semanaStr } from "../../meta/Meta";
import { urlArte } from "../../render/Sprites";
import { fmtInt, fmtTempo, h, ICONE_MOEDA, iconeImg, toast } from "../dom";
import { ic, icT } from "../Icones";
import { moedas, proximaFase, tela, type Nav } from "./Screens";

// ------------------------------------------------------------------ peças

export function avatar(n: number, classe = "avatar"): HTMLElement {
  const url = urlArte(`avatar_${n}`);
  const cor = AVATARES.find((a) => a.id === n)?.cor ?? "#4fd6ff";
  return h("span", { class: classe, style: `--cor:${cor}`, html: url ? `<img src="${url}" alt="">` : ic("usuario") });
}

function perfilCard(nav: Nav): HTMLElement {
  const s = nav.save;
  const pt = patenteDe(s.pontos);
  return h("button", { class: "perfil", onclick: () => nav.ir("progresso") },
    avatar(s.perfil.avatar),
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
        lateral("passe", "Passe de Batalha", emBreve(nav, "Passe de Batalha")),
        lateral("carrinho", "Loja", () => nav.ir("loja"), s.dia.lojaGratis ? 0 : 1, "lat-ouro"))),
    h("button", { class: "btn-batalha", onclick: () => nav.jogarCampanha(idx, false) },
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
          onclick: () => { if (resgatarMensagem(s, m.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("correio"); } } })) : null);
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
        pronta ? h("button", { class: "btn ouro pequeno", text: "Resgatar", onclick: () => { if (resgatarDiaria(s, m.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("missoes"); } } })
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
          onclick: () => { if (resgatarBonusDiario(s)) { audio.sfx("nivel"); nav.persistir(); nav.ir("missoes"); } } }))),
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
    return h("div", { class: "dia" + (feito ? " feito" : "") + (atual ? " atual" : "") + (i === 6 ? " grande" : "") },
      h("small", { text: `Dia ${i + 1}` }),
      h("span", { class: "dia-premio", html: textoPremio(p, ICONE_MOEDA).replace(/ &nbsp;/g, "<br>") }),
      feito ? h("span", { class: "dia-ok", html: ic("check") }) : null);
  });
  return tela(nav, "RECOMPENSAS",
    h("div", { class: "cartao desc", text: "Entre todo dia para resgatar. O 7º dia dá um chip épico garantido." }),
    h("div", { class: "dias" }, ...dias),
    h("button", { class: "btn ouro", disabled: !pode, html: pode ? icT("presente", "Resgatar recompensa de hoje") : icT("check", "Volte amanhã"),
      onclick: () => {
        const r = resgatarLogin(s);
        if (!r) return;
        audio.sfx("vitoria");
        nav.persistir();
        toast(nav.root, r.chip ? `Novo chip ${CHIP_RARIDADES[r.chip.raridade]}!` : "Recompensa resgatada!");
        nav.ir("recompensas");
      } }));
}

// ------------------------------------------------------------------ LOJA

export function telaLoja(nav: Nav): HTMLElement {
  const s = nav.save;
  atualizarDia(s);
  const itens = LOJA.map((it) => {
    const gratisUsado = !it.custo && s.dia.lojaGratis;
    const podePagar = !it.custo || s[it.custo.moeda] >= it.custo.valor;
    const preco = it.custo ? `${ICONE_MOEDA[it.custo.moeda]} ${fmtInt(it.custo.valor)}` : "Grátis";
    return h("div", { class: "loja-item" + (it.custo ? "" : " gratis") },
      h("span", { class: "loja-ic", html: iconeImg(it.icone, ic("caixa"), "loja-img") }),
      h("div", { class: "loja-txt" }, h("b", { text: it.nome }), h("span", { text: it.desc })),
      h("button", { class: "btn " + (it.custo ? "primario" : "ouro") + " pequeno", disabled: gratisUsado || !podePagar, html: gratisUsado ? "Amanhã" : preco,
        onclick: () => {
          const r = comprar(s, it.id);
          if (!r.ok) { toast(nav.root, r.msg); return; }
          audio.sfx("nivel");
          nav.persistir();
          toast(nav.root, r.chip ? `Chip ${CHIP_RARIDADES[r.chip.raridade]}: ${CHIP_SET_MAP[r.chip.set]?.nome}` : r.msg);
          nav.ir("loja");
        } }));
  });
  return tela(nav, "LOJA", h("div", { class: "cartao desc", text: "Tudo com moedas do jogo. Cristais vêm de missões, conquistas, eventos e recompensas diárias." }), ...itens);
}

// ------------------------------------------------------------------ PROGRESSO (perfil e patentes)

export function telaProgresso(nav: Nav): HTMLElement {
  const s = nav.save;
  const pt = patenteDe(s.pontos);
  const e = s.estatisticas;
  const est = (k: string, v: string) => h("div", { class: "est-item" }, h("b", { text: v }), h("small", { text: k }));
  const el = tela(nav, "PROGRESSO",
    h("div", { class: "cartao perfil-grande" },
      avatar(s.perfil.avatar, "avatar grande"),
      h("div", { style: "flex:1;min-width:0" },
        h("div", { class: "nome", text: `Cmd. ${s.perfil.nome || "Comandante"}` }),
        h("div", { class: "pat-nome", text: pt.atual.nome }),
        h("div", { class: "perfil-barra" }, h("i", { style: `width:${Math.round(pt.frac * 100)}%` })),
        h("div", { class: "desc", text: pt.prox ? `${fmtInt(s.pontos)} / ${fmtInt(pt.prox.pontos)} pontos para ${pt.prox.nome}` : `${fmtInt(s.pontos)} pontos · patente máxima` })),
      h("button", { class: "btn icone", html: ic("usuario"), "aria-label": "Editar perfil", onclick: () => nav.ir("login") })),
    h("div", { class: "estatisticas" },
      est("Partidas", fmtInt(e.partidas ?? 0)), est("Abates", fmtInt(e.abates ?? 0)), est("Chefes", fmtInt(e.chefes ?? 0)),
      est("Estrelas", fmtInt(e.estrelas ?? 0)), est("Evoluções", fmtInt(e.evolucoes ?? 0)), est("Melhor partida", `${fmtInt(e.melhorPartida ?? 0)} pts`),
      est("Sobrevivência", fmtTempo(s.sobrevivenciaMelhor)), est("Jornadas", fmtInt(e.jornadas ?? 0)), est("Desafios", fmtInt(e.diarios ?? 0))),
    h("div", { class: "cartao" }, h("div", { class: "nome", style: "margin-bottom:6px", text: "Patentes" }),
      ...PATENTES.map((p, i) => h("div", { class: "pat-linha" + (i <= pt.indice ? " ok" : "") + (i === pt.indice ? " atual" : "") },
        h("span", { html: i <= pt.indice ? ic("estrela", "ic-estrela") : ic("cadeado") }), h("b", { text: p.nome }), h("small", { text: `${fmtInt(p.pontos)} pts` })))));
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
