"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/constants";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "CLIENT", label: "Sou cliente" },
  { value: "PROVIDER", label: "Sou prestador" },
];

// Máscara 000.000.000-00 — só formata visualmente, quem valida de
// verdade (nome/CPF batendo com o comprovante) é o admin na hora de
// aprovar a assinatura (Fase 9).
function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "PROVIDER" ? "PROVIDER" : "CLIENT";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        "O Supabase ainda não foi configurado neste ambiente (faltam as chaves em .env.local). Veja o README.",
      );
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      setError("Informe um CPF válido (11 dígitos).");
      return;
    }
    if (!acceptedTerms) {
      setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade pra continuar.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone, cpf: cpfDigits, role } },
    });
    setLoading(false);

    if (error) {
      setError(
        error.message === "User already registered"
          ? "Já existe uma conta com este e-mail."
          : error.message,
      );
      return;
    }

    if (data.session) {
      router.refresh();
      router.push("/redirecionando");
    } else {
      // Projeto com confirmação de e-mail ativada: não há sessão ainda.
      setConfirmEmailSent(true);
    }
  }

  if (confirmEmailSent) {
    return (
      <div className="text-center text-sm text-foreground">
        <p className="font-semibold">Quase lá!</p>
        <p className="mt-2 text-muted">
          Enviamos um e-mail de confirmação para <strong>{email}</strong>. Confirme para
          poder entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Como você quer usar o app?</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                role === opt.value
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-surface-2 text-foreground hover:border-brand/50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
        />
      </div>

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
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input
          id="phone"
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 90000-0000"
        />
      </div>

      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          required
          inputMode="numeric"
          autoComplete="off"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          placeholder="000.000.000-00"
        />
        <p className="mt-1 text-xs text-muted">
          Usado só pra conferir o comprovante quando você pagar a assinatura mensal.
        </p>
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a senha"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
        />
        <span>
          Li e concordo com os{" "}
          <Link href="/termos-de-uso" target="_blank" className="font-semibold text-brand hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/politica-de-privacidade"
            target="_blank"
            className="font-semibold text-brand hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      <FieldError>{error}</FieldError>

      <Button type="submit" disabled={loading || !acceptedTerms} className="mt-2 w-full">
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}
