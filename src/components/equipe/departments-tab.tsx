"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { saveDepartment, toggleDepartmentActive } from "@/app/(app)/equipe/actions";

interface DepartmentRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  active: boolean;
  userCount: number;
}

export function DepartmentsTab({
  departments,
  canManage,
}: {
  departments: DepartmentRow[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);

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
            <Plus className="h-4 w-4" /> Novo departamento
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: d.color ?? "#6366f1" }}
                  />
                  <p className="font-medium">{d.name}</p>
                </div>
                {canManage && (
                  <DepartmentActiveToggle id={d.id} active={d.active} />
                )}
              </div>
              {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{d.userCount} colaborador(es)</p>
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 -ml-2"
                  onClick={() => {
                    setEditing(d);
                    setOpen(true);
                  }}
                >
                  Editar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <DepartmentFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function DepartmentActiveToggle({ id, active }: { id: string; active: boolean }) {
  const [checked, setChecked] = useState(active);
  const [isPending, startTransition] = useTransition();
  return (
    <Switch
      checked={checked}
      disabled={isPending}
      onCheckedChange={(value) => {
        setChecked(value);
        startTransition(async () => {
          await toggleDepartmentActive(id, value);
        });
      }}
    />
  );
}

function DepartmentFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: DepartmentRow | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [color, setColor] = useState(editing?.color ?? "#6366f1");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(editing?.name ?? "");
          setDescription(editing?.description ?? "");
          setColor(editing?.color ?? "#6366f1");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar departamento" : "Novo departamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <Input type="color" value={color ?? "#6366f1"} onChange={(e) => setColor(e.target.value)} className="h-9 w-16 p-1" />
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
                  await saveDepartment({ id: editing?.id, name, description, color });
                  toast.success("Departamento salvo");
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
