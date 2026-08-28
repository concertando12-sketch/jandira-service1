import { requireRole } from "@/lib/auth";
import { getSubscriptionData } from "@/lib/subscription";
import { PageHeader } from "@/components/dashboard/page-header";
import { SubscriptionPanel } from "@/components/subscription/subscription-panel";

export default async function ClienteAssinaturaPage() {
  const user = await requireRole("CLIENT");
  const data = await getSubscriptionData(user.id, user.role === "ADMIN");

  return (
    <div>
      <PageHeader
        title="Assinatura"
        description="Precisa estar em dia pra você conseguir solicitar serviços."
      />
      <SubscriptionPanel {...data} />
    </div>
  );
}
