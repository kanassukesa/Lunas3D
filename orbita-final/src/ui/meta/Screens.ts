import { BALANCE, custoHangar } from "../../data/balance";
import { CHIP_RARIDADE_COR, CHIP_RARIDADES, CHIP_SET_MAP, CHIP_SETS, CHIP_SLOT_NOME, CHIP_SLOTS } from "../../data/chips";
import { MISSIONS } from "../../data/missions";
import { SENTINELS, SENTINEL_IDS } from "../../data/sentinels";
import { STAGES } from "../../data/stages";
import { BOSSES } from "../../data/bosses";
import { TALENTS } from "../../data/talents";
import type { Chip, SentinelId } from "../../data/types";
import { audio } from "../../core/Audio";
import { apagar, salvar, saveNovo, type SaveData } from "../../core/Save";
import {
  comprarTalento, desafioDoDia, desbloquear, faseLiberada, formatStat, fundir, hojeStr, melhorar, missoesProntas, podeMelhorar, resgatarMissao,
} from "../../meta/Meta";
import { fmtInt, fmtTempo, h, hex, ICONE_MOEDA, toast } from "../dom";

export interface Nav {
  save: SaveData;
  root: HTMLElement;
  ir(tela: string): void;
  jogarCampanha(idx: number, dificil: boolean): void;
  jogarDiario(): void;
  jogarSobrevivencia(): void;
  aplicarConfig(): void;
  persistir(): void;
}

function moedas(s: SaveData): HTMLElement {
  return h("div", { class: "moedas" },
    h("span", { class: "moeda", text: `${ICONE_MOEDA.creditos} ${fmtInt(s.creditos)}` }),
    h("span", { class: "moeda", text: `${ICONE_MOEDA.nucleos} ${fmtInt(s.nucleos)}` }),
    h("span", { class: "moeda", text: `${ICONE_MOEDA.cristais} ${fmtInt(s.cristais)}` }));
}

function topo(nav: Nav, titulo: string | null): HTMLElement {
  return h("div", { class: "topo" },
    titulo ? h("button", { class: "btn icone", text: "‹", "aria-label": "Voltar", onclick: () => nav.ir("hub") }) : null,
    titulo ? h("div", { style: "font-weight:900;letter-spacing:.08em;font-size:18px", text: titulo }) : null,
    moedas(nav.save));
}

function tela(nav: Nav, titulo: string, ...conteudo: (HTMLElement | null)[]): HTMLElement {
  return h("div", { class: "tela", style: "background:rgba(5,7,15,0.78)" }, topo(nav, titulo), h("div", { class: "tela-conteudo" }, ...conteudo));
}

function proximaFase(s: SaveData): number {
  const i = s.campanha.normal.findIndex((x) => x === 0);
  return i < 0 ? STAGES.length - 1 : i;
}

// ------------------------------------------------------------------ HUB

export function telaHub(nav: Nav): HTMLElement {
  const s = nav.save;
  const idx = proximaFase(s);
  const st = STAGES[idx];
  const m = missoesProntas(s);
  const item = (ic: string, nome: string, alvo: string, badge = 0) =>
    h("button", { class: "btn", onclick: () => nav.ir(alvo) }, h("span", { text: ic }), nome, badge ? h("i", { class: "badge", text: String(badge) }) : null);
  return h("div", { class: "tela" },
    topo(nav, null),
    h("div", { class: "logo", html: "ÓRBITA FINAL<small>DEFESA PLANETÁRIA</small>" }),
    h("div", { class: "hub-base" },
      h("button", { class: "btn primario btn-batalha", onclick: () => nav.jogarCampanha(idx, false) },
        "BATALHA", h("small", { text: `Fase ${st.id} · ${st.nome}` })),
      h("div", { class: "grade" },
        item("🗺️", "Fases", "mapa"),
        item("🛰️", "Hangar", "hangar"),
        item("💠", "Chips", "chips"),
        item("🌍", "Planeta", "planeta"),
        item("🎯", "Missões", "missoes", m),
        item("🌀", "Modos", "modos"),
      ),
      h("button", { class: "btn pequeno", style: "align-self:center", text: "⚙ Configurações", onclick: () => nav.ir("config") })));
}

// ------------------------------------------------------------------ MAPA

