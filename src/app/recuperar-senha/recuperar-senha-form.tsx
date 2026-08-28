"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Recuperação de senha por código (6 dígitos, mandado por e-mail) —
// mais simples que clicar num link: a pessoa digita o código aqui
// mesmo e já libera pra trocar a senha em /redefinir-senha. Usa
// verifyOtp com o mesmo token que o resetPasswordForEmail gera; o
// e-mail (template "Reset Password" no Supabase) precisa mostrar
// {{ .Token }}, não só o link.
export function RecuperarSenhaForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function sendCode() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("O Supabase ainda não foi configurado neste ambiente. Veja o README.");
      return;
    }

    const ok = await sendCode();
    if (ok) setStep("code");
  }

  async function handleResend() {
    setResent(false);
    const ok = await sendCode();
    if (ok) setResent(true);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });
    setLoading(false);

    if (error) {
      setError("Código inválido ou expirado. Confira e tente de novo, ou peça um novo código.");
      return;
    }
    router.push("/redefinir-senha");
  }

  if (step === "code") {
    return (
      <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
        <p className="text-center text-sm text-muted">
          Mandamos um código para <strong className="text-foreground">{email}</strong>. Digite
          abaixo (também dá pra clicar no link do e-mail, se preferir).
        </p>
        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
          />
        </div>
        <FieldError>{error}</FieldError>
        {resent && <p className="text-center text-sm text-success">Novo código enviado.</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Confirmando…" : "Confirmar código"}
        </Button>
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="text-center text-sm text-brand hover:underline"
        >
          Reenviar código
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando…" : "Enviar código"}
      </Button>
    </form>
  );
}
