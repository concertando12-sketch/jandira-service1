import { Home, Search, LayoutGrid, ClipboardList, Heart, User, Building2, Bell, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const iconProps = { className: "h-4.5 w-4.5", strokeWidth: 2 } as const;

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const navItems = [
    { href: "/cliente/dashboard", label: "Início", icon: <Home {...iconProps} /> },
    {
      href: "/cliente/notificacoes",
      label: "Notificações",
      icon: <Bell {...iconProps} />,
      badge: unreadCount ?? 0,
    },
    { href: "/cliente/buscar", label: "Buscar", icon: <Search {...iconProps} /> },
    { href: "/cliente/categorias", label: "Categorias", icon: <LayoutGrid {...iconProps} /> },
    { href: "/cliente/solicitacoes", label: "Meus pedidos", icon: <ClipboardList {...iconProps} /> },
    { href: "/cliente/favoritos", label: "Favoritos", icon: <Heart {...iconProps} /> },
    { href: "/cliente/endereco", label: "Meu endereço", icon: <Building2 {...iconProps} /> },
    { href: "/cliente/assinatura", label: "Assinatura", icon: <Wallet {...iconProps} /> },
    { href: "/cliente/perfil", label: "Perfil", icon: <User {...iconProps} /> },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      roleLabel={ROLE_LABELS.CLIENT}
      userName={user.name}
      previewMode={!isSupabaseConfigured}
      notificationsHref="/cliente/notificacoes"
      unreadCount={unreadCount ?? 0}
      viewSwitcher={user.role === "ADMIN" ? "CLIENT" : undefined}
      showSupportWhatsApp
    >
      {children}
    </DashboardShell>
  );
}
