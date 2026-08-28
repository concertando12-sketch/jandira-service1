import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { ReportStatusActions } from "@/components/admin/report-status-actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  IN_REVIEW: "Em análise",
  RESOLVED: "Resolvida",
  DISMISSED: "Descartada",
};

const STATUS_VARIANT: Record<string, "brand" | "success" | "muted" | "default"> = {
  PENDING: "brand",
  IN_REVIEW: "default",
  RESOLVED: "success",
  DISMISSED: "muted",
};

export default async function AdminDenunciasPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      `id, reason, description, status, created_at,
       reporter:users!reports_reporter_id_fkey(name),
       reported:users!reports_reported_user_id_fkey(name)`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title="Denúncias" description="Denúncias enviadas por clientes e prestadores" />

      {reports && reports.length > 0 ? (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{r.reported?.name ?? "Usuário"}</p>
                  <p className="text-sm text-muted">Motivo: {r.reason}</p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</Badge>
              </div>
              {r.description && <p className="text-sm text-foreground">{r.description}</p>}
              <p className="text-xs text-muted">
                Denunciado por {r.reporter?.name ?? "—"} ·{" "}
                {new Date(r.created_at).toLocaleDateString("pt-BR")}
              </p>
              <ReportStatusActions reportId={r.id} status={r.status} />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">Nenhuma denúncia registrada.</Card>
      )}
    </div>
  );
}
