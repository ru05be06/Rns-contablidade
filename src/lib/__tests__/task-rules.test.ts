import { describe, expect, it } from "vitest";
import { canCompleteTask } from "@/lib/task-rules";

describe("canCompleteTask (seção 10 — checklist obrigatório)", () => {
  it("permite concluir quando todos os itens obrigatórios estão completos", () => {
    const result = canCompleteTask([
      { required: true, completed: true },
      { required: false, completed: false },
    ]);
    expect(result.allowed).toBe(true);
  });

  it("bloqueia conclusão quando há item obrigatório pendente", () => {
    const result = canCompleteTask([{ required: true, completed: false }]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/gestor/i);
  });

  it("permite conclusão forçada apenas quando o usuário pode sobrepor (gestor)", () => {
    const items = [{ required: true, completed: false }];
    expect(canCompleteTask(items, { force: true, canOverride: false }).allowed).toBe(false);
    expect(canCompleteTask(items, { force: true, canOverride: true }).allowed).toBe(true);
  });

  it("uma tarefa sem checklist pode sempre ser concluída", () => {
    expect(canCompleteTask([]).allowed).toBe(true);
  });
});
