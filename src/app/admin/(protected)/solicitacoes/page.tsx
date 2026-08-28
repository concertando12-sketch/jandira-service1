import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { AdminRequestsTable, type AdminRequestRow } from "@/components/admin/requests-table";
import type { RequestStatus } from "@/lib/constants";

export default async function AdminSolicitacoesPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("service_requests")
    .select(
      "id, status, provider_price, created_at, services(name), users(name), provider_profiles(professional_name), regions(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: AdminRequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    status: r.status as RequestStatus,
    serviceName: r.services?.name ?? null,
    clientName: r.users?.name ?? null,
    providerName: r.provider_profiles?.professional_name ?? null,
    regionName: r.regions?.name ?? null,
    price: r.provider_price,
    createdAt: r.created_at,
  }));

  return (
    <div>
      <PageHeader title="Solicitações" description="Todos os pedidos feitos por clientes na plataforma" />
      {rows.length > 0 ? (
        <AdminRequestsTable requests={rows} />
      ) : (
        <p className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
          Nenhuma solicitação ainda.
        </p>
      )}
    </div>
  );
}
