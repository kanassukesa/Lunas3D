// Recebe as notificações do Mercado Pago, confere a assinatura, consulta o pagamento na API
// (nunca confia no corpo da notificação) e grava a compra como aprovada.
// Segredos: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET (Assinatura secreta do painel de webhooks).
// Publicar sem verificação de JWT: supabase functions deploy webhook-mercadopago --no-verify-jwt
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PRODUTOS } from "../_shared/produtos.ts";

async function assinaturaValida(req: Request, dataId: string): Promise<boolean> {
  const segredo = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!segredo) return false;
  const sig = req.headers.get("x-signature") ?? "";
  const reqId = req.headers.get("x-request-id") ?? "";
  const partes = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${dataId.toLowerCase()};request-id:${reqId};ts:${partes.ts};`;
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(manifesto)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === partes.v1;
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  let corpo: { type?: string; data?: { id?: string } } = {};
  try { corpo = await req.json(); } catch { /* notificação sem corpo */ }
  const tipo = corpo.type ?? u.searchParams.get("type");
  const dataId = String(corpo.data?.id ?? u.searchParams.get("data.id") ?? "");
  if (tipo !== "payment" || !dataId) return new Response("ignorado", { status: 200 });
  if (!(await assinaturaValida(req, dataId))) return new Response("assinatura inválida", { status: 401 });

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` },
  });
  if (!r.ok) return new Response("erro ao consultar pagamento", { status: 502 });
  const pg = await r.json();
  const [userId, produto] = String(pg.external_reference ?? "").split(":");
  const p = PRODUTOS[produto];
  if (!userId || !p) return new Response("referência inválida", { status: 200 });
  // confere o valor cobrado contra a tabela do servidor
  if (Math.round(Number(pg.transaction_amount) * 100) !== p.centavos || pg.currency_id !== "BRL") return new Response("valor divergente", { status: 200 });

  const status = pg.status === "approved" ? "aprovado"
    : pg.status === "refunded" || pg.status === "charged_back" ? "estornado"
    : pg.status === "rejected" || pg.status === "cancelled" ? "recusado" : "pendente";

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await admin.from("compras").upsert({
    id: `mp:${pg.id}`, user_id: userId, produto, centavos: p.centavos, preferencia: pg.preference_id ?? null, status, atualizado_em: new Date().toISOString(),
  });
  return new Response("ok", { status: 200 });
});
