"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NewItemMenu } from "@/components/layout/new-item-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  user,
  organizationName,
  overdueCount,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; roleName: string; permissions: string[] };
  organizationName: string;
  overdueCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Sidebar - desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <SidebarHeader organizationName={organizationName} overdueCount={overdueCount} />
        <SidebarNav permissions={user.permissions} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-background">
            <div className="flex items-center justify-between px-3 py-3">
              <SidebarHeader organizationName={organizationName} overdueCount={overdueCount} compact />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarNav permissions={user.permissions} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <NewItemMenu />
          <NotificationsMenu />
          <UserMenu name={user.name} roleName={user.roleName} email={user.email} />
        </header>
        <main className="flex-1 overflow-y-auto thin-scrollbar">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarHeader({
  organizationName,
  overdueCount,
  compact,
}: {
  organizationName: string;
  overdueCount: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-2 px-4", compact ? "" : "py-4")}>
      <Link href="/dashboard" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branding/logo.jpg" alt="RNS Contabilidade" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none">RNS Gestão</p>
          <p className="truncate text-xs text-muted-foreground">{organizationName}</p>
        </div>
      </Link>
      {overdueCount > 0 && (
        <Link
          href="/tarefas?status=ATRASADA"
          className="flex items-center justify-between rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/15"
        >
          <span>Tarefas atrasadas</span>
          <span className="rounded-full bg-destructive px-1.5 text-white">{overdueCount}</span>
        </Link>
      )}
    </div>
  );
}
