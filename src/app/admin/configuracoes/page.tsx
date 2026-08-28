import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { APP_CITY, APP_COUNTRY, APP_STATE } from "@/lib/constants";

export default async function AdminConfiguracoesPage() {
  await requireRole("ADMIN");

  return (
    <div>
      <PageHeader title="Configurações" description="Configuração global da plataforma" />

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
