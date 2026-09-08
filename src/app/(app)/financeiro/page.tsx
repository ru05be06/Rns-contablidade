import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { syncReceivableStatuses } from "@/lib/receivables";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Wallet, TrendingDown, Users2, Receipt } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/utils";
import { ReceivablesTable } from "@/components/financeiro/receivables-table";
import { RevenueChart } from "@/components/financeiro/revenue-chart";
import { GenerateBillingButton } from "@/components/financeiro/generate-billing-button";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default async function FinanceiroPage() {
  const session = await requirePermission("financeiro.view");
  const organizationId = session.user.organizationId;
  await syncReceivableStatuses(organizationId);

  const now = new Date();

  const [receivables, receitaPrevista, receitaRecebidaAgg, inadimplentesCount, totalClientsCount, last12] =
    await Promise.all([
      prisma.receivable.findMany({
        where: { organizationId },
        include: { client: { select: { legalName: true, tradeName: true } }, payments: true },
        orderBy: { dueDate: "desc" },
        take: 200,
      }),
      prisma.receivable.aggregate({
        where: { organizationId, dueDate: { gte: startOfMonth(now), lte: endOfMonth(now) }, status: { not: "CANCELADO" } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { receivable: { organizationId }, paidAt: { gte: startOfMonth(now), lte: endOfMonth(now) } },
        _sum: { amount: true },
      }),
      prisma.receivable.groupBy({ by: ["clientId"], where: { organizationId, status: "VENCIDO" } }),
      prisma.client.count({ where: { organizationId, status: "ATIVO", deletedAt: null } }),
      Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return prisma.payment
            .aggregate({
              where: {
                receivable: { organizationId },
                paidAt: { gte: startOfMonth(d), lte: endOfMonth(d) },
              },
              _sum: { amount: true },
            })
            .then((r) => ({
              month: d.toLocaleDateString("pt-BR", { month: "short" }),
              value: Number(r._sum.amount ?? 0),
            }));
        })
      ),
    ]);

  const prevista = Number(receitaPrevista._sum.amount ?? 0);
  const recebida = Number(receitaRecebidaAgg._sum.amount ?? 0);
  const pendente = Math.max(prevista - recebida, 0);
  const ticketMedio = totalClientsCount > 0 ? prevista / totalClientsCount : 0;

  const canManage = session.user.permissions.includes("financeiro.manage");

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas a receber, mensalidades e cobranças do escritório."
        actions={
          canManage && (
            <div className="flex gap-2">
              <GenerateBillingButton />
              <Button size="sm" asChild>
                <Link href="/financeiro/nova">
                  <Plus className="h-4 w-4" /> Nova cobrança
                </Link>
              </Button>
            </div>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Receita prevista (mês)" value={formatCurrencyBRL(prevista)} icon={Wallet} />
        <StatCard label="Receita recebida (mês)" value={formatCurrencyBRL(recebida)} icon={Receipt} tone="success" />
        <StatCard label="Receita pendente" value={formatCurrencyBRL(pendente)} icon={TrendingDown} tone="warning" />
        <StatCard label="Ticket médio" value={formatCurrencyBRL(ticketMedio)} icon={Users2} />
      </div>

      <div className="mb-6 rounded-lg border bg-background p-4">
        <p className="mb-3 text-sm font-semibold">Recebimentos — últimos 12 meses</p>
        <RevenueChart data={last12} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{inadimplentesCount.length} cliente(s) inadimplente(s)</p>
        <Link href="/financeiro/inadimplencia" className="text-sm text-primary hover:underline">
          Ver central de inadimplência
        </Link>
      </div>

      <ReceivablesTable
        receivables={receivables.map((r) => ({
          id: r.id,
          clientName: r.client.tradeName || r.client.legalName,
          description: r.description,
          competence: r.competence,
          dueDate: r.dueDate.toISOString(),
          amount: Number(r.amount),
          paid: r.payments.reduce((sum, p) => sum + Number(p.amount), 0),
          status: r.status,
        }))}
        canManage={canManage}
      />
    </div>
  );
}
