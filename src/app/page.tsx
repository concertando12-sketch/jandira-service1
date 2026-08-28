import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        Disponível em {APP_CITY} - {APP_STATE}
      </div>

      <div className="mt-6 mb-12">
        <Logo />
      </div>

      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Como você deseja usar o app?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Conectamos clientes e prestadores de serviço em {APP_CITY}.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <LinkButton href="/cadastro?role=CLIENT" size="lg" className="w-full">
            Sou cliente — quero contratar
          </LinkButton>
          <LinkButton
            href="/cadastro?role=PROVIDER"
            size="lg"
            variant="secondary"
            className="w-full"
          >
            Sou prestador — quero oferecer serviços
          </LinkButton>
        </div>

        <p className="mt-8 text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
