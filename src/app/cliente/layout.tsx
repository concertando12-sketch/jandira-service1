import { Home, Search, LayoutGrid, ClipboardList, Heart, User, Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/cliente/dashboard", label: "Início", icon: Home },
  { href: "/cliente/buscar", label: "Buscar", icon: Search },
  { href: "/cliente/categorias", label: "Categorias", icon: LayoutGrid },
  { href: "/cliente/solicitacoes", label: "Meus pedidos", icon: ClipboardList },
  { href: "/cliente/favoritos", label: "Favoritos", icon: Heart },
  { href: "/cliente/endereco", label: "Meu endereço", icon: Building2 },
  { href: "/cliente/perfil", label: "Perfil", icon: User },
];

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CLIENT");

  return (
    <DashboardShell navItems={NAV_ITEMS} roleLabel={ROLE_LABELS.CLIENT} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
