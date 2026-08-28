import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { ClientSearchTable, type ClientRow } from "@/components/admin/client-search-table";

export default async function AdminClientesPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("users")
    .select("id, name, email, phone, is_active, created_at, user_addresses(regions(name))")
    .eq("role", "CLIENT")
    .order("created_at", { ascending: false });

  const rows: ClientRow[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    regionName: c.user_addresses?.regions?.name ?? null,
    isActive: c.is_active,
    createdAt: c.created_at,
  }));

  return (
    <div>
      <PageHeader title="Clientes" description={`${rows.length} cadastrados`} />
      <ClientSearchTable clients={rows} />
    </div>
  );
}
