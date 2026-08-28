import { Home, ClipboardList, Wrench, MapPin, User, Settings, Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/prestador/dashboard", label: "Início", icon: Home },
  { href: "/prestador/solicitacoes", label: "Solicitações", icon: ClipboardList },
  { href: "/prestador/servicos", label: "Meus serviços", icon: Wrench },
  { href: "/prestador/regiao", label: "Minha região", icon: MapPin },
  { href: "/prestador/endereco", label: "Meu endereço", icon: Building2 },
  { href: "/prestador/perfil", label: "Meu perfil", icon: User },
  { href: "/prestador/configuracoes", label: "Configurações", icon: Settings },
];

export default async function PrestadorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PROVIDER");

  return (
    <DashboardShell navItems={NAV_ITEMS} roleLabel={ROLE_LABELS.PROVIDER} userName={user.name}>
      {children}
    </DashboardShell>
  );
}
