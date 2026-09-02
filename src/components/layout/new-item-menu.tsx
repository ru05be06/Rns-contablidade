"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { label: "Cliente", href: "/clientes/novo" },
  { label: "Tarefa", href: "/tarefas/nova" },
  { label: "Serviço", href: "/servicos/novo" },
  { label: "Contrato", href: "/contratos/novo" },
  { label: "Cobrança", href: "/financeiro/nova" },
  { label: "Documento", href: "/documentos" },
];

export function NewItemMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.href} asChild>
            <Link href={opt.href}>{opt.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
