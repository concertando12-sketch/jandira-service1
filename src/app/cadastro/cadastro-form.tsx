"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
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
  // null = formulário; true = conta criada e já pode entrar; "pending" =
  // falta confirmar o e-mail antes de entrar.
  const [done, setDone] = useState<true | "pending" | null>(null);

  // Cadastro mais fluído (item 2 do feedback): Enter num campo já pula
  // pro próximo, em vez de precisar clicar. Último campo de texto
  // (confirmar senha) só continua submetendo normal.
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  function focusNext(e: React.KeyboardEvent<HTMLInputElement>, next: React.RefObject<HTMLInputElement | null>) {
    if (e.key === "Enter") {
      e.preventDefault();
      next.current?.focus();
    }
  }

  function handleCpfChange(value: string) {
    const formatted = formatCpf(value);
    setCpf(formatted);
    // Assim que os 11 dígitos são preenchidos, já pula pra senha —
    // não precisa nem apertar Enter.
    if (formatted.replace(/\D/g, "").length === 11) {
      passwordRef.current?.focus();
    }
  }

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

    // Não entra direto no painel — mostra a confirmação e deixa a
    // pessoa clicar em "Entrar" (item 2 do feedback).
    setDone(data.session ? true : "pending");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <p className="text-base font-semibold text-foreground">Cadastro concluído!</p>
        <p className="text-sm text-muted">
          {done === "pending" ? (
            <>
              Enviamos um e-mail de confirmação para <strong className="text-foreground">{email}</strong>.
              Confirme para poder entrar.
            </>
          ) : (
            "Sua conta foi criada com sucesso. Já pode entrar."
          )}
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
          ref={nameRef}
          required
          autoComplete="name"
          enterKeyHint="next"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => focusNext(e, emailRef)}
          placeholder="Seu nome"
        />
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          required
          autoComplete="email"
          enterKeyHint="next"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => focusNext(e, phoneRef)}
          placeholder="voce@exemplo.com"
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input
          id="phone"
          ref={phoneRef}
          type="tel"
          required
          autoComplete="tel"
          enterKeyHint="next"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => focusNext(e, cpfRef)}
          placeholder="(11) 90000-0000"
        />
      </div>

      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          ref={cpfRef}
          required
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          value={cpf}
          onChange={(e) => handleCpfChange(e.target.value)}
          onKeyDown={(e) => focusNext(e, passwordRef)}
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
          ref={passwordRef}
          type="password"
          required
          autoComplete="new-password"
          enterKeyHint="next"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => focusNext(e, confirmPasswordRef)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          ref={confirmPasswordRef}
          type="password"
          required
          autoComplete="new-password"
          enterKeyHint="done"
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
