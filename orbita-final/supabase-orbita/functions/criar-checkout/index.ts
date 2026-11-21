// Cria a preferência de pagamento no Mercado Pago para o jogador logado e devolve a URL do checkout.
// Segredos (supabase secrets set): MP_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY (automático), URL_WEBHOOK (opcional).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PRODUTOS, cors } from "../_shared/produtos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const usuario = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await usuario.auth.getUser();
    if (!user) return new Response(JSON.stringify({ erro: "não logado" }), { status: 401, headers: cors });

    const { produto, retorno } = await req.json();
    const p = PRODUTOS[produto];
    if (!p) return new Response(JSON.stringify({ erro: "produto inválido" }), { status: 400, headers: cors });

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const referencia = `${user.id}:${produto}:${crypto.randomUUID()}`;
    const notificacao = Deno.env.get("URL_WEBHOOK") ?? `${url}/functions/v1/webhook-mercadopago`;

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: produto, title: `Órbita Final — ${p.nome}`, quantity: 1, currency_id: "BRL", unit_price: p.centavos / 100 }],
        external_reference: referencia,
        notification_url: notificacao,
        back_urls: { success: retorno, pending: retorno, failure: retorno },
        auto_return: "approved",
        payment_methods: { installments: 1 },
        statement_descriptor: "ORBITAFINAL",
      }),
    });
    const pref = await r.json();
    if (!r.ok) throw new Error(pref.message ?? "erro no Mercado Pago");

    await admin.from("compras").insert({ id: `pref:${pref.id}`, user_id: user.id, produto, centavos: p.centavos, preferencia: pref.id, status: "pendente" });
    return new Response(JSON.stringify({ url: pref.init_point }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ erro: (e as Error).message }), { status: 500, headers: cors });
  }
});
