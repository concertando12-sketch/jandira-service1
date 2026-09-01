import { createClient } from "@/lib/supabase/server";
import { buildPixPayload, buildPixQrDataUrl } from "@/lib/pix";
import { APP_CITY, TRIAL_DAYS } from "@/lib/constants";

// created_at (timestamptz) + N dias, em data (YYYY-MM-DD) — usa só a
// parte da data (igual o banco faz com created_at::date + N) pra não
// depender de fuso/horário exato do cadastro.
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Lê o histórico de assinatura de um usuário e resolve o status atual
// — compartilhado entre /cliente/assinatura e /prestador/assinatura
// (é a mesma regra pros dois papéis, Fase 9). `isAdmin` espelha o
// bypass que já existe em has_active_subscription() no banco — admin
// nunca precisa pagar, mesmo navegando como cliente/prestador via
// seletor de visualização.
export async function getSubscriptionData(userId: string, isAdmin = false) {
  const supabase = await createClient();

  const [{ data: settings }, { data: userRow }] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("pix_key, pix_receiver_name, subscription_amount")
      .eq("id", true)
      .maybeSingle(),
    supabase.from("users").select("created_at").eq("id", userId).maybeSingle(),
  ]);

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
  // Teste grátis por pessoa — TRIAL_DAYS a partir do PRÓPRIO cadastro
  // (created_at), não uma data fixa igual pra todo mundo. Mesmo
  // cálculo de has_active_subscription() no banco (schema.sql).
  const freeTrialEndDate = userRow?.created_at ? addDays(userRow.created_at, TRIAL_DAYS) : null;
  const isFreeTrial = freeTrialEndDate ? today < freeTrialEndDate : false;

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
      freeTrialEndDate,
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
    freeTrialEndDate,
  };
}
