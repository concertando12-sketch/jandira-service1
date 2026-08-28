import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { CreateCategoryForm } from "@/components/admin/create-category-form";
import { ActiveToggleButton } from "@/components/admin/active-toggle-button";
import { toggleCategoryActiveAction } from "@/lib/actions/admin-actions";

export default async function AdminCategoriasPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, description, is_active, services(id)")
    .order("name");

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Agrupam os serviços/profissões do app. Cadastre novas sem mexer em código."
      />

      <Card className="mb-6">
        <CreateCategoryForm />
      </Card>

      <div className="flex flex-col gap-2">
        {categories?.map((cat) => (
          <Card key={cat.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{cat.name}</p>
              <p className="text-xs text-muted">
                {(cat.services ?? []).length} serviço(s){cat.description ? ` · ${cat.description}` : ""}
              </p>
            </div>
            <ActiveToggleButton id={cat.id} isActive={cat.is_active} onToggle={toggleCategoryActiveAction} />
          </Card>
        ))}
      </div>
    </div>
  );
}
