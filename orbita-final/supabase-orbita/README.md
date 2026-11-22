# Servidor do Órbita Final (Supabase + Mercado Pago)

Projeto Supabase **separado** da loja. Guarda o progresso na nuvem e confirma compras.

## 1. Criar o projeto
1. supabase.com → New project (plano grátis serve para começar).
2. Authentication → Providers → **Email** ligado. Em URL Configuration, coloque o endereço do jogo (`https://orbita-final.vercel.app`) em Site URL e Redirect URLs.
3. **Contas:** Authentication → Sign In / Providers:
   - **Allow anonymous sign-ins** ligado (botão "Jogar como convidado").
   - Em **Email**, desligue **Confirm email** (a conta criada já entra direto).
   - Convidado vira conta de verdade em Ajustes → "Salvar meu progresso" (mesmo usuário: ranking e clã continuam).
4. **Esqueci minha senha:** usa o e-mail padrão "Reset password" (link). O link volta para o jogo, que pede a senha nova.
   - O e-mail padrão do Supabase só entrega para os membros do time e tem limite por hora (e não deixa editar os textos):
     para jogadores de verdade, configure um SMTP próprio (Authentication → Emails → SMTP Settings, ex.: Resend).
5. Banco: cole **`SETUP_SUPABASE.sql`** (tudo junto: saves, compras, ranking, clãs e convites) no SQL Editor e rode. Pode rodar de novo sem problema.
   (ou `supabase link --project-ref SEU_REF` e `supabase db push --workdir supabase-orbita`)

## 2. Mercado Pago
1. mercadopago.com.br/developers → Suas integrações → Criar aplicação (Checkout Pro).
2. Copie o **Access Token** (comece com o de TESTE).
3. Webhooks → URL: `https://SEU_REF.supabase.co/functions/v1/webhook-mercadopago`, evento **Pagamentos**. Copie a **assinatura secreta**.
4. Segredos e deploy:
   ```
   supabase secrets set MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=...
   supabase functions deploy criar-checkout
   supabase functions deploy webhook-mercadopago --no-verify-jwt
   ```

## 3. Ligar no jogo (variáveis na Vercel)
| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto |
| `VITE_SUPABASE_ANON_KEY` | chave anon (pública) |
| `VITE_PAGAMENTOS` | `mercadopago` |
| `VITE_ADSENSE_CLIENT` | `ca-pub-…` (depois da aprovação do AdSense/H5 Games Ads) |

Sem essas variáveis o jogo roda em **modo teste** (compras e anúncios simulados).

## Segurança
- O preço cobrado vem de `functions/_shared/produtos.ts`, não do celular.
- O webhook confere a assinatura e consulta o pagamento na API antes de aprovar; também confere o valor.
- O jogador só lê as próprias compras (RLS). Entregas são idempotentes pelo id do pagamento.
- Limitação conhecida: as moedas do jogo ainda ficam no aparelho (save). Compras ficam garantidas no servidor,
  mas alguém que edite o próprio save consegue se dar moedas locais. Para ranking/PvP, mover o saldo para o servidor.
