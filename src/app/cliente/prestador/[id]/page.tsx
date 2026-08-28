import Link from "next/link";
import { CheckCircle2, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { FavoriteButton } from "@/components/provider/favorite-button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export default async function PrestadorPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CLIENT");
  const { id } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select(
      `id, professional_name, description, profile_photo, whatsapp, price_from, price_to, availability,
       is_verified, is_active, rating_avg, rating_count,
       provider_services(services(id, name, slug, categories(name))),
       provider_regions(regions(id, name)),
       users(user_addresses(regions(name)))`,
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!provider) {
    return (
      <div>
        <Card className="py-14 text-center text-sm text-muted">
          Esse perfil não existe ou não está mais disponível.
        </Card>
      </div>
    );
  }

  const [{ data: reviews }, { data: favorite }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, users(name)")
      .eq("provider_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("favorites")
      .select("id")
      .eq("client_id", user.id)
      .eq("provider_id", id)
      .maybeSingle(),
  ]);

  const services = (provider.provider_services ?? [])
    .map((ps) => ps.services)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const regions = (provider.provider_regions ?? [])
    .map((pr) => pr.regions)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const homeRegionName = provider.users?.user_addresses?.regions?.name ?? null;

  const whatsappLink = buildWhatsAppLink(
    provider.whatsapp,
    `Olá, ${provider.professional_name}! Encontrei seu perfil no Jandira Service e gostaria de solicitar um orçamento.`,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="flex flex-col items-center py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-2 text-2xl font-bold text-brand">
          {provider.professional_name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{provider.professional_name}</h1>
          <FavoriteButton providerId={provider.id} initialFavorited={Boolean(favorite)} />
        </div>

        {provider.rating_count > 0 ? (
          <div className="mt-1">
            <StarRating value={provider.rating_avg} count={provider.rating_count} size="md" />
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">Sem avaliações ainda</p>
        )}

        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4 text-brand" />
          {homeRegionName ? `${homeRegionName}, ` : ""}
          {APP_CITY} - {APP_STATE}
        </p>

        {provider.is_verified && (
          <Badge variant="brand" className="mt-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Perfil verificado
          </Badge>
        )}
      </Card>

      {provider.description && (
        <Card className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Sobre</p>
          <p className="text-sm text-foreground">{provider.description}</p>
        </Card>
      )}

      {services.length > 0 && (
        <Card className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Serviços</p>
          <div className="flex flex-col gap-1.5">
            {services.map((s) => (
              <p key={s.id} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                {s.name}
              </p>
            ))}
          </div>
        </Card>
      )}

      {regions.length > 0 && (
        <Card className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Regiões atendidas
          </p>
          <div className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <Badge key={r.id} variant="default">
                {r.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {(provider.price_from || provider.availability) && (
        <Card className="mt-4">
          {provider.price_from && (
            <p className="text-sm text-foreground">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Valor: </span>
              A partir de R$ {Number(provider.price_from).toLocaleString("pt-BR")}
            </p>
          )}
          {provider.availability && (
            <p className="mt-1 text-sm text-foreground">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Disponibilidade:{" "}
              </span>
              {provider.availability}
            </p>
          )}
        </Card>
      )}

      <Card className="mt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Avaliações {provider.rating_count > 0 && `(${provider.rating_count})`}
        </p>
        {reviews && reviews.length > 0 ? (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <StarRating value={r.rating} />
                {r.comment && <p className="mt-1 text-sm text-foreground">&quot;{r.comment}&quot;</p>}
                <p className="mt-1 text-xs text-muted">{r.users?.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Ainda sem avaliações.</p>
        )}
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={`/cliente/prestador/${provider.id}/solicitar`} className="flex-1 justify-center">
          Solicitar serviço
        </LinkButton>
        {whatsappLink && (
          <Link
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-brand/50"
          >
            <MessageCircle className="h-4 w-4" />
            Falar no WhatsApp
          </Link>
        )}
      </div>
    </div>
  );
}