export function telaMapa(nav: Nav, dificil: boolean): HTMLElement {
  const s = nav.save;
  const difLib = s.campanha.normal[STAGES.length - 1] > 0;
  const abas = h("div", { class: "abas" },
    h("button", { class: "btn pequeno" + (!dificil ? " ativo" : ""), text: "Normal", onclick: () => nav.ir("mapa") }),
    h("button", { class: "btn pequeno" + (dificil ? " ativo" : ""), text: difLib ? "Difícil" : "🔒 Difícil", disabled: !difLib, onclick: () => nav.ir("mapaDificil") }));
  const lista = STAGES.map((st, i) => {
    const lib = faseLiberada(s, i, dificil);
    const est = (dificil ? s.campanha.dificil : s.campanha.normal)[i];
    return h("button", { class: "fase-item" + (lib ? "" : " bloq"), disabled: !lib, onclick: () => nav.jogarCampanha(i, dificil) },
      h("div", { class: "num", text: lib ? String(st.id) : "🔒" }),
      h("div", null, h("div", { style: "font-weight:800", text: st.nome }), h("div", { class: "desc", style: "font-size:12px;color:var(--texto2)", text: `Chefe: ${BOSSES[st.chefe].nome}` })),
      h("div", { class: "est", text: "★".repeat(est) + "☆".repeat(3 - est) }));
  });
  return tela(nav, "FASES", abas, ...lista);
}

// ------------------------------------------------------------------ HANGAR

