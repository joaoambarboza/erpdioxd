"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav-items";

function NavContent({
  onNavigate,
  nome,
  hasLogo,
  logoVersion,
}: {
  onNavigate?: () => void;
  nome: string;
  hasLogo: boolean;
  logoVersion: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        {hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/configuracao/logo?v=${logoVersion}`}
            alt={nome}
            className="h-6 w-6 rounded object-contain"
          />
        ) : (
          <Sprout className="text-primary" size={22} />
        )}
        <span className="truncate text-base font-semibold text-foreground">{nome}</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {group.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = item.href && pathname?.startsWith(item.href);
                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className="flex cursor-not-allowed items-center rounded-md px-2 py-1.5 text-sm text-muted/60">
                        {item.label}
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-background"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar({
  nome,
  hasLogo,
  logoVersion,
}: {
  nome: string;
  hasLogo: boolean;
  logoVersion: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <NavContent nome={nome} hasLogo={hasLogo} logoVersion={logoVersion} />
      </aside>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-md border border-border bg-surface p-2 shadow-sm lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 bg-surface shadow-lg">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-muted hover:bg-background"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
            <NavContent
              onNavigate={() => setMobileOpen(false)}
              nome={nome}
              hasLogo={hasLogo}
              logoVersion={logoVersion}
            />
          </div>
        </div>
      )}
    </>
  );
}
