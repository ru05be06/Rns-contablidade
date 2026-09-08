"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateBR } from "@/lib/utils";
import { savePartner, deletePartner } from "@/app/(app)/clientes/actions";

interface Partner {
  id: string;
  clientId: string;
  name: string;
  cpf: string | null;
  equityShare: number | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  entryDate: Date | null;
  exitDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function PartnersTab({
  clientId,
  partners,
  canManage,
}: {
  clientId: string;
  partners: Partner[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo sócio
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {partners.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.cpf}</p>
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await deletePartner(p.id, clientId);
                      toast.success("Sócio removido");
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>Cargo: {p.role || "—"}</span>
                <span>Participação: {p.equityShare ? `${p.equityShare}%` : "—"}</span>
                <span>Entrada: {formatDateBR(p.entryDate)}</span>
                <span>Saída: {formatDateBR(p.exitDate)}</span>
              </div>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 -ml-2"
                  onClick={() => {
                    setEditing(p);
                    setOpen(true);
                  }}
                >
                  Editar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {partners.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum sócio cadastrado.</p>
        )}
      </div>

      <PartnerFormDialog clientId={clientId} open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function toInput(value: Date | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function PartnerFormDialog({
  clientId,
  open,
  onOpenChange,
  editing,
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Partner | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [cpf, setCpf] = useState(editing?.cpf ?? "");
  const [role, setRole] = useState(editing?.role ?? "");
  const [equityShare, setEquityShare] = useState(editing?.equityShare?.toString() ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [entryDate, setEntryDate] = useState(toInput(editing?.entryDate));
  const [exitDate, setExitDate] = useState(toInput(editing?.exitDate));
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(editing?.name ?? "");
          setCpf(editing?.cpf ?? "");
          setRole(editing?.role ?? "");
          setEquityShare(editing?.equityShare?.toString() ?? "");
          setPhone(editing?.phone ?? "");
          setEmail(editing?.email ?? "");
          setEntryDate(toInput(editing?.entryDate));
          setExitDate(toInput(editing?.exitDate));
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar sócio" : "Novo sócio"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Participação societária (%)</Label>
            <Input type="number" value={equityShare} onChange={(e) => setEquityShare(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de entrada</Label>
            <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de saída</Label>
            <Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !name}
            onClick={() => {
              startTransition(async () => {
                try {
                  await savePartner({
                    id: editing?.id,
                    clientId,
                    name,
                    cpf,
                    role,
                    equityShare: equityShare ? Number(equityShare) : null,
                    phone,
                    email,
                    entryDate: entryDate || undefined,
                    exitDate: exitDate || undefined,
                  });
                  toast.success("Sócio salvo");
                  onOpenChange(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao salvar");
                }
              });
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
