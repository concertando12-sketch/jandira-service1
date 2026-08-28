import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { ProfileSummaryCard } from "@/components/provider/profile-summary-card";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import { ProfileForm } from "./profile-form";

export default async function PrestadorPerfilPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();

  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase
      .from("provider_profiles")
      .select(
        "id, profile_photo, professional_name, description, price_from, price_to, availability, whatsapp, profile_completion",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_addresses")
      .select("street, number, complement, regions(name)")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const [{ data: attendedRegions }, { data: services }] = await Promise.all([
    profile
      ? supabase.from("provider_regions").select("regions(name)").eq("provider_id", profile.id)
      : Promise.resolve({ data: [] as { regions: { name: string } | null }[] }),
    profile
      ? supabase.from("provider_services").select("services(name)").eq("provider_id", profile.id)
      : Promise.resolve({ data: [] as { services: { name: string } | null }[] }),
  ]);

  const completion = profile?.profile_completion ?? 0;
  const regionNames = (attendedRegions ?? []).map((r) => r.regions?.name).filter(Boolean) as string[];
  const serviceNames = (services ?? []).map((s) => s.services?.name).filter(Boolean) as string[];

  return (
    <div>
      <PageHeader title="Meu perfil profissional" description="O que os clientes veem no seu perfil público" />

      <Card className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Perfil completo</span>
          <span className="font-bold text-brand">{completion}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <p className="mt-2 text-xs text-muted">
            Complete seu perfil pra aumentar suas chances de receber clientes.
          </p>
        )}
      </Card>

      <ProfileSummaryCard title="Endereço" editHref="/prestador/endereco">
        {address ? (
          <p className="text-sm text-foreground">
            {address.regions?.name ? `${address.regions.name}, ` : ""}
            {APP_CITY} - {APP_STATE}
            {address.street && (
              <span className="text-muted">
                {" "}
                — {address.street}, {address.number}
                {address.complement ? ` (${address.complement})` : ""}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted">Você ainda não definiu seu endereço.</p>
        )}
      </ProfileSummaryCard>

      <ProfileSummaryCard title="Regiões que atendo" editHref="/prestador/regiao">
        {regionNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {regionNames.map((name) => (
              <Badge key={name} variant="success">
                ✓ {name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Você ainda não marcou nenhum bairro.</p>
        )}
      </ProfileSummaryCard>

      <ProfileSummaryCard title="Serviços que ofereço" editHref="/prestador/servicos">
        {serviceNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {serviceNames.map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Você ainda não marcou nenhum serviço.</p>
        )}
      </ProfileSummaryCard>

      <Card>
        <ProfileForm
          initialPhoto={profile?.profile_photo ?? null}
          initialProfessionalName={profile?.professional_name || user.name}
          initialDescription={profile?.description ?? null}
          initialPriceFrom={profile?.price_from ?? null}
          initialPriceTo={profile?.price_to ?? null}
          initialAvailability={profile?.availability ?? null}
          initialWhatsapp={profile?.whatsapp ?? null}
        />
      </Card>
    </div>
  );
}
