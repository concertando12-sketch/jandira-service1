import { Home, Search, LayoutGrid, ClipboardList, Heart, User, Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const iconProps = { className: "h-4.5 w-4.5", strokeWidth: 2 } as const;

const NAV_ITEMS = [
  { href: "/cliente/dashboard", label: "Início", icon: <Home {...iconProps} /> },
  { href: "/cliente/buscar", label: "Buscar", icon: <Search {...iconProps} /> },
  { href: "/cliente/categorias", label: "Categorias", icon: <LayoutGrid {...iconProps} /> },
  { href: "/cliente/solicitacoes", label: "Meus pedidos", icon: <ClipboardList {...iconProps} /> },
  { href: "/cliente/favoritos", label: "Favoritos", icon: <Heart {...iconProps} /> },
  { href: "/cliente/endereco", label: "Meu endereço", icon: <Building2 {...iconProps} /> },
  { href: "/cliente/perfil", label: "Perfil", icon: <User {...iconProps} /> },
];

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CLIENT");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel={ROLE_LABELS.CLIENT}
      userName={user.name}
      previewMode={!isSupabaseConfigured}
    >
      {children}
    </DashboardShell>
  );
}
