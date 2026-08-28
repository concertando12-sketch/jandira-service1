import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function PrestadorPerfilPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select(
      "profile_photo, professional_name, description, price_from, price_to, availability, whatsapp, profile_completion",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const completion = profile?.profile_completion ?? 0;

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
