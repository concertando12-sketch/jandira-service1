import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

export default async function ClienteCategoriasPage() {
  await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, services(id, name, slug)")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <PageHeader title="Categorias" description="Todos os serviços disponíveis em Jandira" />

      {categories && categories.length > 0 ? (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} id={cat.slug}>
              <p className="font-semibold text-foreground">{cat.name}</p>
              {cat.description && <p className="mt-0.5 text-sm text-muted">{cat.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {(cat.services ?? [])
                  .filter((s) => s)
                  .map((service) => (
                    <Link
                      key={service.id}
                      href={`/cliente/buscar?servico=${service.slug}`}
                      className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand/50"
                    >
                      {service.name}
                    </Link>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">
          Nenhuma categoria cadastrada ainda. O administrador pode cadastrar em
          Admin → Categorias.
        </Card>
      )}
    </div>
  );
}
