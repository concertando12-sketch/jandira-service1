import {
  Home,
  Users,
  Briefcase,
  ShieldQuestion,
  LayoutGrid,
  Wrench,
  ClipboardList,
  Star,
  MapPin,
  Flag,
  History,
  Settings,
  Wallet,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const iconProps = { className: "h-4.5 w-4.5", strokeWidth: 2 } as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  const supabase = await createClient();

  const [{ count: pendingProviders }, { count: pendingReports }, { count: pendingSubscriptions }] =
    await Promise.all([
      supabase.from("provider_profiles").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["PENDING", "IN_REVIEW"]),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "PENDING_REVIEW"),
    ]);

  const navItems = [
    { href: "/admin/dashboard", label: "Início", icon: <Home {...iconProps} /> },
    { href: "/admin/clientes", label: "Clientes", icon: <Users {...iconProps} /> },
    { href: "/admin/prestadores", label: "Prestadores", icon: <Briefcase {...iconProps} /> },
    {
      href: "/admin/homologacao",
      label: "Homologação",
      icon: <ShieldQuestion {...iconProps} />,
      badge: pendingProviders ?? 0,
    },
    { href: "/admin/categorias", label: "Categorias", icon: <LayoutGrid {...iconProps} /> },
    { href: "/admin/servicos", label: "Serviços", icon: <Wrench {...iconProps} /> },
    { href: "/admin/regioes", label: "Regiões", icon: <MapPin {...iconProps} /> },
    {
      href: "/admin/assinaturas",
      label: "Assinaturas",
      icon: <Wallet {...iconProps} />,
      badge: pendingSubscriptions ?? 0,
    },
    { href: "/admin/financeiro", label: "Financeiro", icon: <DollarSign {...iconProps} /> },
    { href: "/admin/contatos", label: "Contatos", icon: <MessageCircle {...iconProps} /> },
    { href: "/admin/solicitacoes", label: "Solicitações", icon: <ClipboardList {...iconProps} /> },
    { href: "/admin/avaliacoes", label: "Avaliações", icon: <Star {...iconProps} /> },
    {
      href: "/admin/denuncias",
      label: "Denúncias",
      icon: <Flag {...iconProps} />,
      badge: pendingReports ?? 0,
    },
    { href: "/admin/logs", label: "Log administrativo", icon: <History {...iconProps} /> },
    { href: "/admin/configuracoes", label: "Configurações", icon: <Settings {...iconProps} /> },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      roleLabel={ROLE_LABELS.ADMIN}
      userName={user.name}
      previewMode={!isSupabaseConfigured}
      viewSwitcher="ADMIN"
    >
      {children}
    </DashboardShell>
  );
}
