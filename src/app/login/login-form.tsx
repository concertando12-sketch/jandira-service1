"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, PasswordInput } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        "O Supabase ainda não foi configurado neste ambiente (faltam as chaves em .env.local). Veja o README.",
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }

    router.refresh();
    router.push("/redirecionando");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isSupabaseConfigured && (
        <p className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-brand">
          O projeto Supabase ainda não foi conectado, então não tem login real ainda. Quer só{" "}
          <Link href="/preview" className="font-semibold underline">
            olhar as telas no modo prévia
          </Link>
          ?
        </p>
      )}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link href="/recuperar-senha" className="text-xs font-medium text-brand hover:underline">
            Esqueci a senha
          </Link>
        </div>
        <PasswordInput
          id="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <FieldError>{error}</FieldError>

      <Button type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
