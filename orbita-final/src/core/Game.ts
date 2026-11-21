import { Application, Container } from "pixi.js";
import { Battle } from "../battle/Battle";
import { montarRun } from "../battle/Loadout";
import type { Oferta } from "../battle/CardSystem";
import type { Modo } from "../battle/types";
import { BALANCE } from "../data/balance";
import { STAGES } from "../data/stages";
import { calcularRecompensas, CUSTO_REVIVER, desafioDoDia, faseLiberada, hojeStr, jornadaDaSemana, snapshot, type Recompensa } from "../meta/Meta";
import { Background } from "../render/Background";
import { BattleRenderer } from "../render/BattleRenderer";
import { HubScene } from "../render/HubScene";
import { initTextures } from "../render/Textures";
import { aparencia } from "../render/Aparencia";
import { Hud } from "../ui/Hud";
import { telaLevelUp } from "../ui/LevelUpScreen";
import { telaBuild, telaPausa, telaResultado } from "../ui/Panels";
import { telaBau } from "../ui/Bau";
import { anuncioRecompensado, anunciosRestantes, talvezIntersticial } from "../meta/Anuncios";
import { sincronizarCompras } from "../meta/Pagamentos";
import { nuvem } from "./Nuvem";
import { toast } from "../ui/dom";
import { h, ICONE_MOEDA } from "../ui/dom";
import { ic } from "../ui/Icones";
import {
  painelConfig, telaChips, telaConfig, telaHangar, telaMapa, telaMissoes, telaModos, telaPlaneta, type Nav,
} from "../ui/meta/Screens";
import {
  telaCorreio, telaDiarias, telaEventos, telaHub, telaInventario, telaLogin, telaLoja, telaPasse, telaProgresso, telaRecompensas,
} from "../ui/meta/Hub";
import { patenteDe, registrarPartida } from "../meta/Comandante";
import { audio } from "./Audio";
import { FixedLoop } from "./Loop";
import { carregar, carregarDe, salvar, type SaveData } from "./Save";

const W = BALANCE.mundo.largura;
const H = BALANCE.mundo.altura;

const DICAS: [number, number, string][] = [
  [0.5, 6, "As sentinelas atiram sozinhas. Proteja o planeta!"],
  [6.5, 12.5, "Inimigos destruídos dão XP. A cada nível, escolha uma carta de melhoria."],
];

/** Tutorial guiado: cada passo aparece uma vez, quando fizer sentido, apontando o botão certo. */
const PASSOS: { id: string; alvo: string; texto: string; quando: (b: Battle) => boolean; feito?: (b: Battle) => boolean }[] = [
  { id: "ultimate", alvo: ".hud-ult", texto: "Ultimate carregado! Toque aqui para soltar o poder da sua sentinela base.", quando: (b) => b.ult.pronto(), feito: (b) => b.ult.usos > 0 },
  { id: "choque", alvo: ".hud-hab", texto: "Onda de choque: empurra os inimigos perto do planeta e recarrega o escudo.", quando: (b) => b.habilidadePronta() && b.inimigosVivos() > 6, feito: (b) => b.habilidadeUsos > 0 },
  { id: "combo", alvo: ".hud-combo", texto: "Abates seguidos fazem COMBO: mais pontos e mais sucata. Tomar dano zera o combo.", quando: (b) => b.combo >= 15 },
  { id: "build", alvo: ".hud-botoes .btn:nth-child(3)", texto: "Aqui você vê sua build: sentinelas, níveis e cartas pegas.", quando: (b) => b.nivel >= 4 },
  { id: "velocidade", alvo: ".hud-botoes .btn:nth-child(2)", texto: "Toque para acelerar a partida (x2).", quando: (b) => b.t > 50 },
];

interface Run {
  b: Battle;
  r: BattleRenderer;
  loop: FixedLoop;
  hud: Hud;
  overlay: HTMLElement | null;
  overlayTipo: "" | "nivel" | "pausa" | "build" | "config" | "reviver" | "resultado";
  modo: Modo;
  idx: number;
  dificil: boolean;
  tutorial: boolean;
  recompensa: Recompensa | null;
  bauVisto?: boolean;
  dobrou?: boolean;
}

