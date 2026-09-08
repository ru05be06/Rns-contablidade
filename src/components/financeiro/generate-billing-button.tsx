"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMonthlyBilling } from "@/app/(app)/financeiro/actions";

export function GenerateBillingButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const count = await generateMonthlyBilling();
          toast.success(count > 0 ? `${count} mensalidade(s) gerada(s)` : "Mensalidades do mês já geradas");
        });
      }}
    >
      <Zap className="h-4 w-4" /> Gerar mensalidades do mês
    </Button>
  );
}
