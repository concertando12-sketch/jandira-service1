import { requireRole } from "@/lib/auth";
import { getSubscriptionData } from "@/lib/subscription";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubscriptionPanel } from "@/components/subscription/subscription-panel";

export default async function PrestadorAssinaturaPage() {
  const user = await requireRole("PROVIDER");
  const data = await getSubscriptionData(user.id, user.role === "ADMIN");

  return (
    <div>
      <PageHeader
        title="Assinatura"
        description="Precisa estar em dia pra você aparecer na busca dos clientes."
      />
      <SubscriptionPanel {...data} />
    </div>
  );
}
