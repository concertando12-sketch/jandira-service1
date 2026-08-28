import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import { BuscarForm } from "./buscar-form";

export default async function ClienteBuscarPage() {
  await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const [{ data: services }, { data: regions }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, slug, categories(name)")
      .eq("is_active", true)
      .order("name"),
    city
      ? supabase.from("regions").select("id, name").eq("city_id", city.id).eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const serviceOptions = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category_name: s.categories?.name ?? null,
  }));

  return (
    <div>
      <PageHeader title="Buscar serviço" description={`Encontre prestadores em ${APP_CITY} - ${APP_STATE}`} />
      <Suspense fallback={null}>
        <BuscarForm services={serviceOptions} regions={regions ?? []} />
      </Suspense>
    </div>
  );
}
