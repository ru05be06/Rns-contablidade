"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { generateTaskCode } from "@/lib/codes";

const taskSchema = z.object({
  title: z.string().min(2),
  clientId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority),
  competence: z.string().optional(),
  internalDueDate: z.string().optional(),
  officialDueDate: z.string().optional(),
  notes: z.string().optional(),
  checklist: z.array(z.string()).optional(),
});

export async function createTask(input: z.infer<typeof taskSchema>) {
  const session = await requirePermission("tasks.manage");
  const data = taskSchema.parse(input);
  const organizationId = session.user.organizationId;
  const code = await generateTaskCode(organizationId);

  const task = await prisma.task.create({
    data: {
      organizationId,
      code,
      title: data.title,
      clientId: data.clientId || null,
      departmentId: data.departmentId || null,
      assigneeId: data.assigneeId || null,
      creatorId: session.user.id,
      priority: data.priority,
      status: "NAO_INICIADA",
      competence: data.competence || null,
      internalDueDate: data.internalDueDate ? new Date(data.internalDueDate) : null,
      officialDueDate: data.officialDueDate ? new Date(data.officialDueDate) : null,
      notes: data.notes || null,
      checklistItems: {
        create: (data.checklist ?? [])
          .filter((d) => d.trim())
          .map((description, idx) => ({ order: idx + 1, description, required: true })),
      },
    },
  });

  await logAudit({
    organizationId,
    userId: session.user.id,
    clientId: data.clientId || null,
    entityType: "Task",
    entityId: task.id,
    action: "CREATE",
  });

  revalidatePath("/tarefas");
  return task.id;
}

export async function createTaskAndRedirect(input: z.infer<typeof taskSchema>) {
  const id = await createTask(input);
  redirect(`/tarefas/${id}`);
}

const REQUIRES_MANAGER_OVERRIDE_MESSAGE =
  "Existem itens obrigatórios do checklist não concluídos. Apenas um gestor pode concluir mesmo assim.";

export async function changeTaskStatus(taskId: string, status: TaskStatus, force = false) {
  const session = await requirePermission("tasks.execute");
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { checklistItems: true },
  });
  if (!task) throw new Error("Tarefa não encontrada");

  if (status === "CONCLUIDA" && !force) {
    const pendingRequired = task.checklistItems.some((i) => i.required && !i.completed);
    const canOverride = session.user.permissions.includes("tasks.manage");
    if (pendingRequired && !canOverride) {
      throw new Error(REQUIRES_MANAGER_OVERRIDE_MESSAGE);
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "CONCLUIDA" ? new Date() : null,
      cancelledAt: status === "CANCELADA" ? new Date() : null,
    },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId: task.clientId,
    entityType: "Task",
    entityId: taskId,
    action: "STATUS_CHANGE",
    field: "status",
    oldValue: task.status,
    newValue: status,
  });

  revalidatePath("/tarefas");
  revalidatePath(`/tarefas/${taskId}`);
  revalidatePath("/tarefas/kanban");
}

export async function toggleChecklistItem(itemId: string, completed: boolean) {
  const session = await requirePermission("tasks.execute");
  const item = await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? session.user.id : null,
    },
  });
  revalidatePath(`/tarefas/${item.taskId}`);
}

export async function addSubtask(parentTaskId: string, title: string) {
  const session = await requirePermission("tasks.manage");
  const parent = await prisma.task.findUnique({ where: { id: parentTaskId } });
  if (!parent) throw new Error("Tarefa não encontrada");
  const code = await generateTaskCode(session.user.organizationId);

  await prisma.task.create({
    data: {
      organizationId: session.user.organizationId,
      code,
      title,
      parentTaskId,
      clientId: parent.clientId,
      departmentId: parent.departmentId,
      assigneeId: parent.assigneeId,
      creatorId: session.user.id,
      priority: parent.priority,
      status: "NAO_INICIADA",
    },
  });
  revalidatePath(`/tarefas/${parentTaskId}`);
}

export async function addComment(taskId: string, body: string) {
  const session = await requirePermission("tasks.execute");
  const mentions = Array.from(body.matchAll(/@(\w+)/g)).map((m) => m[1]);
  await prisma.taskComment.create({
    data: { taskId, authorId: session.user.id, body, mentions },
  });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function uploadTaskAttachment(formData: FormData) {
  const session = await requirePermission("tasks.execute");
  const taskId = String(formData.get("taskId") || "");
  const file = formData.get("file") as File | null;
  if (!taskId || !file || file.size === 0) throw new Error("Selecione um arquivo válido");
  if (file.size > 20 * 1024 * 1024) throw new Error("Arquivo maior que 20MB");

  const dir = path.join(process.cwd(), "public", "uploads", session.user.organizationId, "tarefas", taskId);
  await mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  const fileUrl = `/uploads/${session.user.organizationId}/tarefas/${taskId}/${storedName}`;
  await prisma.taskAttachment.create({
    data: { taskId, fileName: file.name, fileUrl, fileSize: file.size, mimeType: file.type, uploadedById: session.user.id },
  });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function setDependency(dependentTaskId: string, prerequisiteTaskId: string) {
  await requirePermission("tasks.manage");
  if (dependentTaskId === prerequisiteTaskId) throw new Error("Uma tarefa não pode depender de si mesma");
  await prisma.taskDependency.create({ data: { dependentTaskId, prerequisiteTaskId } });
  revalidatePath(`/tarefas/${dependentTaskId}`);
}

export async function removeDependency(id: string, taskId: string) {
  await requirePermission("tasks.manage");
  await prisma.taskDependency.delete({ where: { id } });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function logDelay(taskId: string, reason: string, detail: string, daysLate: number) {
  const session = await requirePermission("tasks.execute");
  await prisma.taskDelayLog.create({
    data: {
      taskId,
      reason: reason as never,
      detail,
      daysLate,
      reportedById: session.user.id,
    },
  });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function updateTaskAssignments(input: {
  taskIds: string[];
  assigneeId?: string;
  departmentId?: string;
  priority?: TaskPriority;
  officialDueDate?: string;
}) {
  const session = await requirePermission("tasks.manage");
  const data: Record<string, unknown> = {};
  if (input.assigneeId) data.assigneeId = input.assigneeId;
  if (input.departmentId) data.departmentId = input.departmentId;
  if (input.priority) data.priority = input.priority;
  if (input.officialDueDate) data.officialDueDate = new Date(input.officialDueDate);

  if (Object.keys(data).length === 0) return;

  await prisma.task.updateMany({
    where: { id: { in: input.taskIds }, organizationId: session.user.organizationId },
    data,
  });

  revalidatePath("/tarefas");
  revalidatePath("/tarefas/kanban");
}

export async function bulkComplete(taskIds: string[]) {
  const session = await requirePermission("tasks.manage");
  await prisma.task.updateMany({
    where: { id: { in: taskIds }, organizationId: session.user.organizationId },
    data: { status: "CONCLUIDA", completedAt: new Date() },
  });
  revalidatePath("/tarefas");
  revalidatePath("/tarefas/kanban");
}

export async function moveTaskKanban(taskId: string, status: TaskStatus) {
  await changeTaskStatus(taskId, status, true);
}
