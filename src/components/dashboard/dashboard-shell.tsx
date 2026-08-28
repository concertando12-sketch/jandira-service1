"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Bell, ChevronDown, Check, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth-actions";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { SUPPORT_WHATSAPP_PHONE } from "@/lib/constants";

// Suporte único por WhatsApp (dono da plataforma) — substitui o antigo
// "falar no WhatsApp" por prestador. Mesmo botão pra cliente e
// prestador, qualquer dúvida.
const SUPPORT_WHATSAPP_LINK = buildWhatsAppLink(
  SUPPORT_WHATSAPP_PHONE,
  "Olá! Preciso de ajuda com o Jandira Service.",
);

function SupportWhatsAppLink() {
  if (!SUPPORT_WHATSAPP_LINK) return null;
  return (
    <Link
      href={SUPPORT_WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <MessageCircle className="h-4.5 w-4.5" strokeWidth={2} />
      Fale conosco
    </Link>
  );
}

// Visível só pra quem realmente é ADMIN (ver requireRole) — deixa
// navegar pelas telas de cliente/prestador/admin com a mesma conta,
// pra ver a experiência de cada papel sem precisar de 3 logins.
const VIEW_OPTIONS = [
  { view: "CLIENT" as const, label: "Cliente", href: "/cliente/dashboard" },
  { view: "PROVIDER" as const, label: "Prestador", href: "/prestador/dashboard" },
  { view: "ADMIN" as const, label: "Admin", href: "/admin/dashboard" },
];

function ViewSwitcher({ currentView }: { currentView: "CLIENT" | "PROVIDER" | "ADMIN" }) {
  const [open, setOpen] = useState(false);
  const current = VIEW_OPTIONS.find((v) => v.view === currentView);

  return (
    <div className="relative mb-4 px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground"
      >
        Vendo como: {current?.label ?? currentView}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {VIEW_OPTIONS.map((opt) => (
            <Link
              key={opt.view}
              href={opt.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm hover:bg-surface-2",
                opt.view === currentView ? "text-brand" : "text-foreground",
              )}
            >
              {opt.label}
              {opt.view === currentView && <Check className="h-3.5 w-3.5" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export interface NavItem {
  href: string;
  label: string;
  // Elemento já renderizado (ex: <Home className="..." />), não o
  // componente em si — ícone de lucide-react é um objeto forwardRef,
  // e Server Component não pode passar isso "cru" pra Client
  // Component como prop (só elementos React já montados).
  icon: ReactNode;
  // Contador (ex: notificações não lidas — item 37).
  badge?: number;
}

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  previewMode = false,
  notificationsHref,
  unreadCount = 0,
  viewSwitcher,
  showSupportWhatsApp = false,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  previewMode?: boolean;
  notificationsHref?: string;
  unreadCount?: number;
  // Só presente quando quem está logado é ADMIN — ver requireRole.
  viewSwitcher?: "CLIENT" | "PROVIDER" | "ADMIN";
  // Botão único de suporte via WhatsApp — cliente e prestador, não admin.
  showSupportWhatsApp?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-brand-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            {item.icon}
            {item.label}
            {Boolean(item.badge) && (
              <span
                className={cn(
                  "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                  active ? "bg-brand-foreground text-brand" : "bg-brand text-brand-foreground",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {previewMode && (
        <Link
          href="/preview"
          className="flex shrink-0 items-center justify-center gap-2 bg-brand px-4 py-1.5 text-center text-xs font-semibold text-brand-foreground"
        >
          🔧 Modo prévia — sem login real, dados vazios de propósito · trocar papel
        </Link>
      )}
      <div className="flex min-h-0 flex-1 bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface py-6 lg:flex">
        <Link href="/" className="mb-6 px-5">
          <Logo subtitle={false} />
        </Link>
        {viewSwitcher && <ViewSwitcher currentView={viewSwitcher} />}
        {nav}
        <div className="mt-auto px-3 pt-4">
          <div className="mb-2 rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
          </div>
          {showSupportWhatsApp && <SupportWhatsAppLink />}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Sidebar — mobile (slide-over) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface py-6">
            <div className="mb-6 flex items-center justify-between px-5">
              <Logo subtitle={false} />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            {viewSwitcher && <ViewSwitcher currentView={viewSwitcher} />}
            {nav}
            <div className="mt-auto px-3 pt-4">
              {showSupportWhatsApp && <SupportWhatsAppLink />}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-danger"
                >
                  <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
                  Sair
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — mobile */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <Logo subtitle={false} />
          {notificationsHref ? (
            <Link href={notificationsHref} className="relative" aria-label="Notificações">
              <Bell className="h-6 w-6 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <div className="w-6" />
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
      </div>
    </div>
  );
}
