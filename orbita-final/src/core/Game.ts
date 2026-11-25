import { Application, Container } from "pixi.js";
import { Battle } from "../battle/Battle";
import { montarRun } from "../battle/Loadout";
import type { Oferta } from "../battle/CardSystem";
import type { Modo } from "../battle/types";
import { BALANCE, DIFICULDADES } from "../data/balance";
import { STAGES } from "../data/stages";
import { calcularRecompensas, creditosParciais, gerarChip, podeMelhorar, CUSTO_REVIVER, desafioDoDia, faseLiberada, hojeStr, jornadaDaSemana, semanaStr, snapshot, type Recompensa } from "../meta/Meta";
import { Background } from "../render/Background";
import { BattleRenderer } from "../render/BattleRenderer";
import { HubScene, type ArmaVitrine } from "../render/HubScene";
import { SENTINEL_IDS } from "../data/sentinels";
import { initTextures } from "../render/Textures";
import { aparencia } from "../render/Aparencia";
import { Hud } from "../ui/Hud";
import { telaLevelUp } from "../ui/LevelUpScreen";
import { botao3, faixaTitulo, telaBuild, telaNovidades, telaPausa, telaResultado } from "../ui/Panels";
import { NOVIDADES, VERSAO_ATUAL } from "../data/novidades";
import { vigiarAtualizacao } from "./Atualizacao";
import { telaCla } from "../ui/meta/Cla";
import { telaAmigos, telaConversa } from "../ui/meta/Amigos";
import { telaBau } from "../ui/Bau";
import { criarCoach, type PassoCoach } from "../ui/Tutorial";
import { Rng } from "./Rng";
import { telaPromocao } from "../ui/Promocao";
import { anuncioRecompensado, anunciosRestantes, talvezIntersticial } from "../meta/Anuncios";
import { sincronizarCompras, temPremium } from "../meta/Pagamentos";
import { nuvem } from "./Nuvem";
import { toast } from "../ui/dom";
import { h, ICONE_MOEDA } from "../ui/dom";
import { ic } from "../ui/Icones";
import {
  painelConfig, telaConfig, telaMissoes, type Nav,
} from "../ui/meta/Screens";
import {
  telaCorreio, telaDiarias, telaEventos, telaHub, telaInventario, telaLogin, telaEntrada, telaNovaSenha, telaLoja, telaPasse, telaProgresso, telaRanking, telaComandantes, telaRecompensas, telaSkins,
} from "../ui/meta/Hub";
import { linhaRanking, patenteDe, registrarPartida, ultDoComandante } from "../meta/Comandante";
import { telaBriefing, telaChipsV2, telaFases, telaHangarV2, telaModosV2, telaPlanetaV2 } from "../ui/meta/Paineis";
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

