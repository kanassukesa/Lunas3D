import type { Battle } from "../battle/Battle";
import { CAMPOS } from "../data/journey";
import { BOSSES } from "../data/bosses";
import { audio } from "../core/Audio";
import { BALANCE } from "../data/balance";
import { aparencia } from "../render/Aparencia";
import { urlArte } from "../render/Sprites";
import { fmtInt, fmtTempo, h, iconeImg } from "./dom";
import { ic } from "./Icones";

export interface HudAcoes {
  pausar(): void;
  velocidade(): void;
  cartas(): void;
  ultimate(): void;
  habilidade(): void;
}

const SEGMENTOS = 10;
/** Mapa (textura) do planeta da skin equipada: o ícone do HUD gira igual ao planeta da batalha. */
function mapaDaSkin(): string | null {
  const id = aparencia.planeta;
  return urlArte(id === "planeta_terra" ? "planeta_mapa" : `planeta_mapa_${id.replace("planeta_", "")}`) ?? urlArte("planeta_mapa");
}

/** Ícones do HUD em pixel art (src/assets/hud/hud_ic_<nome>.png); sem a arte, o ícone vetorial de antes. */
const HUD_PX = import.meta.glob("../assets/hud/hud_ic_*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
function icPx(nome: string, reserva: string): string {
  const url = HUD_PX[`../assets/hud/hud_ic_${nome}.png`];
  return url ? `<img class="ic-px" src="${url}" alt="">` : reserva;
}

const CAMPO_ICONE: Record<string, string> = Object.fromEntries(CAMPOS.map((c) => [c.id, c.icone]));

/** HUD da batalha (DOM por cima do canvas), atualizado só quando os valores mudam. */
export class Hud {
  readonly el: HTMLElement;
  private segs: HTMLElement[] = [];
  private segWrap: HTMLElement;
  private hpNum: HTMLElement;
  private escudo: HTMLElement;
  private escNum: HTMLElement;
  private planeta: HTMLElement;
  private nivelBox: HTMLElement;
  private tempo: HTMLElement;
  private nivel: HTMLElement;
  private xp: HTMLElement;
  private vel: HTMLButtonElement;
  private ult: HTMLButtonElement;
  private chefe: HTMLElement;
  private chefeNome: HTMLElement;
  private chefeBarra: HTMLElement;
  private aviso: HTMLElement;
  private fps: HTMLElement;
  private dica: HTMLElement;
  private combo: HTMLElement;
  private hab: HTMLButtonElement;
  private fase: HTMLElement;
  private campos: HTMLElement;
  readonly flash: HTMLElement;
  private cache: Record<string, string | number | boolean> = {};

  constructor(nomeFase: string, acoes: HudAcoes) {
    this.segWrap = h("div", { class: "barra-seg" });
    for (let i = 0; i < SEGMENTOS; i++) {
      const b = h("b");
      this.segWrap.append(h("i", null, b));
      this.segs.push(b);
    }
    this.hpNum = h("span", { class: "hud-num" });
    this.escudo = h("b");
    this.escNum = h("span", { class: "hud-esc-num" });
    const mapa = mapaDaSkin();
    this.planeta = h("div", { class: "hud-planeta" },
      h("span", { class: "hud-planeta-mapa", style: mapa ? `background-image:url('${mapa}')` : "" }));
    this.tempo = h("div", { class: "hud-tempo", text: "00:00" });
    this.nivel = h("b", { text: "1" });
    this.xp = h("b");
    this.nivelBox = h("div", { class: "hud-nivel" }, h("span", { class: "hud-nivel-selo" }, h("small", { text: "LV" }), this.nivel));
    this.vel = h("button", { class: "btn icone", text: "x1", onclick: () => acoes.velocidade() });
    this.ult = h("button", { class: "hud-ult", onclick: () => acoes.ultimate() }, h("span", { html: icPx("raio", iconeImg("icone_ultimate", ic("raio", "ic-ult"), "ic-ult")) }), h("small", { text: "ULTIMATE" }));
    this.chefeNome = h("div");
    this.chefeBarra = h("b");
    this.chefe = h("div", { class: "hud-chefe oculto" }, this.chefeNome, h("div", { class: "barra" }, this.chefeBarra));
    this.aviso = h("div", { class: "aviso oculto" });
    this.fps = h("div", { class: "fps" });
    this.dica = h("div", { class: "dica oculto" });
    this.combo = h("div", { class: "hud-combo oculto" });
    this.hab = h("button", { class: "hud-hab", "aria-label": "Onda de choque", onclick: () => acoes.habilidade() },
      h("span", { html: icPx("choque", ic("radiacao")) }), h("small", { text: "CHOQUE" }));
    this.fase = h("div", { class: "hud-fase", text: nomeFase });
    this.campos = h("div", { class: "hud-campos" });
    this.flash = h("div", { class: "flash" });

    this.el = h(
      "div",
      { class: "hud" },
      this.flash,
      h(
        "div",
        { class: "hud-top" },
        h("div", { class: "hud-hp" }, this.planeta,
          h("div", { class: "hud-barras" },
            h("div", { class: "hud-linha-hp" }, h("span", { class: "hud-rotulo", html: icPx("coracao", ic("coracao")) }), h("div", { class: "hud-hp-barra" }, this.segWrap, this.hpNum)),
            h("div", { class: "hud-linha-esc" }, h("span", { class: "hud-rotulo esc", html: icPx("escudo", ic("escudo")) }), h("div", { class: "barra-escudo" }, this.escudo, this.escNum)))),
        h(
          "div",
          { class: "hud-centro" },
          this.fase,
          h(
            "div",
            { class: "hud-botoes" },
            h("button", { class: "btn icone", html: icPx("pausar", ic("pausar")), "aria-label": "Pausar", onclick: () => acoes.pausar() }),
            this.vel,
            h("button", { class: "btn icone", html: icPx("cartas", ic("cartas")), "aria-label": "Cartas", onclick: () => acoes.cartas() }),
          ),
        ),
        h("div", { class: "hud-dir" }, this.tempo, this.nivelBox),
        // barra de experiência na largura toda, colada embaixo do HUD: dá para ver o progresso a cada inimigo
        h("div", { class: "barra-xp" }, this.xp),
      ),
      this.chefe,
      this.campos,
      this.aviso,
      this.dica,
      this.ult,
      this.hab,
      this.combo,
      this.fps,
    );
  }

  private set(k: string, v: string | number | boolean): boolean {
    if (this.cache[k] === v) return false;
    this.cache[k] = v;
    return true;
  }

  private tuto: HTMLElement | null = null;

  /** Balão do tutorial apontando para um elemento do HUD (seta embaixo/em cima conforme a posição). */
  apontar(seletor: string | null, texto = ""): void {
    this.tuto?.remove();
    this.tuto = null;
    if (!seletor) return;
    const alvo = this.el.querySelector<HTMLElement>(seletor);
    if (!alvo) return;
    const r = alvo.getBoundingClientRect();
    const embaixo = r.top > window.innerHeight / 2;
    const b = h("div", { class: "tuto " + (embaixo ? "acima" : "abaixo") }, h("span", { text: texto }));
    const cx = r.left + r.width / 2;
    const larg = Math.min(250, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - larg - 12, cx - larg / 2));
    b.style.width = larg + "px";
    b.style.left = left + "px";
    b.style.setProperty("--seta", `${cx - left}px`);
    if (embaixo) b.style.bottom = `${window.innerHeight - r.top + 14}px`;
    else b.style.top = `${r.bottom + 14}px`;
    const anel = h("div", { class: "tuto-anel", style: `left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px` });
    const wrap = h("div", { class: "tuto-wrap" }, anel, b);
    this.el.append(wrap);
    this.tuto = wrap;
  }

  mostrarDica(txt: string | null): void {
    if (!this.set("dica", txt ?? "")) return;
    this.dica.classList.toggle("oculto", !txt);
    if (txt) this.dica.textContent = txt;
  }

  update(b: Battle, velocidade: number, fps: number | null, flash: number): void {
    const p = b.planet;
    const frac = Math.max(0, p.hp / p.hpMax);
    const fq = Math.round(frac * 200) / 200;
    if (this.set("hp", fq)) {
      const per = 1 / SEGMENTOS;
      this.segs.forEach((s, i) => {
        const f = Math.max(0, Math.min(1, (fq - i * per) / per));
        s.style.transform = `scaleX(${f})`;
      });
      this.segWrap.classList.toggle("baixa", fq < 0.3);
    }
    if (this.set("hpn", Math.ceil(p.hp))) this.hpNum.textContent = fmtInt(Math.ceil(p.hp));
    const ef = p.escudoMax ? Math.round((p.escudo / p.escudoMax) * 100) : 0;
    if (this.set("esc", ef)) {
      this.escudo.style.width = ef + "%";
      this.planeta.style.setProperty("--esc", String(ef));
    }
    if (this.set("escn", Math.ceil(p.escudo))) this.escNum.textContent = p.escudoMax ? fmtInt(Math.ceil(p.escudo)) : "";

    const modoInf = b.cfg.modo === "sobrevivencia";
    const tShow = modoInf ? b.t : b.boss ? b.t : Math.max(0, b.entradaChefe() - b.t);
    if (b.cfg.modo === "jornada" && this.set("fase", b.etapa)) {
      this.fase.textContent = `Jornada ${b.etapa + 1}/${b.cfg.etapas?.length ?? 1}`;
      this.campos.innerHTML = [...b.campo.ativos].map((id) => ic(CAMPO_ICONE[id] ?? "alerta")).join("");
    }
    if (this.set("t", Math.floor(tShow))) this.tempo.textContent = fmtTempo(tShow);
    if (this.set("lv", b.nivel)) {
      this.nivel.textContent = String(b.nivel);
      if (b.nivel > 1) {
        this.nivelBox.classList.remove("subiu");
        void this.nivelBox.offsetWidth;
        this.nivelBox.classList.add("subiu");
      }
    }
    const xpf = Math.round((b.xp / b.xpNext) * 100);
    if (this.set("xp", xpf)) this.xp.style.width = xpf + "%";
    if (this.set("vel", velocidade)) this.vel.textContent = `x${velocidade}`;

    const up = Math.floor(b.ult.energia);
    const pronto = b.ult.pronto();
    if (this.set("ult", up) || this.set("ultp", pronto)) {
      this.ult.style.setProperty("--p", String(up));
      this.ult.classList.toggle("pronto", pronto);
    }

    // habilidade ativa
    const habP = Math.round((1 - Math.max(0, b.habilidadeCd) / BALANCE.habilidade.recarga) * 100);
    if (this.set("hab", habP)) {
      this.hab.style.setProperty("--p", String(habP));
      this.hab.classList.toggle("pronto", habP >= 100);
    }
    // combo
    const mostra = b.combo >= 5;
    if (this.set("comboV", mostra ? b.combo : 0)) {
      this.combo.classList.toggle("oculto", !mostra);
      if (mostra) {
        const m = b.multCombo();
        this.combo.innerHTML = `<b>${b.combo}</b><span>COMBO</span>${m > 1 ? `<em>x${m.toFixed(1)}</em>` : ""}`;
        this.combo.classList.remove("pulo");
        void this.combo.offsetWidth;
        this.combo.classList.add("pulo");
      }
    }

    const boss = b.boss && b.boss.alive ? b.boss : null;
    if (this.set("boss", !!boss)) {
      this.chefe.classList.toggle("oculto", !boss);
      if (boss) this.chefeNome.textContent = boss.boss!.def.nome.toUpperCase();
    }
    if (boss) {
      const bf = Math.round((boss.hp / boss.hpMax) * 1000) / 10;
      if (this.set("bossHp", bf)) this.chefeBarra.style.width = Math.max(0, bf) + "%";
    }
    const transicao = b.transicao > 0;
    const aviso = (b.avisoChefe && !boss) || transicao;
    if (this.set("aviso", aviso) || this.set("trans", transicao)) {
      this.aviso.classList.toggle("oculto", !aviso);
      this.aviso.classList.toggle("ok", transicao);
      this.aviso.classList.toggle("chefe", !transicao && aviso);
      this.el.classList.toggle("alerta-chefe", !transicao && aviso);
      const nomeChefe = BOSSES[b.cfg.stage.chefe]?.nome ?? "Chefe";
      const retrato = urlArte(`retrato_${b.cfg.stage.chefe}`);
      this.aviso.innerHTML = transicao ? `${ic("check")} ETAPA ${b.etapa + 1} CONCLUÍDA`
        : `<div class="av-faixa"><div class="av-listra"></div>${retrato ? `<img class="av-retrato" src="${retrato}" alt="" style="height:72px;image-rendering:pixelated;margin-right:10px">` : ""}<div class="av-corpo"><span class="av-tag">${ic("alerta")} ALERTA ${ic("alerta")}</span><b>${nomeChefe.toUpperCase()}</b><small>se aproximando do planeta</small></div><div class="av-listra"></div></div>`;
      if (!transicao && aviso) audio.sfx("alerta");
    }

    if (this.set("fps", fps === null ? -1 : Math.round(fps))) this.fps.textContent = fps === null ? "" : `${Math.round(fps)} FPS · ${b.inimigosVivos()} inim · ${b.projs.length} proj`;
    const fl = Math.round(flash * 20) / 20;
    if (this.set("flash", fl)) this.flash.style.opacity = String(fl);
  }
}
