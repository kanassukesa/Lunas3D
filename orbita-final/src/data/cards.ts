import { SENTINELS, SENTINEL_IDS } from "./sentinels";
import type { CardDef } from "./types";

/**
 * Cartas de melhoria. As de "nova sentinela", "subir nível" e "evolução" são geradas a partir de
 * `sentinels.ts`; as demais estão escritas abaixo. Tipos e campos seguem o GDD (seção 3.5).
 */
const MANUAIS: CardDef[] = [
  // ---------- Atributos globais ----------
  { id: "dano_global_1", nome: "Sobrecarga de Núcleo", raridade: "comum", tipo: "global", texto: "+10% de dano para todas as sentinelas", efeito: { danoPct: 0.1 }, maxPilhas: 5 },
  { id: "dano_global_2", nome: "Matriz de Fusão", raridade: "rara", tipo: "global", texto: "+20% de dano para todas as sentinelas", efeito: { danoPct: 0.2 }, maxPilhas: 3 },
  { id: "dano_global_3", nome: "Coração de Estrela", raridade: "epica", tipo: "global", texto: "+40% de dano para todas as sentinelas", efeito: { danoPct: 0.4 }, maxPilhas: 2 },
  { id: "cadencia_1", nome: "Ciclo Rápido", raridade: "comum", tipo: "global", texto: "+10% de cadência", efeito: { cadenciaPct: 0.1 }, maxPilhas: 5 },
  { id: "cadencia_2", nome: "Overclock", raridade: "rara", tipo: "global", texto: "+20% de cadência", efeito: { cadenciaPct: 0.2 }, maxPilhas: 3 },
  { id: "crit_1", nome: "Mira Fina", raridade: "comum", tipo: "global", texto: "+5% de chance de crítico", efeito: { critChance: 0.05 }, maxPilhas: 5 },
  { id: "crit_2", nome: "Ponto Fraco", raridade: "rara", tipo: "global", texto: "+40% de dano crítico", efeito: { critDano: 0.4 }, maxPilhas: 4 },
  { id: "crit_3", nome: "Olho do Caçador", raridade: "epica", tipo: "global", texto: "+12% de crítico e +60% de dano crítico", efeito: { critChance: 0.12, critDano: 0.6 }, maxPilhas: 2 },
  { id: "alcance_1", nome: "Sensores Longos", raridade: "comum", tipo: "global", texto: "+12% de alcance", efeito: { alcancePct: 0.12 }, maxPilhas: 3 },
  { id: "velproj_1", nome: "Propulsores", raridade: "comum", tipo: "global", texto: "+25% de velocidade dos projéteis e +5% de dano", efeito: { velProjPct: 0.25, danoPct: 0.05 }, maxPilhas: 3 },
  { id: "area_1", nome: "Carga Expansiva", raridade: "rara", tipo: "global", texto: "+20% de área", efeito: { areaPct: 0.2 }, maxPilhas: 3 },
  { id: "xp_1", nome: "Coletor de Dados", raridade: "comum", tipo: "global", texto: "+15% de XP", efeito: { xpPct: 0.15 }, maxPilhas: 3 },
  { id: "vidro", nome: "Canhão de Vidro", raridade: "epica", tipo: "global", texto: "+50% de dano, mas −25% de HP máximo", efeito: { danoPct: 0.5, hpMaxPct: -0.25 }, maxPilhas: 1 },

  // ---------- Planeta ----------
  { id: "hp_1", nome: "Crosta Reforçada", raridade: "comum", tipo: "planeta", texto: "+15% de HP máximo e cura 15%", efeito: { hpMaxPct: 0.15, curaPct: 0.15 }, maxPilhas: 5 },
  { id: "cura_1", nome: "Reparo de Emergência", raridade: "comum", tipo: "planeta", texto: "Cura 35% do HP", efeito: { curaPct: 0.35 }, maxPilhas: 99, peso: 0.6 },
  { id: "escudo_1", nome: "Placas Hexagonais", raridade: "comum", tipo: "planeta", texto: "+30% de escudo máximo", efeito: { escudoMaxPct: 0.3, escudoCheio: 1 }, maxPilhas: 5 },
  { id: "escudo_2", nome: "Regeneradores", raridade: "rara", tipo: "planeta", texto: "+60% de regeneração do escudo", efeito: { escudoRegenPct: 0.6 }, maxPilhas: 3 },
  { id: "regen_1", nome: "Biosfera Viva", raridade: "rara", tipo: "planeta", texto: "Regenera 6 HP/s", efeito: { regenHp: 6 }, maxPilhas: 4 },
  { id: "armadura_1", nome: "Blindagem", raridade: "rara", tipo: "planeta", texto: "+8 de armadura (reduz cada dano)", efeito: { armadura: 8 }, maxPilhas: 4 },
  { id: "espinhos_1", nome: "Campo Reativo", raridade: "rara", tipo: "planeta", texto: "Ao tomar dano, devolve 300% em área", efeito: { espinhos: 3 }, maxPilhas: 3 },
  { id: "bastiao", nome: "Bastião Planetário", raridade: "epica", tipo: "planeta", texto: "+40% de HP, +40% de escudo e +5 de armadura", efeito: { hpMaxPct: 0.4, escudoMaxPct: 0.4, armadura: 5, curaPct: 0.4 }, maxPilhas: 1 },

  // ---------- Modificadores de tiro ----------
  { id: "estilhaco", nome: "Estilhaços", raridade: "epica", tipo: "mod_tiro", texto: "Projéteis se dividem em 3 estilhaços ao acertar (30% do dano)", efeito: { split: 3, splitDanoPct: 0.3 }, maxPilhas: 2 },
  { id: "ricochete", nome: "Ricochete", raridade: "rara", tipo: "mod_tiro", texto: "Projéteis ricocheteiam para +1 inimigo", efeito: { ricochete: 1 }, maxPilhas: 3 },
  { id: "queima", nome: "Plasma Incendiário", raridade: "rara", tipo: "mod_tiro", texto: "Acertos queimam: 40% do dano por segundo por 3 s", efeito: { queima: 0.4 }, maxPilhas: 3 },
  { id: "veneno", nome: "Nanovírus", raridade: "rara", tipo: "mod_tiro", texto: "Acertos envenenam (acumula): 15% do dano/s por 4 s", efeito: { veneno: 0.15 }, maxPilhas: 3 },
  { id: "explosao", nome: "Reação em Cadeia", raridade: "epica", tipo: "mod_tiro", texto: "Inimigos explodem ao morrer (25% do HP máx. em área)", efeito: { explosaoAoMatar: 0.25 }, maxPilhas: 2 },
  { id: "perfurante", nome: "Ponta de Tungstênio", raridade: "rara", tipo: "mod_tiro", texto: "+1 perfuração para todos os projéteis", efeito: { perfuracao: 1 }, maxPilhas: 3 },
  { id: "executor", nome: "Executor", raridade: "epica", tipo: "mod_tiro", texto: "Acertos matam inimigos comuns abaixo de 12% do HP", efeito: { executar: 0.12 }, maxPilhas: 1 },

  // ---------- Ultimate ----------
  { id: "ult_1", nome: "Bateria Extra", raridade: "comum", tipo: "ultimate", texto: "+25% de velocidade de carga do ultimate", efeito: { ultCargaPct: 0.25 }, maxPilhas: 4 },
  { id: "ult_2", nome: "Capacitor", raridade: "rara", tipo: "ultimate", texto: "+40% de dano do ultimate e carga +50 agora", efeito: { ultDanoPct: 0.4, ultEnergia: 50 }, maxPilhas: 3 },
  { id: "ult_3", nome: "Fusão Instantânea", raridade: "epica", tipo: "ultimate", texto: "Ultimate carrega 60% mais rápido e dura +50%", efeito: { ultCargaPct: 0.6, ultDuracaoPct: 0.5 }, maxPilhas: 1 },

  // ---------- Mods específicos de sentinela ----------
  { id: "missil_salva", nome: "Salva Dupla", raridade: "rara", tipo: "sentinela_mod", alvo: "missil", texto: "Enxame dispara +2 mísseis", efeito: { projeteis: 2 }, maxPilhas: 3, requisitos: { sentinela: "missil" } },
  { id: "laser_foco", nome: "Lente de Foco", raridade: "rara", tipo: "sentinela_mod", alvo: "laser", texto: "Lança Laser: +40% de dano", efeito: { danoPct: 0.4 }, maxPilhas: 3, requisitos: { sentinela: "laser" } },
  { id: "feixe_arco", nome: "Arco Extenso", raridade: "rara", tipo: "sentinela_mod", alvo: "feixe", texto: "Prisma: +2 saltos e +25% de distância", efeito: { cadeia: 2, areaPct: 0.25 }, maxPilhas: 2, requisitos: { sentinela: "feixe" } },
  { id: "canhao_gatilho", nome: "Gatilho Leve", raridade: "rara", tipo: "sentinela_mod", alvo: "canhao", texto: "Canhão de Pulso: +40% de cadência", efeito: { cadenciaPct: 0.4 }, maxPilhas: 3, requisitos: { sentinela: "canhao" } },
  { id: "trilho_bobina", nome: "Bobina Dupla", raridade: "rara", tipo: "sentinela_mod", alvo: "trilho", texto: "Acelerador: +50% de dano", efeito: { danoPct: 0.5 }, maxPilhas: 3, requisitos: { sentinela: "trilho" } },
  { id: "grav_horizonte", nome: "Horizonte Largo", raridade: "rara", tipo: "sentinela_mod", alvo: "gravidade", texto: "Poço: +30% de área e +1 s", efeito: { areaPct: 0.3, duracao: 1 }, maxPilhas: 2, requisitos: { sentinela: "gravidade" } },
  { id: "campo_capacitor", nome: "Capacitor do Domo", raridade: "rara", tipo: "sentinela_mod", alvo: "campo", texto: "Domo: +30% de dano e +6% de raio", efeito: { danoPct: 0.3, areaPct: 0.06, alcancePct: 0.06 }, maxPilhas: 3, requisitos: { sentinela: "campo" } },
  { id: "drone_extra", nome: "Fábrica de Drones", raridade: "rara", tipo: "sentinela_mod", alvo: "drone", texto: "Colmeia: +1 drone", efeito: { projeteis: 1 }, maxPilhas: 3, requisitos: { sentinela: "drone" } },
  { id: "gelo_fragil", nome: "Gelo Quebradiço", raridade: "rara", tipo: "sentinela_mod", alvo: "gelo", texto: "Criostase: +50% de dano e +10% de lentidão", efeito: { danoPct: 0.5, lentidao: 0.1 }, maxPilhas: 3, requisitos: { sentinela: "gelo" } },

  // ---------- Passivas de evolução ----------
  { id: "calibre_pesado", nome: "Calibre Pesado", raridade: "rara", tipo: "passiva", texto: "+15% de dano (evolui o Canhão de Pulso)", efeito: { danoPct: 0.15 }, maxPilhas: 1, requisitos: { sentinela: "canhao" } },
  { id: "prisma_optico", nome: "Prisma Óptico", raridade: "rara", tipo: "passiva", texto: "+10% de alcance (evolui a Lança Laser)", efeito: { alcancePct: 0.1 }, maxPilhas: 1, requisitos: { sentinela: "laser" } },
  { id: "supercondutor", nome: "Supercondutor", raridade: "rara", tipo: "passiva", texto: "+10% de cadência (evolui o Acelerador)", efeito: { cadenciaPct: 0.1 }, maxPilhas: 1, requisitos: { sentinela: "trilho" } },
  { id: "refracao", nome: "Refração", raridade: "rara", tipo: "passiva", texto: "+5% de crítico (evolui o Prisma)", efeito: { critChance: 0.05 }, maxPilhas: 1, requisitos: { sentinela: "feixe" } },
  { id: "ogiva_pesada", nome: "Ogiva Pesada", raridade: "rara", tipo: "passiva", texto: "+15% de área (evolui o Enxame)", efeito: { areaPct: 0.15 }, maxPilhas: 1, requisitos: { sentinela: "missil" } },
  { id: "massa_critica", nome: "Massa Crítica", raridade: "rara", tipo: "passiva", texto: "+10% de dano (evolui o Poço Gravitacional)", efeito: { danoPct: 0.1 }, maxPilhas: 1, requisitos: { sentinela: "gravidade" } },
  { id: "sobrecarga", nome: "Sobrecarga", raridade: "rara", tipo: "passiva", texto: "+20% de carga do ultimate (evolui o Domo)", efeito: { ultCargaPct: 0.2 }, maxPilhas: 1, requisitos: { sentinela: "campo" } },
  { id: "enxame_autonomo", nome: "Enxame Autônomo", raridade: "rara", tipo: "passiva", texto: "+10% de cadência (evolui a Colmeia)", efeito: { cadenciaPct: 0.1 }, maxPilhas: 1, requisitos: { sentinela: "drone" } },
  { id: "zero_absoluto", nome: "Zero Absoluto", raridade: "rara", tipo: "passiva", texto: "+10% de lentidão (evolui a Criostase)", efeito: { lentidao: 0.1 }, maxPilhas: 1, requisitos: { sentinela: "gelo" } },
];

