import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

export default async function AdminAvaliacoesPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, users(name), provider_profiles(professional_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader title="Avaliações" description="Avaliações deixadas por clientes após o atendimento" />

      {reviews && reviews.length > 0 ? (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">
                  {r.provider_profiles?.professional_name}
                </p>
                <p className="text-sm font-semibold text-brand">{"⭐".repeat(r.rating)}</p>
              </div>
              <p className="mt-1 text-xs text-muted">por {r.users?.name}</p>
              {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">
          Nenhuma avaliação ainda — chega junto com o fluxo de conclusão de serviço (Fase 6).
        </Card>
      )}
    </div>
  );
}
