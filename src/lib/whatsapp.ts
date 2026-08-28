// Monta um link direto do wa.me (item 22 da Fase 1 / item 33 da Fase 4).
// Sem integração de API — só um link com mensagem pré-preenchida.
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
