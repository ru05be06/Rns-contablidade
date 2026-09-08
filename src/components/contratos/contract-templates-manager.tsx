"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CONTRACT_VARIABLES } from "@/lib/contract-template";
import { saveContractTemplate } from "@/app/(app)/contratos/actions";

interface Template {
  id: string;
  name: string;
  content: string;
  active: boolean;
}

export function ContractTemplatesManager({ templates }: { templates: Template[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo modelo
        </Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <p className="font-medium">{t.name}</p>
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
              </div>
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{t.content}</p>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado.</p>}
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
        }}
      >
        <TemplateForm editing={editing} onSaved={() => setOpen(false)} />
      </Dialog>
    </div>
  );
}

function TemplateForm({ editing, onSaved }: { editing: Template | null; onSaved: () => void }) {
  const [name, setName] = useState(editing?.name ?? "");
  const [content, setContent] = useState(
    editing?.content ??
      `CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS

CONTRATANTE: {{razao_social}}, CNPJ {{cnpj}}, com sede em {{endereco}}, {{cidade}}, representada por {{nome_responsavel}}, CPF {{cpf_responsavel}}.

Objeto: {{servicos_contratados}}.

Valor mensal: R$ {{valor_mensalidade}}, com vencimento todo dia {{dia_vencimento}}.

Início de vigência: {{data_inicio}}.`
  );
  const [isPending, startTransition] = useTransition();

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar modelo" : "Novo modelo de contrato"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Nome do modelo</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Conteúdo</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} className="font-mono text-xs" />
        </div>
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">Variáveis disponíveis</Label>
          <div className="flex flex-wrap gap-1">
            {CONTRACT_VARIABLES.map((v) => (
              <Badge key={v} variant="outline" className="cursor-pointer font-mono text-[10px]" onClick={() => setContent((c) => c + " " + v)}>
                {v}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={isPending || !name || !content}
          onClick={() => {
            startTransition(async () => {
              try {
                await saveContractTemplate({ id: editing?.id, name, content });
                toast.success("Modelo salvo");
                onSaved();
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
  );
}