/** Tutorial obrigatório nas 2 primeiras batalhas: o jogo pausa e o coach explica/aponta o botão. */
const ONB_BATALHA: Record<1 | 2, { id: string; quando: (b: Battle) => boolean; p: PassoCoach }[]> = {
  1: [
    { id: "boas", quando: (b) => b.t > 0.6, p: { titulo: "Primeira missão", texto: "Invasores estão vindo para o seu planeta! As sentinelas em órbita atiram sozinhas nos inimigos. Você comanda as melhorias e os poderes." } },
    { id: "vida", quando: (b) => b.t > 3, p: { alvo: ".hud-hp", texto: "Esta é a vida do planeta (verde) e o escudo (azul). O escudo recarrega sozinho quando você para de tomar dano. Se a vida zerar, você perde." } },
    { id: "tempo", quando: (b) => b.t > 9, p: { alvo: ".hud-tempo", texto: "Aguente até o tempo acabar: no final chega o CHEFE da fase. Derrote-o para vencer." } },
    { id: "xp", quando: (b) => b.t > 14, p: { alvo: ".hud-nivel", texto: "Cada inimigo destruído dá XP. Quando a barra roxa enche, você sobe de nível e escolhe uma carta de melhoria." } },
    { id: "choque", quando: (b) => b.habilidadePronta() && b.t > 20, p: { alvo: ".hud-hab", tocar: true, texto: "O CHOQUE está pronto! Ele empurra e fere os inimigos perto do planeta e recarrega parte do escudo. Toque nele." } },
    { id: "ult", quando: (b) => b.ult.pronto(), p: { alvo: ".hud-ult", tocar: true, texto: "Ultimate carregado! É o poder especial do seu comandante. Toque para soltar." } },
    { id: "chefe", quando: (b) => !!b.avisoChefe, p: { titulo: "Chefe chegando!", texto: "Concentre tudo nele. Quando ele aparecer, o botão MIRA NO CHEFE faz todas as sentinelas focarem só nele." } },
  ],
  2: [
    { id: "boas2", quando: (b) => b.t > 0.6, p: { titulo: "Segunda missão", texto: "Agora sua sentinela está mais forte (hangar) e com um chip equipado. Vamos ver mais alguns comandos." } },
    { id: "vel", quando: (b) => b.t > 6, p: { alvo: ".hud-botoes .btn:nth-child(2)", tocar: true, texto: "Este botão acelera a partida (x2). Toque para experimentar." } },
    { id: "build", quando: (b) => b.nivel >= 3, p: { alvo: ".hud-botoes .btn:nth-child(3)", tocar: true, texto: "Aqui você vê a sua BUILD: sentinelas, níveis, cartas e o que falta para o SUPREMO de cada uma. Toque." } },
    { id: "supremo", quando: (b) => b.nivel >= 4 && !b.fim, p: { titulo: "Supremo", texto: "Cada sentinela no nível 5 + a carta passiva certa evolui para o SUPREMO, uma versão muito mais forte. As cartas mostram o que falta." } },
    { id: "pause", quando: (b) => b.t > 40, p: { alvo: ".hud-botoes .btn:nth-child(1)", texto: "Precisa parar? O botão de pausa abre as configurações. Depois do tutorial, ali também dá para desistir (com penalidade)." } },
    { id: "fim2", quando: (b) => !!b.avisoChefe, p: { titulo: "Último desafio do tutorial", texto: "Derrote este chefe e o tutorial termina. Depois disso, as dicas ficam opcionais e você joga do seu jeito!" } },
  ],
};

