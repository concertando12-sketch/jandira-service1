import Link from "next/link";
import { Bell, CalendarCheck2, CheckCircle2, Star, UserCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function PrestadorDashboardPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("id, is_active, is_verified, profile_completion, rating_avg, rating_count")
    .eq("user_id", user.id)
    .maybeSingle();

  let newRequests = 0;
  let scheduledRequests = 0;
  let completedRequests = 0;
  let regionsCount = 0;

  if (profile) {
    const [{ count: newCount }, { count: scheduledCount }, { count: completedCount }, { count: regionCount }] =
      await Promise.all([
        supabase
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", profile.id)
          .eq("status", "PENDING"),
        supabase
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", profile.id)
          .eq("status", "SCHEDULED"),
        supabase
          .from("service_requests")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", profile.id)
          .eq("status", "COMPLETED"),
        supabase
          .from("provider_regions")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", profile.id),
      ]);
    newRequests = newCount ?? 0;
    scheduledRequests = scheduledCount ?? 0;
    completedRequests = completedCount ?? 0;
    regionsCount = regionCount ?? 0;
  }

  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {firstName}! 👋</h1>
      <p className="mt-1 text-sm text-muted">Este é o resumo do seu negócio na Jandira Service.</p>

      {regionsCount === 0 && (
        <Card className="mt-6 flex flex-col items-start gap-3 border-brand/40 bg-brand/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-brand" />
            <div>
              <p className="font-semibold text-foreground">Defina onde você atende</p>
              <p className="text-sm text-muted">
                Sem bairros marcados, você não aparece em nenhuma busca de cliente.
              </p>
            </div>
          </div>
          <LinkButton href="/prestador/regiao" size="sm">
            Escolher bairros
          </LinkButton>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Solicitações novas" value={newRequests} icon={Bell} />
        <StatCard label="Serviços agendados" value={scheduledRequests} icon={CalendarCheck2} />
        <StatCard label="Serviços concluídos" value={completedRequests} icon={CheckCircle2} />
        <StatCard
          label="Avaliação"
          value={profile && profile.rating_count > 0 ? `⭐ ${profile.rating_avg}` : "—"}
          icon={Star}
        />
      </div>

      {profile && (
        <Card className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              Status do perfil: {profile.is_active ? "Publicado" : "Não publicado"}
              {profile.is_verified && " · ✓ Verificado"}
            </p>
            <p className="text-sm text-muted">
              {profile.is_active
                ? "Seu perfil já pode ser encontrado por clientes."
                : "Publique seu perfil para começar a receber solicitações."}
            </p>
          </div>
          <Link href="/prestador/perfil" className="text-sm font-semibold text-brand hover:underline">
            Editar perfil
          </Link>
        </Card>
      )}
    </div>
  );
}
