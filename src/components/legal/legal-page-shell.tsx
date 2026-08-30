import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

// Layout simples pras páginas de Termos de Uso e Política de
// Privacidade — texto corrido, sem exigir login (precisam estar
// acessíveis pra quem ainda nem tem conta, na hora do cadastro).
export function LegalPageShell({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Link href="/">
          <Logo subtitle={false} />
        </Link>
        <Link
          href="/cadastro"
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-xs text-muted">Última atualização: {updatedAt}</p>

        <div className="prose-legal mt-8 flex flex-col gap-6 text-sm leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-0 [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </main>
    </div>
  );
}
