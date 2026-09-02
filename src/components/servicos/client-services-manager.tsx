"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Zap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIODICITY_LABELS } from "@/lib/labels";
import { formatCurrencyBRL } from "@/lib/utils";
import {
  linkServiceToClient,
  removeClientService,
  generateTasksNow,
} from "@/app/(app)/servicos/actions";
import type { Periodicity } from "@prisma/client";

interface ClientServiceRow {
  id: string;
  serviceName: string;
  departmentName: string | null;
  periodicity: string;
  value: number | null;
  dueDay: number | null;
  internalDeadlineDay: number | null;
  billingType: string | null;
}

interface CatalogItem {
  id: string;
  name: string;
  periodicity: Periodicity;
  defaultValue: number | null;
  departmentId: string | null;
  internalDeadlineDay: number | null;
  defaultDeadlineDay: number | null;
}

export function ClientServicesManager({
  clientId,
  clientServices,
  catalogItems,
  users,
  departments,
}: {
  clientId: string;
  clientServices: ClientServiceRow[];
  catalogItems: CatalogItem[];
  users: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Vincular serviço
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {clientServices.map((cs) => (
          <Card key={cs.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{cs.serviceName}</p>
                  <p className="text-xs text-muted-foreground">{cs.departmentName ?? "Sem departamento"}</p>
                </div>
                <RemoveButton clientServiceId={cs.id} clientId={clientId} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>Periodicidade: {PERIODICITY_LABELS[cs.periodicity] ?? cs.periodicity}</span>
                <span>Valor: {cs.value ? formatCurrencyBRL(cs.value) : "—"}</span>
                <span>Prazo interno: dia {cs.internalDeadlineDay ?? "—"}</span>
                <span>Prazo oficial: dia {cs.dueDay ?? "—"}</span>
              </div>
              <GenerateTasksButton clientServiceId={cs.id} clientId={clientId} />
            </CardContent>
          </Card>
        ))}
        {clientServices.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum serviço vinculado a este cliente ainda.</p>
        )}
      </div>

      <LinkServiceDialog
        open={open}
        onOpenChange={setOpen}
        clientId={clientId}
        catalogItems={catalogItems}
        users={users}
        departments={departments}
      />
    </div>
  );
}

function RemoveButton({ clientServiceId, clientId }: { clientServiceId: string; clientId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await removeClientService(clientServiceId, clientId);
          toast.success("Serviço removido do cliente");
        });
      }}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

function GenerateTasksButton({ clientServiceId, clientId }: { clientServiceId: string; clientId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mt-2 -ml-2"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const count = await generateTasksNow(clientServiceId, clientId);
          toast.success(count > 0 ? `${count} tarefa(s) gerada(s)` : "Nenhuma tarefa nova (já geradas)");
        });
      }}
    >
      <Zap className="h-4 w-4" /> Gerar tarefas
    </Button>
  );
}

function LinkServiceDialog({
  open,
  onOpenChange,
  clientId,
  catalogItems,
  users,
  departments,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string;
  catalogItems: CatalogItem[];
  users: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const [serviceId, setServiceId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [periodicity, setPeriodicity] = useState<Periodicity>("MENSAL");
  const [value, setValue] = useState<string>("");
  const [dueDay, setDueDay] = useState<string>("20");
  const [internalDeadlineDay, setInternalDeadlineDay] = useState<string>("15");
  const [billingType, setBillingType] = useState("Mensalidade");
  const [isPending, startTransition] = useTransition();

  function selectService(id: string) {
    setServiceId(id);
    const item = catalogItems.find((c) => c.id === id);
    if (item) {
      setPeriodicity(item.periodicity);
      setValue(item.defaultValue ? String(item.defaultValue) : "");
      setDepartmentId(item.departmentId ?? "");
      setInternalDeadlineDay(item.internalDeadlineDay ? String(item.internalDeadlineDay) : "15");
      setDueDay(item.defaultDeadlineDay ? String(item.defaultDeadlineDay) : "20");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setServiceId("");
          setDepartmentId("");
          setResponsibleId("");
          setPeriodicity("MENSAL");
          setValue("");
          setDueDay("20");
          setInternalDeadlineDay("15");
          setBillingType("Mensalidade");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular serviço ao cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select value={serviceId} onValueChange={selectService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço do catálogo" />
              </SelectTrigger>
              <SelectContent>
                {catalogItems.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Select value={responsibleId || undefined} onValueChange={setResponsibleId}>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Periodicidade</Label>
              <Select value={periodicity} onValueChange={(v) => setPeriodicity(v as Periodicity)}>
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
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prazo interno (dia)</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={internalDeadlineDay}
                onChange={(e) => setInternalDeadlineDay(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo oficial (dia)</Label>
              <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Forma de cobrança</Label>
            <Input value={billingType} onChange={(e) => setBillingType(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !serviceId}
            onClick={() => {
              startTransition(async () => {
                try {
                  await linkServiceToClient({
                    clientId,
                    serviceCatalogItemId: serviceId,
                    departmentId: departmentId || null,
                    responsibleId: responsibleId || null,
                    periodicity,
                    value: value ? Number(value) : null,
                    dueDay: dueDay ? Number(dueDay) : null,
                    internalDeadlineDay: internalDeadlineDay ? Number(internalDeadlineDay) : null,
                    billingType,
                  });
                  toast.success("Serviço vinculado e tarefas geradas automaticamente");
                  onOpenChange(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao vincular serviço");
                }
              });
            }}
          >
            Vincular serviço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
