const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 49.9 → "R$ 49,90" */
export function formatBRL(value: number | string | null | undefined) {
  return brl.format(Number(value ?? 0));
}

/** "60000000" → "60000-000" */
export function formatCEP(cep: string) {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : cep;
}

/** "5585988669361" → "(85) 98866-9361" */
export function formatPhoneBR(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

/** Link do WhatsApp com mensagem pronta. */
export function whatsappLink(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/** Preço atual considerando promoção válida. */
export function effectivePrice(product: {
  price: number;
  promo_price: number | null;
  promo_ends_at: string | null;
}) {
  const promoValid =
    product.promo_price != null &&
    (!product.promo_ends_at || new Date(product.promo_ends_at) > new Date());
  return promoValid ? Number(product.promo_price) : Number(product.price);
}
