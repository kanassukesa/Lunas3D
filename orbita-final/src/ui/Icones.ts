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
  correio: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  trofeu: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9.5 18h5"/>',
  presente: '<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12"/><path d="M12 9C10.5 6 7 5 7 7.2 7 9 12 9 12 9zM12 9c1.5-3 5-4 5-1.8C17 9 12 9 12 9z"/>',
  carrinho: '<path d="M2.5 3.5h3l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21.5 8H6.5"/><circle cx="10" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>',
  passe: '<path d="M12 2.8l2.6 5.5 6 .7-4.4 4.1 1.2 6L12 16.1l-5.4 3 1.2-6L3.4 9l6-.7z"/><path d="M12 7.5v5"/>',
  grafico: '<path d="M4 20h16M6 16v-3M11 16V9M16 16V5"/>',
  caixa: '<path d="M3 8l9-4.5L21 8v8.5L12 21l-9-4.5z"/><path d="M3 8l9 4.5L21 8M12 12.5V21"/>',
  grupo: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
  ranking: '<path d="M12 3l1.9 3.9 4.3.6-3.1 3 .7 4.3L12 12.8l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/><path d="M5 13c-1.8 2-1.8 5.5.8 7.5M19 13c1.8 2 1.8 5.5-.8 7.5M8 21h8"/>',
  usuario: '<path d="M5 12a7 7 0 0 1 14 0v3H5z"/><path d="M7.5 12.5h9l-1 3h-7z" fill="currentColor"/><path d="M6 15v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3"/>',
  sair: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  espadas: '<path d="M4 4l9 9M4 4v3.5M4 4h3.5M20 4l-9 9M20 4v3.5M20 4h-3.5M7 14l3 3M17 14l-3 3M5.5 18.5l2-2M18.5 18.5l-2-2"/>',
  ampulheta: '<path d="M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9s10 4 10 9"/>',
  camadas: '<path d="M12 3 2 8l10 5 10-5z"/><path d="M2 12l10 5 10-5M2 16l10 5 10-5"/>',
  bandeira: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
  evoluir: '<path d="M6 13l6-6 6 6M6 19l6-6 6 6"/>',
  coroa2: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>',
  coracao: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/>',
  folha: '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19 13 11"/>',
  banco: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
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
