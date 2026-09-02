"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createReceivableAndRedirect } from "@/app/(app)/financeiro/actions";

export function NewReceivableForm({
  clients,
  defaultClientId,
}: {
  clients: { id: string; name: string; monthlyFee: number | null }[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [description, setDescription] = useState("Mensalidade");
  const [competence, setCompetence] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function selectClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c?.monthlyFee) setAmount(String(c.monthlyFee));
  }

  function submit() {
    if (!clientId || !dueDate || !amount) {
      toast.error("Preencha cliente, vencimento e valor");
      return;
    }
    startTransition(async () => {
      try {
        await createReceivableAndRedirect({
          clientId,
          description,
          competence,
          dueDate,
          amount: Number(amount),
          recurring: description.toLowerCase().includes("mensalidade"),
        });
      } catch (error) {
        const digest = (error as { digest?: string })?.digest;
        if (digest?.startsWith("NEXT_REDIRECT")) throw error;
        toast.error(error instanceof Error ? error.message : "Erro ao criar cobrança");
      }
    });
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Cliente</Label>
          <Select value={clientId} onValueChange={selectClient}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Alteração contratual" />
        </div>
        <div className="space-y-1.5">
          <Label>Competência</Label>
          <Input value={competence} onChange={(e) => setCompetence(e.target.value)} placeholder="09/2026" />
        </div>
        <div className="space-y-1.5">
          <Label>Vencimento</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button disabled={isPending} onClick={submit}>
            {isPending ? "Salvando..." : "Registrar cobrança"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
