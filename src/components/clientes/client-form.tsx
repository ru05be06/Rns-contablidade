"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLIENT_STATUS_LABELS, TAX_REGIME_LABELS } from "@/lib/labels";
import { saveClientAndRedirect, type ClientFormInput } from "@/app/(app)/clientes/actions";

interface ClientFormProps {
  client?: (ClientFormInput & { id: string }) | null;
  users: { id: string; name: string }[];
}

function dateToInput(value?: string | Date | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function ClientForm({ client, users }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormInput>({
    id: client?.id,
    legalName: client?.legalName ?? "",
    tradeName: client?.tradeName ?? "",
    cnpj: client?.cnpj ?? "",
    cpf: client?.cpf ?? "",
    stateRegistration: client?.stateRegistration ?? "",
    municipalRegistration: client?.municipalRegistration ?? "",
    mainCnae: client?.mainCnae ?? "",
    taxRegime: client?.taxRegime ?? "SIMPLES_NACIONAL",
    status: client?.status ?? "LEAD",
    foundationDate: dateToInput(client?.foundationDate),
    onboardingDate: dateToInput(client?.onboardingDate),
    responsibleUserId: client?.responsibleUserId ?? "",
    phone: client?.phone ?? "",
    whatsapp: client?.whatsapp ?? "",
    email: client?.email ?? "",
    zipCode: client?.zipCode ?? "",
    address: client?.address ?? "",
    addressNumber: client?.addressNumber ?? "",
    addressComplement: client?.addressComplement ?? "",
    neighborhood: client?.neighborhood ?? "",
    city: client?.city ?? "",
    state: client?.state ?? "",
    notes: client?.notes ?? "",
    monthlyFee: client?.monthlyFee ?? undefined,
    feeDueDay: client?.feeDueDay ?? undefined,
  });
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof ClientFormInput>(key: K, value: ClientFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!form.legalName.trim()) {
      toast.error("Informe a razão social");
      return;
    }
    startTransition(async () => {
      try {
        await saveClientAndRedirect(form);
      } catch (error) {
        const digest = (error as { digest?: string })?.digest;
        if (digest?.startsWith("NEXT_REDIRECT")) throw error;
        toast.error(error instanceof Error ? error.message : "Erro ao salvar cliente");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Razão social" required>
            <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} />
          </Field>
          <Field label="Nome fantasia">
            <Input value={form.tradeName} onChange={(e) => set("tradeName", e.target.value)} />
          </Field>
          <Field label="CNPJ">
            <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="CPF">
            <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} />
          </Field>
          <Field label="Inscrição Estadual">
            <Input value={form.stateRegistration} onChange={(e) => set("stateRegistration", e.target.value)} />
          </Field>
          <Field label="Inscrição Municipal">
            <Input value={form.municipalRegistration} onChange={(e) => set("municipalRegistration", e.target.value)} />
          </Field>
          <Field label="CNAE principal">
            <Input value={form.mainCnae} onChange={(e) => set("mainCnae", e.target.value)} />
          </Field>
          <Field label="Regime tributário" required>
            <Select value={form.taxRegime} onValueChange={(v) => set("taxRegime", v as ClientFormInput["taxRegime"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_REGIME_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status do cliente" required>
            <Select value={form.status} onValueChange={(v) => set("status", v as ClientFormInput["status"])}>
              <SelectTrigger>
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
          </Field>
          <Field label="Data de abertura">
            <Input type="date" value={form.foundationDate ?? ""} onChange={(e) => set("foundationDate", e.target.value)} />
          </Field>
          <Field label="Entrada no escritório">
            <Input type="date" value={form.onboardingDate ?? ""} onChange={(e) => set("onboardingDate", e.target.value)} />
          </Field>
          <Field label="Responsável interno">
            <Select value={form.responsibleUserId || undefined} onValueChange={(v) => set("responsibleUserId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Telefone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CEP">
            <Input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} />
          </Field>
          <Field label="Endereço" className="lg:col-span-2">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="Número">
            <Input value={form.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} />
          </Field>
          <Field label="Complemento">
            <Input value={form.addressComplement} onChange={(e) => set("addressComplement", e.target.value)} />
          </Field>
          <Field label="Bairro">
            <Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </Field>
          <Field label="Cidade">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Estado (UF)">
            <Input value={form.state} maxLength={2} onChange={(e) => set("state", e.target.value.toUpperCase())} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro e observações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Mensalidade (R$)">
            <Input
              type="number"
              step="0.01"
              value={form.monthlyFee ?? ""}
              onChange={(e) => set("monthlyFee", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Dia de vencimento">
            <Input
              type="number"
              min={1}
              max={31}
              value={form.feeDueDay ?? ""}
              onChange={(e) => set("feeDueDay", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Observações" className="lg:col-span-3">
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button disabled={isPending} onClick={submit}>
          {isPending ? "Salvando..." : "Salvar cliente"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