const GERADAS: CardDef[] = SENTINEL_IDS.flatMap((id): CardDef[] => {
  const s = SENTINELS[id];
  return [
    {
      id: `nova_${id}`,
      nome: s.nome,
      raridade: "rara",
      tipo: "nova_sentinela",
      alvo: id,
      texto: `Nova sentinela: ${s.desc}`,
      efeito: {},
      maxPilhas: 1,
      peso: 1.4,
    },
    {
      id: `nivel_${id}`,
      nome: `${s.nome} +1`,
      raridade: "comum",
      tipo: "sentinela_nivel",
      alvo: id,
      texto: "", // preenchido dinamicamente com o bônus do próximo nível
      efeito: {},
      maxPilhas: 4,
      requisitos: { sentinela: id },
      peso: 1.6,
    },
    {
      id: `evo_${id}`,
      nome: s.evolucao.nome,
      raridade: "lendaria",
      tipo: "evolucao",
      alvo: id,
      texto: `EVOLUÇÃO: ${s.evolucao.desc}`,
      efeito: { danoPct: 0.5 },
      maxPilhas: 1,
      requisitos: { sentinela: id, nivelMin: 5, carta: s.evolucao.passiva },
    },
  ];
});

export const CARDS: CardDef[] = [...MANUAIS, ...GERADAS];
export const CARD_MAP: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
