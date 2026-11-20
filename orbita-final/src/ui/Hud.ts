import type { Battle } from "../battle/Battle";
import { BALANCE } from "../data/balance";
import { fmtInt, fmtTempo, h } from "./dom";

export interface HudAcoes {
  pausar(): void;
  velocidade(): void;
  cartas(): void;
  ultimate(): void;
  foco(): void;
}

const SEGMENTOS = 10;

/** HUD da batalha (DOM por cima do canvas), atualizado só quando os valores mudam. */
export class Hud {
  readonly el: HTMLElement;
  private segs: HTMLElement[] = [];
  private segWrap: HTMLElement;
  private hpNum: HTMLElement;
  private escudo: HTMLElement;
  private tempo: HTMLElement;
  private nivel: HTMLElement;
  private xp: HTMLElement;
  private vel: HTMLButtonElement;
  private ult: HTMLButtonElement;
  private chefe: HTMLElement;
  private chefeNome: HTMLElement;
  private chefeBarra: HTMLElement;
  private aviso: HTMLElement;
  private foco: HTMLButtonElement;
  private fps: HTMLElement;
  private dica: HTMLElement;
  readonly flash: HTMLElement;
  private cache: Record<string, string | number | boolean> = {};

  constructor(nomeFase: string, acoes: HudAcoes) {
    this.segWrap = h("div", { class: "barra-seg" });
    for (let i = 0; i < SEGMENTOS; i++) {
      const b = h("b");
      this.segWrap.append(h("i", null, b));
      this.segs.push(b);
    }
    this.hpNum = h("div", { class: "hud-num" });
    this.escudo = h("b");
    this.tempo = h("div", { class: "hud-tempo", text: "00:00" });
    this.nivel = h("span", { text: "Lv.1" });
    this.xp = h("b");
    this.vel = h("button", { class: "btn icone", text: "x1", onclick: () => acoes.velocidade() });
    this.ult = h("button", { class: "hud-ult", onclick: () => acoes.ultimate() }, h("span", { text: "⚡" }), h("small", { text: "ULTIMATE" }));
    this.chefeNome = h("div");
    this.chefeBarra = h("b");
    this.chefe = h("div", { class: "hud-chefe oculto" }, this.chefeNome, h("div", { class: "barra" }, this.chefeBarra));
    this.aviso = h("div", { class: "aviso oculto", text: "⚠ CHEFE SE APROXIMANDO ⚠" });
    this.foco = h("button", { class: "btn pequeno hud-foco oculto", onclick: () => acoes.foco() });
    this.fps = h("div", { class: "fps" });
    this.dica = h("div", { class: "dica oculto" });
    this.flash = h("div", { class: "flash" });

    this.el = h(
      "div",
      { class: "hud" },
      this.flash,
      h(
        "div",
        { class: "hud-top" },
        h("div", { class: "hud-hp" }, h("div", { class: "hud-planeta" }), h("div", { class: "hud-barras" }, this.segWrap, h("div", { class: "barra-escudo" }, this.escudo), this.hpNum)),
        h(
          "div",
          { class: "hud-centro" },
          h("div", { class: "hud-fase", text: nomeFase }),
          h(
            "div",
            { class: "hud-botoes" },
            h("button", { class: "btn icone", text: "⏸", "aria-label": "Pausar", onclick: () => acoes.pausar() }),
            this.vel,
            h("button", { class: "btn icone", text: "🃏", "aria-label": "Cartas", onclick: () => acoes.cartas() }),
          ),
        ),
        h("div", { class: "hud-dir" }, this.tempo, h("div", { class: "hud-nivel" }, this.nivel, h("div", { class: "barra-xp" }, this.xp))),
      ),
      this.chefe,
      this.aviso,
      this.dica,
      this.foco,
      this.ult,
      this.fps,
    );
  }

  private set(k: string, v: string | number | boolean): boolean {
    if (this.cache[k] === v) return false;
    this.cache[k] = v;
    return true;
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
    if (this.set("esc", ef)) this.escudo.style.width = ef + "%";

    const modoInf = b.cfg.modo === "sobrevivencia";
    const tShow = modoInf ? b.t : b.boss ? b.t : Math.max(0, BALANCE.entradaChefe - b.t);
    if (this.set("t", Math.floor(tShow))) this.tempo.textContent = fmtTempo(tShow);
    if (this.set("lv", b.nivel)) this.nivel.textContent = `Lv.${b.nivel}`;
    const xpf = Math.round((b.xp / b.xpNext) * 100);
    if (this.set("xp", xpf)) this.xp.style.width = xpf + "%";
    if (this.set("vel", velocidade)) this.vel.textContent = `x${velocidade}`;

    const up = Math.floor(b.ult.energia);
    const pronto = b.ult.pronto();
    if (this.set("ult", up) || this.set("ultp", pronto)) {
      this.ult.style.setProperty("--p", String(up));
      this.ult.classList.toggle("pronto", pronto);
    }

    const boss = b.boss && b.boss.alive ? b.boss : null;
    if (this.set("boss", !!boss)) {
      this.chefe.classList.toggle("oculto", !boss);
      this.foco.classList.toggle("oculto", !boss);
      if (boss) this.chefeNome.textContent = boss.boss!.def.nome.toUpperCase();
    }
    if (boss) {
      const bf = Math.round((boss.hp / boss.hpMax) * 1000) / 10;
      if (this.set("bossHp", bf)) this.chefeBarra.style.width = Math.max(0, bf) + "%";
    }
    if (this.set("foco", b.focoChefe)) this.foco.textContent = b.focoChefe ? "🎯 Mira no chefe: ON" : "🎯 Mira no chefe: OFF";
    const aviso = b.avisoChefe && !boss;
    if (this.set("aviso", aviso)) this.aviso.classList.toggle("oculto", !aviso);

    if (this.set("fps", fps === null ? -1 : Math.round(fps))) this.fps.textContent = fps === null ? "" : `${Math.round(fps)} FPS · ${b.inimigosVivos()} inim · ${b.projs.length} proj`;
    const fl = Math.round(flash * 20) / 20;
    if (this.set("flash", fl)) this.flash.style.opacity = String(fl);
  }
}
