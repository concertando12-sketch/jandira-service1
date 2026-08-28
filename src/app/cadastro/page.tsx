import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
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
