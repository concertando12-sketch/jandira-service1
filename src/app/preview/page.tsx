import { redirect } from "next/navigation";
import { Briefcase, ShieldCheck, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { enterPreviewAction } from "@/lib/actions/preview-actions";
import type { UserRole } from "@/lib/constants";

const OPTIONS: {
  role: UserRole;
  title: string;
  description: string;
  icon: typeof User;
}[] = [
  {
    role: "CLIENT",
    title: "Ver como Cliente",
    description: "Home, categorias, busca, endereço, perfil",
    icon: User,
  },
  {
    role: "PROVIDER",
    title: "Ver como Prestador",
    description: "Dashboard, minha região, meu endereço, configurações",
    icon: Briefcase,
  },
  {
    role: "ADMIN",
    title: "Ver como Admin",
    description: "Categorias, serviços, regiões, prestadores, clientes",
    icon: ShieldCheck,
  },
];

export default function PreviewPage() {
  // Modo prévia só faz sentido sem projeto conectado — com Supabase
  // configurado, isso vira o /login de verdade.
  if (isSupabaseConfigured) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <Logo subtitle={false} className="mb-6" />

      <div className="mb-8 max-w-md rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-center text-xs text-brand">
        <strong>Modo prévia</strong> — o Supabase ainda não foi conectado, então não há login
        real. Escolha um papel abaixo só pra olhar as telas; os dados aparecem vazios (é
        esperado). Assim que o `.env.local` tiver as chaves do Supabase, essa página some e
        vira o login de verdade.
      </div>

      <h1 className="mb-6 text-lg font-bold text-foreground">Como você quer ver o sistema?</h1>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <form key={opt.role} action={enterPreviewAction.bind(null, opt.role)}>
              <button
                type="submit"
                className="group flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-colors hover:border-brand"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-brand">
                    {opt.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">{opt.description}</p>
                </div>
              </button>
            </form>
          );
        })}
      </div>
    </main>
  );
}
