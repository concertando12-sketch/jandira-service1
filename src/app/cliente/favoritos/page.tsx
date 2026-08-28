import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function ClienteFavoritosPage() {
  await requireRole("CLIENT");
  return (
    <ComingSoon
      title="Favoritos"
      phase="Fase 6"
      description="Salve prestadores favoritos para encontrá-los rápido depois. A tabela favorites já existe no banco."
    />
  );
}
