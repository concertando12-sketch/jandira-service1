import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { ToggleUserActiveButton } from "@/components/admin/toggle-user-active-button";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export default async function AdminClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("users")
    .select("id, name, email, phone, is_active, created_at, user_addresses(regions(name), street, number)")
    .eq("id", id)
    .eq("role", "CLIENT")
    .maybeSingle();

  if (!client) {
    return (
      <div>
        <Card className="py-14 text-center text-sm text-muted">Cliente não encontrado.</Card>
      </div>
    );
  }

  const [{ count: total }, { count: completed }, { count: cancelled }] = await Promise.all([
    supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("client_id", id),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("status", "COMPLETED"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("status", "CANCELLED"),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/admin/clientes" className="mb-4 inline-block text-sm text-muted hover:text-brand">
        ← Clientes
      </Link>

      <PageHeader
        title={client.name}
        description={`Cadastrado em ${new Date(client.created_at).toLocaleDateString("pt-BR")}`}
        action={<Badge variant={client.is_active ? "success" : "danger"}>{client.is_active ? "Ativo" : "Bloqueado"}</Badge>}
      />

      <Card className="mb-4">
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="E-mail" value={client.email} />
          <Row label="WhatsApp" value={client.phone} />
          <Row label="Cidade" value={`${APP_CITY} - ${APP_STATE}`} />
          <Row label="Bairro" value={client.user_addresses?.regions?.name} />
        </dl>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-lg font-bold text-foreground">{total ?? 0}</p>
          <p className="text-xs text-muted">Solicitações</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-foreground">{completed ?? 0}</p>
          <p className="text-xs text-muted">Concluídas</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-foreground">{cancelled ?? 0}</p>
          <p className="text-xs text-muted">Canceladas</p>
        </Card>
      </div>

      <ToggleUserActiveButton userId={client.id} userName={client.name} isActive={client.is_active} />
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
