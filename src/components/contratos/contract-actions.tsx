"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ContractStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { sendContractForSignature, changeContractStatus } from "@/app/(app)/contratos/actions";

const NEXT_ACTIONS: Partial<Record<ContractStatus, { label: string; status: ContractStatus }[]>> = {
  GERADO: [{ label: "Marcar como visualizado", status: "VISUALIZADO" }],
  ENVIADO: [{ label: "Marcar como visualizado", status: "VISUALIZADO" }],
  VISUALIZADO: [
    { label: "Marcar como assinado", status: "ASSINADO" },
    { label: "Marcar como recusado", status: "RECUSADO" },
  ],
};

export function ContractActions({ contractId, status }: { contractId: string; status: ContractStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {(status === "RASCUNHO" || status === "GERADO") && (
        <Button
          size="sm"
          className="w-full"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const message = await sendContractForSignature(contractId);
              toast.info(message);
            });
          }}
        >
          Enviar para assinatura
        </Button>
      )}
      {(NEXT_ACTIONS[status] ?? []).map((action) => (
        <Button
          key={action.status}
          size="sm"
          variant="outline"
          className="w-full"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await changeContractStatus(contractId, action.status);
              toast.success("Status do contrato atualizado");
            });
          }}
        >
          {action.label}
        </Button>
      ))}
      {status !== "CANCELADO" && status !== "ASSINADO" && (
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-destructive"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await changeContractStatus(contractId, "CANCELADO");
              toast.success("Contrato cancelado");
            });
          }}
        >
          Cancelar contrato
        </Button>
      )}
    </div>
  );
}
