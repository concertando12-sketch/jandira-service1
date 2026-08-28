import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { SubscriptionReviewRow } from "@/components/admin/subscription-review-row";

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutos — só pro admin abrir na hora

export default async function AdminAssinaturasPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("subscriptions")
    .select("id, amount, receipt_url, submitted_at, users!subscriptions_user_id_fkey(name, email, cpf)")
    .eq("status", "PENDING_REVIEW")
    .order("submitted_at", { ascending: true });

  const rows = await Promise.all(
    (pending ?? []).map(async (s) => {
      const { data: signed } = await supabase.storage
        .from("payment-receipts")
        .createSignedUrl(s.receipt_url, SIGNED_URL_TTL_SECONDS);
      return { ...s, receiptSignedUrl: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        description="Comprovantes de PIX aguardando confirmação — confira se nome e CPF batem com o cadastro."
      />

      {rows.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rows.map((s) => (
            <SubscriptionReviewRow
              key={s.id}
              id={s.id}
              userName={s.users?.name ?? "—"}
              userEmail={s.users?.email ?? "—"}
              userCpf={s.users?.cpf ?? null}
              amount={s.amount}
              submittedAt={s.submitted_at}
              receiptSignedUrl={s.receiptSignedUrl}
            />
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">
          Nenhum comprovante pendente de análise no momento.
        </Card>
      )}
    </div>
  );
}
