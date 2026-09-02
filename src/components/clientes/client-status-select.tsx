"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ClientStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLIENT_STATUS_LABELS } from "@/lib/labels";
import { changeClientStatus } from "@/app/(app)/clientes/actions";

export function ClientStatusSelect({ clientId, status }: { clientId: string; status: ClientStatus }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={isPending}
      onValueChange={(v) => {
        setValue(v as ClientStatus);
        startTransition(async () => {
          try {
            await changeClientStatus(clientId, v as ClientStatus);
            toast.success("Status do cliente atualizado");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao atualizar status");
          }
        });
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CLIENT_STATUS_LABELS).map(([k, v]) => (
          <SelectItem key={k} value={k}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
