import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { AccountForm } from "@/components/account/account-form";

export default async function PrestadorConfiguracoesPage() {
  const user = await requireRole("PROVIDER");

  return (
    <div>
      <PageHeader title="Configurações" description="Seus dados de conta e acesso" />
      <Card>
        <AccountForm
          path="/prestador/configuracoes"
          email={user.email}
          initialName={user.name}
          initialPhone={user.phone}
        />
      </Card>
    </div>
  );
}
