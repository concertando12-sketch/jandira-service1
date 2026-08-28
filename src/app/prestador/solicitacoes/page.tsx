import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { ProviderRequestsTabList } from "@/components/provider/requests-tab-list";
import type { ProviderRequestCardData } from "@/components/provider/provider-request-card";
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
          `id, status, description, street, number, complement, requested_date, requested_time, provider_price,
           services(name),
           users(name, avatar_url),
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
    clientPhoto: r.users?.avatar_url ?? null,
    regionName: r.regions?.name ?? null,
    street: r.street,
    number: r.number,
    complement: r.complement,
    requestedDate: r.requested_date,
    requestedTime: r.requested_time,
    description: r.description,
    providerPrice: r.provider_price,
  }));

  // Histórico resumido (item 33).
  const total = cards.length;
  const accepted = cards.filter((c) => c.status !== "PENDING" && c.status !== "DECLINED").length;
  const completed = cards.filter((c) => c.status === "COMPLETED").length;
  const cancelled = cards.filter((c) => c.status === "CANCELLED").length;

  return (
    <div>
      <PageHeader title="Solicitações" description="Pedidos de clientes esperando resposta" />

      {!profile ? (
        <Card className="py-14 text-center text-sm text-muted">
          Você ainda não definiu onde atende — vá em{" "}
          <span className="font-medium text-foreground">Minha região</span> pra começar a
          receber pedidos.
        </Card>
      ) : (
        <>
          {total > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="text-center">
                <p className="text-lg font-bold text-foreground">{total}</p>
                <p className="text-xs text-muted">Recebidas</p>
              </Card>
              <Card className="text-center">
                <p className="text-lg font-bold text-foreground">{accepted}</p>
                <p className="text-xs text-muted">Aceitas</p>
              </Card>
              <Card className="text-center">
                <p className="text-lg font-bold text-foreground">{completed}</p>
                <p className="text-xs text-muted">Concluídas</p>
              </Card>
              <Card className="text-center">
                <p className="text-lg font-bold text-foreground">{cancelled}</p>
                <p className="text-xs text-muted">Canceladas</p>
              </Card>
            </div>
          )}

          {cards.length > 0 ? (
            <ProviderRequestsTabList requests={cards} />
          ) : (
            <Card className="py-14 text-center text-sm text-muted">
              Nenhuma solicitação ainda. Assim que um cliente pedir seu serviço, aparece aqui.
            </Card>
          )}
        </>
      )}
    </div>
  );
}
