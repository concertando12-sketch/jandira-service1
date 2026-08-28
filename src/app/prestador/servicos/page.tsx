import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function PrestadorServicosPage() {
  await requireRole("PROVIDER");
  return (
    <ComingSoon
      title="Meus serviços"
      phase="Fase 2"
      description="Escolha quais profissões/serviços você oferece dentro do catálogo cadastrado pelo admin (tabela provider_services)."
    />
  );
}
