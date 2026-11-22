import { MISSIONS } from "../../data/missions";
import { STAGES } from "../../data/stages";
import { apagar, salvar, saveNovo, type SaveData } from "../../core/Save";
import { resgatarMissao } from "../../meta/Meta";
import { fmtInt, h, ICONE_MOEDA, toast } from "../dom";
import { ic, icT } from "../Icones";
import { celebrar } from "../Premio";
import { nuvem } from "../../core/Nuvem";
import { sincronizarCompras } from "../../meta/Pagamentos";

export interface Nav {
  save: SaveData;
  root: HTMLElement;
  ir(tela: string): void;
  jogarCampanha(idx: number, dif: number): void;
  jogarDiario(): void;
  jogarSobrevivencia(): void;
  jogarJornada(): void;
  aplicarConfig(): void;
  persistir(): void;
  telaAtual(): string;
}

export function moedas(nav: Nav): HTMLElement {
  const s = nav.save;
  const pilula = (m: "creditos" | "nucleos" | "cristais", v: number) =>
    h("button", { class: "pilula", "data-moeda": m, "data-valor": String(v), "aria-label": "Loja", onclick: () => nav.ir("loja") },
      h("span", { class: "moeda", html: `${ICONE_MOEDA[m]} <span class="pil-num">${fmtInt(v)}</span>` }), h("span", { class: "pil-mais", html: ic("mais") }));
  return h("div", { class: "moedas" }, pilula("creditos", s.creditos), pilula("nucleos", s.nucleos), pilula("cristais", s.cristais));
}

export function topo(nav: Nav, titulo: string | null): HTMLElement {
  return h("div", { class: "topo" },
    titulo ? h("button", { class: "btn icone", html: ic("voltar"), "aria-label": "Voltar", onclick: () => nav.ir("hub") })
      : h("button", { class: "btn icone", html: ic("config"), "aria-label": "Configurações", onclick: () => nav.ir("config") }),
    titulo ? h("div", { style: "font-weight:900;letter-spacing:.08em;font-size:18px", text: titulo }) : null,
    moedas(nav));
}

export function tela(nav: Nav, titulo: string, ...conteudo: (HTMLElement | null)[]): HTMLElement {
  return h("div", { class: "tela", style: "background:rgba(5,7,15,0.78)" }, topo(nav, titulo), h("div", { class: "tela-conteudo" }, ...conteudo));
}

export function proximaFase(s: SaveData): number {
  const i = s.campanha.normal.findIndex((x) => x === 0);
  return i < 0 ? STAGES.length - 1 : i;
}

// ------------------------------------------------------------------ HUB

// ------------------------------------------------------------------ MAPA

// ------------------------------------------------------------------ MISSÕES

export function telaMissoes(nav: Nav): HTMLElement {
  const s = nav.save;
  const itens = MISSIONS.map((m) => {
    const v = s.estatisticas[m.stat] ?? 0;
    const feita = s.missoesResgatadas.includes(m.id);
    const pronta = !feita && v >= m.meta;
    const rec = [m.recompensa.creditos ? `${ICONE_MOEDA.creditos} ${m.recompensa.creditos}` : "", m.recompensa.nucleos ? `${ICONE_MOEDA.nucleos} ${m.recompensa.nucleos}` : "", m.recompensa.cristais ? `${ICONE_MOEDA.cristais} ${m.recompensa.cristais}` : ""].filter(Boolean).join("  ");
    return { feita, pronta, el: h("div", { class: "cartao" + (feita ? " bloq" : "") },
      h("div", { class: "cab" }, h("div", { style: "flex:1" }, h("div", { class: "nome", style: "font-size:14px", text: m.texto }), h("div", { class: "desc", html: rec })),
        pronta ? h("button", { class: "btn ouro pequeno", text: "Resgatar", onclick: (ev: MouseEvent) => { const o = (ev.currentTarget as HTMLElement).getBoundingClientRect(); if (resgatarMissao(s, m.id)) { nav.persistir(); nav.ir("conquistas"); celebrar(nav.root, o, m.recompensa); } } })
          : h("span", { style: "font-size:12px;color:var(--texto2)", html: feita ? ic("check") : `${fmtInt(Math.min(v, m.meta))}/${fmtInt(m.meta)}` })),
      h("div", { class: "prog" }, h("b", { style: `width:${Math.min(100, (v / m.meta) * 100)}%` }))) };
  });
  itens.sort((a, b) => Number(b.pronta) - Number(a.pronta) || Number(a.feita) - Number(b.feita));
  return tela(nav, "CONQUISTAS", ...itens.map((i) => i.el));
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
    toggle("Bloom (brilho real)", c.bloom, (b) => (c.bloom = b)),
    toggle("Halo nos projéteis", c.brilho, (b) => (c.brilho = b)),
    toggle("Números de dano", c.numeros, (b) => (c.numeros = b)),
    toggle("Mostrar FPS", c.fps, (b) => (c.fps = b)),
    slider("Som", c.som, (n) => (c.som = n)),
    slider("Música", c.musica, (n) => (c.musica = n)),
  );
  if (!noJogo) {
    // conta na nuvem (só aparece com o Supabase configurado)
    if (nuvem.configurada) {
      if (nuvem.logado()) {
        p.append(h("div", { class: "config-linha" }, h("span", { text: `Conta: ${nuvem.email}` }),
          h("button", { class: "btn pequeno", html: icT("sair", "Sair"), onclick: async () => { await nuvem.sair(); nav.ir("config"); } })));
        p.append(h("div", { class: "config-linha" }, h("span", { text: "Compras" }),
          h("button", { class: "btn pequeno", html: icT("repetir", "Restaurar compras"), onclick: async () => {
            const n = await sincronizarCompras(nav.save).catch(() => 0);
            nav.persistir();
            toast(nav.root, n ? `${n} compra(s) entregue(s)!` : "Nenhuma compra pendente.");
          } })));
      } else {
        const email = h("input", { class: "campo", id: "email-conta", type: "email", placeholder: "seu@email.com", autocomplete: "email" }) as HTMLInputElement;
        p.append(h("div", { class: "config-linha conta" },
          h("span", { text: "Conta na nuvem (salva o progresso e as compras)" }),
          h("div", { class: "campo-linha" }, email),
          h("button", { class: "btn ciano pequeno", html: icT("correio", "Receber link de acesso"), onclick: async () => {
            const v = email.value.trim();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { toast(nav.root, "Digite um e-mail válido."); return; }
            try { await nuvem.entrarEmail(v); toast(nav.root, "Link enviado! Abra o e-mail neste aparelho."); }
            catch (e) { toast(nav.root, `Erro: ${(e as Error).message}`); }
          } })));
      }
    }
    p.append(h("div", { class: "config-linha" }, h("span", { text: `Comandante: ${nav.save.perfil.nome || "—"}` }),
      h("button", { class: "btn pequeno", html: icT("usuario", "Comandantes"), onclick: () => nav.ir("comandantes") })));
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
