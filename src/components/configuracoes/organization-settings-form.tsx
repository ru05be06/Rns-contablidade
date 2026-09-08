"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { saveOrganizationSettings } from "@/app/(app)/configuracoes/actions";

export function OrganizationSettingsForm({
  organization,
}: {
  organization: { name: string; primaryColor: string; timezone: string; currency: string };
}) {
  const [name, setName] = useState(organization.name);
  const [primaryColor, setPrimaryColor] = useState(organization.primaryColor);
  const [timezone, setTimezone] = useState(organization.timezone);
  const [currency, setCurrency] = useState(organization.currency);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nome do escritório</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Cor principal</Label>
          <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-16 p-1" />
        </div>
        <div className="space-y-1.5">
          <Label>Fuso horário</Label>
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Moeda</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await saveOrganizationSettings({ name, primaryColor, timezone, currency });
                toast.success("Configurações salvas");
              });
            }}
          >
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
