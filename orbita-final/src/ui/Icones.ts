/**
 * Ícones vetoriais da interface (traço uniforme, cor = currentColor). Substituem os emojis.
 * Uso: `h("span", { class: "ic", html: ic("mapa") })` ou dentro de strings `html:`.
 */
const P: Record<string, string> = {
  mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  hangar: '<path d="M8 5h8l4 7-4 7H8l-4-7z"/><circle cx="12" cy="12" r="2.6"/><path d="M14.6 12H22"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  planeta: '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-22 12 12)"/>',
  missoes: '<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><circle cx="11" cy="13" r="1" fill="currentColor"/><path d="M14 10l6.5-6.5M17.5 3.5h3v3"/>',
  modos: '<circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/>',
  pausar: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  cartas: '<rect x="3" y="6" width="11" height="15" rx="2"/><path d="M8 3.5 18.5 2a2 2 0 0 1 2.2 1.7l1.6 11.2a2 2 0 0 1-1.7 2.2l-3.1.5"/>',
  estrela: '<path fill="currentColor" stroke="none" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/>',
  cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  coroa: '<path d="M4 18h16M4.5 8l4 3.5L12 5l3.5 6.5 4-3.5-1.5 9h-12z"/>',
  alerta: '<path d="M12 3 22 20H2z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  mira: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  repetir: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.6M20 3.5v5.1h-5.1M20 12a8 8 0 0 1-13.7 5.6L4 15.4M4 20.5v-5.1h5.1"/>',
  casa: '<path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5"/>',
  fundir: '<path d="M9 3h6M10 3v6l-5.4 9.3A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.7L14 9V3M7.5 15h9"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  infinito: '<path d="M7 8c-3 0-5 1.8-5 4s2 4 5 4c4.5 0 5.5-8 10-8 3 0 5 1.8 5 4s-2 4-5 4c-4.5 0-5.5-8-10-8z"/>',
  bussola: '<circle cx="12" cy="12" r="9"/><path fill="currentColor" d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z"/>',
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path fill="currentColor" stroke="none" d="M8 4.5v15l12-7.5z"/>',
  raio: '<path fill="currentColor" stroke="none" d="M13.5 2 4 14h7l-1.5 8L19 10h-7z"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  diamante: '<path d="M6 3h12l4 6-10 12L2 9z M2 9h20M9 3l3 18M15 3l-3 18"/>',
  // efeitos de campo da Jornada
  radiacao: '<circle cx="12" cy="12" r="1.8" fill="currentColor"/><path fill="currentColor" stroke="none" d="M12 9.5 8.6 3.6A9.5 9.5 0 0 0 2.6 12H9.5a2.5 2.5 0 0 1 2.5-2.5zM12 9.5l3.4-5.9A9.5 9.5 0 0 1 21.4 12h-6.9a2.5 2.5 0 0 0-2.5-2.5zM10.8 14.2l-3.4 6a9.5 9.5 0 0 0 9.2 0l-3.4-6a2.5 2.5 0 0 1-2.4 0z"/>',
  espiral: '<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6 8 8 0 1 1-8-8"/>',
  avancar: '<path fill="currentColor" stroke="none" d="M3 5l9 7-9 7zM12 5l9 7-9 7z"/>',
  sol: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  nevoa: '<path d="M3 8h13M6 12h15M3 16h11M7 20h10"/>',
  bomba: '<circle cx="10.5" cy="14" r="7"/><path d="M15.5 9l3-3M19 2.5v2M21.5 5h-2M20.8 2.9l-1.3 1.3"/>',
};

export function ic(nome: string, classe = "ic"): string {
  const corpo = P[nome] ?? P.mais;
  return `<svg class="${classe}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
}

/** Texto com ícone na frente (para `html:`). */
export function icT(nome: string, texto: string): string {
  return `${ic(nome)}<span>${texto}</span>`;
}
