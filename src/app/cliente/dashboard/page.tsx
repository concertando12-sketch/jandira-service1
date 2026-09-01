import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock3, Gift, MapPin, Search, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getSubscriptionData } from "@/lib/subscription";
import { Card, Badge } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { APP_CITY } from "@/lib/constants";

export default async function ClienteDashboardPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();
  const {
    isActive: hasActiveSubscription,
    isFreeTrial,
    freeTrialEndDate,
  } = await getSubscriptionData(user.id, user.role === "ADMIN");

  const [
    { count: pendingCount },
    { count: scheduledCount },
    { count: completedCount },
    { data: categories },
    { data: address },
    { data: nextService },
  ] = await Promise.all([
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "PENDING"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "SCHEDULED"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "COMPLETED"),
    supabase.from("categories").select("id, name, slug, icon").eq("is_active", true).order("name").limit(8),
    supabase.from("user_addresses").select("regions(name)").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("service_requests")
      .select("id, requested_date, requested_time, services(name), provider_profiles(professional_name)")
      .eq("client_id", user.id)
      .eq("status", "SCHEDULED")
      .order("requested_date", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const regionName = address?.regions?.name ?? null;

  return (
    <div>
      {regionName ? (
        <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <MapPin className="h-3.5 w-3.5 text-brand" />
          {regionName}, {APP_CITY}
        </div>
      ) : (
        <Link
          href="/cliente/endereco"
          className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          Defina seu bairro em {APP_CITY}
        </Link>
      )}
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {firstName} 👋</h1>
      <p className="mt-1 text-sm text-muted">O que você precisa hoje?</p>

      <Link
        href="/cliente/buscar"
        className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm text-muted transition-colors hover:border-brand/50"
      >
        <Search className="h-4.5 w-4.5" />
        Buscar serviço (ex: eletricista, babá, diarista...)
      </Link>

      {isFreeTrial && freeTrialEndDate && (
        <Card className="mt-6 flex flex-col items-start gap-3 border-brand/40 bg-brand/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-brand" />
            <div>
              <p className="font-semibold text-foreground">30 dias grátis pra testar</p>
              <p className="text-sm text-muted">
                Vencimento em {new Date(`${freeTrialEndDate}T00:00:00`).toLocaleDateString("pt-BR")} — depois
                disso, a assinatura mensal passa a valer.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!hasActiveSubscription && (
        <Card className="mt-6 flex flex-col items-start gap-3 border-danger/40 bg-danger/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-danger" />
            <div>
              <p className="font-semibold text-foreground">Assinatura mensal pendente</p>
              <p className="text-sm text-muted">Sem ela em dia, você não consegue solicitar serviços.</p>
            </div>
          </div>
          <LinkButton href="/cliente/assinatura" size="sm">
            Ver assinatura
          </LinkButton>
        </Card>
      )}

      {nextService && (
        <Link href={`/cliente/solicitacoes/${nextService.id}`}>
          <Card className="mt-6 flex items-center justify-between gap-3 border-brand/40 bg-brand/5 transition-colors hover:border-brand">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Próximo serviço
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {nextService.services?.name} — {nextService.provider_profiles?.professional_name}
              </p>
              <p className="mt-1 text-xs text-muted">
                {nextService.requested_date &&
                  `📅 ${new Date(`${nextService.requested_date}T00:00:00`).toLocaleDateString("pt-BR")}`}
                {nextService.requested_time && ` · 🕐 ${nextService.requested_time.slice(0, 5)}`}
              </p>
            </div>
            <Badge variant="success">🟢 Confirmado</Badge>
          </Card>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatLink
          href="/cliente/solicitacoes"
          icon={Clock3}
          label="Pendentes"
          value={pendingCount ?? 0}
        />
        <StatLink
          href="/cliente/solicitacoes"
          icon={CalendarCheck2}
          label="Agendados"
          value={scheduledCount ?? 0}
        />
        <StatLink
          href="/cliente/solicitacoes"
          icon={CheckCircle2}
          label="Concluídos"
          value={completedCount ?? 0}
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Categorias</h2>
          <Link href="/cliente/categorias" className="text-xs font-medium text-brand hover:underline">
            Ver todas
          </Link>
        </div>
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/cliente/categorias#${cat.slug}`}>
                <Card className="flex flex-col items-center gap-2 py-5 text-center transition-colors hover:border-brand/50">
                  <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-sm text-muted">
            Nenhuma categoria cadastrada ainda.
          </Card>
        )}
      </div>

      <Card className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Prestadores no seu bairro</p>
          <p className="text-sm text-muted">
            {regionName
              ? `Veja quem atende ${regionName} agora mesmo.`
              : "Defina seu bairro pra já ver os prestadores certos direto na busca."}
          </p>
        </div>
        <LinkButton href="/cliente/buscar" variant="secondary" size="sm">
          Buscar
        </LinkButton>
      </Card>
    </div>
  );
}

function StatLink({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <Link href={href}>
      <Card className="flex flex-col items-center gap-1 py-4 text-center transition-colors hover:border-brand/50">
        <Icon className="h-5 w-5 text-brand" />
        <p className="text-lg font-bold leading-none text-foreground">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </Card>
    </Link>
  );
}
