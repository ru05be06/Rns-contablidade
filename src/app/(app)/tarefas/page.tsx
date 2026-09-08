import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TaskFilters } from "@/components/tarefas/task-filters";
import { TaskTable } from "@/components/tarefas/task-table";

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    departmentId?: string;
    assigneeId?: string;
    clientId?: string;
    priority?: string;
    competence?: string;
  }>;
}) {
  const session = await requirePermission("tasks.view");
  const params = await searchParams;
  const organizationId = session.user.organizationId;

  const where: Prisma.TaskWhereInput = { organizationId, deletedAt: null };
  if (params.status) where.status = params.status as TaskStatus;
  if (params.departmentId) where.departmentId = params.departmentId;
  if (params.assigneeId) where.assigneeId = params.assigneeId;
  if (params.clientId) where.clientId = params.clientId;
  if (params.priority) where.priority = params.priority as TaskPriority;
  if (params.competence) where.competence = params.competence;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { code: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [tasks, departments, users, clients] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        client: { select: { legalName: true, tradeName: true } },
        assignee: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: [{ officialDueDate: "asc" }],
      take: 300,
    }),
    prisma.department.findMany({ where: { organizationId, active: true }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { organizationId, active: true, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.client.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, legalName: true, tradeName: true },
      orderBy: { legalName: "asc" },
    }),
  ]);

  const canManage = session.user.permissions.includes("tasks.manage");

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description={`${tasks.length} tarefa(s) encontradas`}
        actions={
          <Button asChild size="sm">
            <Link href="/tarefas/nova">
              <Plus className="h-4 w-4" /> Nova tarefa
            </Link>
          </Button>
        }
      />
      <TaskFilters departments={departments} users={users} clients={clients} />
      <div className="mt-4">
        <TaskTable
          tasks={tasks.map((t) => ({
            id: t.id,
            code: t.code,
            title: t.title,
            clientName: t.client?.tradeName || t.client?.legalName || null,
            assigneeName: t.assignee?.name ?? null,
            departmentName: t.department?.name ?? null,
            priority: t.priority,
            status: t.status,
            competence: t.competence,
            officialDueDate: t.officialDueDate?.toISOString() ?? null,
          }))}
          users={users}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
