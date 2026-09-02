"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DELAY_REASON_LABELS } from "@/lib/labels";
import { formatDateTimeBR } from "@/lib/utils";
import { logDelay } from "@/app/(app)/tarefas/actions";

interface DelayLog {
  id: string;
  reason: string;
  detail: string | null;
  daysLate: number | null;
  reportedByName: string | null;
}

export function TaskDelayLog({ taskId, logs }: { taskId: string; logs: DelayLog[] }) {
  const [reason, setReason] = useState("CLIENTE_NAO_ENVIOU_DOCUMENTOS");
  const [detail, setDetail] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="rounded-md border px-3 py-2 text-xs">
            <p className="font-medium">{DELAY_REASON_LABELS[l.reason] ?? l.reason}</p>
            {l.detail && <p className="text-muted-foreground">{l.detail}</p>}
          </div>
        ))}
        {logs.length === 0 && <p className="text-xs text-muted-foreground">Nenhum motivo registrado ainda.</p>}
      </div>
      <div className="space-y-2">
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DELAY_REASON_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Detalhes (opcional)" />
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await logDelay(taskId, reason, detail, 0);
              setDetail("");
              toast.success("Motivo do atraso registrado");
            });
          }}
        >
          Registrar motivo
        </Button>
      </div>
    </div>
  );
}
