"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { saveChecklistTemplate, deleteChecklistTemplate } from "@/app/(app)/servicos/actions";

interface ChecklistItem {
  id?: string;
  description: string;
  required: boolean;
  requiresDocument: boolean;
}

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  usageCount: number;
  items: ChecklistItem[];
}

export function ChecklistLibrary({
  templates,
  canManage,
}: {
  templates: TemplateRow[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);

  return (
    <div>
      <div className="mt-4 mb-3 flex justify-end">
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo modelo de checklist
          </Button>
        )}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{t.name}</p>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.items.length} item(ns) · usado em {t.usageCount} serviço(s)
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(t);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <DeleteTemplateButton id={t.id} />
                  </div>
                )}
              </div>
              <ol className="mt-3 space-y-1">
                {t.items.slice(0, 6).map((item, idx) => (
                  <li key={item.id ?? idx} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                    <span className="flex-1">{item.description}</span>
                    {!item.required && <Badge variant="outline" className="text-[10px]">opcional</Badge>}
                  </li>
                ))}
                {t.items.length > 6 && (
                  <li className="text-xs text-muted-foreground">+{t.items.length - 6} item(ns)...</li>
                )}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <TemplateFormDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function DeleteTemplateButton({ id }: { id: string }) {
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
          <AlertDialogTitle>Excluir modelo de checklist?</AlertDialogTitle>
          <AlertDialogDescription>
            Só é possível excluir modelos que não estejam vinculados a nenhum serviço do catálogo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteChecklistTemplate(id);
                  toast.success("Modelo excluído");
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

function TemplateFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: TemplateRow | null;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [items, setItems] = useState<ChecklistItem[]>(
    editing?.items ?? [{ description: "", required: true, requiresDocument: false }]
  );
  const [isPending, startTransition] = useTransition();

  function updateItem(index: number, patch: Partial<ChecklistItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setName(editing?.name ?? "");
          setDescription(editing?.description ?? "");
          setItems(editing?.items ?? [{ description: "", required: true, requiresDocument: false }]);
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar modelo de checklist" : "Novo modelo de checklist"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome do modelo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: PGDAS-D" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Itens do checklist</Label>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto thin-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-md border p-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    placeholder={`Item ${idx + 1}`}
                    className="flex-1"
                  />
                  <label className="flex shrink-0 items-center gap-1 text-xs">
                    <Checkbox
                      checked={item.required}
                      onCheckedChange={(v) => updateItem(idx, { required: Boolean(v) })}
                    />
                    obrigatório
                  </label>
                  <label className="flex shrink-0 items-center gap-1 text-xs">
                    <Checkbox
                      checked={item.requiresDocument}
                      onCheckedChange={(v) => updateItem(idx, { requiresDocument: Boolean(v) })}
                    />
                    exige doc.
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                setItems((prev) => [...prev, { description: "", required: true, requiresDocument: false }])
              }
            >
              <Plus className="h-4 w-4" /> Adicionar item
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={isPending || !name || items.filter((i) => i.description.trim()).length === 0}
            onClick={() => {
              startTransition(async () => {
                try {
                  await saveChecklistTemplate({
                    id: editing?.id,
                    name,
                    description,
                    items: items.filter((i) => i.description.trim()),
                  });
                  toast.success("Modelo salvo");
                  onOpenChange(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Erro ao salvar");
                }
              });
            }}
          >
            Salvar modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
