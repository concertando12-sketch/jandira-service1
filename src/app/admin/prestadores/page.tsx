import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { ProviderRowActions } from "@/components/admin/provider-row-actions";

export default async function AdminPrestadoresPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("provider_profiles")
    .select(
      "id, professional_name, is_active, is_verified, rating_avg, rating_count, users(name, email), neighborhoods(name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Prestadores" description={`${providers?.length ?? 0} cadastrados`} />

      {providers && providers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {providers.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">
                    {p.professional_name || p.users?.name || "Sem nome"}
                  </p>
                  <Badge variant={p.is_active ? "success" : "muted"}>
                    {p.is_active ? "Publicado" : "Não publicado"}
                  </Badge>
                  {p.is_verified && <Badge variant="brand">✓ Verificado</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {p.users?.email} · {p.neighborhoods?.name ?? "sem bairro"} ·{" "}
                  {p.rating_count > 0 ? `⭐ ${p.rating_avg} (${p.rating_count})` : "sem avaliações"}
                </p>
              </div>
              <ProviderRowActions id={p.id} isActive={p.is_active} isVerified={p.is_verified} />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">Nenhum prestador cadastrado ainda.</Card>
      )}
    </div>
  );
}
