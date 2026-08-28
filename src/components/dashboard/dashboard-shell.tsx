"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth-actions";

export interface NavItem {
  href: string;
  label: string;
  // Elemento já renderizado (ex: <Home className="..." />), não o
  // componente em si — ícone de lucide-react é um objeto forwardRef,
  // e Server Component não pode passar isso "cru" pra Client
  // Component como prop (só elementos React já montados).
  icon: ReactNode;
}

export function DashboardShell({
  navItems,
  roleLabel,
  userName,
  previewMode = false,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  userName: string;
  previewMode?: boolean;
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
        {nav}
        <div className="mt-auto px-3 pt-4">
          <div className="mb-2 rounded-xl bg-surface-2 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
          </div>
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
            {nav}
            <div className="mt-auto px-3 pt-4">
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
          <div className="w-6" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
      </div>
    </div>
  );
}