export function telaHangar(nav: Nav): HTMLElement {
  const s = nav.save;
  const info = h("div", { class: "cartao" },
    h("div", { class: "desc", html: `<b>Deck:</b> 1 sentinela <b>base</b> (começa a partida e define o ultimate) + até ${BALANCE.maxSlots - 1} que podem aparecer como carta.` }));
  const cards = SENTINEL_IDS.map((id) => {
    const def = SENTINELS[id];
    const st = s.sentinelas[id];
    const ehBase = s.deck.base === id;
    const noPool = s.deck.pool.includes(id);
    const acoes = h("div", { class: "acoes" });
    if (!st.desbloqueada) {
      acoes.append(h("button", { class: "btn ciano pequeno", disabled: s.nucleos < def.desbloqueio, text: `Desbloquear ${ICONE_MOEDA.nucleos} ${def.desbloqueio}`,
        onclick: () => { if (desbloquear(s, id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("hangar"); } } }));
    } else {
      const { ok, custo } = podeMelhorar(s, id);
      const max = st.nivel >= BALANCE.hangar.nivelMax;
      acoes.append(h("button", { class: "btn primario pequeno", disabled: !ok, text: max ? "Nível máximo" : `Melhorar ${ICONE_MOEDA.creditos} ${fmtInt(custo)}`,
        onclick: () => { if (melhorar(s, id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("hangar"); } } }));
      acoes.append(h("button", { class: "btn pequeno" + (ehBase ? " ativo" : ""), text: ehBase ? "★ Base" : "Definir base",
        onclick: () => {
          const antiga = s.deck.base;
          s.deck.base = id;
          s.deck.pool = s.deck.pool.filter((x) => x !== id);
          if (!s.deck.pool.includes(antiga) && s.deck.pool.length < BALANCE.maxSlots - 1) s.deck.pool.unshift(antiga);
          nav.persistir();
          nav.ir("hangar");
        } }));
      if (!ehBase) {
        acoes.append(h("button", { class: "btn pequeno" + (noPool ? " ativo" : ""), text: noPool ? "✓ No deck" : "+ Deck",
          onclick: () => {
            if (noPool) s.deck.pool = s.deck.pool.filter((x) => x !== id);
            else if (s.deck.pool.length < BALANCE.maxSlots - 1) s.deck.pool.push(id);
            else { toast(nav.root, `Deck cheio (máx. ${BALANCE.maxSlots - 1})`); return; }
            nav.persistir(); nav.ir("hangar");
          } }));
      }
    }
    const tracos = h("div", { class: "tracos" }, ...def.tracos.map((t) => h("span", { class: "traco" + (st.nivel >= t.nivel ? " on" : ""), text: `Nv${t.nivel}: ${t.texto}` })));
    const danoBonus = Math.round(BALANCE.hangar.danoPorNivel * (st.nivel - 1) * 100);
    return h("div", { class: "cartao" + (st.desbloqueada ? "" : " bloq") },
      h("div", { class: "cab" }, h("i", { class: "dot", style: `background:${hex(def.cor)};width:18px;height:18px` }),
        h("div", { style: "flex:1" }, h("div", { class: "nome", text: def.nome }), h("div", { style: "font-size:12px;color:var(--texto2)", text: `${def.papel} · Nível ${st.nivel}/${BALANCE.hangar.nivelMax}${danoBonus ? ` · +${danoBonus}% dano` : ""}` }))),
      h("div", { class: "desc", text: `${def.desc} Ultimate: ${def.ultimate.nome} — ${def.ultimate.desc} Evolução: ${def.evolucao.nome}.` }),
      tracos, acoes);
  });
  return tela(nav, "HANGAR", info, ...cards);
}

// ------------------------------------------------------------------ CHIPS

let selecionados: number[] = [];
let modoFundir = false;

function descChip(c: Chip): HTMLElement[] {
  return [
    h("b", { text: `${CHIP_SET_MAP[c.set]?.nome ?? c.set} · ${CHIP_SLOT_NOME[c.slot]}` }),
    h("div", { style: `color:${CHIP_RARIDADE_COR[c.raridade]};font-size:11px;font-weight:800`, text: CHIP_RARIDADES[c.raridade] }),
    h("div", { text: formatStat(c.principal.stat, c.principal.valor) }),
    ...c.secundarios.map((x) => h("div", { style: "color:var(--texto2)", text: formatStat(x.stat, x.valor) })),
  ];
}

export function telaChips(nav: Nav): HTMLElement {
  const s = nav.save;
  const slots = h("div", { class: "slots" }, ...CHIP_SLOTS.map((slot) => {
    const c = s.chips.find((x) => x.uid === s.equipados[slot]);
    if (!c) return h("div", { class: "slot" }, h("b", { text: CHIP_SLOT_NOME[slot] }), h("span", { style: "color:var(--texto2)", text: "vazio" }));
    return h("button", { class: "slot cheio", style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}`, onclick: () => { delete s.equipados[slot]; nav.persistir(); nav.ir("chips"); } },
      h("b", { text: CHIP_SLOT_NOME[slot] }), h("span", { text: CHIP_SET_MAP[c.set]?.nome }), h("span", { text: formatStat(c.principal.stat, c.principal.valor) }));
  }));
  // bônus de conjunto ativos
  const porSet: Record<string, number> = {};
  for (const uid of Object.values(s.equipados)) {
    const c = s.chips.find((x) => x.uid === uid);
    if (c) porSet[c.set] = (porSet[c.set] ?? 0) + 1;
  }
  const sets = h("div", { class: "cartao" }, h("div", { style: "font-weight:800;margin-bottom:6px", text: "Bônus de conjunto" }),
    ...CHIP_SETS.map((st) => {
      const n = porSet[st.id] ?? 0;
      return h("div", { class: "desc", html: `<b style="color:${hex(st.cor)}">${st.nome}</b> (${n}/4) — <span style="opacity:${n >= 2 ? 1 : 0.45}">2: ${st.bonus2.texto}</span> · <span style="opacity:${n >= 4 ? 1 : 0.45}">4: ${st.bonus4.texto}</span>` });
    }));
  const ordenados = [...s.chips].sort((a, b) => b.raridade - a.raridade || a.slot.localeCompare(b.slot));
  const lista = h("div", { class: "lista-chips" }, ...ordenados.map((c) => {
    const equip = s.equipados[c.slot] === c.uid;
    return h("button", { class: "chip" + (selecionados.includes(c.uid) ? " sel" : ""), style: `--cor:${CHIP_RARIDADE_COR[c.raridade]}`,
      onclick: () => {
        if (modoFundir) {
          if (selecionados.includes(c.uid)) selecionados = selecionados.filter((u) => u !== c.uid);
          else if (selecionados.length < 3) selecionados.push(c.uid);
        } else {
          if (equip) delete s.equipados[c.slot];
          else s.equipados[c.slot] = c.uid;
          nav.persistir();
        }
        nav.ir("chips");
      } }, ...descChip(c), equip ? h("div", { style: "color:var(--verde);font-weight:800", text: "✓ Equipado" }) : null);
  }));
  const fundirBar = h("div", { class: "acoes" },
    h("button", { class: "btn pequeno" + (modoFundir ? " ativo" : ""), text: modoFundir ? "Cancelar fusão" : "⚗ Fundir 3 → 1",
      onclick: () => { modoFundir = !modoFundir; selecionados = []; nav.ir("chips"); } }),
    modoFundir ? h("button", { class: "btn ouro pequeno", disabled: selecionados.length !== 3, text: `Fundir (${selecionados.length}/3)`,
      onclick: () => {
        const novo = fundir(s, selecionados);
        if (!novo) toast(nav.root, "Escolha 3 chips do mesmo encaixe e raridade");
        else { audio.sfx("nivel"); toast(nav.root, `Novo chip ${CHIP_RARIDADES[novo.raridade]}!`); modoFundir = false; nav.persistir(); }
        selecionados = [];
        nav.ir("chips");
      } }) : null);
  return tela(nav, "CHIPS", slots, sets, fundirBar,
    s.chips.length ? lista : h("div", { class: "cartao desc", text: "Você ainda não tem chips. Vença fases para ganhar." }));
}

// ------------------------------------------------------------------ PLANETA (talentos)

export function telaPlaneta(nav: Nav): HTMLElement {
  const s = nav.save;
  return tela(nav, "PLANETA", ...TALENTS.map((t) => {
    const n = s.talentos[t.id] ?? 0;
    const max = n >= t.max;
    const custo = max ? 0 : t.custo(n);
    const pode = !max && s[t.moeda] >= custo;
    return h("div", { class: "cartao" },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", text: t.nome }), h("div", { class: "desc", text: t.desc })),
        h("div", { style: "font-weight:800", text: `${n}/${t.max}` })),
      h("div", { class: "prog" }, h("b", { style: `width:${(n / t.max) * 100}%` })),
      h("div", { class: "acoes" }, h("button", { class: "btn primario pequeno", disabled: !pode, text: max ? "Máximo" : `Melhorar ${ICONE_MOEDA[t.moeda]} ${fmtInt(custo)}`,
        onclick: () => { if (comprarTalento(s, t.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("planeta"); } } })));
  }));
}

// ------------------------------------------------------------------ MISSÕES

export function telaMissoes(nav: Nav): HTMLElement {
  const s = nav.save;
  const itens = MISSIONS.map((m) => {
    const v = s.estatisticas[m.stat] ?? 0;
    const feita = s.missoesResgatadas.includes(m.id);
    const pronta = !feita && v >= m.meta;
    const rec = [m.recompensa.creditos ? `${ICONE_MOEDA.creditos} ${m.recompensa.creditos}` : "", m.recompensa.nucleos ? `${ICONE_MOEDA.nucleos} ${m.recompensa.nucleos}` : "", m.recompensa.cristais ? `${ICONE_MOEDA.cristais} ${m.recompensa.cristais}` : ""].filter(Boolean).join("  ");
    return { feita, pronta, el: h("div", { class: "cartao" + (feita ? " bloq" : "") },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", style: "font-size:14px", text: m.texto }), h("div", { class: "desc", text: rec })),
        pronta ? h("button", { class: "btn ouro pequeno", text: "Resgatar", onclick: () => { if (resgatarMissao(s, m.id)) { audio.sfx("nivel"); nav.persistir(); nav.ir("missoes"); } } })
          : h("span", { style: "font-size:12px;color:var(--texto2)", text: feita ? "✓" : `${fmtInt(Math.min(v, m.meta))}/${fmtInt(m.meta)}` })),
      h("div", { class: "prog" }, h("b", { style: `width:${Math.min(100, (v / m.meta) * 100)}%` }))) };
  });
  itens.sort((a, b) => Number(b.pronta) - Number(a.pronta) || Number(a.feita) - Number(b.feita));
  return tela(nav, "MISSÕES", ...itens.map((i) => i.el));
}

// ------------------------------------------------------------------ MODOS

export function telaModos(nav: Nav): HTMLElement {
  const s = nav.save;
  const d = desafioDoDia();
  if (s.diario.data !== hojeStr()) {
    s.diario = { data: hojeStr(), melhor: 0, concluido: false };
    nav.persistir();
  }
  return tela(nav, "MODOS",
    h("div", { class: "cartao" },
      h("div", { class: "nome", style: "font-weight:900;font-size:17px", text: "📅 Desafio Diário" }),
      h("div", { class: "desc", html: `<b>${d.mod.nome}:</b> ${d.mod.desc}<br>Base: fase ${d.stage.id} · chefe ${BOSSES[d.stage.chefe].nome}. A mesma seed para todos hoje.` }),
      h("div", { class: "desc", text: s.diario.concluido ? "✓ Concluído hoje" : s.diario.melhor ? `Melhor tempo hoje: ${fmtTempo(s.diario.melhor)}` : "Ainda não jogado hoje" }),
      h("div", { class: "acoes" }, h("button", { class: "btn primario", text: "Jogar desafio", onclick: () => nav.jogarDiario() }))),
    h("div", { class: "cartao" },
      h("div", { class: "nome", style: "font-weight:900;font-size:17px", text: "♾️ Sobrevivência Infinita" }),
      h("div", { class: "desc", text: "Ondas sem fim que ficam mais fortes. Um chefe a cada 3 minutos. Até onde você aguenta?" }),
      h("div", { class: "desc", text: `Recorde: ${fmtTempo(s.sobrevivenciaMelhor)}` }),
      h("div", { class: "acoes" }, h("button", { class: "btn primario", text: "Sobreviver", onclick: () => nav.jogarSobrevivencia() }))),
    h("div", { class: "cartao bloq" },
      h("div", { class: "nome", style: "font-weight:900;font-size:17px", text: "🧭 Jornada (em breve)" }),
      h("div", { class: "desc", text: "Sequência de fases sem cura entre elas, com efeitos de campo semanais." })));
}

// ------------------------------------------------------------------ CONFIG

export function painelConfig(nav: Nav, voltar: () => void, noJogo = false): HTMLElement {
  const c = nav.save.config;
  const toggle = (rot: string, v: boolean, set: (b: boolean) => void) =>
    h("div", { class: "config-linha" }, h("span", { text: rot }),
      h("button", { class: "btn pequeno" + (v ? " ativo" : ""), text: v ? "Ligado" : "Desligado", onclick: () => { set(!v); nav.aplicarConfig(); nav.persistir(); voltar(); } }));
  const slider = (rot: string, v: number, set: (n: number) => void) => {
    const inp = h("input", { type: "range", min: "0", max: "1", step: "0.05", value: String(v) }) as HTMLInputElement;
    inp.addEventListener("input", () => { set(Number(inp.value)); nav.aplicarConfig(); });
    inp.addEventListener("change", () => nav.persistir());
    return h("div", { class: "config-linha" }, h("span", { text: rot }), inp);
  };
  const p = h("div", { class: "painel" },
    h("div", { class: "config-linha" }, h("span", { text: "Efeitos" }),
      h("div", { class: "abas" },
        h("button", { class: "btn pequeno" + (c.efeitos === "completo" ? " ativo" : ""), text: "Completos", onclick: () => { c.efeitos = "completo"; nav.aplicarConfig(); nav.persistir(); voltar(); } }),
        h("button", { class: "btn pequeno" + (c.efeitos === "leve" ? " ativo" : ""), text: "Leves", onclick: () => { c.efeitos = "leve"; nav.aplicarConfig(); nav.persistir(); voltar(); } }))),
    toggle("Brilho extra (bloom)", c.brilho, (b) => (c.brilho = b)),
    toggle("Números de dano", c.numeros, (b) => (c.numeros = b)),
    toggle("Mostrar FPS", c.fps, (b) => (c.fps = b)),
    slider("Som", c.som, (n) => (c.som = n)),
    slider("Música", c.musica, (n) => (c.musica = n)),
  );
  if (!noJogo) {
    p.append(h("div", { class: "config-linha" }, h("span", { text: "Apagar progresso" }),
      h("button", { class: "btn pequeno", style: "color:var(--vermelho)", text: "Apagar", onclick: () => {
        if (!confirm("Apagar todo o progresso? Isso não pode ser desfeito.")) return;
        apagar();
        Object.assign(nav.save, saveNovo());
        salvar(nav.save);
        nav.ir("hub");
      } })));
  }
  return p;
}

export function telaConfig(nav: Nav): HTMLElement {
  return tela(nav, "CONFIGURAÇÕES", painelConfig(nav, () => nav.ir("config")),
    h("div", { class: "cartao desc", html: "Dica: no iPhone, toque em <b>Compartilhar → Adicionar à Tela de Início</b> para jogar em tela cheia." }));
}

export function custoHangarTexto(n: number): string {
  return fmtInt(custoHangar(n));
}

export type { SentinelId };
