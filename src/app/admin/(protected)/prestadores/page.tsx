import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Homologado",
  REJECTED: "Recusado",
  SUSPENDED: "Suspenso",
  INACTIVE: "Inativo",
};

const STATUS_VARIANT: Record<string, "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
  INACTIVE: "muted",
};

export default async function AdminPrestadoresPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("provider_profiles")
    .select(
      "id, professional_name, is_active, is_verified, status, rating_avg, rating_count, users(name, email, user_addresses(regions(name))), provider_regions(count)",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Prestadores" description={`${providers?.length ?? 0} cadastrados`} />

      {providers && providers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {providers.map((p) => (
            <Link key={p.id} href={`/admin/prestadores/${p.id}`}>
              <Card className="flex flex-col gap-3 transition-colors hover:border-brand/50 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {p.professional_name || p.users?.name || "Sem nome"}
                    </p>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    {p.is_verified && <Badge variant="brand">✓ Verificado</Badge>}
                  </div>
                  <p className="text-sm text-muted">
                    {p.users?.email} · mora em{" "}
                    {p.users?.user_addresses?.regions?.name ?? "não informado"} · atende{" "}
                    {p.provider_regions?.[0]?.count ?? 0} bairro(s) ·{" "}
                    {p.rating_count > 0 ? `⭐ ${p.rating_avg} (${p.rating_count})` : "sem avaliações"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">Nenhum prestador cadastrado ainda.</Card>
      )}
    </div>
  );
}
