"use client";

import { useState } from "react";
import { Info, Lock, MessageCircle, X } from "lucide-react";

// "Orçamento no WhatsApp" (item 4 da spec) — não vai direto pro
// WhatsApp: primeiro explica como funciona e deixa claro que o
// Jandira Service só conecta, não participa do valor/pagamento (item
// 10/11). O link já vem pronto do servidor (item 17 — nunca confia em
// número vindo do front, o servidor já resolveu o whatsapp real do
// prestador antes de montar esse link).
export function WhatsAppQuoteButton({
  whatsappLink,
  providerName,
}: {
  whatsappLink: string;
  providerName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-success/40 px-5 py-3 text-sm font-semibold text-success transition-colors hover:bg-success/10"
      >
        <MessageCircle className="h-4 w-4" />
        Orçamento no WhatsApp
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-success" />
                <h2 className="text-lg font-bold text-foreground">Orçamento pelo WhatsApp</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-brand/30 bg-brand/10 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Info className="h-4 w-4 text-brand" />
                Como funciona?
              </p>
              <p className="mt-1 text-sm text-muted">
                Você será direcionado para o WhatsApp de {providerName}. Explique o serviço que
                precisa realizar e solicite seu orçamento diretamente — o profissional vai
                informar valores, prazo e disponibilidade direto pra você.
              </p>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
              <p className="text-xs text-muted">
                O orçamento, valores, prazos e condições são combinados diretamente entre você e
                o profissional. O Jandira Service apenas realiza a conexão entre as partes.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
              >
                Continuar para o WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-surface-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
