import { requireRole } from "@/lib/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default async function PrestadorPerfilPage() {
  await requireRole("PROVIDER");
  return (
    <ComingSoon
      title="Meu perfil profissional"
      phase="Fase 2"
      description="Aqui você vai cadastrar profissão, descrição, foto, preço e publicar seu perfil (tabela provider_profiles já existe no banco)."
    />
  );
}
