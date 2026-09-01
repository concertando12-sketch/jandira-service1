import Link from "next/link";
import { Bell, CalendarCheck2, CheckCircle2, Gift, MessageCircle, Star, UserCircle2, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionData } from "@/lib/subscription";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { SUPPORT_WHATSAPP_PHONE } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function PrestadorDashboardPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();
  const {
    isActive: hasActiveSubscription,
    isFreeTrial,
    freeTrialEndDate,
    amount: subscriptionAmount,
  } = await getSubscriptionData(user.id, user.role === "ADMIN");

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("id, is_active, is_verified, status, status_reason, profile_completion, rating_avg, rating_count")
    .eq("user_id", user.id)
    .maybeSingle();

  let newRequests = 0;
  let scheduledRequests = 0;
  let completedRequests = 0;
  let regionsCount = 0;
  let servicesCount = 0;

  if (profile) {
    const [
      { count: newCount },
      { count: scheduledCount },
      { count: completedCount },
      { count: regionCount },
      { count: serviceCount },
    ] = await Promise.all([
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
      supabase
        .from("provider_services")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", profile.id),
    ]);
    newRequests = newCount ?? 0;
    scheduledRequests = scheduledCount ?? 0;
    completedRequests = completedCount ?? 0;
    regionsCount = regionCount ?? 0;
    servicesCount = serviceCount ?? 0;
  }

  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {firstName}! 👋</h1>
      <p className="mt-1 text-sm text-muted">Este é o resumo do seu negócio na Jandira Service.</p>

      {(() => {
        const supportLink = buildWhatsAppLink(
          SUPPORT_WHATSAPP_PHONE,
          "Olá! Preciso de ajuda com o Jandira Service.",
        );
        if (!supportLink) return null;
        return (
          <Link
            href={supportLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3.5 text-sm text-foreground transition-colors hover:border-success/50"
          >
            <MessageCircle className="h-4.5 w-4.5 shrink-0 text-success" />
            Ficou com alguma dúvida? Fala com a gente pelo WhatsApp
          </Link>
        );
      })()}

      {servicesCount === 0 && (
        <Card className="mt-6 flex flex-col items-start gap-3 border-brand/40 bg-brand/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-brand" />
            <div>
              <p className="font-semibold text-foreground">Escolha seus serviços</p>
              <p className="text-sm text-muted">
                Sem nenhum serviço marcado, você não aparece em nenhuma busca de cliente.
              </p>
            </div>
          </div>
          <LinkButton href="/prestador/servicos" size="sm">
            Escolher serviços
          </LinkButton>
        </Card>
      )}

      {isFreeTrial && freeTrialEndDate && (
        <Card className="mt-3 flex flex-col items-start gap-3 border-brand/40 bg-brand/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-brand" />
            <div>
              <p className="font-semibold text-foreground">30 dias grátis pra testar</p>
              <p className="text-sm text-muted">
                Vencimento em {new Date(`${freeTrialEndDate}T00:00:00`).toLocaleDateString("pt-BR")} — depois
                disso, a assinatura de{" "}
                {subscriptionAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês passa a
                valer.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!hasActiveSubscription && (
        <Card className="mt-3 flex flex-col items-start gap-3 border-danger/40 bg-danger/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-danger" />
            <div>
              <p className="font-semibold text-foreground">Assinatura mensal pendente</p>
              <p className="text-sm text-muted">
                Sem a assinatura em dia, você não aparece em nenhuma busca de cliente.
              </p>
            </div>
          </div>
          <LinkButton href="/prestador/assinatura" size="sm">
            Ver assinatura
          </LinkButton>
        </Card>
      )}

      {regionsCount === 0 && (
        <Card className="mt-3 flex flex-col items-start gap-3 border-brand/40 bg-brand/10 sm:flex-row sm:items-center sm:justify-between">
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

      {profile && profile.status === "PENDING" && (
        <Card className="mt-6 border-brand/40 bg-brand/10">
          <p className="font-semibold text-foreground">🕐 Cadastro em análise</p>
          <p className="mt-1 text-sm text-muted">
            Seu perfil está publicado, mas só aparece pros clientes depois que a equipe do
            Jandira Service homologar seu cadastro. Isso costuma ser rápido.
          </p>
        </Card>
      )}

      {profile && profile.status === "REJECTED" && (
        <Card className="mt-6 border-danger/40 bg-danger/10">
          <p className="font-semibold text-foreground">Seu cadastro não foi aprovado</p>
          {profile.status_reason && (
            <p className="mt-1 text-sm text-muted">Motivo: {profile.status_reason}</p>
          )}
          <Link href="/prestador/perfil" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
            Atualizar cadastro
          </Link>
        </Card>
      )}

      {profile && profile.status === "SUSPENDED" && (
        <Card className="mt-6 border-danger/40 bg-danger/10">
          <p className="font-semibold text-foreground">Seu perfil está suspenso</p>
          {profile.status_reason && (
            <p className="mt-1 text-sm text-muted">Motivo: {profile.status_reason}</p>
          )}
          <p className="mt-1 text-sm text-muted">
            Você não aparece nas buscas enquanto estiver suspenso. Fale com o suporte se
            achar que isso é um engano.
          </p>
        </Card>
      )}

      {profile && (
        <Card className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              Status do perfil: {profile.is_active ? "Publicado" : "Não publicado"}
              {profile.is_verified && " · ✓ Verificado"}
            </p>
            <p className="text-sm text-muted">
              {profile.status === "APPROVED"
                ? "Seu perfil está homologado e pode ser encontrado por clientes."
                : "Complete seu perfil e aguarde a homologação do admin."}{" "}
              Perfil <span className="font-semibold text-foreground">{profile.profile_completion}%</span> completo.
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
