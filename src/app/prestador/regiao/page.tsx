import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import { ProviderRegionForm } from "./region-form";

export default async function PrestadorRegiaoPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const [{ data: regions }, { data: profile }] = await Promise.all([
    city
      ? supabase
          .from("regions")
          .select("id, name")
          .eq("city_id", city.id)
          .eq("is_active", true)
          .order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("provider_profiles").select("id, region_id").eq("user_id", user.id).maybeSingle(),
  ]);

  let attendingIds: string[] = [];
  if (profile) {
    const { data: providerRegions } = await supabase
      .from("provider_regions")
      .select("region_id")
      .eq("provider_id", profile.id);
    attendingIds = (providerRegions ?? []).map((r) => r.region_id);
  }

  return (
    <div>
      <PageHeader
        title="Minha região"
        description={`Onde em ${APP_CITY} - ${APP_STATE} você atende? Você pode marcar quantos bairros quiser.`}
      />

      <Card className="max-w-xl">
        {regions && regions.length > 0 ? (
          <ProviderRegionForm
            regions={regions}
            defaultHomeRegionId={profile?.region_id ?? null}
            defaultAttendingIds={attendingIds}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            Nenhum bairro cadastrado ainda em {APP_CITY}. Rode supabase/seed.sql ou peça pro
            admin cadastrar em Admin → Regiões.
          </p>
        )}
      </Card>
    </div>
  );
}
