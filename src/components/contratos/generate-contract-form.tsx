"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fillContractTemplate } from "@/lib/contract-template";
import { generateContractAndRedirect } from "@/app/(app)/contratos/actions";

interface ClientOption {
  id: string;
  name: string;
  monthlyFee: number | null;
  feeDueDay: number | null;
  services: { name: string; value: number | null }[];
}

export function GenerateContractForm({
  clients,
  templates,
  defaultClientId,
}: {
  clients: ClientOption[];
  templates: { id: string; name: string; content: string }[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDay, setDueDay] = useState("10");
  const [isPending, startTransition] = useTransition();

  const client = clients.find((c) => c.id === clientId);
  const template = templates.find((t) => t.id === templateId);

  const effectiveValue = monthlyValue ? Number(monthlyValue) : client?.monthlyFee ?? 0;
  const servicesDescription = client?.services.map((s) => s.name).join(", ") || "Serviços contábeis";

  const preview = useMemo(() => {
    if (!template) return "";
    return fillContractTemplate(template.content, {
      legalName: client?.name ?? "",
      cnpj: null,
      address: null,
      city: null,
      state: null,
      responsibleName: null,
      responsibleCpf: null,
      monthlyValue: effectiveValue,
      startDate: startDate ? new Date(startDate) : null,
      dueDay: dueDay ? Number(dueDay) : null,
      servicesDescription,
    });
  }, [template, client, effectiveValue, startDate, dueDay, servicesDescription]);

  function submit() {
    if (!clientId || !templateId) {
      toast.error("Selecione o cliente e o modelo de contrato");
      return;
    }
    startTransition(async () => {
      try {
        await generateContractAndRedirect({
          clientId,
          templateId,
          type: "CONTRATO",
          services: client?.services.map((s) => ({ description: s.name, value: s.value })) ?? [],
          monthlyValue: effectiveValue,
          startDate,
          dueDay: dueDay ? Number(dueDay) : null,
        });
      } catch (error) {
        const digest = (error as { digest?: string })?.digest;
        if (digest?.startsWith("NEXT_REDIRECT")) throw error;
        toast.error(error instanceof Error ? error.message : "Erro ao gerar contrato");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dados do contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
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
            <Label>Modelo de contrato</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {client && client.services.length > 0 && (
            <div>
              <Label className="mb-1 block">Serviços contratados</Label>
              <p className="text-sm text-muted-foreground">{servicesDescription}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Valor mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={monthlyValue}
                placeholder={String(client?.monthlyFee ?? 0)}
                onChange={(e) => setMonthlyValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Início de vigência</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dia de vencimento</Label>
              <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={isPending} onClick={submit}>
              {isPending ? "Gerando..." : "Gerar contrato"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs thin-scrollbar">
            {preview || "Selecione um cliente e um modelo para visualizar."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
