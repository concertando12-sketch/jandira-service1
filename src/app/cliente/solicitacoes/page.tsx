import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { RequestCard, type RequestCardData } from "@/components/client/request-card";
import type { RequestStatus } from "@/lib/constants";

export default async function ClienteSolicitacoesPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("service_requests")
    .select(
      `id, status, created_at, description, preferred_date, preferred_time,
       services(name),
       provider_profiles(id, professional_name, whatsapp),
       regions(name),
       reviews(rating, comment)`,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const cards: RequestCardData[] = (requests ?? []).map((r) => ({
    id: r.id,
    status: r.status as RequestStatus,
    serviceName: r.services?.name ?? "Serviço",
    providerId: r.provider_profiles?.id ?? "",
    providerName: r.provider_profiles?.professional_name || "Prestador",
    providerWhatsapp: r.provider_profiles?.whatsapp ?? null,
    regionName: r.regions?.name ?? null,
    preferredDate: r.preferred_date,
    preferredTime: r.preferred_time,
    description: r.description,
    createdAt: r.created_at,
    existingReview: r.reviews,
  }));

  return (
    <div>
      <PageHeader title="Meus pedidos" description="Acompanhe suas solicitações de serviço" />

      {cards.length > 0 ? (
        <div className="flex flex-col gap-3">
          {cards.map((c) => (
            <RequestCard key={c.id} data={c} />
          ))}
        </div>
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
