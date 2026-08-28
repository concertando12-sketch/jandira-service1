import { Briefcase, ClipboardList, LayoutGrid, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");
  const supabase = await createClient();

  const [
    { count: clientsCount },
    { count: providersCount },
    { count: activeProvidersCount },
    { count: categoriesCount },
    { count: servicesCount },
    { count: requestsCount },
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "CLIENT"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "PROVIDER"),
    supabase
      .from("provider_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("service_requests").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted">
        Painel administrativo — {APP_CITY}/{APP_STATE}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Clientes" value={clientsCount ?? 0} icon={Users} />
        <StatCard label="Prestadores" value={providersCount ?? 0} icon={Briefcase} />
        <StatCard label="Publicados" value={activeProvidersCount ?? 0} icon={Briefcase} />
        <StatCard label="Categorias" value={categoriesCount ?? 0} icon={LayoutGrid} />
        <StatCard label="Serviços" value={servicesCount ?? 0} icon={LayoutGrid} />
        <StatCard label="Solicitações" value={requestsCount ?? 0} icon={ClipboardList} />
      </div>
    </div>
  );
}
