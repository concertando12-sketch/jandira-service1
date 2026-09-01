import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.is_active ? ROLE_HOME[user.role] : "/bloqueado");
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse sua conta Jandira Service"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-brand hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
