import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import {
  ProviderRequestCard,
  type ProviderRequestCardData,
} from "@/components/provider/provider-request-card";
import type { RequestStatus } from "@/lib/constants";

export default async function PrestadorSolicitacoesPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: requests } = profile
    ? await supabase
        .from("service_requests")
        .select(
          `id, status, created_at, description, street, number, complement, preferred_date, preferred_time,
           services(name),
           users(name),
           regions(name)`,
        )
        .eq("provider_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const cards: ProviderRequestCardData[] = (requests ?? []).map((r) => ({
    id: r.id,
    status: r.status as RequestStatus,
    serviceName: r.services?.name ?? "Serviço",
    clientName: r.users?.name || "Cliente",
    regionName: r.regions?.name ?? null,
    street: r.street,
    number: r.number,
    complement: r.complement,
    preferredDate: r.preferred_date,
    preferredTime: r.preferred_time,
    description: r.description,
  }));

  return (
    <div>
      <PageHeader title="Solicitações" description="Pedidos de clientes esperando resposta" />

      {!profile ? (
        <Card className="py-14 text-center text-sm text-muted">
          Você ainda não definiu onde atende — vá em{" "}
          <span className="font-medium text-foreground">Minha região</span> pra começar a
          receber pedidos.
        </Card>
      ) : cards.length > 0 ? (
        <div className="flex flex-col gap-3">
          {cards.map((c) => (
            <ProviderRequestCard key={c.id} data={c} />
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">
          Nenhuma solicitação ainda. Assim que um cliente pedir seu serviço, aparece aqui.
        </Card>
      )}
    </div>
  );
}
