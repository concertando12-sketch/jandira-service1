import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function PrestadorSolicitacoesPage() {
  await requireRole("PROVIDER");
  return (
    <ComingSoon
      title="Solicitações"
      phase="Fase 5"
      description="Novas solicitações de clientes vão aparecer aqui, com opção de aceitar ou recusar."
    />
  );
}
