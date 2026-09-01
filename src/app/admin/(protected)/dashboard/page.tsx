import Link from "next/link";
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  LayoutGrid,
  MapPin,
  ShieldQuestion,
  Users,
  Wrench,
  Wallet,
  DollarSign,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { APP_CITY, APP_STATE, LAUNCH_DATE } from "@/lib/constants";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const todayDate = new Date().toISOString().slice(0, 10);
  // Receita real só conta a partir do lançamento da plataforma —
  // pagamentos anteriores foram teste/ajuste, não entram na contabilidade.
  const launch = new Date(`${LAUNCH_DATE}T00:00:00Z`);
  const revenueSince = launch > startOfMonth ? launch : startOfMonth;

  const [
    { count: clientsCount },
    { count: providersCount },
    { count: pendingProvidersCount },
    { count: requestsTodayCount },
    { count: completedCount },
    { count: inProgressCount },
    { count: categoriesCount },
    { count: servicesCount },
    { count: regionsCount },
    { count: pendingReportsCount },
    { count: pendingSuggestionsCount },
    { count: pendingServiceSuggestionsCount },
    { count: pendingSubscriptionsCount },
    { data: activeSubscriberRows },
    { data: revenueThisMonthRows },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "CLIENT"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "PROVIDER"),
    supabase
      .from("provider_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "COMPLETED"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "IN_PROGRESS"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("regions").select("id", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["PENDING", "IN_REVIEW"]),
    supabase
      .from("region_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING"),
    supabase
      .from("service_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING_REVIEW"),
    supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "APPROVED")
      .gte("period_end", todayDate),
    supabase
      .from("subscriptions")
      .select("amount")
      .eq("status", "APPROVED")
      .gte("reviewed_at", revenueSince.toISOString()),
  ]);

  const activeSubscribersCount = new Set((activeSubscriberRows ?? []).map((r) => r.user_id)).size;
  const revenueThisMonth = (revenueThisMonthRows ?? []).reduce((sum, r) => sum + Number(r.amount), 0);

  const alerts = [
    {
      count: pendingProvidersCount ?? 0,
      label: "prestadores aguardando aprovação",
      href: "/admin/homologacao",
    },
    { count: pendingReportsCount ?? 0, label: "denúncias pendentes", href: "/admin/denuncias" },
    {
      count: pendingSuggestionsCount ?? 0,
      label: "sugestões de bairro",
      href: "/admin/regioes",
    },
    {
      count: pendingServiceSuggestionsCount ?? 0,
      label: "sugestões de serviço",
      href: "/admin/servicos",
    },
    {
      count: pendingSubscriptionsCount ?? 0,
      label: "comprovantes de assinatura pendentes",
      href: "/admin/assinaturas",
    },
  ].filter((a) => a.count > 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted">
        Painel administrativo — {APP_CITY}/{APP_STATE}
      </p>

      {alerts.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {alerts.map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="flex items-center gap-2 border-brand/40 bg-brand/10 py-2.5 transition-colors hover:border-brand">
                <AlertTriangle className="h-4 w-4 shrink-0 text-brand" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{a.count}</span> {a.label}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Usuários</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Clientes" value={clientsCount ?? 0} icon={Users} />
        <StatCard label="Prestadores" value={providersCount ?? 0} icon={Briefcase} />
        <StatCard label="Pendentes de aprovação" value={pendingProvidersCount ?? 0} icon={ShieldQuestion} />
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Serviços</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Solicitações hoje" value={requestsTodayCount ?? 0} icon={ClipboardList} />
        <StatCard label="Em andamento" value={inProgressCount ?? 0} icon={CalendarClock} />
        <StatCard label="Concluídos" value={completedCount ?? 0} icon={CheckCircle2} />
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Plataforma</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Categorias" value={categoriesCount ?? 0} icon={LayoutGrid} />
        <StatCard label="Serviços" value={servicesCount ?? 0} icon={Wrench} />
        <StatCard label="Bairros" value={regionsCount ?? 0} icon={MapPin} />
      </div>

      <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Financeiro</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Assinantes ativos" value={activeSubscribersCount} icon={Wallet} />
        <StatCard
          label="Receita do mês"
          value={revenueThisMonth.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={DollarSign}
        />
        <StatCard label="Comprovantes pendentes" value={pendingSubscriptionsCount ?? 0} icon={ClipboardList} />
      </div>
    </div>
  );
}
