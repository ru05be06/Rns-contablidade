"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { TaskStatus } from "@prisma/client";
import { DeadlineBadge } from "@/components/deadline-badge";
import { KANBAN_STATUSES, TASK_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { moveTaskKanban } from "@/app/(app)/tarefas/actions";

interface KanbanTask {
  id: string;
  title: string;
  code: string;
  status: string;
  clientName: string | null;
  assigneeName: string | null;
  officialDueDate: string | null;
}

export function KanbanBoard({ tasks, canManage }: { tasks: KanbanTask[]; canManage: boolean }) {
  const [items, setItems] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !canManage) return;
    const newStatus = String(over.id) as TaskStatus;
    const taskId = String(active.id);
    const current = items.find((t) => t.id === taskId);
    if (!current || current.status === newStatus) return;

    setItems((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    moveTaskKanban(taskId, newStatus).catch(() => {
      toast.error("Erro ao mover tarefa");
      setItems((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: current.status } : t)));
    });
  }

  const activeTask = items.find((t) => t.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 thin-scrollbar">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={items.filter((t) => t.status === status)}
          />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} dragging />}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ status, tasks }: { status: string; tasks: KanbanTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-2",
        isOver && "ring-2 ring-primary"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</p>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} />
    </div>
  );
}

function TaskCard({ task, dragging }: { task: KanbanTask; dragging?: boolean }) {
  return (
    <Link
      href={`/tarefas/${task.id}`}
      onClick={(e) => dragging && e.preventDefault()}
      className={cn(
        "block cursor-grab rounded-md border bg-background p-2.5 text-sm shadow-sm hover:border-primary/40",
        dragging && "shadow-lg"
      )}
    >
      <p className="font-medium leading-snug">{task.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{task.clientName ?? "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{task.assigneeName ?? "Sem responsável"}</span>
        <DeadlineBadge date={task.officialDueDate} />
      </div>
    </Link>
  );
}
