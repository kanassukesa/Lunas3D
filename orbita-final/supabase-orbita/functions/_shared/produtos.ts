// Tabela de preços do SERVIDOR (fonte da verdade). Mantenha igual a src/data/monetizacao.ts.
export const PRODUTOS: Record<string, { nome: string; centavos: number }> = {
  inicial: { nome: "Pacote Inicial", centavos: 990 },
  cristais_60: { nome: "60 cristais", centavos: 490 },
  cristais_330: { nome: "330 cristais", centavos: 1990 },
  cristais_900: { nome: "900 cristais", centavos: 4990 },
  cristais_2000: { nome: "2000 cristais", centavos: 9990 },
  passe_premium: { nome: "Passe Premium", centavos: 1490 },
  sem_anuncios: { nome: "Sem anúncios", centavos: 1290 },
};

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
