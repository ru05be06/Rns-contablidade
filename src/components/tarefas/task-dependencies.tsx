"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/labels";
import { setDependency } from "@/app/(app)/tarefas/actions";

export function TaskDependencies({
  taskId,
  dependencies,
  availableTasks,
  canManage,
}: {
  taskId: string;
  dependencies: { id: string; title: string; status: string }[];
  availableTasks: { id: string; title: string; code: string }[];
  canManage: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {dependencies.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>{d.title}</span>
          <StatusBadge status={d.status} labels={TASK_STATUS_LABELS} colors={TASK_STATUS_COLORS} />
        </div>
      ))}
      {dependencies.length === 0 && (
        <p className="text-sm text-muted-foreground">Esta tarefa não depende de outra.</p>
      )}
      {canManage && (
        <div className="flex items-center gap-2 pt-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Depende de..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            disabled={isPending || !selected}
            onClick={() => {
              startTransition(async () => {
                try {
                  await setDependency(taskId, selected);
                  toast.success("Dependência adicionada");
                  setSelected("");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao adicionar dependência");
                }
              });
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
