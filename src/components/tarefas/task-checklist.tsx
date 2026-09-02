"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toggleChecklistItem } from "@/app/(app)/tarefas/actions";

interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  requiresDocument: boolean;
  completed: boolean;
}

export function TaskChecklist({ items, canExecute }: { items: ChecklistItem[]; canExecute: boolean }) {
  const [state, setState] = useState(items);
  const [, startTransition] = useTransition();

  if (state.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta tarefa não possui checklist.</p>;
  }

  const doneCount = state.filter((i) => i.completed).length;
  const percent = Math.round((doneCount / state.length) * 100);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Progress value={percent} className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {doneCount}/{state.length}
        </span>
      </div>
      <ol className="space-y-2">
        {state.map((item, idx) => (
          <li key={item.id} className="flex items-start gap-2">
            <Checkbox
              checked={item.completed}
              disabled={!canExecute}
              onCheckedChange={(v) => {
                const completed = Boolean(v);
                setState((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed } : i)));
                startTransition(async () => {
                  await toggleChecklistItem(item.id, completed);
                });
              }}
            />
            <span className={cn("text-sm", item.completed && "text-muted-foreground line-through")}>
              {idx + 1}. {item.description}
            </span>
            {!item.required && (
              <Badge variant="outline" className="text-[10px]">
                opcional
              </Badge>
            )}
            {item.requiresDocument && (
              <Badge variant="outline" className="text-[10px]">
                exige documento
              </Badge>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
