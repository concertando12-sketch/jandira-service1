import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CadastroForm } from "./cadastro-form";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export default async function CadastroPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.is_active ? ROLE_HOME[user.role] : "/bloqueado");
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <CadastroForm />
      </Suspense>
    </AuthShell>
  );
}
