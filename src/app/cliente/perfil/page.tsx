import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { AccountForm } from "@/components/account/account-form";

export default async function ClientePerfilPage() {
  const user = await requireRole("CLIENT");

  return (
    <div>
      <PageHeader title="Meu perfil" description="Seus dados pessoais" />
      <Card>
        <AccountForm
          path="/cliente/perfil"
          email={user.email}
          initialName={user.name}
          initialPhone={user.phone}
        />
      </Card>
    </div>
  );
}
