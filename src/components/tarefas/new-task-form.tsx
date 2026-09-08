"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_PRIORITY_LABELS } from "@/lib/labels";
import { createTaskAndRedirect } from "@/app/(app)/tarefas/actions";
import type { TaskPriority } from "@prisma/client";

export function NewTaskForm({
  clients,
  departments,
  users,
  defaultClientId,
}: {
  clients: { id: string; legalName: string; tradeName: string | null }[];
  departments: { id: string; name: string }[];
  users: { id: string; name: string }[];
  defaultClientId?: string;
}) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [departmentId, setDepartmentId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [competence, setCompetence] = useState("");
  const [internalDueDate, setInternalDueDate] = useState("");
  const [officialDueDate, setOfficialDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<string[]>([""]);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }
    startTransition(async () => {
      try {
        await createTaskAndRedirect({
          title,
          clientId: clientId || null,
          departmentId: departmentId || null,
          assigneeId: assigneeId || null,
          priority,
          competence,
          internalDueDate,
          officialDueDate,
          notes,
          checklist: checklist.filter((c) => c.trim()),
        });
      } catch (error) {
        const digest = (error as { digest?: string })?.digest;
        if (digest?.startsWith("NEXT_REDIRECT")) throw error;
        toast.error(error instanceof Error ? error.message : "Erro ao criar tarefa");
      }
    });
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
          <Label>Título da tarefa</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select value={clientId || undefined} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.tradeName || c.legalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Departamento</Label>
          <Select value={departmentId || undefined} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Responsável</Label>
          <Select value={assigneeId || undefined} onValueChange={setAssigneeId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Competência (MM/AAAA)</Label>
          <Input value={competence} onChange={(e) => setCompetence(e.target.value)} placeholder="09/2026" />
        </div>
        <div className="space-y-1.5">
          <Label>Prazo interno</Label>
          <Input type="date" value={internalDueDate} onChange={(e) => setInternalDueDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Prazo oficial</Label>
          <Input type="date" value={officialDueDate} onChange={(e) => setOfficialDueDate(e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
          <Label>Observações</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label className="mb-2 block">Checklist (opcional)</Label>
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) =>
                    setChecklist((prev) => prev.map((c, i) => (i === idx ? e.target.value : c)))
                  }
                  placeholder={`Item ${idx + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setChecklist((prev) => [...prev, ""])}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <Button disabled={isPending} onClick={submit}>
            {isPending ? "Criando..." : "Criar tarefa"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
