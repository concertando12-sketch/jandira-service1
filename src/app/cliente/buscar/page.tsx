import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import { BuscarForm } from "./buscar-form";

export default async function ClienteBuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string }>;
}) {
  const user = await requireRole("CLIENT");
  const { servico } = await searchParams;
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const [{ data: services }, { data: regions }, { data: address }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, slug, categories(name)")
      .eq("is_active", true)
      .order("name"),
    city
      ? supabase.from("regions").select("id, name").eq("city_id", city.id).eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from("user_addresses")
      .select("region_id, regions(name)")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const serviceOptions = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category_name: s.categories?.name ?? null,
  }));

  // Item 9/12 da Fase 3.1: se o cliente já tem bairro salvo, usa
  // automaticamente. Se também veio com ?servico= (ex: link de uma
  // categoria), já busca no servidor — sem round-trip extra no cliente.
  const initialRegionId = address?.region_id ?? null;
  const initialRegionName = address?.regions?.name ?? null;

  let initialResults = null;
  if (servico && initialRegionId) {
    const { data } = await supabase.rpc("search_providers", {
      p_service_slug: servico,
      p_region_id: initialRegionId,
    });
    initialResults = data ?? [];
  }

  return (
    <div>
      <PageHeader title="Buscar serviço" description={`Encontre prestadores em ${APP_CITY} - ${APP_STATE}`} />
      <BuscarForm
        services={serviceOptions}
        regions={regions ?? []}
        initialServiceSlug={servico ?? ""}
        initialRegionId={initialRegionId}
        initialRegionName={initialRegionName}
        initialResults={initialResults}
      />
    </div>
  );
}
