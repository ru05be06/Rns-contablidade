import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ListChecks,
  CalendarDays,
  KanbanSquare,
  FileSignature,
  Wallet,
  FolderOpen,
  BarChart3,
  UsersRound,
  Zap,
  Settings,
  Inbox,
  Radar,
  TrendingDown,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Central Operacional", href: "/operacional", icon: Radar, permission: "dashboard.view" },
  { label: "Clientes", href: "/clientes", icon: Users, permission: "clients.view" },
  { label: "Serviços", href: "/servicos", icon: Briefcase, permission: "services.view" },
  { label: "Tarefas", href: "/tarefas", icon: ListChecks, permission: "tasks.view" },
  { label: "Minhas Tarefas", href: "/tarefas/minhas", icon: ListChecks, permission: "tasks.view" },
  { label: "Kanban", href: "/tarefas/kanban", icon: KanbanSquare, permission: "tasks.view" },
  { label: "Calendário", href: "/calendario", icon: CalendarDays, permission: "tasks.view" },
  { label: "Pendências", href: "/pendencias", icon: Inbox, permission: "tasks.view" },
  { label: "Contratos", href: "/contratos", icon: FileSignature, permission: "contracts.view" },
  { label: "Financeiro", href: "/financeiro", icon: Wallet, permission: "financeiro.view" },
  { label: "Inadimplência", href: "/financeiro/inadimplencia", icon: TrendingDown, permission: "financeiro.view" },
  { label: "Documentos", href: "/documentos", icon: FolderOpen, permission: "documents.view" },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3, permission: "reports.view" },
  { label: "Equipe", href: "/equipe", icon: UsersRound, permission: "team.view" },
  { label: "Automação", href: "/automacao", icon: Zap, permission: "settings.manage" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, permission: "settings.manage" },
];
