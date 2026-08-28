import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

// Pra onde requireRole manda quem tem users.is_active = false (Fase 6,
// item 8) — a conta existe e a senha ainda funciona, só que o admin
// bloqueou o acesso.
export default function BloqueadoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <Logo subtitle={false} className="mb-8" />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
        <ShieldAlert className="h-7 w-7 text-danger" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-foreground">Sua conta está bloqueada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        O acesso a essa conta foi suspenso pela administração do Jandira Service. Se você
        acha que isso é um engano, entre em contato pelo suporte.
      </p>
      <form action={signOutAction} className="mt-6">
        <Button type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </main>
  );
}
