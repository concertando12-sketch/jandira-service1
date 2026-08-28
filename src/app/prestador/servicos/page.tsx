import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { ServicesForm } from "./services-form";
import { SuggestServiceForm } from "@/components/provider/suggest-service-form";
import type { CategoryWithServices } from "@/components/provider/service-checkbox-list";

export default async function PrestadorServicosPage() {
  const user = await requireRole("PROVIDER");
  const supabase = await createClient();

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, services(id, name, is_active)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("provider_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  let selectedIds: string[] = [];
  if (profile) {
    const { data: providerServices } = await supabase
      .from("provider_services")
      .select("service_id")
      .eq("provider_id", profile.id);
    selectedIds = (providerServices ?? []).map((ps) => ps.service_id);
  }

  const allCategories = (categories ?? []).map((c) => ({ id: c.id, name: c.name }));

  const categoriesWithServices: CategoryWithServices[] = (categories ?? [])
    .map((c) => ({
      id: c.id,
      name: c.name,
      services: (c.services ?? []).filter((s) => s.is_active).map((s) => ({ id: s.id, name: s.name })),
    }))
    .filter((c) => c.services.length > 0);

  return (
    <div>
      <PageHeader
        title="Meus serviços"
        description="O que você oferece — sem marcar nada aqui, você não aparece em nenhuma busca."
      />
      <Card>
        {categoriesWithServices.length > 0 ? (
          <ServicesForm
            categories={categoriesWithServices}
            defaultSelectedIds={selectedIds}
            allCategories={allCategories}
          />
        ) : (
          <div>
            <p className="py-8 text-center text-sm text-muted">
              Nenhum serviço cadastrado ainda. Rode supabase/seed.sql ou peça pro admin
              cadastrar em Admin → Serviços.
            </p>
            {allCategories.length > 0 && <SuggestServiceForm categories={allCategories} />}
          </div>
        )}
      </Card>
    </div>
  );
}
