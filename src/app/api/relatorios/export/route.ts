import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { CLIENT_STATUS_LABELS, TASK_STATUS_LABELS, CONTRACT_STATUS_LABELS, RECEIVABLE_STATUS_LABELS, TAX_REGIME_LABELS } from "@/lib/labels";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const organizationId = session.user.organizationId;

  let csv = "";
  const filename = `relatorio-${type}.csv`;

  switch (type) {
    case "clientes": {
      const clients = await prisma.client.findMany({
        where: { organizationId, deletedAt: null },
        include: { responsibleUser: { select: { name: true } } },
        orderBy: { legalName: "asc" },
      });
      csv = toCsv(
        clients.map((c) => ({
          codigo: c.code,
          razao_social: c.legalName,
          nome_fantasia: c.tradeName,
          cnpj: c.cnpj,
          regime: TAX_REGIME_LABELS[c.taxRegime],
          status: CLIENT_STATUS_LABELS[c.status],
          responsavel: c.responsibleUser?.name,
          mensalidade: c.monthlyFee,
        })),
        [
          { key: "codigo", header: "Código" },
          { key: "razao_social", header: "Razão Social" },
          { key: "nome_fantasia", header: "Nome Fantasia" },
          { key: "cnpj", header: "CNPJ" },
          { key: "regime", header: "Regime" },
          { key: "status", header: "Status" },
          { key: "responsavel", header: "Responsável" },
          { key: "mensalidade", header: "Mensalidade" },
        ]
      );
      break;
    }
    case "tarefas":
    case "tarefas-atrasadas": {
      const tasks = await prisma.task.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...(type === "tarefas-atrasadas" ? { status: "ATRASADA" } : {}),
        },
        include: {
          client: { select: { legalName: true } },
          assignee: { select: { name: true } },
          department: { select: { name: true } },
        },
        orderBy: { officialDueDate: "asc" },
      });
      csv = toCsv(
        tasks.map((t) => ({
          codigo: t.code,
          titulo: t.title,
          cliente: t.client?.legalName,
          departamento: t.department?.name,
          responsavel: t.assignee?.name,
          competencia: t.competence,
          prazo_oficial: t.officialDueDate?.toLocaleDateString("pt-BR"),
          status: TASK_STATUS_LABELS[t.status],
        })),
        [
          { key: "codigo", header: "Código" },
          { key: "titulo", header: "Título" },
          { key: "cliente", header: "Cliente" },
          { key: "departamento", header: "Departamento" },
          { key: "responsavel", header: "Responsável" },
          { key: "competencia", header: "Competência" },
          { key: "prazo_oficial", header: "Prazo Oficial" },
          { key: "status", header: "Status" },
        ]
      );
      break;
    }
    case "contratos": {
      const contracts = await prisma.contract.findMany({
        where: { organizationId },
        include: { client: { select: { legalName: true } } },
        orderBy: { createdAt: "desc" },
      });
      csv = toCsv(
        contracts.map((c) => ({
          cliente: c.client.legalName,
          tipo: c.type,
          versao: c.version,
          valor_mensal: c.monthlyValue,
          status: CONTRACT_STATUS_LABELS[c.status],
          gerado_em: c.generatedAt?.toLocaleDateString("pt-BR"),
        })),
        [
          { key: "cliente", header: "Cliente" },
          { key: "tipo", header: "Tipo" },
          { key: "versao", header: "Versão" },
          { key: "valor_mensal", header: "Valor mensal" },
          { key: "status", header: "Status" },
          { key: "gerado_em", header: "Gerado em" },
        ]
      );
      break;
    }
    case "financeiro":
    case "inadimplencia": {
      const receivables = await prisma.receivable.findMany({
        where: { organizationId, ...(type === "inadimplencia" ? { status: "VENCIDO" } : {}) },
        include: { client: { select: { legalName: true } } },
        orderBy: { dueDate: "desc" },
      });
      csv = toCsv(
        receivables.map((r) => ({
          cliente: r.client.legalName,
          descricao: r.description,
          competencia: r.competence,
          vencimento: r.dueDate.toLocaleDateString("pt-BR"),
          valor: r.amount,
          status: RECEIVABLE_STATUS_LABELS[r.status],
        })),
        [
          { key: "cliente", header: "Cliente" },
          { key: "descricao", header: "Descrição" },
          { key: "competencia", header: "Competência" },
          { key: "vencimento", header: "Vencimento" },
          { key: "valor", header: "Valor" },
          { key: "status", header: "Status" },
        ]
      );
      break;
    }
    case "servicos": {
      const services = await prisma.serviceCatalogItem.findMany({
        where: { organizationId },
        include: { department: { select: { name: true } }, _count: { select: { clientServices: true } } },
        orderBy: { name: "asc" },
      });
      csv = toCsv(
        services.map((s) => ({
          codigo: s.code,
          nome: s.name,
          categoria: s.category,
          departamento: s.department?.name,
          valor_padrao: s.defaultValue,
          clientes: s._count.clientServices,
        })),
        [
          { key: "codigo", header: "Código" },
          { key: "nome", header: "Nome" },
          { key: "categoria", header: "Categoria" },
          { key: "departamento", header: "Departamento" },
          { key: "valor_padrao", header: "Valor padrão" },
          { key: "clientes", header: "Qtd. clientes" },
        ]
      );
      break;
    }
    case "produtividade": {
      const users = await prisma.user.findMany({
        where: { organizationId, active: true, deletedAt: null },
        include: { assignedTasks: { where: { deletedAt: null } } },
      });
      csv = toCsv(
        users.map((u) => {
          const total = u.assignedTasks.length;
          const done = u.assignedTasks.filter((t) => t.status === "CONCLUIDA").length;
          const overdue = u.assignedTasks.filter((t) => t.status === "ATRASADA").length;
          return {
            nome: u.name,
            total_tarefas: total,
            concluidas: done,
            atrasadas: overdue,
            percentual_no_prazo: total > 0 ? `${Math.round((done / total) * 100)}%` : "-",
          };
        }),
        [
          { key: "nome", header: "Colaborador" },
          { key: "total_tarefas", header: "Total de tarefas" },
          { key: "concluidas", header: "Concluídas" },
          { key: "atrasadas", header: "Atrasadas" },
          { key: "percentual_no_prazo", header: "% no prazo" },
        ]
      );
      break;
    }
    default:
      return NextResponse.json({ error: "invalid report type" }, { status: 400 });
  }

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
