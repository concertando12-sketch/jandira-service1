import { Home, ClipboardList, Wrench, MapPin, User, Settings, Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const iconProps = { className: "h-4.5 w-4.5", strokeWidth: 2 } as const;

const NAV_ITEMS = [
  { href: "/prestador/dashboard", label: "Início", icon: <Home {...iconProps} /> },
  { href: "/prestador/solicitacoes", label: "Solicitações", icon: <ClipboardList {...iconProps} /> },
  { href: "/prestador/servicos", label: "Meus serviços", icon: <Wrench {...iconProps} /> },
  { href: "/prestador/regiao", label: "Minha região", icon: <MapPin {...iconProps} /> },
  { href: "/prestador/endereco", label: "Meu endereço", icon: <Building2 {...iconProps} /> },
  { href: "/prestador/perfil", label: "Meu perfil", icon: <User {...iconProps} /> },
  { href: "/prestador/configuracoes", label: "Configurações", icon: <Settings {...iconProps} /> },
];

export default async function PrestadorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PROVIDER");

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      roleLabel={ROLE_LABELS.PROVIDER}
      userName={user.name}
      previewMode={!isSupabaseConfigured}
    >
      {children}
    </DashboardShell>
  );
}
