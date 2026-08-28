import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RecuperarSenhaForm } from "./recuperar-senha-form";

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link de redefinição para seu e-mail"
      footer={
        <>
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RecuperarSenhaForm />
    </AuthShell>
  );
}
