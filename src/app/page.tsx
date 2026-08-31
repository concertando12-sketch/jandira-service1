import Link from "next/link";
import { MapPin } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Link href="/">
          <Logo subtitle={false} />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-1.5 text-sm text-muted sm:flex">
            <MapPin className="h-4 w-4 text-brand" />
            {APP_CITY} - {APP_STATE}
          </span>
          <Link
            href="/login"
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand/50"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Disponível em {APP_CITY} - {APP_STATE}
        </div>

        <h1 className="max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          Encontre profissionais de confiança perto de você
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted sm:text-base">
          Babá, eletricista, diarista, encanador e muito mais — profissionais que atendem
          sua região em {APP_CITY} - {APP_STATE}.
        </p>

        <p className="mt-12 text-xs font-semibold uppercase tracking-wider text-muted">
          Como você deseja usar o aplicativo?
        </p>

        <div className="mt-4 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/cadastro?role=CLIENT"
            className="group rounded-2xl border border-border bg-surface p-6 text-left transition-colors hover:border-brand"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-xl">
              🙋
            </div>
            <p className="mt-4 font-semibold text-foreground group-hover:text-brand">
              Sou cliente
            </p>
            <p className="mt-1 text-sm text-muted">Quero contratar um serviço</p>
          </Link>

          <Link
            href="/cadastro?role=PROVIDER"
            className="group rounded-2xl border border-border bg-surface p-6 text-left transition-colors hover:border-brand"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-xl">
              🛠️
            </div>
            <p className="mt-4 font-semibold text-foreground group-hover:text-brand">
              Sou prestador
            </p>
            <p className="mt-1 text-sm text-muted">Quero oferecer meus serviços</p>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </p>
        <p className="mt-2 text-xs text-muted">
          <Link href="/recuperar-senha" className="hover:text-brand hover:underline">
            Esqueceu a senha?
          </Link>
        </p>

        {!isSupabaseConfigured && (
          <Link
            href="/preview"
            className="mt-3 text-xs text-muted underline decoration-dotted hover:text-brand"
          >
            🔧 Ver o sistema sem login (modo prévia)
          </Link>
        )}
      </main>

      <footer className="flex flex-col items-center justify-center gap-2 border-t border-border px-6 py-6 text-xs text-muted">
        <span className="flex items-center gap-2">
          <LogoMark className="h-4 w-4" />
          Jandira Service — Soluções que facilitam sua vida
        </span>
        <span className="flex items-center gap-3">
          <Link href="/termos-de-uso" className="hover:text-brand hover:underline">
            Termos de Uso
          </Link>
          <span className="text-border">·</span>
          <Link href="/politica-de-privacidade" className="hover:text-brand hover:underline">
            Política de Privacidade
          </Link>
        </span>
      </footer>
    </div>
  );
}
