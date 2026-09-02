/**
 * Catálogo de permissões do sistema (RBAC).
 * Cada módulo expõe permissões granulares que o Administrador pode
 * atribuir livremente a qualquer perfil (role) — ver seção 4 do escopo.
 */
export const PERMISSION_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", label: "Visualizar dashboard" }],
  },
  {
    key: "clients",
    label: "Clientes",
    permissions: [
      { key: "clients.view", label: "Visualizar clientes" },
      { key: "clients.manage", label: "Criar/editar clientes" },
      { key: "clients.delete", label: "Excluir/arquivar clientes" },
    ],
  },
  {
    key: "services",
    label: "Serviços",
    permissions: [
      { key: "services.view", label: "Visualizar catálogo de serviços" },
      { key: "services.manage", label: "Gerenciar catálogo e checklists" },
    ],
  },
  {
    key: "tasks",
    label: "Tarefas",
    permissions: [
      { key: "tasks.view", label: "Visualizar tarefas" },
      { key: "tasks.manage", label: "Criar/editar/delegar tarefas" },
      { key: "tasks.execute", label: "Executar checklist e concluir tarefas atribuídas" },
    ],
  },
  {
    key: "contracts",
    label: "Contratos",
    permissions: [
      { key: "contracts.view", label: "Visualizar contratos" },
      { key: "contracts.manage", label: "Gerar/editar contratos" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    permissions: [
      { key: "financeiro.view", label: "Visualizar financeiro" },
      { key: "financeiro.manage", label: "Gerenciar cobranças e pagamentos" },
    ],
  },
  {
    key: "documents",
    label: "Documentos",
    permissions: [
      { key: "documents.view", label: "Visualizar documentos" },
      { key: "documents.manage", label: "Upload/exclusão de documentos" },
    ],
  },
  {
    key: "team",
    label: "Equipe",
    permissions: [
      { key: "team.view", label: "Visualizar equipe" },
      { key: "team.manage", label: "Gerenciar usuários, departamentos e perfis" },
    ],
  },
  {
    key: "reports",
    label: "Relatórios",
    permissions: [{ key: "reports.view", label: "Acessar relatórios" }],
  },
  {
    key: "settings",
    label: "Configurações",
    permissions: [{ key: "settings.manage", label: "Gerenciar configurações do escritório" }],
  },
] as const;

export type PermissionKey = (typeof PERMISSION_MODULES)[number]["permissions"][number]["key"];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key)
);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ALL_PERMISSION_KEYS,
  GESTOR: [
    "dashboard.view",
    "clients.view",
    "clients.manage",
    "services.view",
    "tasks.view",
    "tasks.manage",
    "tasks.execute",
    "contracts.view",
    "financeiro.view",
    "documents.view",
    "team.view",
    "reports.view",
  ],
  COLABORADOR: [
    "dashboard.view",
    "clients.view",
    "services.view",
    "tasks.view",
    "tasks.execute",
    "documents.view",
    "documents.manage",
  ],
  FINANCEIRO: [
    "dashboard.view",
    "clients.view",
    "contracts.view",
    "financeiro.view",
    "financeiro.manage",
    "reports.view",
  ],
};

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => userPermissions.includes(p));
}
