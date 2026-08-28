import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { CreateServiceForm } from "@/components/admin/create-service-form";
import { ActiveToggleButton } from "@/components/admin/active-toggle-button";
import { toggleServiceActiveAction } from "@/lib/actions/admin-actions";

export default async function AdminServicosPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, is_active, categories(name)")
      .order("name"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Serviços / profissões"
        description="O catálogo que aparece para clientes e prestadores. Adicione quantas profissões quiser, sem alterar código."
      />

      <Card className="mb-6">
        <CreateServiceForm categories={categories ?? []} />
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {services?.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                <td className="px-4 py-3 text-muted">
                  <Badge variant="default">{s.categories?.name ?? "—"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <ActiveToggleButton id={s.id} isActive={s.is_active} onToggle={toggleServiceActiveAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
