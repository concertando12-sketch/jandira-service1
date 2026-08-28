import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";

const STATUS_VARIANT: Record<string, "default" | "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  ACCEPTED: "default",
  DECLINED: "danger",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  CANCELLED: "muted",
};

export default async function AdminSolicitacoesPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("service_requests")
    .select(
      "id, status, created_at, services(name), users(name), provider_profiles(professional_name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader title="Solicitações" description="Todos os pedidos feitos por clientes na plataforma" />

      {requests && requests.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Prestador</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.services?.name}</td>
                  <td className="px-4 py-3 text-muted">{r.users?.name}</td>
                  <td className="px-4 py-3 text-muted">{r.provider_profiles?.professional_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>
                      {REQUEST_STATUS_LABELS[r.status as keyof typeof REQUEST_STATUS_LABELS]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">
          Nenhuma solicitação ainda — o fluxo de solicitação chega na Fase 5.
        </Card>
      )}
    </div>
  );
}
