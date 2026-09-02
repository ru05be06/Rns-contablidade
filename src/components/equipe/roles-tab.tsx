"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PERMISSION_MODULES } from "@/lib/permissions";
import { saveRole, deleteRole } from "@/app/(app)/equipe/actions";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

export function RolesTab({ roles, canManage }: { roles: RoleRow[]; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);

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
            <Plus className="h-4 w-4" /> Novo perfil
          </Button>
        )}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.name}</p>
                    {r.isSystem && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" /> Padrão
                      </Badge>
                    )}
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.userCount} usuário(s) · {r.permissions.length} permissões
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    {!r.isSystem && <DeleteRoleButton id={r.id} />}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoleFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function DeleteRoleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Só é possível excluir perfis sem usuários vinculados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteRole(id);
                  toast.success("Perfil excluído");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao excluir");
                }
              });
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RoleFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: RoleRow | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(editing?.permissions ?? []);
  const [isPending, startTransition] = useTransition();

  function togglePermission(key: string, checked: boolean) {
    setPermissions((prev) => (checked ? [...prev, key] : prev.filter((p) => p !== key)));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(editing?.name ?? "");
          setDescription(editing?.description ?? "");
          setPermissions(editing?.permissions ?? []);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar perfil" : "Novo perfil de acesso"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome do perfil</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Módulos e permissões</Label>
            <div className="mt-2 max-h-80 space-y-3 overflow-y-auto rounded-md border p-3 thin-scrollbar">
              {PERMISSION_MODULES.map((mod) => (
                <div key={mod.key}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{mod.label}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {mod.permissions.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={permissions.includes(p.key)}
                          onCheckedChange={(v) => togglePermission(p.key, Boolean(v))}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                  await saveRole({ id: editing?.id, name, description, permissions });
                  toast.success("Perfil salvo");
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
