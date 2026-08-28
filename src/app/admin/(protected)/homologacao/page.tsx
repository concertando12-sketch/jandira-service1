import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";

export default async function AdminHomologacaoPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from("provider_profiles")
    .select(
      "id, professional_name, phone, created_at, users(name, phone), provider_services(services(name)), provider_regions(regions(name))",
    )
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Homologação"
        description="Prestadores aguardando aprovação pra aparecer nas buscas"
      />

      {providers && providers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {providers.map((p) => {
            const services = (p.provider_services ?? []).map((ps) => ps.services?.name).filter(Boolean);
            const regionsList = (p.provider_regions ?? []).map((pr) => pr.regions?.name).filter(Boolean);
            return (
              <Card key={p.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{p.professional_name || p.users?.name}</p>
                  <p className="text-sm text-muted">
                    {services.length > 0 ? services.join(", ") : "sem serviço"} ·{" "}
                    {regionsList.length > 0 ? regionsList.slice(0, 2).join(", ") : "sem bairro"}
                    {regionsList.length > 2 && ` +${regionsList.length - 2}`}
                  </p>
                  <p className="text-xs text-muted">
                    {p.phone ?? p.users?.phone} · cadastrado em{" "}
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Link href={`/admin/prestadores/${p.id}`}>
                  <Badge variant="brand">Analisar →</Badge>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">
          Nenhum prestador esperando aprovação no momento. 🎉
        </Card>
      )}
    </div>
  );
}
