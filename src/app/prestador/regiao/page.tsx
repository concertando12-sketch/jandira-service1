import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function PrestadorRegiaoPage() {
  await requireRole("PROVIDER");
  return (
    <ComingSoon
      title="Minha região"
      phase="Fase 3"
      description="Escolha seu bairro em Jandira e o raio de atendimento (1, 3, 5 ou 10 km). O cálculo de distância entre bairros já está pronto no banco (haversine_km)."
    />
  );
}
