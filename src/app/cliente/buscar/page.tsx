import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import { BuscarForm } from "./buscar-form";

// URL compartilhável (item 24 da Fase 4): /cliente/buscar?servico=baba&bairro=novo-horizonte
export default async function ClienteBuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; bairro?: string }>;
}) {
  const user = await requireRole("CLIENT");
  const { servico, bairro } = await searchParams;
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const [{ data: services }, { data: regions }, { data: address }, { data: favorites }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, slug, categories(name)")
      .eq("is_active", true)
      .order("name"),
    city
      ? supabase.from("regions").select("id, name, slug").eq("city_id", city.id).eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    supabase
      .from("user_addresses")
      .select("region_id, regions(name)")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("favorites").select("provider_id").eq("client_id", user.id),
  ]);

  const serviceOptions = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category_name: s.categories?.name ?? null,
  }));

  // Item 9/12 da Fase 3.1: se o cliente já tem bairro salvo, usa
  // automaticamente. `?bairro=slug` na URL tem prioridade (link
  // compartilhado) — some sozinho da URL se ninguém informar nenhum.
  const regionFromUrl = bairro ? (regions ?? []).find((r) => r.slug === bairro) : null;
  const initialRegionId = regionFromUrl?.id ?? address?.region_id ?? null;
  const initialRegionName = regionFromUrl?.name ?? address?.regions?.name ?? null;

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
        regions={(regions ?? []).map((r) => ({ id: r.id, name: r.name }))}
        initialServiceSlug={servico ?? ""}
        initialRegionId={initialRegionId}
        initialRegionName={initialRegionName}
        initialResults={initialResults}
        initialFavoritedIds={(favorites ?? []).map((f) => f.provider_id)}
      />
    </div>
  );
}
