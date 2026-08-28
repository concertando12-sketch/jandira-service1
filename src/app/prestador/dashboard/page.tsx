import Link from "next/link";
import { Bell, CheckCircle2, Star, UserCircle2 } from "lucide-react";
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
  let completedRequests = 0;

  if (profile) {
    const [{ count: newCount }, { count: completedCount }] = await Promise.all([
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", profile.id)
        .eq("status", "PENDING"),
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", profile.id)
        .eq("status", "COMPLETED"),
    ]);
    newRequests = newCount ?? 0;
    completedRequests = completedCount ?? 0;
  }

  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {firstName}! 👋</h1>
      <p className="mt-1 text-sm text-muted">Este é o resumo do seu negócio na Jendira Service.</p>

      {!profile && (
        <Card className="mt-6 flex flex-col items-start gap-3 border-brand/40 bg-brand/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-brand" />
            <div>
              <p className="font-semibold text-foreground">Crie seu perfil profissional</p>
              <p className="text-sm text-muted">
                Você ainda não publicou seu perfil — sem ele, clientes não conseguem te encontrar.
              </p>
            </div>
          </div>
          <LinkButton href="/prestador/perfil" size="sm">
            Criar perfil
          </LinkButton>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Solicitações novas" value={newRequests} icon={Bell} />
        <StatCard label="Serviços concluídos" value={completedRequests} icon={CheckCircle2} />
        <StatCard
          label="Avaliação"
          value={profile && profile.rating_count > 0 ? `⭐ ${profile.rating_avg}` : "—"}
          icon={Star}
        />
        <StatCard
          label="Perfil completo"
          value={profile ? `${profile.profile_completion}%` : "0%"}
          icon={UserCircle2}
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
