import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, TAX_REGIME_LABELS } from "@/lib/labels";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";
import { ClientStatusSelect } from "@/components/clientes/client-status-select";
import { OverviewTab } from "@/components/clientes/tabs/overview-tab";
import { PartnersTab } from "@/components/clientes/tabs/partners-tab";
import { ServicesTab } from "@/components/clientes/tabs/services-tab";
import { TasksTab } from "@/components/clientes/tabs/tasks-tab";
import { FinanceTab } from "@/components/clientes/tabs/finance-tab";
import { ContractsTab } from "@/components/clientes/tabs/contracts-tab";
import { DocumentsTab } from "@/components/clientes/tabs/documents-tab";
import { HistoryTab } from "@/components/clientes/tabs/history-tab";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("clients.view");
  const organizationId = session.user.organizationId;

  const client = await prisma.client.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      responsibleUser: { select: { name: true } },
      partners: { orderBy: { createdAt: "asc" } },
      _count: {
        select: {
          services: true,
          tasks: { where: { deletedAt: null, status: { notIn: ["CONCLUIDA", "CANCELADA"] } } },
        },
      },
    },
  });
  if (!client) notFound();

  const [openTasksCount, overdueTasksCount, latestContract, pendingReceivablesSum] = await Promise.all([
    prisma.task.count({
      where: { clientId: id, deletedAt: null, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
    }),
    prisma.task.count({
      where: { clientId: id, deletedAt: null, status: "ATRASADA" },
    }),
    prisma.contract.findFirst({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.receivable.aggregate({
      where: { clientId: id, status: { in: ["A_VENCER", "VENCENDO_HOJE", "VENCIDO", "PARCIALMENTE_PAGO"] } },
      _sum: { amount: true },
    }),
  ]);

  const canManage = session.user.permissions.includes("clients.manage");

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{client.tradeName || client.legalName}</h1>
            <StatusBadge status={client.status} labels={CLIENT_STATUS_LABELS} colors={CLIENT_STATUS_COLORS} />
          </div>
          <p className="text-sm text-muted-foreground">
            {client.legalName} · {client.cnpj || client.cpf || "sem documento cadastrado"}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {client.email}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {client.city}/{client.state}
              </span>
            )}
            {client.responsibleUser && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Responsável: {client.responsibleUser.name}
              </span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <ClientStatusSelect clientId={client.id} status={client.status} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clientes/${client.id}/editar`}>
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Serviços ativos" value={client._count.services} />
        <StatCard label="Tarefas abertas" value={openTasksCount} />
        <StatCard label="Obrigações atrasadas" value={overdueTasksCount} tone={overdueTasksCount > 0 ? "destructive" : "success"} />
        <StatCard label="Mensalidade" value={formatCurrencyBRL(client.monthlyFee ? Number(client.monthlyFee) : 0)} />
        <StatCard
          label="Em aberto (financeiro)"
          value={formatCurrencyBRL(Number(pendingReceivablesSum._sum.amount ?? 0))}
          tone={Number(pendingReceivablesSum._sum.amount ?? 0) > 0 ? "warning" : "success"}
        />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="socios">Sócios</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas / Obrigações</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <OverviewTab client={client} latestContract={latestContract} taxRegimeLabel={TAX_REGIME_LABELS[client.taxRegime]} />
        </TabsContent>
        <TabsContent value="socios">
          <PartnersTab
            clientId={client.id}
            partners={client.partners.map((p) => ({
              ...p,
              equityShare: p.equityShare ? Number(p.equityShare) : null,
            }))}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="servicos">
          <ServicesTab clientId={client.id} organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="tarefas">
          <TasksTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="financeiro">
          <FinanceTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="contratos">
          <ContractsTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentsTab clientId={client.id} organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="historico">
          <HistoryTab clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
