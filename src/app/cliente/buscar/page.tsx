import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function ClienteBuscarPage() {
  await requireRole("CLIENT");
  return (
    <ComingSoon
      title="Buscar serviço"
      phase="Fase 3/4"
      description="A busca por bairro, mapa e o motor de match (fórmula de distância + raio de atendimento) entram nas próximas fases. O banco (search_providers) já está pronto para isso."
    />
  );
}
