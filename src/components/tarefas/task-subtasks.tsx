"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/labels";
import { addSubtask } from "@/app/(app)/tarefas/actions";

export function TaskSubtasks({
  parentTaskId,
  subtasks,
  canManage,
}: {
  parentTaskId: string;
  subtasks: { id: string; title: string; status: string }[];
  canManage: boolean;
}) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {subtasks.map((s) => (
        <Link
          key={s.id}
          href={`/tarefas/${s.id}`}
          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
        >
          <span>{s.title}</span>
          <StatusBadge status={s.status} labels={TASK_STATUS_LABELS} colors={TASK_STATUS_COLORS} />
        </Link>
      ))}
      {subtasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma subtarefa.</p>}
      {canManage && (
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nova subtarefa..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                startTransition(async () => {
                  await addSubtask(parentTaskId, title.trim());
                  setTitle("");
                  toast.success("Subtarefa adicionada");
                });
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || !title.trim()}
            onClick={() => {
              startTransition(async () => {
                await addSubtask(parentTaskId, title.trim());
                setTitle("");
                toast.success("Subtarefa adicionada");
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
