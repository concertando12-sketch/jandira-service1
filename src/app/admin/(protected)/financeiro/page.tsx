import { DollarSign, Users, CalendarClock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, Badge } from "@/components/ui/card";
import { ROLE_LABELS, FREE_TRIAL_END_DATE } from "@/lib/constants";

// Aba Financeira (Fase 9) — quem já pagou de verdade, com nome/CPF/e-mail
// e o valor. Diferente de /admin/assinaturas (que só lista comprovante
// PENDING_REVIEW pra aprovar/rejeitar): aqui é o histórico já aprovado,
// pra dono da plataforma acompanhar quem pagou e quanto entrou.
//
// Só conta pagamentos aprovados a partir de FREE_TRIAL_END_DATE — os
// pagamentos anteriores foram feitos ainda em fase de teste/ajuste
// (antes do período de teste grátis e do valor subir pra R$6), então
// não entram na contabilidade real da plataforma.
export default async function AdminFinanceiroPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const trialEnd = new Date(`${FREE_TRIAL_END_DATE}T00:00:00Z`);

  const { data: paid } = await supabase
    .from("subscriptions")
    .select(
      "id, amount, reviewed_at, period_start, period_end, users!subscriptions_user_id_fkey(name, email, cpf, phone, role)",
    )
    .eq("status", "APPROVED")
    .gte("reviewed_at", trialEnd.toISOString())
    .order("reviewed_at", { ascending: false });

  const rows = paid ?? [];

  const totalRecebido = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const recebidoNoMes = rows
    .filter((r) => r.reviewed_at && new Date(r.reviewed_at) >= startOfMonth)
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const pagantesUnicos = new Set(rows.map((r) => r.users?.email ?? r.id)).size;

  const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "—");
  const formatDate = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—");

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description={`Pagamentos de assinatura aprovados a partir de ${trialEnd.toLocaleDateString("pt-BR")} — pagamentos de teste anteriores a essa data não entram na conta.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total recebido" value={currency(totalRecebido)} icon={DollarSign} />
        <StatCard label="Recebido no mês" value={currency(recebidoNoMes)} icon={CalendarClock} />
        <StatCard label="Pagantes" value={pagantesUnicos} icon={Users} />
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
        Pagamentos aprovados ({rows.length})
      </p>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{r.users?.name ?? "—"}</p>
                  {r.users?.role && <Badge variant="muted">{ROLE_LABELS[r.users.role]}</Badge>}
                </div>
                <p className="text-xs text-muted">{r.users?.email ?? "—"}</p>
                <p className="text-xs text-muted">
                  CPF: <span className="font-medium text-foreground">{r.users?.cpf || "não informado"}</span>
                  {r.users?.phone && <span> · Tel: {r.users.phone}</span>}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Pago em {formatDateTime(r.reviewed_at)}
                  {r.period_start && r.period_end && (
                    <> · Período: {formatDate(r.period_start)} a {formatDate(r.period_end)}</>
                  )}
                </p>
              </div>
              <Badge variant="brand" className="w-fit shrink-0">
                {currency(Number(r.amount))}
              </Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">Nenhum pagamento aprovado ainda.</Card>
      )}
    </div>
  );
}
