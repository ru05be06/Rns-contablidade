import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/deadline-badge";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";

export default async function PendenciasPage() {
  const session = await requirePermission("tasks.view");
  const organizationId = session.user.organizationId;
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 5);

  const [overdueTasks, clientsWithoutContract, overdueReceivables, upcomingDeadlines, tasksInReview, pendingDocumentItems] =
    await Promise.all([
      prisma.task.findMany({
        where: { organizationId, deletedAt: null, status: "ATRASADA" },
        include: { client: { select: { legalName: true, tradeName: true } }, assignee: { select: { name: true } } },
        orderBy: { officialDueDate: "asc" },
        take: 20,
      }),
      prisma.client.findMany({
        where: { organizationId, deletedAt: null, status: { in: ["ATIVO", "IMPLANTACAO"] }, contracts: { none: {} } },
        select: { id: true, legalName: true, tradeName: true },
        take: 20,
      }),
      prisma.receivable.findMany({
        where: { organizationId, status: "VENCIDO" },
        include: { client: { select: { legalName: true, tradeName: true } } },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      prisma.task.findMany({
        where: {
          organizationId,
          deletedAt: null,
          status: { notIn: ["CONCLUIDA", "CANCELADA"] },
          officialDueDate: { gte: now, lte: soon },
        },
        include: { client: { select: { legalName: true, tradeName: true } } },
        orderBy: { officialDueDate: "asc" },
        take: 20,
      }),
      prisma.task.findMany({
        where: { organizationId, deletedAt: null, status: "EM_REVISAO" },
        include: { client: { select: { legalName: true, tradeName: true } }, assignee: { select: { name: true } } },
        take: 20,
      }),
      prisma.documentRequestItem.findMany({
        where: { received: false, documentRequest: { client: { organizationId } } },
        include: { documentRequest: { include: { client: { select: { legalName: true, tradeName: true } } } } },
        take: 20,
      }),
    ]);

  return (
    <div>
      <PageHeader title="Central de Pendências" description="Tudo que exige atenção do escritório, em um só lugar." />
      <div className="grid gap-6 lg:grid-cols-2">
        <PendencyCard title="Tarefas atrasadas" count={overdueTasks.length} tone="destructive">
          {overdueTasks.map((t) => (
            <Link key={t.id} href={`/tarefas/${t.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.client?.tradeName || t.client?.legalName} · {t.assignee?.name ?? "sem responsável"}</p>
              </div>
              <DeadlineBadge date={t.officialDueDate} />
            </Link>
          ))}
        </PendencyCard>

        <PendencyCard title="Obrigações próximas do vencimento" count={upcomingDeadlines.length} tone="warning">
          {upcomingDeadlines.map((t) => (
            <Link key={t.id} href={`/tarefas/${t.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.client?.tradeName || t.client?.legalName}</p>
              </div>
              <DeadlineBadge date={t.officialDueDate} />
            </Link>
          ))}
        </PendencyCard>

        <PendencyCard title="Clientes sem contrato" count={clientsWithoutContract.length}>
          {clientsWithoutContract.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
              <span>{c.tradeName || c.legalName}</span>
              <Link href={`/contratos/novo?clientId=${c.id}`} className="text-xs text-primary hover:underline">
                Gerar contrato
              </Link>
            </Link>
          ))}
        </PendencyCard>

        <PendencyCard title="Mensalidades vencidas" count={overdueReceivables.length} tone="destructive">
          {overdueReceivables.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{r.client.tradeName || r.client.legalName}</p>
                <p className="text-xs text-muted-foreground">Venceu em {formatDateBR(r.dueDate)}</p>
              </div>
              <span className="font-medium">{formatCurrencyBRL(Number(r.amount))}</span>
            </div>
          ))}
        </PendencyCard>

        <PendencyCard title="Tarefas aguardando revisão" count={tasksInReview.length}>
          {tasksInReview.map((t) => (
            <Link key={t.id} href={`/tarefas/${t.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50">
              <span>{t.title}</span>
              <span className="text-xs text-muted-foreground">{t.assignee?.name ?? "—"}</span>
            </Link>
          ))}
        </PendencyCard>

        <PendencyCard title="Documentos pendentes de clientes" count={pendingDocumentItems.length}>
          {pendingDocumentItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{item.description}</span>
              <span className="text-xs text-muted-foreground">
                {item.documentRequest.client.tradeName || item.documentRequest.client.legalName}
              </span>
            </div>
          ))}
        </PendencyCard>
      </div>
    </div>
  );
}

function PendencyCard({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone?: "destructive" | "warning";
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span
          className={
            tone === "destructive"
              ? "rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive"
              : tone === "warning"
              ? "rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning"
              : "text-xs text-muted-foreground"
          }
        >
          {count}
        </span>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {children}
        {count === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nada pendente aqui.</p>}
      </CardContent>
    </Card>
  );
}
