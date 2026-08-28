"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("O Supabase ainda não foi configurado neste ambiente. Veja o README.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setLoading(false);
      setError(
        signInError?.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : signInError?.message ?? "Não foi possível entrar.",
      );
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Essa conta não é de administrador.");
      return;
    }
    if (!profile.is_active) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Essa conta de administrador está bloqueada.");
      return;
    }

    router.refresh();
    router.push("/admin/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isSupabaseConfigured && (
        <p className="rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-brand">
          O Supabase ainda não foi conectado — veja o README pra configurar o `.env.local`.
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
          placeholder="admin@exemplo.com"
        />
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
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
