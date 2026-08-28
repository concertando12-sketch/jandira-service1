import { MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { CreateNeighborhoodForm } from "@/components/admin/create-neighborhood-form";
import { ActiveToggleButton } from "@/components/admin/active-toggle-button";
import { toggleNeighborhoodActiveAction } from "@/lib/actions/admin-actions";
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

  const { data: neighborhoods } = city
    ? await supabase
        .from("neighborhoods")
        .select("id, name, latitude, longitude, is_active")
        .eq("city_id", city.id)
        .order("name")
    : { data: [] };

  return (
    <div>
      <PageHeader
        title="Regiões"
        description="O MVP atende só uma cidade por vez — item mais importante da regra regional."
      />

      <Card className="mb-6 flex items-center gap-3">
        <MapPin className="h-5 w-5 text-brand" />
        <div>
          <p className="font-semibold text-foreground">
            {city ? `${city.name} - ${city.state}` : `${APP_CITY} - ${APP_STATE} (não encontrada no banco)`}
          </p>
          <p className="text-xs text-muted">
            Cidade principal e única ativa. Outras cidades entram aqui no futuro, sem alterar código.
          </p>
        </div>
        <Badge variant="brand" className="ml-auto">
          Ativa
        </Badge>
      </Card>

      {city && (
        <>
          <Card className="mb-6">
            <p className="mb-3 text-sm font-semibold text-foreground">Bairros de {city.name}</p>
            <CreateNeighborhoodForm cityId={city.id} />
          </Card>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods?.map((n) => (
              <Card key={n.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.name}</p>
                  <p className="text-xs text-muted">
                    {n.latitude}, {n.longitude}
                  </p>
                </div>
                <ActiveToggleButton
                  id={n.id}
                  isActive={n.is_active}
                  onToggle={toggleNeighborhoodActiveAction}
                />
              </Card>
            ))}
          </div>
          {(!neighborhoods || neighborhoods.length === 0) && (
            <Card className="py-8 text-center text-sm text-muted">
              Nenhum bairro cadastrado ainda. Rode supabase/seed.sql ou cadastre acima.
            </Card>
          )}
        </>
      )}
    </div>
  );
}