/** Máquina de estados do jogo: Hub (menus) ↔ Batalha (LevelUp, Pausa, Resultado). */
export class Game implements Nav {
  save: SaveData;
  root: HTMLElement;
  private bg!: Background;
  private cena = new Container();
  private hub: HubScene | null = null;
  private run: Run | null = null;
  private telaEl: HTMLElement | null = null;
  private fpsAcc = 0;
  private fpsFrames = 0;
  private fps = 60;

  constructor(private app: Application) {
    this.save = carregar();
    this.root = document.getElementById("ui")!;
  }

  init(): void {
    initTextures();
    this.bg = new Background();
    this.app.stage.addChild(this.bg.layer, this.cena);
    this.aplicarConfig();
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.run && !this.run.overlay && !this.run.b.fim) this.pausar();
    });
    // áudio só libera após gesto do usuário (iOS)
    const unlock = () => audio.desbloquear();
    window.addEventListener("pointerdown", unlock);
    this.root.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) audio.sfx("clique");
    });
    this.app.ticker.add((t) => this.tick(t.deltaMS / 1000));
    this.ir(this.save.perfil.nome ? "hub" : "login");
    this.resize();
    void this.conectarNuvem();
  }

  // ------------------------------------------------------------------ Nav (menus)

  private nuvemTimer = 0;

  persistir(): void {
    salvar(this.save);
    // salva na nuvem com atraso (junta várias alterações seguidas)
    if (nuvem.logado()) {
      clearTimeout(this.nuvemTimer);
      this.nuvemTimer = window.setTimeout(() => void nuvem.salvar(this.save).catch(() => {}), 3000);
    }
  }

  telaAtual(): string {
    return this.telaEl?.dataset.tela ?? "hub";
  }

  /** Conecta a conta na nuvem: traz o progresso salvo e entrega compras aprovadas. */
  async conectarNuvem(): Promise<void> {
    if (!nuvem.configurada) return;
    await nuvem.iniciar().catch(() => {});
    if (!nuvem.logado()) return;
    const remoto = await nuvem.carregar().catch(() => null);
    if (remoto && (remoto.pontos ?? 0) >= this.save.pontos) Object.assign(this.save, carregarDe(remoto));
    const n = await sincronizarCompras(this.save).catch(() => 0);
    this.persistir();
    if (n) toast(this.root, `${n} compra${n > 1 ? "s" : ""} entregue${n > 1 ? "s" : ""}!`);
    if (!this.run) this.ir(this.telaAtual());
  }

  aplicarConfig(): void {
    const c = this.save.config;
    audio.volSom = c.som;
    audio.volMusica = c.musica;
    audio.aplicarVolumes();
    this.run?.r.aplicarConfig(c.efeitos === "leve", c.brilho, c.numeros, c.bloom);
  }

  ir(tela: string): void {
    this.sairDaBatalha();
    aparencia.planeta = this.save.skins.planeta;
    aparencia.escudo = this.save.skins.escudo;
    if (!this.hub) {
      this.hub = new HubScene([this.save.deck.base, ...this.save.deck.pool]);
      this.cena.addChild(this.hub.layer);
      this.resize();
    }
    const scroll = this.telaEl?.querySelector(".tela-conteudo")?.scrollTop ?? 0;
    const mesmo = this.telaEl?.dataset.tela === tela;
    this.telaEl?.remove();
    const mapa: Record<string, () => HTMLElement> = {
      hub: () => telaHub(this),
      mapa: () => telaMapa(this, false),
      mapaDificil: () => telaMapa(this, true),
      hangar: () => telaHangar(this),
      chips: () => telaChips(this),
      planeta: () => telaPlaneta(this),
      missoes: () => telaDiarias(this),
      conquistas: () => telaMissoes(this),
      login: () => telaLogin(this),
      correio: () => telaCorreio(this),
      eventos: () => telaEventos(this),
      recompensas: () => telaRecompensas(this),
      loja: () => telaLoja(this),
      progresso: () => telaProgresso(this),
      inventario: () => telaInventario(this),
      passe: () => telaPasse(this),
      modos: () => telaModos(this),
      config: () => telaConfig(this),
    };
    const el = (mapa[tela] ?? mapa.hub)();
    el.dataset.tela = tela;
    this.telaEl = el;
    this.root.append(el);
    if (mesmo) {
      const c = el.querySelector(".tela-conteudo");
      if (c) c.scrollTop = scroll;
    }
    if (tela === "hangar" || tela === "hub" || tela === "planeta") this.recriarHub();
    this.bg.setFundo(1);
    // vitrine do planeta: só no início (e na tela de login, atrás do formulário fica escondida)
    if (this.hub) this.hub.layer.visible = tela === "hub" || tela === "planeta";
    requestAnimationFrame(() => this.posicionarVitrine());
    el.querySelector(".tela-conteudo")?.addEventListener("scroll", () => this.posicionarVitrine(), { passive: true });
    audio.tocarMusica("ambiente");
  }

  /** Encaixa o planeta da vitrine no espaço reservado do menu (div .hub-vitrine). */
  private posicionarVitrine(): void {
    const alvo = this.telaEl?.querySelector<HTMLElement>("[data-vitrine]");
    if (!this.hub || !alvo) return;
    const r = alvo.getBoundingClientRect();
    // fora da área visível (rolou para longe): esconde o planeta
    const tela = this.telaEl!.dataset.tela;
    if (this.hub) this.hub.layer.visible = tela === "hub" || (r.bottom > 60 && r.top < window.innerHeight - 40);
    this.hub.encaixar(r.left + r.width / 2, r.top + r.height / 2, Math.min(r.width, r.height) / 2);
  }

  private recriarHub(): void {
    if (!this.hub) return;
    this.hub.destruir();
    this.hub = new HubScene([this.save.deck.base, ...this.save.deck.pool]);
    this.cena.addChild(this.hub.layer);
    this.resize();
  }

  jogarCampanha(idx: number, dificil: boolean): void {
    if (!faseLiberada(this.save, idx, dificil)) return;
    const stage = STAGES[idx];
    this.iniciar("campanha", stage, idx, dificil, (Date.now() >>> 0) ^ (idx * 7919));
  }

  jogarDiario(): void {
    const d = desafioDoDia();
    if (this.save.diario.data !== hojeStr()) this.save.diario = { data: hojeStr(), melhor: 0, concluido: false };
    this.iniciar("diario", d.stage, d.stage.id - 1, false, d.seed, d.mod);
  }

  jogarSobrevivencia(): void {
    const base = { ...STAGES[0], nome: "Sobrevivência", ondas: [], mult: 1 };
    this.iniciar("sobrevivencia", base, 0, false, Date.now() >>> 0);
  }

  jogarJornada(): void {
    const j = jornadaDaSemana();
    this.iniciar("jornada", j.etapas[0], 0, false, j.seed, undefined, j.campos.map((c) => c.id), j.etapas);
  }

  // ------------------------------------------------------------------ batalha

  private iniciar(
    modo: Modo, stage: (typeof STAGES)[number], idx: number, dificil: boolean, seed: number,
    daily?: ReturnType<typeof desafioDoDia>["mod"], campos?: string[], etapas?: (typeof STAGES)[number][],
  ): void {
    this.sairDaBatalha();
    this.telaEl?.remove();
    this.telaEl = null;
    if (this.hub) {
      this.hub.destruir();
      this.hub = null;
    }
    aparencia.planeta = this.save.skins.planeta;
    aparencia.escudo = this.save.skins.escudo;
    const tutorial = modo === "campanha" && idx === 0 && !this.save.tutorialVisto;
    const cfg = montarRun({ modo, stage, dificil, seed, meta: snapshot(this.save), daily, tutorial, campos, etapas: etapas?.map((e) => ({ ...e })) });
    const b = new Battle(cfg);
    const r = new BattleRenderer(b);
    const loop = new FixedLoop((dt) => {
      if (b.pendentes > 0 || b.fim) return;
      b.step(dt);
    });
    const nome = modo === "campanha" ? `${dificil ? "Difícil" : "Normal"} · Fase ${stage.id}` : stage.nome;
    const hud = new Hud(nome, {
      pausar: () => this.pausar(),
      velocidade: () => {
        loop.speed = loop.speed === 1 ? 2 : 1;
      },
      cartas: () => this.abrir(telaBuild(b, () => this.fechar()), "build"),
      ultimate: () => {
        if (!this.run?.overlay) b.ult.ativar();
      },
      habilidade: () => {
        if (!this.run?.overlay) b.usarHabilidade();
      },
      foco: () => {
        b.focoChefe = !b.focoChefe;
      },
    });
    this.run = { b, r, loop, hud, overlay: null, overlayTipo: "", modo, idx, dificil, tutorial, recompensa: null };
    this.cena.addChild(r.world);
    this.bg.setFundo(((stage.id - 1) % 3) + 1);
    this.root.append(hud.el);
    this.aplicarConfig();
    this.resize();
    audio.tocarMusica("ambiente");
  }

  private sairDaBatalha(): void {
    const run = this.run;
    if (!run) return;
    this.tutoAtivo = null;
    run.r.destruir();
    run.hud.el.remove();
    run.overlay?.remove();
    this.run = null;
  }

  private abrir(el: HTMLElement, tipo: Run["overlayTipo"]): void {
    const run = this.run;
    if (!run) return;
    run.overlay?.remove();
    run.overlay = el;
    run.overlayTipo = tipo;
    this.root.append(el);
  }

  private fechar(): void {
    const run = this.run;
    if (!run) return;
    run.overlay?.remove();
    run.overlay = null;
    run.overlayTipo = "";
  }

  private pausar(): void {
    const run = this.run;
    if (!run || run.b.fim) return;
    this.abrir(
      telaPausa({
        continuar: () => this.fechar(),
        config: () => this.abrirConfigJogo(),
        desistir: () => {
          this.fechar();
          run.b.terminar(false);
          run.b.reviveu = true; // desistir não oferece reviver
        },
      }),
      "pausa",
    );
  }

  private abrirConfigJogo(): void {
    const el = h("div", { class: "overlay" }, h("div", { class: "titulo", text: "CONFIGURAÇÕES" }),
      painelConfig(this, () => this.abrirConfigJogo(), true),
      h("button", { class: "btn ciano", text: "Voltar", onclick: () => this.pausar() }));
    this.abrir(el, "config");
  }

  private mostrarLevelUp(): void {
    const run = this.run!;
    const b = run.b;
    if (!b.cards.ofertas.length || run.overlayTipo !== "nivel") b.cards.sortear(b.cards.numeroDeCartas());
    const escolher = (o: Oferta) => {
      audio.sfx("carta");
      b.cards.aplicar(o.card);
      b.cards.ofertas = [];
      if (b.pendentes > 0) {
        b.cards.sortear(b.cards.numeroDeCartas());
        this.abrir(telaLevelUp(b, escolher, rerrolar, anuncioDisp()), "nivel");
      } else this.fechar();
    };
    const rerrolar = async () => {
      if (b.cards.podeRerrolar()) {
        if (b.cards.rerrolar()) this.abrir(telaLevelUp(b, escolher, rerrolar, anuncioDisp()), "nivel");
        return;
      }
      if (!(await anuncioRecompensado(this.save, this.root, "rerrolar"))) return;
      this.persistir();
      b.cards.rerrolagensGratis++;
      if (b.cards.rerrolar()) this.abrir(telaLevelUp(b, escolher, rerrolar, anuncioDisp()), "nivel");
    };
    const anuncioDisp = () => anunciosRestantes(this.save, "rerrolar") > 0;
    const tela = telaLevelUp(b, escolher, rerrolar, anuncioDisp());
    if (!this.save.tutorialPassos.includes("cartas")) {
      this.save.tutorialPassos.push("cartas");
      this.persistir();
      tela.insertBefore(h("div", { class: "tuto-cartas", text: "Escolha uma carta: nova sentinela, subir o nível de uma que você já tem ou um bônus. Monte sua build!" }), tela.querySelector(".cartas-lv"));
    }
    this.abrir(tela, "nivel");
  }

  private mostrarFim(): void {
    const run = this.run!;
    const b = run.b;
    const f = b.fim!;
    // oferece reviver antes de fechar as contas
    if (!f.vitoria && !b.reviveu && run.modo !== "sobrevivencia" && run.modo !== "jornada") {
      const el = h("div", { class: "overlay" },
        h("div", { class: "titulo", style: "color:var(--vermelho)", text: "ESCUDOS CAÍRAM" }),
        h("div", { class: "subtitulo", html: `Reviver com 50% de HP? (1x por partida) · Você tem ${ICONE_MOEDA.cristais} ${this.save.cristais}` }),
        h("button", { class: "btn ouro", disabled: this.save.cristais < CUSTO_REVIVER, html: `${ICONE_MOEDA.cristais} ${CUSTO_REVIVER} Reviver`, onclick: () => {
          this.save.cristais -= CUSTO_REVIVER;
          this.persistir();
          b.reviver();
          this.fechar();
        } }),
        h("button", { class: "btn ciano", disabled: anunciosRestantes(this.save, "reviver") <= 0,
          html: `${ic("play")}<span>${this.save.monet.semAnuncios ? "Reviver grátis (VIP)" : "Reviver assistindo anúncio"}</span>`, onclick: async () => {
            if (!(await anuncioRecompensado(this.save, this.root, "reviver"))) return;
            this.persistir();
            b.reviver();
            this.fechar();
          } }),
        h("button", { class: "btn", text: "Ver resultado", onclick: () => {
          b.reviveu = true;
          this.mostrarFim();
        } }));
      this.abrir(el, "reviver");
      return;
    }
    if (!run.recompensa) {
      const antes = patenteDe(this.save.pontos).indice;
      run.recompensa = calcularRecompensas(this.save, b, run.modo);
      run.recompensa.pontos = registrarPartida(this.save, b, run.modo);
      const depois = patenteDe(this.save.pontos);
      if (depois.indice > antes) run.recompensa.novaPatente = depois.atual.nome;
      if (run.tutorial) this.save.tutorialVisto = true;
      this.persistir();
    }
    // baú animado antes do resultado (uma vez por partida, só se houve prêmio)
    if (!run.bauVisto && (run.recompensa.creditos > 0 || run.recompensa.chip)) {
      run.bauVisto = true;
      this.abrir(telaBau(run.recompensa, () => this.mostrarFim()), "resultado");
      return;
    }
    const idx = run.idx;
    const temProxima = run.modo === "campanha" && f.vitoria && idx + 1 < STAGES.length && faseLiberada(this.save, idx + 1, run.dificil);
    const repetir = () => {
      if (run.modo === "campanha") this.jogarCampanha(idx, run.dificil);
      else if (run.modo === "diario") this.jogarDiario();
      else if (run.modo === "jornada") this.jogarJornada();
      else this.jogarSobrevivencia();
    };
    this.abrir(
      telaResultado(b, run.recompensa, {
        hub: () => this.depoisDaPartida(() => this.ir("hub")),
        repetir: () => this.depoisDaPartida(repetir),
        proxima: temProxima ? () => this.depoisDaPartida(() => this.jogarCampanha(idx + 1, run.dificil)) : null,
        dobrar: run.dobrou || (run.recompensa.creditos <= 0 && run.recompensa.nucleos <= 0) || anunciosRestantes(this.save, "dobrar") <= 0 ? null : async () => {
          if (!(await anuncioRecompensado(this.save, this.root, "dobrar"))) return;
          run.dobrou = true;
          this.save.creditos += run.recompensa!.creditos;
          this.save.nucleos += run.recompensa!.nucleos;
          run.recompensa!.creditos *= 2;
          run.recompensa!.nucleos *= 2;
          this.persistir();
          toast(this.root, "Recompensa dobrada!");
          this.mostrarFim();
        },
        semAnuncios: this.save.monet.semAnuncios,
        reviver: null,
        cristais: this.save.cristais,
        custoReviver: CUSTO_REVIVER,
      }),
      "resultado",
    );
  }

  // ------------------------------------------------------------------ loop

  private tick(dt: number): void {
    this.fpsAcc += dt;
    this.fpsFrames++;
    if (this.fpsAcc >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }
    const run = this.run;
    if (!run) {
      this.bg.update(dt);
      this.hub?.update(dt);
      return;
    }
    const b = run.b;
    const parado = !!run.overlay;
    run.loop.paused = parado;
    run.loop.advance(dt);
    this.bg.update(parado ? 0 : dt * run.loop.speed, 1.5);
    run.r.render(parado ? 0 : dt * run.loop.speed);
    if (!run.overlay) {
      if (b.fim) this.mostrarFim();
      else if (b.pendentes > 0) this.mostrarLevelUp();
    }
    run.hud.update(b, run.loop.speed, this.save.config.fps ? this.fps : null, run.r.flash);
    if (run.tutorial) {
      const d = DICAS.find(([a, z]) => b.t >= a && b.t < z);
      run.hud.mostrarDica(d ? d[2] : null);
    }
    this.tutorialGuiado(run, dt);
    audio.tocarMusica(b.boss && b.boss.alive ? "chefe" : "ambiente");
  }

  /** Anúncio entre partidas (com limite de frequência), depois segue. */
  private depoisDaPartida(seguir: () => void): void {
    void talvezIntersticial(this.save, this.root).finally(() => {
      this.persistir();
      seguir();
    });
  }

  private tutoAtivo: { id: string; t: number } | null = null;

  private tutorialGuiado(run: Run, dt: number): void {
    const b = run.b;
    const feitos = this.save.tutorialPassos;
    if (run.overlay || b.fim) {
      run.hud.apontar(null);
      return;
    }
    if (this.tutoAtivo) {
      const p = PASSOS.find((x) => x.id === this.tutoAtivo!.id)!;
      const antes = this.tutoAtivo.t;
      this.tutoAtivo.t += dt;
      if (this.tutoAtivo.t > 7 || p.feito?.(b)) {
        this.tutoAtivo = null;
        run.hud.apontar(null);
      } else if (antes === 0 || (antes < 0.4 && this.tutoAtivo.t >= 0.4)) {
        run.hud.apontar(p.alvo, p.texto); // aparece e reposiciona uma vez (o alvo pode ter acabado de surgir)
      }
      return;
    }
    const prox = PASSOS.find((p) => !feitos.includes(p.id) && p.quando(b));
    if (!prox) return;
    feitos.push(prox.id);
    this.persistir();
    this.tutoAtivo = { id: prox.id, t: 0 };
  }

  private resize(): void {
    const w = window.innerWidth;
    const hh = window.innerHeight;
    this.app.renderer.resize(w, hh);
    this.bg.resize(w, hh);
    this.hub?.resize(w, hh);
    this.posicionarVitrine();
    const run = this.run;
    if (!run) return;
    // mundo lógico 1080×1920: encaixa pela largura em telas altas (mostra mais espaço acima), pela altura em telas largas
    let scale: number;
    let ox: number;
    let oy: number;
    if (w / hh < W / H) {
      scale = w / W;
      ox = 0;
      oy = hh - H * scale;
    } else {
      scale = hh / H;
      ox = (w - W * scale) / 2;
      oy = 0;
    }
    run.r.setTela(w, hh, scale, ox, oy);
    run.r.world.scale.set(scale);
    run.r.world.position.set(ox, oy);
    run.b.vis = { left: 0, right: W, top: Math.min(0, -oy / scale), bottom: H };
  }
}
