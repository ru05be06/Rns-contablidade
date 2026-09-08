import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KanbanBoard } from "@/components/tarefas/kanban-board";
import { KANBAN_STATUSES } from "@/lib/labels";

export default async function KanbanPage() {
  const session = await requirePermission("tasks.view");
  const organizationId = session.user.organizationId;

  const tasks = await prisma.task.findMany({
    where: { organizationId, deletedAt: null, status: { in: [...KANBAN_STATUSES] } },
    include: {
      client: { select: { legalName: true, tradeName: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { officialDueDate: "asc" },
    take: 300,
  });

  const canManage = session.user.permissions.includes("tasks.execute");

  return (
    <div>
      <PageHeader title="Kanban" description="Arraste os cartões para atualizar o status das tarefas." />
      <KanbanBoard
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          code: t.code,
          status: t.status,
          clientName: t.client?.tradeName || t.client?.legalName || null,
          assigneeName: t.assignee?.name ?? null,
          officialDueDate: t.officialDueDate?.toISOString() ?? null,
        }))}
        canManage={canManage}
      />
    </div>
  );
}