/** Tour obrigatório do menu entre as 2 batalhas do tutorial. */
const ONB_MENU: { tela: string; p: PassoCoach }[] = [
  { tela: "hub", p: { titulo: "Bem-vindo ao QG", texto: "Missão cumprida! Este é o seu quartel-general. Daqui você fortalece o planeta entre as batalhas." } },
  { tela: "hub", p: { alvo: '[data-tile="hangar"]', tocar: true, texto: "No HANGAR você melhora as sentinelas com créditos. Toque nele." } },
  { tela: "hangar", p: { alvo: ".hg2.base .btn.primario", tocar: true, texto: "Esta é a sua sentinela base. Toque em MELHORAR para subir o nível dela (ganhou créditos na batalha)." } },
  { tela: "hangar", p: { alvo: ".hg2.base", texto: "Cada nível dá +6% de dano e, a cada 5 níveis, um bônus extra. Aqui você também escolhe a BASE e o DECK: até 5 sentinelas que podem aparecer na partida." } },
  { tela: "hangar", p: { alvo: ".btn-voltar", tocar: true, texto: "Volte para o QG." } },
  { tela: "hub", p: { alvo: '[data-tile="chips"]', tocar: true, texto: "Agora os CHIPS: você ganha ao vencer fases e abrir baús. Toque em Chips." } },
  { tela: "chips", p: { alvo: ".chips-grade > *:first-child", tocar: true, texto: "Toque no chip para EQUIPAR. Cada um vai num encaixe (ataque, defesa, crítico...)." } },
  { tela: "chips", p: { alvo: ".slots-v2", texto: "Chips equipados dão bônus permanentes. 2 ou 4 do mesmo conjunto dão bônus extra, e 3 chips iguais podem ser FUNDIDOS num melhor." } },
  { tela: "chips", p: { alvo: ".btn-voltar", tocar: true, texto: "Volte para o QG." } },
  { tela: "hub", p: { alvo: ".nav-inferior .nav-item:nth-child(2)", texto: "Em PROGRESSO ficam sua patente, os COMANDANTES (cada um com uma ultimate) e as skins. Explore depois do tutorial!" } },
  { tela: "hub", p: { alvo: ".btn-batalha", tocar: true, texto: "Pronto para a segunda missão! Toque em BATALHA." } },
  { tela: "briefing", p: { alvo: ".brief-rodape .bt3", tocar: true, texto: "Antes de cada fase você vê o chefe, os inimigos e como ganhar as 3 estrelas. Toque em INICIAR." } },
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
  dif: number;
  tutorial: boolean;
  /** Batalha do tutorial obrigatório (1 ou 2), 0 = normal. */
  onb: 0 | 1 | 2;
  onbFeitos: string[];
  recompensa: Recompensa | null;
  bauVisto?: boolean;
  promocao?: { de: number; para: number };
  promocaoVista?: boolean;
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
    // APK: o Android avisa quando o app é minimizado
    document.addEventListener("pause", () => {
      if (this.run && !this.run.overlay && !this.run.b.fim) this.pausar();
    });
    // áudio só libera após gesto do usuário (iOS)
    const unlock = () => audio.desbloquear();
    window.addEventListener("pointerdown", unlock);
    this.root.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) audio.sfx("clique");
    });
    this.app.ticker.add((t) => this.tick(t.deltaMS / 1000));
    // quem já jogava antes do tutorial novo não precisa fazê-lo
    if (this.save.onboarding === 0 && (this.save.tutorialVisto || this.save.campanha.normal[0] > 0)) this.save.onboarding = 3;
    // sem comandante: com o servidor ligado, primeiro escolhe como entrar (convidado, e-mail ou Google)
    this.ir(this.save.perfil.nome ? "hub" : nuvem.configurada ? "entrada" : "login");
    this.resize();
    void this.conectarNuvem();
    // versão nova publicada: aviso no topo (funciona no site e no APK, que carrega o site)
    vigiarAtualizacao(() => this.avisarAtualizacao());
    // "online agora" para os amigos + selo de pedidos/mensagens novas (a cada minuto, com o app aberto)
    window.setInterval(() => { if (!document.hidden) void nuvem.pingOnline(); }, 60_000);
    this.cerimoniaPendente();
    this.novidadesPendentes();
  }

  /** Faixa no topo: "Nova atualização disponível". Na batalha, sugere terminar a partida antes. */
  private avisarAtualizacao(): void {
    if (document.querySelector(".aviso-atualizacao")) return;
    const emBatalha = !!this.run && !this.run.b.fim;
    const el = h("div", { class: "aviso-atualizacao" },
      h("span", { class: "aa-ic", html: ic("estrela") }),
      h("div", { class: "aa-txt" }, h("b", { text: "Nova atualização disponível!" }),
        h("small", { text: emBatalha ? "Termine a partida e reinicie para atualizar." : "Reinicie para ver as novidades." })),
      h("button", { class: "btn ouro pequeno", text: "Reiniciar", onclick: () => {
        if (this.run && !this.run.b.fim && !el.dataset.confirma) { el.dataset.confirma = "1"; toast(this.root, "Toque de novo: a partida atual será perdida."); return; }
        location.reload();
      } }),
      h("button", { class: "aa-fechar", "aria-label": "Fechar", html: ic("fechar"), onclick: () => el.remove() }));
    this.root.append(el);
    audio.sfx("nivel");
  }

  /** "Teve atualização": mostra uma vez o resumo da versão nova (quem está começando agora não vê). */
  private novidadesPendentes(): void {
    if (this.save.novidadesVista === VERSAO_ATUAL) return;
    const novato = !this.save.perfil.nome || this.save.onboarding < 3;
    this.save.novidadesVista = VERSAO_ATUAL;
    this.persistir();
    if (novato) return;
    const el = telaNovidades(NOVIDADES[0], () => { audio.sfx("clique"); el.remove(); });
    el.style.zIndex = "61";
    this.root.append(el);
  }

  /** Ao abrir uma versão nova (ou depois de sincronizar), celebra a patente atual se ainda não foi celebrada (nunca a primeira). */
  private cerimoniaPendente(): void {
    if (!this.save.perfil.nome) return;
    const atual = patenteDe(this.save).indice;
    const vista = this.save.patenteVista ?? 0;
    if (atual <= 0 || atual <= vista) return;
    this.save.patenteVista = atual;
    this.persistir();
    const el = telaPromocao(atual - 1, atual, this.save.perfil.nome, () => el.remove());
    el.style.zIndex = "60";
    this.root.append(el);
  }

  // ------------------------------------------------------------------ Nav (menus)

  private nuvemTimer = 0;

  persistir(): void {
    salvar(this.save);
    // salva na nuvem com atraso (junta várias alterações seguidas)
    if (nuvem.logado()) {
      clearTimeout(this.nuvemTimer);
      this.nuvemTimer = window.setTimeout(() => {
        void nuvem.salvar(this.save).catch(() => {});
        void nuvem.publicarRanking(this.save, { ...linhaRanking(this.save), premium: temPremium(this.save) }).catch(() => {});
      }, 3000);
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
    // abriu pelo link de "esqueci minha senha": já está logado, falta só escolher a senha nova
    if (nuvem.recuperacao && !document.querySelector("#nova-senha")) {
      const el = telaNovaSenha(this, () => el.remove());
      el.style.zIndex = "62";
      this.root.append(el);
    }
    const remoto = await nuvem.carregar().catch(() => null);
    if (remoto && (remoto.pontos ?? 0) >= this.save.pontos) Object.assign(this.save, carregarDe(remoto));
    void nuvem.pingOnline().then(() => { if (!this.run && this.telaAtual() === "hub" && nuvem.avisosAmigos) this.ir("hub"); });
    const n = await sincronizarCompras(this.save).catch(() => 0);
    this.persistir();
    if (n) toast(this.root, `${n} compra${n > 1 ? "s" : ""} entregue${n > 1 ? "s" : ""}!`);
    // voltou do login (ex.: Google): quem já tem comandante na nuvem vai direto ao menu
    if (!this.run) this.ir(this.telaAtual() === "entrada" ? (this.save.perfil.nome ? "hub" : "login") : this.telaAtual());
  }

  aplicarConfig(): void {
    const c = this.save.config;
    audio.volSom = c.som;
    audio.volMusica = c.musica;
    audio.aplicarVolumes();
    this.run?.r.aplicarConfig(c.efeitos === "leve", c.brilho, c.numeros, c.bloom);
  }

  ir(tela: string): void {
    // tutorial obrigatório: com o nick criado, a 1ª ida ao QG vira a 1ª batalha
    if (tela === "hub" && this.save.perfil.nome && this.save.onboarding === 0) {
      this.iniciar("campanha", STAGES[0], 0, 0, 12345);
      return;
    }
    this.sairDaBatalha();
    aparencia.planeta = this.save.skins.planeta;
    aparencia.escudo = this.save.skins.escudo;
    if (!this.hub) {
      this.hub = new HubScene(this.armasDoHangar());
      this.cena.addChild(this.hub.layer);
      this.resize();
    }
    const scroll = this.telaEl?.querySelector(".tela-conteudo")?.scrollTop ?? 0;
    const mesmo = this.telaEl?.dataset.tela === tela;
    this.telaEl?.remove();
    const mapa: Record<string, () => HTMLElement> = {
      hub: () => telaHub(this),
      mapa: () => telaFases(this, -1),
      mapaDificil: () => telaFases(this, 1),
      hangar: () => telaHangarV2(this),
      chips: () => telaChipsV2(this),
      planeta: () => telaPlanetaV2(this),
      missoes: () => telaDiarias(this),
      conquistas: () => telaMissoes(this),
      // o nick é definitivo: depois de criado, "login" vira a tela de comandantes
      login: () => (this.save.perfil.nome ? telaComandantes(this) : telaLogin(this)),
      entrada: () => telaEntrada(this),
      correio: () => telaCorreio(this),
      eventos: () => telaEventos(this),
      recompensas: () => telaRecompensas(this),
      loja: () => telaLoja(this),
      progresso: () => telaProgresso(this),
      inventario: () => telaInventario(this),
      passe: () => telaPasse(this),
      modos: () => telaModosV2(this),
      skins: () => telaSkins(this),
      ranking: () => telaRanking(this),
      cla: () => telaCla(this),
      amigos: () => telaAmigos(this),
      conversa: () => telaConversa(this),
      comandantes: () => telaComandantes(this),
      briefing: () => telaBriefing(this),
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
    if (tela === "hangar" || tela === "hub" || tela === "planeta" || tela === "skins") this.recriarHub();
    this.bg.setFundo(1);
    // vitrine do planeta: só no início (e na tela de login, atrás do formulário fica escondida)
    if (this.hub) this.hub.layer.visible = tela === "hub" || tela === "planeta" || tela === "skins";
    requestAnimationFrame(() => this.posicionarVitrine());
    el.querySelector(".tela-conteudo")?.addEventListener("scroll", () => this.posicionarVitrine(), { passive: true });
    audio.tocarMusica("ambiente");
    if (this.save.onboarding === 1) requestAnimationFrame(() => this.tourMenu(tela));
    else if (this.save.onboarding === 2) requestAnimationFrame(() => this.retomarTutorial(tela));
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

  /** Todas as armas liberadas no Hangar (com o nível de cada uma), para a vitrine da tela inicial. */
  private armasDoHangar(): ArmaVitrine[] {
    return SENTINEL_IDS.filter((id) => this.save.sentinelas[id]?.desbloqueada).map((id) => ({ id, nivel: this.save.sentinelas[id].nivel }));
  }

  private recriarHub(): void {
    if (!this.hub) return;
    this.hub.destruir();
    this.hub = new HubScene(this.armasDoHangar());
    this.cena.addChild(this.hub.layer);
    this.resize();
  }

  jogarCampanha(idx: number, dif: number): void {
    if (!faseLiberada(this.save, idx, dif)) return;
    const stage = STAGES[idx];
    this.iniciar("campanha", stage, idx, dif, (Date.now() >>> 0) ^ (idx * 7919), undefined, stage.campos);
  }

  jogarDiario(): void {
    const d = desafioDoDia();
    if (this.save.diario.data !== hojeStr()) this.save.diario = { data: hojeStr(), melhor: 0, concluido: false };
    this.iniciar("diario", d.stage, d.stage.id - 1, 0, d.seed, d.mod);
  }

  jogarSobrevivencia(): void {
    const base = { ...STAGES[0], nome: "Sobrevivência", ondas: [], mult: 1 };
    this.iniciar("sobrevivencia", base, 0, 0, Date.now() >>> 0);
  }

  jogarJornada(): void {
    const j = jornadaDaSemana();
    this.iniciar("jornada", j.etapas[0], 0, 0, j.seed, undefined, j.campos.map((c) => c.id), j.etapas);
  }

  // ------------------------------------------------------------------ batalha

  private iniciar(
    modo: Modo, stage: (typeof STAGES)[number], idx: number, dif: number, seed: number,
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
    const onb: 0 | 1 | 2 = modo !== "campanha" || dif !== 0 ? 0 : this.save.onboarding === 0 && idx === 0 ? 1 : this.save.onboarding === 2 && idx === 1 ? 2 : 0;
    const tutorial = onb > 0 || (modo === "campanha" && idx === 0 && !this.save.tutorialVisto);
    const cfg = montarRun({ modo, stage, dif, seed, meta: snapshot(this.save), ult: ultDoComandante(this.save), daily, tutorial, campos, etapas: etapas?.map((e) => ({ ...e })) });
    const b = new Battle(cfg);
    const r = new BattleRenderer(b);
    const loop = new FixedLoop((dt) => {
      if (b.pendentes > 0 || b.fim) return;
      b.step(dt);
    });
    const nome = modo === "campanha" ? `${DIFICULDADES[dif].nome} · Fase ${stage.id}` : stage.nome;
    let avisouX3 = false;
    const hud = new Hud(nome, {
      pausar: () => this.pausar(),
      velocidade: () => {
        // x3 é exclusivo do Passe Premium
        const max = temPremium(this.save) ? 3 : 2;
        if (loop.speed >= max) {
          if (max === 2 && !avisouX3) { avisouX3 = true; toast(this.root, "Velocidade x3: exclusiva do Passe Premium"); }
          loop.speed = 1;
        } else loop.speed++;
      },
      cartas: () => this.abrir(telaBuild(b, () => this.fechar()), "build"),
      ultimate: () => {
        if (!this.run?.overlay) b.ult.ativar();
      },
      habilidade: () => {
        if (!this.run?.overlay) b.usarHabilidade();
      },
    });
    this.run = { b, r, loop, hud, overlay: null, overlayTipo: "", modo, idx, dif, tutorial, onb, onbFeitos: [], recompensa: null };
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
        build: () => this.abrir(telaBuild(run.b, () => this.pausar()), "build"),
        config: () => this.abrirConfigJogo(),
        desistir: run.onb ? null : () => this.confirmarDesistencia(),
      }),
      "pausa",
    );
  }

  /** Mostra quanto o jogador perde antes de desistir. */
  private confirmarDesistencia(): void {
    const run = this.run;
    if (!run || run.b.fim) return;
    const b = run.b;
    const F = BALANCE.recompensas.fatorDesistencia;
    const cheio = creditosParciais(b);
    const fica = Math.round(cheio * F);
    const pct = Math.round((1 - F) * 100);
    const linha = (icone: string, texto: string, valor: string, ruim = true) =>
      h("div", { class: "desist-linha" + (ruim ? " ruim" : "") }, h("span", { class: "desist-ic", html: icone }), h("span", { text: texto }), h("b", { html: valor }));
    const el = h("div", { class: "overlay desistir ov3" },
      faixaTitulo("DESISTIR?"),
      h("div", { class: "subtitulo", text: "Abandonar a missão tem penalidade. Lutar até o fim, mesmo perdendo, rende a recompensa completa." }),
      h("div", { class: "cartao neon desist-cartao" },
        linha(ICONE_MOEDA.creditos, "Créditos", `<s>${cheio}</s> ${fica} <em>-${pct}%</em>`),
        linha(ic("estrela", "ic-estrela"), "Pontos de comandante", `<em>-${pct}%</em>`),
        linha(ICONE_MOEDA.nucleos, "Núcleos", "<em>perdidos</em>"),
        linha(ic("chip"), "Chip da partida", "<em>perdido</em>")),
      botao3("laranja", "play", "Voltar a lutar", () => this.fechar()),
      h("button", { class: "bt3 vermelho", onclick: () => {
        this.fechar();
        b.desistiu = true;
        b.terminar(false);
        b.reviveu = true; // desistir não oferece reviver
      } }, h("span", { class: "bt3-ic", html: ic("fechar") }), h("span", { class: "bt3-txt", text: "Desistir mesmo assim" })));
    this.abrir(el, "pausa");
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
      const antes = patenteDe(this.save).indice;
      run.recompensa = calcularRecompensas(this.save, b, run.modo);
      run.recompensa.pontos = registrarPartida(this.save, b, run.modo, !run.onb && !run.tutorial);
      // Chefe do Clã: o dano da partida soma contra o chefe da semana (o servidor ignora quem não tem clã)
      if (nuvem.logado() && !run.onb && !run.tutorial) {
        const dano = b.sentinels.reduce((a, x) => a + x.danoCausado, 0);
        if (dano > 0) void nuvem.danoRaid(semanaStr(), dano).catch(() => {});
      }
      if (b.desistiu) run.recompensa.perdaPontos = Math.round(run.recompensa.pontos / BALANCE.recompensas.fatorDesistencia - run.recompensa.pontos);
      const depois = patenteDe(this.save);
      if (depois.indice > antes) { run.recompensa.novaPatente = depois.atual.nome; run.promocao = { de: antes, para: depois.indice }; }
      if (run.tutorial) this.save.tutorialVisto = true;
      if (run.onb === 1 && b.fim?.vitoria) { this.save.onboarding = 1; this.save.onbPasso = 0; }
      if (run.onb === 2 && b.fim?.vitoria) { this.save.onboarding = 3; setTimeout(() => toast(this.root, "Tutorial concluído! Agora o jogo é seu, comandante."), 600); }
      this.persistir();
    }
    // baú animado antes do resultado (uma vez por partida, só se houve prêmio)
    if (!run.bauVisto && (run.recompensa.creditos > 0 || run.recompensa.chip)) {
      run.bauVisto = true;
      this.abrir(telaBau(run.recompensa, () => this.mostrarFim()), "resultado");
      return;
    }
    // cerimônia de promoção (depois do baú, uma vez)
    if (run.promocao && !run.promocaoVista) {
      run.promocaoVista = true;
      this.save.patenteVista = Math.max(this.save.patenteVista ?? 0, run.promocao.para);
      this.persistir();
      const p = run.promocao;
      this.abrir(telaPromocao(p.de, p.para, this.save.perfil.nome, () => this.mostrarFim()), "resultado");
      return;
    }
    const idx = run.idx;
    const temProxima = run.modo === "campanha" && f.vitoria && idx + 1 < STAGES.length && faseLiberada(this.save, idx + 1, run.dif);
    const repetir = () => {
      if (run.modo === "campanha") this.jogarCampanha(idx, run.dif);
      else if (run.modo === "diario") this.jogarDiario();
      else if (run.modo === "jornada") this.jogarJornada();
      else this.jogarSobrevivencia();
    };
    this.abrir(
      telaResultado(b, run.recompensa, {
        hub: () => this.depoisDaPartida(() => this.ir("hub")),
        repetir: run.onb ? null : () => this.depoisDaPartida(repetir),
        proxima: temProxima && !run.onb ? () => this.depoisDaPartida(() => this.jogarCampanha(idx + 1, run.dif)) : null,
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
    if (run.tutorial && !run.onb) {
      const d = DICAS.find(([a, z]) => b.t >= a && b.t < z);
      run.hud.mostrarDica(d ? d[2] : null);
    }
    if (run.onb) this.coachBatalha(run);
    else this.tutorialGuiado(run, dt);
    audio.tocarMusica(b.boss && b.boss.alive ? "chefe" : "ambiente");
  }

  /** Anúncio entre partidas (com limite de frequência), depois segue. */
  private depoisDaPartida(seguir: () => void): void {
    void talvezIntersticial(this.save, this.root).finally(() => {
      this.persistir();
      seguir();
    });
  }

  /** Mostra o próximo passo do tutorial obrigatório da batalha (pausa o jogo enquanto aberto). */
  private coachBatalha(run: Run): void {
    const b = run.b;
    if (run.overlay || b.fim || b.pendentes > 0) return;
    // na 1ª batalha o ultimate enche mais cedo para dar tempo de ensinar
    if (run.onb === 1 && b.t > 45 && !run.onbFeitos.includes("ult")) b.ult.energia = Math.max(b.ult.energia, 100);
    const prox = ONB_BATALHA[run.onb as 1 | 2].find((x) => !run.onbFeitos.includes(x.id) && x.quando(b));
    if (!prox) return;
    run.onbFeitos.push(prox.id);
    const el = criarCoach(prox.p, () => this.fechar());
    this.abrir(el, "pausa");
  }

  /** Tour do menu (entre as batalhas do tutorial): mostra o passo da tela atual. */
  private tourMenu(tela: string): void {
    if (this.save.onboarding !== 1) return;
    const passo = ONB_MENU[this.save.onbPasso];
    if (!passo) return;
    if (passo.tela !== tela) return;
    document.querySelector(".coach")?.remove();
    if (this.save.onbPasso === 0) {
      // presentes para o tour funcionar: créditos para 1 melhoria e um chip para equipar
      const custo = podeMelhorar(this.save, this.save.deck.base).custo;
      if (this.save.creditos < custo) this.save.creditos = custo;
      if (!this.save.chips.length) this.save.chips.push(gerarChip(this.save, new Rng(7), 1));
    }
    const el = criarCoach(passo.p, () => {
      this.save.onbPasso++;
      if (this.save.onbPasso >= ONB_MENU.length) this.save.onboarding = 2;
      this.persistir();
      // se o toque não trocou de tela, mostra o próximo passo aqui mesmo
      setTimeout(() => { if (this.telaAtual() === tela && !this.run) this.tourMenu(tela); }, 60);
    });
    this.root.append(el);
  }

  /** Saiu no meio do tutorial: leva de volta para a 2ª batalha. */
  private retomarTutorial(tela: string): void {
    if (this.save.onboarding !== 2 || this.run) return;
    const p: PassoCoach | null = tela === "hub" ? { titulo: "Tutorial", alvo: ".btn-batalha", tocar: true, texto: "Falta só a segunda missão do tutorial! Toque em BATALHA." }
      : tela === "briefing" ? { alvo: ".brief-rodape .bt3", tocar: true, texto: "Toque em INICIAR." } : null;
    if (!p) return;
    document.querySelector(".coach")?.remove();
    this.root.append(criarCoach(p, () => {}));
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
