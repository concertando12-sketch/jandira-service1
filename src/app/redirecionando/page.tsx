import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  CLIENT: "/cliente/dashboard",
  PROVIDER: "/prestador/dashboard",
  ADMIN: "/admin/dashboard",
};

// Ponto único de saída depois de login/cadastro: descobre o role do
// usuário logado e manda para o dashboard certo.
export default async function RedirectingPage() {
  const user = await getCurrentUser();
  redirect(user ? ROLE_HOME[user.role] : "/login");
}
