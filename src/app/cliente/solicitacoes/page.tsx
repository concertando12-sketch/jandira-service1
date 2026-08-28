import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { RequestsTabList } from "@/components/client/requests-tab-list";
import type { RequestCardData } from "@/components/client/request-card";
import type { RequestStatus } from "@/lib/constants";

export default async function ClienteSolicitacoesPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("service_requests")
    .select(
      `id, status, requested_date, requested_time,
       services(name),
       provider_profiles(professional_name),
       regions(name)`,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const cards: RequestCardData[] = (requests ?? []).map((r) => ({
    id: r.id,
    status: r.status as RequestStatus,
    serviceName: r.services?.name ?? "Serviço",
    providerName: r.provider_profiles?.professional_name || "Prestador",
    regionName: r.regions?.name ?? null,
    requestedDate: r.requested_date,
    requestedTime: r.requested_time,
  }));

  return (
    <div>
      <PageHeader title="Meus pedidos" description="Acompanhe suas solicitações de serviço" />

      {cards.length > 0 ? (
        <RequestsTabList requests={cards} />
      ) : (
        <Card className="py-14 text-center text-sm text-muted">
          Você ainda não fez nenhuma solicitação. Vá em{" "}
          <span className="font-medium text-foreground">Buscar</span> pra encontrar um
          prestador.
        </Card>
      )}
    </div>
  );
}
