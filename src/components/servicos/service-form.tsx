"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIODICITY_LABELS } from "@/lib/labels";
import { saveServiceAndRedirect, type ServiceFormInput } from "@/app/(app)/servicos/actions";

export function ServiceForm({
  service,
  departments,
  checklistTemplates,
}: {
  service?: (ServiceFormInput & { id: string }) | null;
  departments: { id: string; name: string }[];
  checklistTemplates: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<ServiceFormInput>({
    id: service?.id,
    name: service?.name ?? "",
    category: service?.category ?? "",
    description: service?.description ?? "",
    departmentId: service?.departmentId ?? "",
    periodicity: service?.periodicity ?? "MENSAL",
    defaultValue: service?.defaultValue ?? undefined,
    slaDays: service?.slaDays ?? undefined,
    internalDeadlineDay: service?.internalDeadlineDay ?? undefined,
    defaultDeadlineDay: service?.defaultDeadlineDay ?? undefined,
    checklistTemplateId: service?.checklistTemplateId ?? "",
  });
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ServiceFormInput>(key: K, value: ServiceFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do serviço");
      return;
    }
    startTransition(async () => {
      try {
        await saveServiceAndRedirect(form);
      } catch (error) {
        const digest = (error as { digest?: string })?.digest;
        if (digest?.startsWith("NEXT_REDIRECT")) throw error;
        toast.error(error instanceof Error ? error.message : "Erro ao salvar serviço");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados do serviço</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
          <Label>Nome do serviço</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Departamento responsável</Label>
          <Select value={form.departmentId || undefined} onValueChange={(v) => set("departmentId", v)}>
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
          <Label>Periodicidade</Label>
          <Select value={form.periodicity} onValueChange={(v) => set("periodicity", v as ServiceFormInput["periodicity"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIODICITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valor padrão (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.defaultValue ?? ""}
            onChange={(e) => set("defaultValue", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>SLA (dias úteis)</Label>
          <Input
            type="number"
            value={form.slaDays ?? ""}
            onChange={(e) => set("slaDays", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Prazo interno padrão (dia)</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={form.internalDeadlineDay ?? ""}
            onChange={(e) => set("internalDeadlineDay", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Prazo oficial padrão (dia)</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={form.defaultDeadlineDay ?? ""}
            onChange={(e) => set("defaultDeadlineDay", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Checklist padrão</Label>
          <Select value={form.checklistTemplateId || undefined} onValueChange={(v) => set("checklistTemplateId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              {checklistTemplates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
          <Label>Descrição</Label>
          <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={3} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <Button disabled={isPending} onClick={submit}>
            {isPending ? "Salvando..." : "Salvar serviço"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
