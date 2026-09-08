import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

async function notifyOnce(params: {
  organizationId: string;
  userId: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const existing = await prisma.notification.findFirst({
    where: {
      organizationId: params.organizationId,
      userId: params.userId,
      title: params.title,
      link: params.link,
      createdAt: { gte: startOfDay(new Date()) },
    },
  });
  if (existing) return;
  await prisma.notification.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}

/**
 * Motor de regras — seções 47/48 do escopo. Executa as automações configuradas
 * (respeitando o campo `active` de cada AutomationRule) para os gatilhos
 * TASK_OVERDUE e TASK_DUE_SOON. Idempotente: pode ser chamado a cada
 * carregamento do dashboard sem duplicar notificações no mesmo dia.
 */
export async function runTaskDeadlineAutomations(organizationId: string) {
  const now = new Date();

  const [overdueRule, dueSoonRule] = await Promise.all([
    prisma.automationRule.findFirst({ where: { organizationId, trigger: "TASK_OVERDUE", active: true } }),
    prisma.automationRule.findFirst({ where: { organizationId, trigger: "TASK_DUE_SOON", active: true } }),
  ]);

  let overdueCount = 0;
  if (overdueRule) {
    const newlyOverdue = await prisma.task.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: ["CONCLUIDA", "CANCELADA", "ATRASADA"] },
        officialDueDate: { lt: startOfDay(now) },
      },
      include: { assignee: true, creator: true, client: { select: { legalName: true, tradeName: true } } },
    });

    for (const task of newlyOverdue) {
      await prisma.task.update({ where: { id: task.id }, data: { status: "ATRASADA" } });
      overdueCount++;
      const recipients = [task.assigneeId, task.creatorId].filter(Boolean) as string[];
      for (const userId of Array.from(new Set(recipients))) {
        await notifyOnce({
          organizationId,
          userId,
          title: `Tarefa atrasada: ${task.title}`,
          body: task.client ? `Cliente: ${task.client.tradeName || task.client.legalName}` : undefined,
          link: `/tarefas/${task.id}`,
        });
      }
    }
  }

  let dueSoonCount = 0;
  if (dueSoonRule) {
    const daysAhead = Number((dueSoonRule.conditions as { daysAhead?: number } | null)?.daysAhead ?? 3);
    const target = new Date(now);
    target.setDate(target.getDate() + daysAhead);

    const dueSoonTasks = await prisma.task.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: ["CONCLUIDA", "CANCELADA"] },
        officialDueDate: { gte: startOfDay(now), lte: endOfDay(target) },
        assigneeId: { not: null },
      },
      include: { assignee: true },
    });

    for (const task of dueSoonTasks) {
      if (!task.assigneeId) continue;
      dueSoonCount++;
      await notifyOnce({
        organizationId,
        userId: task.assigneeId,
        title: `Prazo se aproximando: ${task.title}`,
        body: task.officialDueDate ? `Vence em ${task.officialDueDate.toLocaleDateString("pt-BR")}` : undefined,
        link: `/tarefas/${task.id}`,
      });
    }
  }

  return { overdueCount, dueSoonCount };
}
