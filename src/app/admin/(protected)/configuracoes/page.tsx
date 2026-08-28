import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { APP_CITY, APP_COUNTRY, APP_STATE } from "@/lib/constants";

export default async function AdminConfiguracoesPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("pix_key, pix_receiver_name, subscription_amount")
    .eq("id", true)
    .maybeSingle();

  return (
    <div>
      <PageHeader title="Configurações" description="Configuração global da plataforma" />

      <Card className="mb-6">
        <p className="mb-4 text-sm font-semibold text-foreground">Assinatura mensal via PIX</p>
        <PlatformSettingsForm
          pixKey={settings?.pix_key ?? null}
          pixReceiverName={settings?.pix_receiver_name ?? null}
          subscriptionAmount={settings?.subscription_amount ?? 5}
        />
        <p className="mt-4 text-xs text-muted">
          Essa chave aparece pra cliente e prestador na tela de assinatura. Pagamento é
          conferido manualmente (comprovante + análise em Admin → Assinaturas).
        </p>
      </Card>

      <Card>
        <p className="mb-4 text-sm font-semibold text-foreground">Região ativa</p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Cidade</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{APP_CITY}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Estado</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{APP_STATE}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">País</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{APP_COUNTRY}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          Definido nas variáveis de ambiente (NEXT_PUBLIC_APP_CITY/STATE/COUNTRY). Suporte a
          múltiplas cidades gerenciadas pelo painel entra numa fase futura — por ora o app
          inteiro assume esta cidade como única região ativa.
        </p>
      </Card>
    </div>
  );
}
