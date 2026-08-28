import {
  Home,
  Users,
  Briefcase,
  LayoutGrid,
  Wrench,
  ClipboardList,
  Star,
  MapPin,
  Settings,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const iconProps = { className: "h-4.5 w-4.5", strokeWidth: 2 } as const;

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Início", icon: <Home {...iconProps} /> },
  { href: "/admin/clientes", label: "Clientes", icon: <Users {...iconProps} /> },
  { href: "/admin/prestadores", label: "Prestadores", icon: <Briefcase {...iconProps} /> },
  { href: "/admin/categorias", label: "Categorias", icon: <LayoutGrid {...iconProps} /> },
  { href: "/admin/servicos", label: "Serviços", icon: <Wrench {...iconProps} /> },
  { href: "/admin/solicitacoes", label: "Solicitações", icon: <ClipboardList {...iconProps} /> },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: <Star {...iconProps} /> },
  { href: "/admin/regioes", label: "Regiões", icon: <MapPin {...iconProps} /> },
  { href: "/admin/configuracoes", label: "Configurações", icon: <Settings {...iconProps} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel={ROLE_LABELS.ADMIN}
      userName={user.name}
      previewMode={!isSupabaseConfigured}
    >
      {children}
    </DashboardShell>
  );
}
