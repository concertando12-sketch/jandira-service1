import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function ClientePrestadorPage() {
  await requireRole("CLIENT");
  return (
    <ComingSoon
      title="Perfil do prestador"
      phase="Fase 4/5"
      description="Página pública do prestador (avaliações, serviços, botão de solicitar e falar no WhatsApp) chega junto com a busca."
    />
  );
}
