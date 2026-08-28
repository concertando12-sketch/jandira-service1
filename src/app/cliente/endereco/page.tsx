import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { AddressForm } from "@/components/address/address-form";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export default async function ClienteEnderecoPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const [{ data: regions }, { data: address }] = await Promise.all([
    city
      ? supabase.from("regions").select("id, name").eq("city_id", city.id).eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from("user_addresses")
      .select("region_id, street, number, complement")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div>
      <PageHeader
        title="Meu endereço"
        description="Usamos isso pra já sugerir seu bairro toda vez que você buscar um serviço."
      />
      <Card>
        {regions && regions.length > 0 ? (
          <AddressForm
            path="/cliente/endereco"
            regions={regions}
            defaultRegionId={address?.region_id ?? null}
            defaultStreet={address?.street ?? null}
            defaultNumber={address?.number ?? null}
            defaultComplement={address?.complement ?? null}
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
