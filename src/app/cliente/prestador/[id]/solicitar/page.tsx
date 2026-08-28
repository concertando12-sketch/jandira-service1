import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionData } from "@/lib/subscription";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceRequestForm } from "@/components/provider/service-request-form";

export default async function SolicitarServicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CLIENT");
  const { id } = await params;
  const supabase = await createClient();

  // Fase 9: sem assinatura em dia, nem chega a ver o formulário — a
  // regra "de verdade" já está garantida pela RLS (service_requests_
  // insert_client), isso só evita mostrar uma tela que ia falhar.
  const { isActive } = await getSubscriptionData(user.id, user.role === "ADMIN");
  if (!isActive) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Solicitar serviço" description="Assinatura necessária" />
        <Card className="py-10 text-center">
          <p className="text-sm text-foreground">
            Sua assinatura mensal precisa estar em dia pra solicitar um serviço.
          </p>
          <Link href="/cliente/assinatura">
            <Button className="mt-4">Ver assinatura</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const [{ data: provider }, { data: address }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select(
        "id, professional_name, is_active, provider_services(services(id, name)), provider_regions(regions(id, name))",
      )
      .eq("id", id)
      .eq("is_active", true)
      .eq("status", "APPROVED")
      .maybeSingle(),
    supabase
      .from("user_addresses")
      .select("region_id, street, number, complement")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!provider) {
    return (
      <div>
        <Card className="py-14 text-center text-sm text-muted">
          Esse prestador não está mais disponível.
        </Card>
      </div>
    );
  }

  const services = (provider.provider_services ?? [])
    .map((ps) => ps.services)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const regions = (provider.provider_regions ?? [])
    .map((pr) => pr.regions)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  // O bairro da solicitação só pode ser um que o prestador realmente
  // atende (item 6 da Parte 2) — usa o endereço principal do cliente só
  // se ele bater com um desses, senão deixa em branco pra escolher.
  const defaultRegionId = regions.some((r) => r.id === address?.region_id)
    ? (address?.region_id ?? null)
    : regions[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Solicitar serviço"
        description={`Para ${provider.professional_name}`}
      />
      <Card>
        {services.length === 0 || regions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Esse prestador ainda não configurou serviços/regiões o suficiente pra receber
            pedidos.
          </p>
        ) : (
          <ServiceRequestForm
            providerId={provider.id}
            services={services}
            regions={regions}
            defaultRegionId={defaultRegionId}
            defaultStreet={address?.street ?? null}
            defaultNumber={address?.number ?? null}
            defaultComplement={address?.complement ?? null}
          />
        )}
      </Card>
    </div>
  );
}
