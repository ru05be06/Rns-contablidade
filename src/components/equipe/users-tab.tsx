"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { saveUser, toggleUserActive } from "@/app/(app)/equipe/actions";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  roleId: string;
  roleName: string;
  departmentIds: string[];
  departmentNames: string[];
}

export function UsersTab({
  users,
  roles,
  departments,
  canManage,
}: {
  users: UserRow[];
  roles: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

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
            <Plus className="h-4 w-4" /> Novo usuário
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Departamentos</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{u.roleName}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.departmentNames.join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <UserActiveToggle userId={u.id} active={u.active} disabled={!canManage} />
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(u);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        roles={roles}
        departments={departments}
      />
    </div>
  );
}

function UserActiveToggle({
  userId,
  active,
  disabled,
}: {
  userId: string;
  active: boolean;
  disabled: boolean;
}) {
  const [checked, setChecked] = useState(active);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={disabled || isPending}
        onCheckedChange={(value) => {
          setChecked(value);
          startTransition(async () => {
            await toggleUserActive(userId, value);
            toast.success(value ? "Usuário ativado" : "Usuário desativado");
          });
        }}
      />
      <span className="text-xs text-muted-foreground">{checked ? "Ativo" : "Inativo"}</span>
    </div>
  );
}

function UserFormDialog({
  open,
  onOpenChange,
  editing,
  roles,
  departments,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: UserRow | null;
  roles: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(editing?.roleId ?? roles[0]?.id ?? "");
  const [departmentIds, setDepartmentIds] = useState<string[]>(editing?.departmentIds ?? []);
  const [isPending, startTransition] = useTransition();

  function resetForEditing(u: UserRow | null) {
    setName(u?.name ?? "");
    setEmail(u?.email ?? "");
    setPhone(u?.phone ?? "");
    setPassword("");
    setRoleId(u?.roleId ?? roles[0]?.id ?? "");
    setDepartmentIds(u?.departmentIds ?? []);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) resetForEditing(editing);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{editing ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil de acesso</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Departamentos</Label>
            <div className="grid grid-cols-2 gap-1.5 rounded-md border p-2">
              {departments.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={departmentIds.includes(d.id)}
                    onCheckedChange={(v) =>
                      setDepartmentIds((prev) =>
                        v ? [...prev, d.id] : prev.filter((id) => id !== d.id)
                      )
                    }
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !name || !email || !roleId}
            onClick={() => {
              startTransition(async () => {
                try {
                  await saveUser({
                    id: editing?.id,
                    name,
                    email,
                    phone,
                    roleId,
                    departmentIds,
                    password: password || undefined,
                  });
                  toast.success("Usuário salvo com sucesso");
                  onOpenChange(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao salvar usuário");
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
