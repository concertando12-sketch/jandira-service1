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

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Início", icon: Home },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/prestadores", label: "Prestadores", icon: Briefcase },
  { href: "/admin/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/admin/servicos", label: "Serviços", icon: Wrench },
  { href: "/admin/solicitacoes", label: "Solicitações", icon: ClipboardList },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/regioes", label: "Regiões", icon: MapPin },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");

  return (
    <DashboardShell navItems={NAV_ITEMS} roleLabel={ROLE_LABELS.ADMIN} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
