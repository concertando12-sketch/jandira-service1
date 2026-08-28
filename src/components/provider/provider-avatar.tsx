// Foto de perfil quando existir, senão a inicial do nome — mesmo
// padrão usado no preview de upload (prestador/perfil). Reaproveitado
// em toda tela que mostra o prestador pro cliente (perfil público,
// solicitar serviço), porque a foto nunca tinha sido exibida de
// verdade nesses lugares, só guardada no banco.
export function ProviderAvatar({
  photoUrl,
  name,
  size = "lg",
}: {
  photoUrl: string | null;
  name: string;
  size?: "md" | "lg";
}) {
  const dimension = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, sem domínio configurado pro next/image
      <img
        src={photoUrl}
        alt={name}
        className={`${dimension} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-brand`}
    >
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}
