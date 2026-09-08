import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { DeadlineBadge } from "@/components/deadline-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from "@/lib/labels";
import { formatDateBR } from "@/lib/utils";
import { TaskStatusSelect } from "@/components/tarefas/task-status-select";
import { TaskChecklist } from "@/components/tarefas/task-checklist";
import { TaskSubtasks } from "@/components/tarefas/task-subtasks";
import { TaskComments } from "@/components/tarefas/task-comments";
import { TaskAttachments } from "@/components/tarefas/task-attachments";
import { TaskDelayLog } from "@/components/tarefas/task-delay-log";
import { TaskDependencies } from "@/components/tarefas/task-dependencies";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("tasks.view");
  const organizationId = session.user.organizationId;

  const task = await prisma.task.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      client: { select: { id: true, legalName: true, tradeName: true } },
      department: { select: { name: true } },
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
      checklistItems: { orderBy: { order: "asc" } },
      subtasks: { orderBy: { createdAt: "asc" } },
      comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      attachments: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      delayLogs: { include: { reportedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      dependsOn: { include: { prerequisiteTask: { select: { id: true, title: true, status: true } } } },
    },
  });
  if (!task) notFound();

  const allTasks = await prisma.task.findMany({
    where: { organizationId, deletedAt: null, id: { not: task.id } },
    select: { id: true, title: true, code: true },
    take: 200,
  });

  const canExecute = session.user.permissions.includes("tasks.execute");
  const canManage = session.user.permissions.includes("tasks.manage");

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs text-muted-foreground">#{task.code}</p>
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {task.client && (
              <Link href={`/clientes/${task.client.id}`} className="hover:underline">
                {task.client.tradeName || task.client.legalName}
              </Link>
            )}
            {task.department && <span>· {task.department.name}</span>}
            {task.competence && <span>· Competência {task.competence}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.priority} labels={TASK_PRIORITY_LABELS} colors={TASK_PRIORITY_COLORS} />
          {canExecute && <TaskStatusSelect taskId={task.id} status={task.status} canOverride={canManage} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskChecklist
                items={task.checklistItems.map((i) => ({
                  id: i.id,
                  description: i.description,
                  required: i.required,
                  requiresDocument: i.requiresDocument,
                  completed: i.completed,
                }))}
                canExecute={canExecute}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subtarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskSubtasks
                parentTaskId={task.id}
                subtasks={task.subtasks.map((s) => ({ id: s.id, title: s.title, status: s.status }))}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentários</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskComments
                taskId={task.id}
                comments={task.comments.map((c) => ({
                  id: c.id,
                  authorName: c.author.name,
                  body: c.body,
                  createdAt: c.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Responsável" value={task.assignee?.name} />
              <Row label="Criado por" value={task.creator?.name} />
              <Row label="Prazo interno" value={formatDateBR(task.internalDueDate)} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Prazo oficial</span>
                <DeadlineBadge date={task.officialDueDate} />
              </div>
              <Row label="Etapa de produção" value={task.productionStage} />
              {task.notes && (
                <div className="pt-2">
                  <p className="text-muted-foreground">Observações</p>
                  <p className="whitespace-pre-line">{task.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependências</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskDependencies
                taskId={task.id}
                dependencies={task.dependsOn.map((d) => ({
                  id: d.id,
                  title: d.prerequisiteTask.title,
                  status: d.prerequisiteTask.status,
                }))}
                availableTasks={allTasks}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskAttachments
                taskId={task.id}
                attachments={task.attachments.map((a) => ({
                  id: a.id,
                  fileName: a.fileName,
                  fileUrl: a.fileUrl,
                  uploadedByName: a.uploadedBy?.name ?? null,
                }))}
              />
            </CardContent>
          </Card>

          {task.status === "ATRASADA" && (
            <Card>
              <CardHeader>
                <CardTitle>Motivo do atraso</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskDelayLog
                  taskId={task.id}
                  logs={task.delayLogs.map((l) => ({
                    id: l.id,
                    reason: l.reason,
                    detail: l.detail,
                    daysLate: l.daysLate,
                    reportedByName: l.reportedBy?.name ?? null,
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
