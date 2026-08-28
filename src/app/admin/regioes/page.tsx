import { MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { CreateRegionForm } from "@/components/admin/create-region-form";
import { RegionRow } from "@/components/admin/region-row";
import { RegionSuggestionRow } from "@/components/admin/region-suggestion-row";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export default async function AdminRegioesPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id, name, state, is_active")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const [{ data: regions }, { data: suggestions }] = await Promise.all([
    city
      ? supabase
          .from("regions")
          .select("id, name, is_active")
          .eq("city_id", city.id)
          .order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; is_active: boolean }[] }),
    supabase
      .from("region_suggestions")
      .select("id, name, status, users(name)")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader
        title="Regiões"
        description="Bairros são dados, não código — cadastre aqui e eles aparecem na hora para clientes e prestadores."
      />

      <Card className="mb-6 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-brand" />
        <div>
          <p className="font-semibold text-foreground">
            {city ? `${city.name} - ${city.state}` : `${APP_CITY} - ${APP_STATE} (não encontrada no banco)`}
          </p>
          <p className="text-xs text-muted">Bairros cadastrados: {regions?.length ?? 0}</p>
        </div>
        <Badge variant="brand" className="ml-auto">
          Ativa
        </Badge>
      </Card>

      {suggestions && suggestions.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Sugestões de bairro pendentes ({suggestions.length})
          </p>
          <div className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <RegionSuggestionRow key={s.id} id={s.id} name={s.name} submittedByName={s.users?.name ?? null} />
            ))}
          </div>
        </div>
      )}

      {city && (
        <>
          <Card className="mb-6">
            <p className="mb-3 text-sm font-semibold text-foreground">+ Novo bairro</p>
            <CreateRegionForm cityId={city.id} />
          </Card>

          <div className="flex flex-col gap-2">
            {regions?.map((r) => <RegionRow key={r.id} id={r.id} name={r.name} isActive={r.is_active} />)}
          </div>
          {(!regions || regions.length === 0) && (
            <Card className="py-8 text-center text-sm text-muted">
              Nenhum bairro cadastrado ainda. Rode supabase/seed.sql ou cadastre acima.
            </Card>
          )}
        </>
      )}
    </div>
  );
}
