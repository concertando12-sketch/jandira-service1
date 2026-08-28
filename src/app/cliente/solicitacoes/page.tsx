import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function ClienteSolicitacoesPage() {
  await requireRole("CLIENT");
  return (
    <ComingSoon
      title="Meus pedidos"
      phase="Fase 5"
      description="Aqui você vai acompanhar suas solicitações (pendentes, aceitas, em andamento, concluídas e canceladas) assim que o fluxo de solicitação de serviço estiver pronto."
    />
  );
}
