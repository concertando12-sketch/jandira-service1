import { Home, ClipboardList, Wrench, MapPin, User, Settings, Building2, Bell, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const iconProps = { className: "h-4.5 w-4.5", strokeWidth: 2 } as const;

export default async function PrestadorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const navItems = [
    { href: "/prestador/dashboard", label: "Início", icon: <Home {...iconProps} /> },
    {
      href: "/prestador/notificacoes",
      label: "Notificações",
      icon: <Bell {...iconProps} />,
      badge: unreadCount ?? 0,
    },
    { href: "/prestador/solicitacoes", label: "Solicitações", icon: <ClipboardList {...iconProps} /> },
    { href: "/prestador/servicos", label: "Meus serviços", icon: <Wrench {...iconProps} /> },
    { href: "/prestador/regiao", label: "Minha região", icon: <MapPin {...iconProps} /> },
    { href: "/prestador/endereco", label: "Meu endereço", icon: <Building2 {...iconProps} /> },
    { href: "/prestador/assinatura", label: "Assinatura", icon: <Wallet {...iconProps} /> },
    { href: "/prestador/perfil", label: "Meu perfil", icon: <User {...iconProps} /> },
    { href: "/prestador/configuracoes", label: "Configurações", icon: <Settings {...iconProps} /> },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      roleLabel={ROLE_LABELS.PROVIDER}
      userName={user.name}
      previewMode={!isSupabaseConfigured}
      notificationsHref="/prestador/notificacoes"
      unreadCount={unreadCount ?? 0}
      viewSwitcher={user.role === "ADMIN" ? "PROVIDER" : undefined}
      showSupportWhatsApp
    >
      {children}
    </DashboardShell>
  );
}
