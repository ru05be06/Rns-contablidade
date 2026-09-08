"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  saveAutomationRule,
  toggleAutomationRule,
  deleteAutomationRule,
  runAutomationsNow,
} from "@/app/(app)/automacao/actions";

const TRIGGERS: Record<string, string> = {
  TASK_OVERDUE: "Tarefa ficou atrasada → avisar responsável e gestor",
  TASK_DUE_SOON: "Tarefa próxima do prazo → gerar notificação",
  CONTRACT_SIGNED: "Contrato assinado → cliente vira ativo",
  RECEIVABLE_PAID: "Cobrança paga → marcar como recebida",
  CLIENT_SERVICE_CREATED: "Serviço vinculado ao cliente → gerar tarefas",
};

interface Rule {
  id: string;
  name: string;
  trigger: string;
  active: boolean;
  daysAhead?: number;
}

export function AutomationRulesManager({ rules }: { rules: Rule[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await runAutomationsNow();
              toast.success(
                `Verificação executada: ${result.overdueCount} tarefa(s) marcada(s) como atrasada(s), ${result.dueSoonCount} notificação(ões) de prazo próximo.`
              );
            });
          }}
        >
          <Play className="h-4 w-4" /> Executar verificação agora
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova regra
        </Button>
      </div>
      <div className="space-y-3">
        {rules.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{TRIGGERS[r.trigger] ?? r.trigger}</p>
                {r.trigger === "TASK_DUE_SOON" && (
                  <p className="text-xs text-muted-foreground">Antecedência: {r.daysAhead ?? 3} dia(s)</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={r.active}
                  onCheckedChange={(v) => {
                    startTransition(async () => {
                      await toggleAutomationRule(r.id, v);
                    });
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(r);
                    setOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    startTransition(async () => {
                      await deleteAutomationRule(r.id);
                      toast.success("Regra removida");
                    });
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <p className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground">
            Nenhuma regra configurada. Crie regras para notificar a equipe automaticamente.
          </p>
        )}
      </div>

      <RuleFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function RuleFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Rule | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [trigger, setTrigger] = useState(editing?.trigger ?? "TASK_OVERDUE");
  const [daysAhead, setDaysAhead] = useState(String(editing?.daysAhead ?? 3));
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(editing?.name ?? "");
          setTrigger(editing?.trigger ?? "TASK_OVERDUE");
          setDaysAhead(String(editing?.daysAhead ?? 3));
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar regra" : "Nova regra de automação"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome da regra</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Gatilho</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGERS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {trigger === "TASK_DUE_SOON" && (
            <div className="space-y-1.5">
              <Label>Dias de antecedência</Label>
              <Input type="number" min={1} value={daysAhead} onChange={(e) => setDaysAhead(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !name}
            onClick={() => {
              startTransition(async () => {
                try {
                  await saveAutomationRule({
                    id: editing?.id,
                    name,
                    trigger,
                    daysAhead: Number(daysAhead),
                    active: true,
                  });
                  toast.success("Regra salva");
                  onOpenChange(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao salvar");
                }
              });
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
