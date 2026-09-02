import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
  hasAnyPermission,
  hasPermission,
} from "@/lib/permissions";

describe("RBAC — permissões (seção 4 do escopo)", () => {
  it("hasPermission verifica presença exata da chave", () => {
    expect(hasPermission(["clients.view", "tasks.view"], "clients.view")).toBe(true);
    expect(hasPermission(["clients.view"], "clients.manage")).toBe(false);
  });

  it("hasAnyPermission verifica qualquer uma das chaves exigidas", () => {
    expect(hasAnyPermission(["tasks.view"], ["tasks.view", "tasks.manage"])).toBe(true);
    expect(hasAnyPermission(["tasks.execute"], ["tasks.view", "tasks.manage"])).toBe(false);
  });

  it("o perfil ADMIN possui todas as permissões do sistema", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.ADMIN).toEqual(ALL_PERMISSION_KEYS);
  });

  it("o perfil COLABORADOR não possui permissões de gestão financeira", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.COLABORADOR).not.toContain("financeiro.manage");
    expect(DEFAULT_ROLE_PERMISSIONS.COLABORADOR).toContain("tasks.execute");
  });

  it("o perfil FINANCEIRO possui gestão financeira mas não gestão de tarefas", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.FINANCEIRO).toContain("financeiro.manage");
    expect(DEFAULT_ROLE_PERMISSIONS.FINANCEIRO).not.toContain("tasks.manage");
  });
});
