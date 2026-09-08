"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { DeadlineBadge } from "@/components/deadline-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from "@/lib/labels";
import { updateTaskAssignments, bulkComplete } from "@/app/(app)/tarefas/actions";

interface TaskRow {
  id: string;
  code: string;
  title: string;
  clientName: string | null;
  assigneeName: string | null;
  departmentName: string | null;
  priority: string;
  status: string;
  competence: string | null;
  officialDueDate: string | null;
}

export function TaskTable({
  tasks,
  users,
  canManage,
}: {
  tasks: TaskRow[];
  users: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(tasks.map((t) => t.id)) : new Set());
  }

  return (
    <div>
      {canManage && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selecionada(s)</span>
          <Select
            onValueChange={(v) => {
              startTransition(async () => {
                await updateTaskAssignments({ taskIds: Array.from(selected), assigneeId: v });
                toast.success("Responsável atualizado em lote");
              });
            }}
          >
            <SelectTrigger className="h-8 w-48">
              <SelectValue placeholder="Alterar responsável" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await bulkComplete(Array.from(selected));
                setSelected(new Set());
                toast.success("Tarefas concluídas em lote");
              });
            }}
          >
            Concluir selecionadas
          </Button>
        </div>
      )}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && (
                <TableHead className="w-8">
                  <Checkbox
                    checked={selected.size === tasks.length && tasks.length > 0}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                  />
                </TableHead>
              )}
              <TableHead>Tarefa</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                {canManage && (
                  <TableCell>
                    <Checkbox checked={selected.has(t.id)} onCheckedChange={(v) => toggle(t.id, Boolean(v))} />
                  </TableCell>
                )}
                <TableCell>
                  <Link href={`/tarefas/${t.id}`} className="font-medium hover:underline">
                    {t.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">#{t.code}</p>
                </TableCell>
                <TableCell className="text-sm">{t.clientName ?? "—"}</TableCell>
                <TableCell className="text-sm">{t.departmentName ?? "—"}</TableCell>
                <TableCell className="text-sm">{t.assigneeName ?? "—"}</TableCell>
                <TableCell className="text-sm">{t.competence ?? "—"}</TableCell>
                <TableCell>
                  <DeadlineBadge date={t.officialDueDate} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.priority} labels={TASK_PRIORITY_LABELS} colors={TASK_PRIORITY_COLORS} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} labels={TASK_STATUS_LABELS} colors={TASK_STATUS_COLORS} />
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
