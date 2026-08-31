import { createClient } from "@/lib/supabase/server";
import { buildPixPayload, buildPixQrDataUrl } from "@/lib/pix";
import { APP_CITY, FREE_TRIAL_END_DATE } from "@/lib/constants";

// Lê o histórico de assinatura de um usuário e resolve o status atual
// — compartilhado entre /cliente/assinatura e /prestador/assinatura
// (é a mesma regra pros dois papéis, Fase 9). `isAdmin` espelha o
// bypass que já existe em has_active_subscription() no banco — admin
// nunca precisa pagar, mesmo navegando como cliente/prestador via
// seletor de visualização.
export async function getSubscriptionData(userId: string, isAdmin = false) {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("pix_key, pix_receiver_name, subscription_amount")
    .eq("id", true)
    .maybeSingle();

  const amount = settings?.subscription_amount ?? 5;
  // QR Code + "PIX Copia e Cola" de verdade (padrão Bacen) — gerados na
  // hora a partir da chave/valor configurados pelo admin, nunca
  // hardcoded. Só existem quando a chave PIX já foi cadastrada.
  const pixOpts = settings?.pix_key
    ? {
        pixKey: settings.pix_key,
        receiverName: settings.pix_receiver_name || "JANDIRA SERVICE",
        city: APP_CITY,
        amount,
      }
    : null;
  const pixQrDataUrl = pixOpts ? await buildPixQrDataUrl(pixOpts) : null;
  const pixCopyPaste = pixOpts ? buildPixPayload(pixOpts) : null;

  const today = new Date().toISOString().slice(0, 10);
  // Período de teste grátis de lançamento — mesmo corte de
  // has_active_subscription() no banco (schema.sql). Cliente e
  // prestador ficam liberados até essa data sem precisar de nenhuma
  // assinatura aprovada.
  const isFreeTrial = today < FREE_TRIAL_END_DATE;

  if (isAdmin) {
    return {
      isActive: true,
      activeUntil: null,
      latestStatus: null,
      latestRejectionReason: null,
      pixKey: settings?.pix_key ?? null,
      pixReceiverName: settings?.pix_receiver_name ?? null,
      pixQrDataUrl,
      pixCopyPaste,
      amount,
      isFreeTrial: false,
      freeTrialEndDate: FREE_TRIAL_END_DATE,
    };
  }

  const { data: history } = await supabase
    .from("subscriptions")
    .select("id, status, submitted_at, period_end, rejection_reason")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });

  const activeRow = (history ?? []).find((s) => s.status === "APPROVED" && s.period_end && s.period_end >= today);
  const latest = history?.[0] ?? null;

  return {
    isActive: isFreeTrial || Boolean(activeRow),
    activeUntil: activeRow?.period_end ?? null,
    latestStatus: latest?.status ?? null,
    latestRejectionReason: latest?.rejection_reason ?? null,
    pixKey: settings?.pix_key ?? null,
    pixReceiverName: settings?.pix_receiver_name ?? null,
    pixQrDataUrl,
    pixCopyPaste,
    amount,
    isFreeTrial,
    freeTrialEndDate: FREE_TRIAL_END_DATE,
  };
}
