import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { AlarmClockOff, CalendarClock, Clock3, Eye, Wallet, FileSignature } from "lucide-react";
import Link from "next/link";
import { DeadlineBadge } from "@/components/deadline-badge";
import { DelayMap } from "@/components/operacional/delay-map";
import { TeamWorkload } from "@/components/operacional/team-workload";
import { ProductionLine } from "@/components/operacional/production-line";

export default async function OperacionalPage() {
  const session = await requirePermission("dashboard.view");
  const organizationId = session.user.organizationId;
  const now = new Date();

  const [
    todayTasks,
    overdueTasks,
    awaitingClientTasks,
    inReviewTasks,
    inadimplentesCount,
    contractsAwaitingSignature,
    delayLogs,
    workloadUsers,
    productionTasks,
  ] = await Promise.all([
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: ["CONCLUIDA", "CANCELADA"] },
        officialDueDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
      },
    }),
    prisma.task.findMany({
      where: { organizationId, deletedAt: null, status: "ATRASADA" },
      include: { client: { select: { legalName: true, tradeName: true } }, assignee: { select: { name: true } } },
      orderBy: { officialDueDate: "asc" },
      take: 10,
    }),
    prisma.task.count({ where: { organizationId, deletedAt: null, status: "AGUARDANDO_CLIENTE" } }),
    prisma.task.count({ where: { organizationId, deletedAt: null, status: "EM_REVISAO" } }),
    prisma.receivable.groupBy({ by: ["clientId"], where: { organizationId, status: "VENCIDO" } }),
    prisma.contract.count({ where: { organizationId, status: { in: ["ENVIADO", "VISUALIZADO", "GERADO"] } } }),
    prisma.taskDelayLog.findMany({
      where: { task: { organizationId, deletedAt: null } },
      include: {
        task: {
          select: {
            title: true,
            department: { select: { name: true } },
            client: { select: { legalName: true, tradeName: true } },
          },
        },
        reportedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      where: { organizationId, active: true, deletedAt: null },
      include: {
        assignedTasks: {
          where: { deletedAt: null, status: { notIn: ["CONCLUIDA", "CANCELADA"] } },
          select: { status: true, priority: true, officialDueDate: true },
        },
      },
    }),
    prisma.task.findMany({
      where: { organizationId, deletedAt: null, status: { notIn: ["CONCLUIDA", "CANCELADA"] }, clientId: { not: null } },
      include: { client: { select: { legalName: true, tradeName: true } } },
      orderBy: { officialDueDate: "asc" },
      take: 40,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Central Operacional" description="Acompanhamento diário do escritório — tudo que exige atenção agora." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Vencem hoje" value={todayTasks} icon={CalendarClock} tone="warning" />
        <StatCard label="Atrasadas" value={overdueTasks.length} icon={AlarmClockOff} tone="destructive" />
        <StatCard label="Aguardando cliente" value={awaitingClientTasks} icon={Clock3} />
        <StatCard label="Em revisão" value={inReviewTasks} icon={Eye} />
        <StatCard label="Clientes inadimplentes" value={inadimplentesCount.length} icon={Wallet} tone="destructive" />
        <StatCard label="Contratos aguardando assinatura" value={contractsAwaitingSignature} icon={FileSignature} tone="warning" />
      </div>

      <Tabs defaultValue="urgente">
        <TabsList>
          <TabsTrigger value="urgente">Urgente</TabsTrigger>
          <TabsTrigger value="producao">Linha de Produção</TabsTrigger>
          <TabsTrigger value="atrasos">Mapa de Atrasos</TabsTrigger>
          <TabsTrigger value="carga">Carga da Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="urgente">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas atrasadas — atenção imediata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tarefas/${t.id}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.client?.tradeName || t.client?.legalName} · {t.assignee?.name ?? "sem responsável"}
                    </p>
                  </div>
                  <DeadlineBadge date={t.officialDueDate} />
                </Link>
              ))}
              {overdueTasks.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma tarefa atrasada agora.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="producao">
          <ProductionLine
            tasks={productionTasks.map((t) => ({
              id: t.id,
              title: t.title,
              clientName: t.client?.tradeName || t.client?.legalName || "—",
              productionStage: t.productionStage,
              status: t.status,
            }))}
          />
        </TabsContent>

        <TabsContent value="atrasos">
          <DelayMap
            logs={delayLogs.map((l) => ({
              id: l.id,
              taskTitle: l.task.title,
              departmentName: l.task.department?.name ?? "—",
              clientName: l.task.client?.tradeName || l.task.client?.legalName || "—",
              reason: l.reason,
              daysLate: l.daysLate,
              reportedByName: l.reportedBy?.name ?? "—",
            }))}
          />
        </TabsContent>

        <TabsContent value="carga">
          <TeamWorkload
            users={workloadUsers.map((u) => {
              const total = u.assignedTasks.length;
              const overdue = u.assignedTasks.filter((t) => t.status === "ATRASADA").length;
              const today = u.assignedTasks.filter((t) => {
                if (!t.officialDueDate) return false;
                const d = new Date(t.officialDueDate);
                return d.toDateString() === now.toDateString();
              }).length;
              const urgent = u.assignedTasks.filter((t) => t.priority === "URGENTE").length;
              let load: "Baixa" | "Normal" | "Alta" | "Crítica" = "Baixa";
              if (total > 15 || overdue > 5) load = "Crítica";
              else if (total > 10 || overdue > 2) load = "Alta";
              else if (total > 5) load = "Normal";
              return { id: u.id, name: u.name, total, overdue, today, urgent, load };
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
