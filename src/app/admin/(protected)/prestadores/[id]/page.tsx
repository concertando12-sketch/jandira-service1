import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { ProviderModerationActions } from "@/components/admin/provider-moderation-actions";
import { ToggleUserActiveButton } from "@/components/admin/toggle-user-active-button";
import { APP_CITY, APP_STATE } from "@/lib/constants";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Homologado",
  REJECTED: "Recusado",
  SUSPENDED: "Suspenso",
  INACTIVE: "Inativo",
};

const STATUS_VARIANT: Record<string, "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
  INACTIVE: "muted",
};

export default async function AdminPrestadorDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select(
      `id, user_id, professional_name, description, whatsapp, phone, price_from, price_to, availability,
       is_active, is_verified, status, status_reason, profile_completion, rating_avg, rating_count, created_at,
       users(name, email, phone, is_active, user_addresses(street, number, complement, regions(name))),
       provider_services(services(id, name)),
       provider_regions(regions(id, name))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!provider) {
    return (
      <div>
        <Card className="py-14 text-center text-sm text-muted">Prestador não encontrado.</Card>
      </div>
    );
  }

  const [{ count: totalRequests }, { count: completedRequests }, { count: cancelledRequests }] =
    await Promise.all([
      supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("provider_id", id),
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", id)
        .eq("status", "COMPLETED"),
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", id)
        .eq("status", "CANCELLED"),
    ]);

  const services = (provider.provider_services ?? [])
    .map((ps) => ps.services)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const regions = (provider.provider_regions ?? [])
    .map((pr) => pr.regions)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const address = provider.users?.user_addresses;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/prestadores" className="mb-4 inline-block text-sm text-muted hover:text-brand">
        ← Prestadores
      </Link>

      <PageHeader
        title={provider.professional_name || provider.users?.name || "Prestador"}
        description={`Cadastrado em ${new Date(provider.created_at).toLocaleDateString("pt-BR")}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[provider.status]}>{STATUS_LABELS[provider.status]}</Badge>
            {provider.is_verified && <Badge variant="brand">✓ Verificado</Badge>}
            {provider.users?.is_active === false && <Badge variant="danger">Conta bloqueada</Badge>}
          </div>
        }
      />

      {provider.status_reason && (
        <Card className="mb-4 border-danger/30 bg-danger/10">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Motivo registrado: </span>
            {provider.status_reason}
          </p>
        </Card>
      )}

      <Card className="mb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Dados do prestador</p>
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="Nome" value={provider.users?.name} />
          <Row label="E-mail" value={provider.users?.email} />
          <Row label="Telefone" value={provider.phone ?? provider.users?.phone} />
          <Row label="WhatsApp" value={provider.whatsapp} />
          <Row label="Cidade" value={`${APP_CITY} - ${APP_STATE}`} />
          <Row label="Bairro" value={address?.regions?.name} />
          <Row
            label="Endereço"
            value={
              address?.street
                ? `${address.street}, ${address.number ?? "s/n"}${address.complement ? ` — ${address.complement}` : ""}`
                : undefined
            }
          />
          <Row label="Perfil completo" value={`${provider.profile_completion}%`} />
        </dl>
      </Card>

      {provider.description && (
        <Card className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Descrição</p>
          <p className="text-sm text-foreground">{provider.description}</p>
        </Card>
      )}

      <Card className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Serviços</p>
        {services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <Badge key={s.id}>{s.name}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhum serviço cadastrado ainda.</p>
        )}
      </Card>

      <Card className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Regiões atendidas</p>
        {regions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <Badge key={r.id} variant="success">
                ✓ {r.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhuma região marcada ainda.</p>
        )}
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-lg font-bold text-foreground">{totalRequests ?? 0}</p>
          <p className="text-xs text-muted">Solicitações</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-foreground">{completedRequests ?? 0}</p>
          <p className="text-xs text-muted">Concluídas</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-foreground">{cancelledRequests ?? 0}</p>
          <p className="text-xs text-muted">Canceladas</p>
        </Card>
      </div>

      <ProviderModerationActions providerId={provider.id} providerName={provider.professional_name || "prestador"} status={provider.status} />

      <div className="mt-3">
        <ToggleUserActiveButton
          userId={provider.user_id}
          userName={provider.users?.name || "prestador"}
          isActive={provider.users?.is_active ?? true}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-foreground">{value || "—"}</dd>
    </div>
  );
}
