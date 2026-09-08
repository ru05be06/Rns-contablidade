"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Phone, MessageCircle, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatDateBR, formatDateTimeBR, daysUntil } from "@/lib/utils";
import { addCollectionLog } from "@/app/(app)/financeiro/actions";

interface CollectionLog {
  id: string;
  note: string;
  channel: string | null;
  createdAt: string;
}

interface InadimplenteItem {
  id: string;
  clientName: string;
  cnpj: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  amount: number;
  dueDate: string;
  logs: CollectionLog[];
}

export function InadimplenciaList({ items, canManage }: { items: InadimplenteItem[]; canManage: boolean }) {
  if (items.length === 0) {
    return <p className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground">Nenhum cliente inadimplente no momento. 🎉</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <InadimplenteCard key={item.id} item={item} canManage={canManage} />
      ))}
    </div>
  );
}

function InadimplenteCard({ item, canManage }: { item: InadimplenteItem; canManage: boolean }) {
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState(item.logs);
  const [isPending, startTransition] = useTransition();
  const daysLate = Math.abs(daysUntil(item.dueDate) ?? 0);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div>
            <p className="font-medium">{item.clientName}</p>
            <p className="text-xs text-muted-foreground">{item.cnpj ?? "sem CNPJ"}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
              {item.whatsapp && <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{item.whatsapp}</span>}
              {item.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-destructive">{formatCurrencyBRL(item.amount)}</p>
            <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">
              {daysLate} dia(s) em atraso · venceu em {formatDateBR(item.dueDate)}
            </Badge>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mt-3 space-y-1 border-t pt-3">
            {logs.map((l) => (
              <p key={l.id} className="text-xs text-muted-foreground">
                <span className="font-medium">{formatDateTimeBR(l.createdAt)}</span> — {l.note}
                {l.channel && ` (${l.channel})`}
              </p>
            ))}
          </div>
        )}

        {canManage && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registrar contato de cobrança..."
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={isPending || !note.trim()}
              onClick={() => {
                startTransition(async () => {
                  await addCollectionLog(item.id, note.trim(), "manual");
                  setLogs((prev) => [
                    { id: `temp-${Date.now()}`, note: note.trim(), channel: "manual", createdAt: new Date().toISOString() },
                    ...prev,
                  ]);
                  setNote("");
                  toast.success("Contato registrado");
                });
              }}
            >
              Registrar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
