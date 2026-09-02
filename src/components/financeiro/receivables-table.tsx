"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RECEIVABLE_STATUS_LABELS, RECEIVABLE_STATUS_COLORS } from "@/lib/labels";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";
import { registerPayment } from "@/app/(app)/financeiro/actions";

interface ReceivableRow {
  id: string;
  clientName: string;
  description: string;
  competence: string | null;
  dueDate: string;
  amount: number;
  paid: number;
  status: string;
}

export function ReceivablesTable({ receivables, canManage }: { receivables: ReceivableRow[]; canManage: boolean }) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const paying = receivables.find((r) => r.id === payingId);

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Recebido</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {receivables.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.clientName}</TableCell>
              <TableCell className="text-sm">{r.description}</TableCell>
              <TableCell className="text-sm">{r.competence ?? "—"}</TableCell>
              <TableCell className="text-sm">{formatDateBR(r.dueDate)}</TableCell>
              <TableCell className="text-sm">{formatCurrencyBRL(r.amount)}</TableCell>
              <TableCell className="text-sm">{formatCurrencyBRL(r.paid)}</TableCell>
              <TableCell>
                <StatusBadge status={r.status} labels={RECEIVABLE_STATUS_LABELS} colors={RECEIVABLE_STATUS_COLORS} />
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  {r.status !== "PAGO" && r.status !== "CANCELADO" && (
                    <Button variant="ghost" size="sm" onClick={() => setPayingId(r.id)}>
                      Registrar pagamento
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
          {receivables.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                Nenhum lançamento financeiro.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaymentDialog
        receivable={paying ?? null}
        onOpenChange={(v) => !v && setPayingId(null)}
      />
    </div>
  );
}

function PaymentDialog({
  receivable,
  onOpenChange,
}: {
  receivable: ReceivableRow | null;
  onOpenChange: (v: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("pix");
  const [isPending, startTransition] = useTransition();

  const remaining = receivable ? receivable.amount - receivable.paid : 0;

  return (
    <Dialog
      open={!!receivable}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v && receivable) setAmount(String(remaining));
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento — {receivable?.clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Saldo em aberto: {formatCurrencyBRL(remaining)}
          </p>
          <div className="space-y-1.5">
            <Label>Valor recebido (R$)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="pix, boleto, transferência..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !amount || Number(amount) <= 0}
            onClick={() => {
              if (!receivable) return;
              startTransition(async () => {
                await registerPayment({ receivableId: receivable.id, amount: Number(amount), method });
                toast.success("Pagamento registrado");
                onOpenChange(false);
              });
            }}
          >
            Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
