import type { TaskChecklistItem } from "@prisma/client";

/**
 * Regra de conclusão de tarefas — seção 10 do escopo: não permitir concluir
 * a tarefa caso itens obrigatórios do checklist não estejam concluídos,
 * salvo autorização de gestor (force = true).
 */
export function canCompleteTask(
  checklistItems: Pick<TaskChecklistItem, "required" | "completed">[],
  options: { force?: boolean; canOverride?: boolean } = {}
): { allowed: boolean; reason?: string } {
  const pendingRequired = checklistItems.some((i) => i.required && !i.completed);
  if (!pendingRequired) return { allowed: true };
  if (options.force && options.canOverride) return { allowed: true };
  return {
    allowed: false,
    reason:
      "Existem itens obrigatórios do checklist não concluídos. Apenas um gestor pode concluir mesmo assim.",
  };
}
