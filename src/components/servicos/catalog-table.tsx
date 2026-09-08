"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERIODICITY_LABELS } from "@/lib/labels";
import { formatCurrencyBRL } from "@/lib/utils";
import { toggleServiceActive } from "@/app/(app)/servicos/actions";

interface ServiceRow {
  id: string;
  code: string;
  name: string;
  category: string | null;
  departmentName: string | null;
  periodicity: string;
  defaultValue: number | null;
  checklistTemplateName: string | null;
  slaDays: number | null;
  active: boolean;
  clientCount: number;
}

export function CatalogTable({ services, canManage }: { services: ServiceRow[]; canManage: boolean }) {
  return (
    <div className="mt-4 rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Periodicidade</TableHead>
            <TableHead>Checklist</TableHead>
            <TableHead>Valor padrão</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Clientes</TableHead>
            <TableHead>Ativo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">{s.code}</TableCell>
              <TableCell>
                {canManage ? (
                  <Link href={`/servicos/${s.id}/editar`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                ) : (
                  <span className="font-medium">{s.name}</span>
                )}
                {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
              </TableCell>
              <TableCell className="text-sm">{s.departmentName ?? "—"}</TableCell>
              <TableCell className="text-sm">
                {PERIODICITY_LABELS[s.periodicity] ?? s.periodicity}
              </TableCell>
              <TableCell className="text-sm">
                {s.checklistTemplateName ? (
                  <Badge variant="outline">{s.checklistTemplateName}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-sm">{s.defaultValue ? formatCurrencyBRL(s.defaultValue) : "—"}</TableCell>
              <TableCell className="text-sm">{s.slaDays ? `${s.slaDays}d úteis` : "—"}</TableCell>
              <TableCell className="text-sm">{s.clientCount}</TableCell>
              <TableCell>
                <ActiveToggle id={s.id} active={s.active} disabled={!canManage} />
              </TableCell>
            </TableRow>
          ))}
          {services.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                Nenhum serviço cadastrado no catálogo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ActiveToggle({ id, active, disabled }: { id: string; active: boolean; disabled: boolean }) {
  const [checked, setChecked] = useState(active);
  const [isPending, startTransition] = useTransition();
  return (
    <Switch
      checked={checked}
      disabled={disabled || isPending}
      onCheckedChange={(v) => {
        setChecked(v);
        startTransition(async () => {
          await toggleServiceActive(id, v);
          toast.success(v ? "Serviço ativado" : "Serviço desativado");
        });
      }}
    />
  );
}
