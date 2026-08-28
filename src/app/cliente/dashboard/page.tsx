import Link from "next/link";
import { ClipboardList, Heart, MapPin, Search, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { APP_CITY } from "@/lib/constants";

export default async function ClienteDashboardPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();

  const [{ count: openRequests }, { count: favoritesCount }, { data: categories }, { data: address }] =
    await Promise.all([
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("client_id", user.id)
        .in("status", ["PENDING", "ACCEPTED", "IN_PROGRESS"]),
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("client_id", user.id),
      supabase
        .from("categories")
        .select("id, name, slug, icon")
        .eq("is_active", true)
        .order("name")
        .limit(8),
      supabase.from("user_addresses").select("regions(name)").eq("user_id", user.id).maybeSingle(),
    ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const regionName = address?.regions?.name ?? null;

  return (
    <div>
      {regionName ? (
        <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <MapPin className="h-3.5 w-3.5 text-brand" />
          {regionName}, {APP_CITY}
        </div>
      ) : (
        <Link
          href="/cliente/endereco"
          className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
        >
          <MapPin className="h-3.5 w-3.5" />
          Defina seu bairro em {APP_CITY}
        </Link>
      )}
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Olá, {firstName} 👋</h1>
      <p className="mt-1 text-sm text-muted">O que você precisa hoje?</p>

      <Link
        href="/cliente/buscar"
        className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm text-muted transition-colors hover:border-brand/50"
      >
        <Search className="h-4.5 w-4.5" />
        Buscar serviço (ex: eletricista, babá, diarista...)
      </Link>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatLink href="/cliente/solicitacoes" icon={ClipboardList} label="Pedidos ativos" value={openRequests ?? 0} />
        <StatLink href="/cliente/favoritos" icon={Heart} label="Favoritos" value={favoritesCount ?? 0} />
        <StatLink href="/cliente/solicitacoes" icon={Star} label="Avaliações feitas" value={0} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Categorias</h2>
          <Link href="/cliente/categorias" className="text-xs font-medium text-brand hover:underline">
            Ver todas
          </Link>
        </div>
        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/cliente/categorias#${cat.slug}`}>
                <Card className="flex flex-col items-center gap-2 py-5 text-center transition-colors hover:border-brand/50">
                  <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center text-sm text-muted">
            Nenhuma categoria cadastrada ainda.
          </Card>
        )}
      </div>

      <Card className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Prestadores no seu bairro</p>
          <p className="text-sm text-muted">
            {regionName
              ? `Veja quem atende ${regionName} agora mesmo.`
              : "Defina seu bairro pra já ver os prestadores certos direto na busca."}
          </p>
        </div>
        <LinkButton href="/cliente/buscar" variant="secondary" size="sm">
          Buscar
        </LinkButton>
      </Card>
    </div>
  );
}

function StatLink({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof ClipboardList;
  label: string;
  value: number;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 transition-colors hover:border-brand/50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15">
          <Icon className="h-5 w-5 text-brand" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted">{label}</p>
        </div>
      </Card>
    </Link>
  );
}
