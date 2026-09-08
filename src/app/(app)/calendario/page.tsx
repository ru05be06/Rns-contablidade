import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { deadlineUrgency, cn } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const URGENCY_DOT: Record<string, string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  laranja: "bg-orange-500",
  vermelho: "bg-destructive",
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requirePermission("tasks.view");
  const params = await searchParams;
  const organizationId = session.user.organizationId;

  const now = new Date();
  const [year, month] = (params.month ?? `${now.getFullYear()}-${now.getMonth() + 1}`)
    .split("-")
    .map(Number);

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const where: Prisma.TaskWhereInput = {
    organizationId,
    deletedAt: null,
    officialDueDate: { gte: gridStart, lte: gridEnd },
  };

  const tasks = await prisma.task.findMany({
    where,
    include: { client: { select: { legalName: true, tradeName: true } } },
    orderBy: { officialDueDate: "asc" },
  });

  const receivables = await prisma.receivable.findMany({
    where: { organizationId, dueDate: { gte: gridStart, lte: gridEnd }, status: { not: "CANCELADO" } },
    include: { client: { select: { legalName: true, tradeName: true } } },
  });

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  function keyFor(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  const tasksByDay = new Map<string, typeof tasks>();
  for (const t of tasks) {
    if (!t.officialDueDate) continue;
    const key = keyFor(t.officialDueDate);
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), t]);
  }
  const receivablesByDay = new Map<string, typeof receivables>();
  for (const r of receivables) {
    const key = keyFor(r.dueDate);
    receivablesByDay.set(key, [...(receivablesByDay.get(key) ?? []), r]);
  }

  const prevMonth = new Date(year, month - 2, 1);
  const nextMonth = new Date(year, month, 1);
  const monthLabel = monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div>
      <PageHeader
        title="Calendário de obrigações"
        description="Tarefas, obrigações e cobranças por data de vencimento."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/calendario?month=${prevMonth.getFullYear()}-${prevMonth.getMonth() + 1}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span className="w-36 text-center text-sm font-medium capitalize">{monthLabel}</span>
            <Button variant="outline" size="icon" asChild>
              <Link href={`/calendario?month=${nextMonth.getFullYear()}-${nextMonth.getMonth() + 1}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-muted/50 px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground">
            {w}
          </div>
        ))}
        {days.map((day) => {
          const key = keyFor(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const dayReceivables = receivablesByDay.get(key) ?? [];
          const inMonth = day.getMonth() === month - 1;
          const isToday = key === keyFor(new Date());

          return (
            <div
              key={key}
              className={cn(
                "min-h-28 bg-background p-1.5 align-top",
                !inMonth && "bg-muted/20 text-muted-foreground"
              )}
            >
              <p className={cn("mb-1 text-xs font-medium", isToday && "text-primary")}>
                {day.getDate()}
                {isToday && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">hoje</span>}
              </p>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tarefas/${t.id}`}
                    className="flex items-center gap-1 truncate rounded bg-muted/50 px-1 py-0.5 text-[11px] hover:bg-muted"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", URGENCY_DOT[deadlineUrgency(t.officialDueDate)])} />
                    <span className="truncate">{t.title}</span>
                  </Link>
                ))}
                {dayReceivables.slice(0, 2).map((r) => (
                  <div
                    key={r.id}
                    className="truncate rounded bg-blue-50 px-1 py-0.5 text-[11px] text-blue-700"
                  >
                    R$ {Number(r.amount).toFixed(0)} — {r.client.tradeName || r.client.legalName}
                  </div>
                ))}
                {dayTasks.length + dayReceivables.length > 5 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{dayTasks.length + dayReceivables.length - 5} mais
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
