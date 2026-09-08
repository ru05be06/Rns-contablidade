import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { DeadlineBadge } from "@/components/deadline-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/labels";

export async function TasksTab({ clientId }: { clientId: string }) {
  const tasks = await prisma.task.findMany({
    where: { clientId, deletedAt: null },
    include: { assignee: { select: { name: true } } },
    orderBy: [{ officialDueDate: "asc" }],
    take: 100,
  });

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarefa</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prazo oficial</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link href={`/tarefas/${t.id}`} className="font-medium hover:underline">
                  {t.title}
                </Link>
                <p className="text-xs text-muted-foreground">#{t.code}</p>
              </TableCell>
              <TableCell className="text-sm">{t.competence ?? "—"}</TableCell>
              <TableCell className="text-sm">{t.assignee?.name ?? "—"}</TableCell>
              <TableCell>
                <DeadlineBadge date={t.officialDueDate} />
              </TableCell>
              <TableCell>
                <StatusBadge status={t.status} labels={TASK_STATUS_LABELS} colors={TASK_STATUS_COLORS} />
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma tarefa registrada para este cliente.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
