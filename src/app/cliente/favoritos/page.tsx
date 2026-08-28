import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { FavoriteButton } from "@/components/provider/favorite-button";

export default async function ClienteFavoritosPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "id, provider_profiles(id, professional_name, rating_avg, rating_count, is_verified, provider_services(services(name)))",
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const providers = (favorites ?? [])
    .map((f) => f.provider_profiles)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div>
      <PageHeader title="Favoritos" description="Prestadores que você salvou" />

      {providers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {providers.map((p) => (
            <Card key={p.id} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-brand">
                {p.professional_name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{p.professional_name}</p>
                  {p.is_verified && <Badge variant="brand">✓</Badge>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  {p.rating_count > 0 ? (
                    <StarRating value={p.rating_avg} count={p.rating_count} />
                  ) : (
                    <span>Sem avaliações</span>
                  )}
                  <span>{(p.provider_services ?? []).map((ps) => ps.services?.name).filter(Boolean).join(", ")}</span>
                </div>
              </div>
              <FavoriteButton providerId={p.id} initialFavorited size="sm" />
              <Link
                href={`/cliente/prestador/${p.id}`}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-brand/50"
              >
                Ver perfil
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">
          Você ainda não favoritou nenhum prestador. Clique no ♡ no perfil de quem você
          gostar.
        </Card>
      )}
    </div>
  );
}
