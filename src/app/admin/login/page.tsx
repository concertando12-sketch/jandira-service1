import { AdminLoginForm } from "./admin-login-form";

// Entrada separada do fluxo comum de cliente/prestador (item 1 da Fase
// 6) — mesma autenticação do Supabase por baixo (já guarda senha com
// hash de verdade, não faria sentido reinventar isso), mas nunca
// linkada do cadastro público e com identidade visual própria.
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Jandira Service
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Painel Administrativo</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
