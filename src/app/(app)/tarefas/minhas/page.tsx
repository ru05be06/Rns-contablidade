import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/deadline-badge";
import { StatusBadge } from "@/components/status-badge";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from "@/lib/labels";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export default async function MinhasTarefasPage() {
  const session = await requirePermission("tasks.view");
  const userId = session.user.id;
  const organizationId = session.user.organizationId;
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const baseWhere = { organizationId, assigneeId: userId, deletedAt: null };

  const [today, overdue, thisWeek, upcoming, done] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...baseWhere,
        status: { notIn: ["CONCLUIDA", "CANCELADA"] },
        officialDueDate: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      include: { client: { select: { legalName: true, tradeName: true } } },
      orderBy: { priority: "desc" },
    }),
    prisma.task.findMany({
      where: { ...baseWhere, status: { notIn: ["CONCLUIDA", "CANCELADA"] }, officialDueDate: { lt: startOfDay(now) } },
      include: { client: { select: { legalName: true, tradeName: true } } },
      orderBy: { officialDueDate: "asc" },
    }),
    prisma.task.findMany({
      where: {
        ...baseWhere,
        status: { notIn: ["CONCLUIDA", "CANCELADA"] },
        officialDueDate: { gt: endOfDay(now), lte: weekEnd },
      },
      include: { client: { select: { legalName: true, tradeName: true } } },
      orderBy: { officialDueDate: "asc" },
    }),
    prisma.task.findMany({
      where: { ...baseWhere, status: { notIn: ["CONCLUIDA", "CANCELADA"] }, officialDueDate: { gt: weekEnd } },
      include: { client: { select: { legalName: true, tradeName: true } } },
      orderBy: { officialDueDate: "asc" },
      take: 20,
    }),
    prisma.task.findMany({
      where: { ...baseWhere, status: "CONCLUIDA" },
      include: { client: { select: { legalName: true, tradeName: true } } },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Minhas tarefas" description="Suas tarefas atribuídas, organizadas por prazo." />
      <div className="grid gap-6 lg:grid-cols-2">
        <TaskGroup title="Atrasadas" tasks={overdue} tone="destructive" />
        <TaskGroup title="Hoje" tasks={today} tone="warning" />
        <TaskGroup title="Esta semana" tasks={thisWeek} />
        <TaskGroup title="Próximas" tasks={upcoming} />
        <TaskGroup title="Concluídas recentemente" tasks={done} muted />
      </div>
    </div>
  );
}

interface TaskWithClient {
  id: string;
  title: string;
  code: string;
  priority: string;
  officialDueDate: Date | null;
  client: { legalName: string; tradeName: string | null } | null;
}

function TaskGroup({
  title,
  tasks,
  tone,
  muted,
}: {
  title: string;
  tasks: TaskWithClient[];
  tone?: "destructive" | "warning";
  muted?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span
          className={
            tone === "destructive"
              ? "rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive"
              : tone === "warning"
              ? "rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning"
              : "text-xs text-muted-foreground"
          }
        >
          {tasks.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {tasks.map((t) => (
          <Link
            key={t.id}
            href={`/tarefas/${t.id}`}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 ${muted ? "opacity-70" : ""}`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{t.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t.client?.tradeName || t.client?.legalName || "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={t.priority} labels={TASK_PRIORITY_LABELS} colors={TASK_PRIORITY_COLORS} />
              {!muted && <DeadlineBadge date={t.officialDueDate} />}
            </div>
          </Link>
        ))}
        {tasks.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nada por aqui.</p>}
      </CardContent>
    </Card>
  );
}
