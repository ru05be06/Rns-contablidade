"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateContractContent } from "@/app/(app)/contratos/actions";

export function ContractEditor({
  contractId,
  content,
  canEdit,
}: {
  contractId: string;
  content: string;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(content);
  const [isPending, startTransition] = useTransition();
  const dirty = value !== content;

  if (!canEdit) {
    return <pre className="max-h-[600px] overflow-y-auto whitespace-pre-wrap text-sm">{content}</pre>;
  }

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={20}
        className="font-mono text-xs"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await updateContractContent(contractId, value);
                toast.success("Contrato atualizado");
              });
            }}
          >
            Salvar alterações
          </Button>
        </div>
      )}
    </div>
  );
}
