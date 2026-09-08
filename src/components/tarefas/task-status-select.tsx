"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { TaskStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { changeTaskStatus } from "@/app/(app)/tarefas/actions";

export function TaskStatusSelect({
  taskId,
  status,
  canOverride,
}: {
  taskId: string;
  status: TaskStatus;
  canOverride: boolean;
}) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<TaskStatus | null>(null);

  function apply(newStatus: TaskStatus, force = false) {
    startTransition(async () => {
      try {
        await changeTaskStatus(taskId, newStatus, force);
        setValue(newStatus);
        toast.success("Status atualizado");
      } catch (error) {
        if (error instanceof Error && error.message.includes("Apenas um gestor") && canOverride) {
          setPendingValue(newStatus);
          setConfirmOpen(true);
          return;
        }
        toast.error(error instanceof Error ? error.message : "Erro ao atualizar status");
      }
    });
  }

  return (
    <>
      <Select value={value} disabled={isPending} onValueChange={(v) => apply(v as TaskStatus)}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir mesmo com itens pendentes?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem itens obrigatórios do checklist não concluídos. Como gestor, você pode autorizar a
              conclusão mesmo assim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingValue) apply(pendingValue, true);
              }}
            >
              Concluir mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
