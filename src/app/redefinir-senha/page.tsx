import { AuthShell } from "@/components/auth/auth-shell";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export default function RedefinirSenhaPage() {
  return (
    <AuthShell title="Nova senha" subtitle="Escolha uma nova senha para sua conta">
      <RedefinirSenhaForm />
    </AuthShell>
  );
}
