import { Periodicity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateTaskCode } from "@/lib/codes";

export function competenceLabel(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

/** Quantos meses uma periodicidade "pula" a cada nova competência. */
export const PERIODICITY_STEP_MONTHS: Partial<Record<Periodicity, number>> = {
  MENSAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

/**
 * Calcula as competências (datas) que devem ter tarefas geradas a partir de
 * agora — seção 15 do escopo (recorrência). Função pura, testável.
 */
export function computeCompetenceDates(periodicity: Periodicity, now: Date, monthsAhead = 3): Date[] {
  if (periodicity === Periodicity.UNICA) return [now];
  const step = PERIODICITY_STEP_MONTHS[periodicity];
  if (!step) return [now];
  const count = Math.ceil(monthsAhead / step) + 1;
  return Array.from({ length: count }, (_, i) => new Date(now.getFullYear(), now.getMonth() + i * step, 1));
}

/**
 * Gera as próximas tarefas recorrentes de um serviço vinculado a um cliente,
 * copiando o checklist do template do serviço (ou a personalização do cliente,
 * quando existir) — seções 9, 15 e 69 do escopo funcional.
 * Idempotente: nunca duplica uma tarefa já existente para a mesma competência.
 */
export async function generateTasksForClientService(clientServiceId: string, monthsAhead = 3) {
  const clientService = await prisma.clientService.findUnique({
    where: { id: clientServiceId },
    include: {
      client: true,
      serviceCatalogItem: { include: { checklistTemplate: { include: { items: true } } } },
    },
  });
  if (!clientService || !clientService.active) return [];

  const now = new Date();
  const createdTaskIds: string[] = [];
  const competenceDates = computeCompetenceDates(clientService.periodicity, now, monthsAhead);

  for (const competenceDate of competenceDates) {
    const competence =
      clientService.periodicity === Periodicity.UNICA ? null : competenceLabel(competenceDate);

    const existing = competence
      ? await prisma.task.findFirst({ where: { clientServiceId, competence, deletedAt: null } })
      : await prisma.task.findFirst({ where: { clientServiceId, deletedAt: null } });
    if (existing) continue;

    const internalDay = clientService.internalDeadlineDay ?? 15;
    const officialDay = clientService.dueDay ?? 20;
    const internalDueDate = new Date(competenceDate.getFullYear(), competenceDate.getMonth(), internalDay);
    const officialDueDate = new Date(competenceDate.getFullYear(), competenceDate.getMonth(), officialDay);

    const code = await generateTaskCode(clientService.organizationId);

    const task = await prisma.task.create({
      data: {
        organizationId: clientService.organizationId,
        code,
        title: `${clientService.serviceCatalogItem.name} — ${clientService.client.legalName}`,
        clientId: clientService.clientId,
        clientServiceId: clientService.id,
        departmentId: clientService.departmentId,
        assigneeId: clientService.responsibleId,
        priority: "NORMAL",
        status: "NAO_INICIADA",
        competence: competence ?? undefined,
        internalDueDate,
        officialDueDate,
      },
    });

    const templateItems = clientService.serviceCatalogItem.checklistTemplate?.items ?? [];
    const extraItems = Array.isArray(clientService.extraChecklistItems)
      ? (clientService.extraChecklistItems as { description: string; required?: boolean }[])
      : [];

    if (templateItems.length > 0 || extraItems.length > 0) {
      await prisma.taskChecklistItem.createMany({
        data: [
          ...templateItems.map((item) => ({
            taskId: task.id,
            order: item.order,
            description: item.description,
            required: item.required,
            requiresDocument: item.requiresDocument,
          })),
          ...extraItems.map((item, idx) => ({
            taskId: task.id,
            order: templateItems.length + idx + 1,
            description: item.description,
            required: item.required ?? true,
          })),
        ],
      });
    }

    createdTaskIds.push(task.id);
  }

  return createdTaskIds;
}
