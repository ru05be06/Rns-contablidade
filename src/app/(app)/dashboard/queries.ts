import { prisma } from "@/lib/prisma";
import { ClientStatus, ContractStatus, ReceivableStatus, TaskStatus } from "@prisma/client";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}
function endOfWeek(date: Date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
}
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

const OPEN_TASK_STATUSES: TaskStatus[] = [
  "NAO_INICIADA",
  "AGUARDANDO_DOCUMENTOS",
  "EM_ANDAMENTO",
  "EM_REVISAO",
  "AGUARDANDO_CLIENTE",
  "ATRASADA",
];

export async function getDashboardData(organizationId: string) {
  const now = new Date();

  const [
    clientsActive,
    clientsNew,
    clientsImplantacao,
    clientsSuspended,
    tasksToday,
    tasksOverdue,
    tasksThisWeek,
    tasksInReview,
    tasksAwaitingClient,
    tasksMonthTotal,
    tasksMonthDone,
    upcomingDeadlines,
    receivablesThisMonth,
    paymentsThisMonth,
    receivablesOverdueCount,
    receivablesTotalCount,
    contractsAwaitingSignature,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId, status: ClientStatus.ATIVO, deletedAt: null } }),
    prisma.client.count({
      where: { organizationId, deletedAt: null, createdAt: { gte: startOfMonth(now) } },
    }),
    prisma.client.count({ where: { organizationId, status: ClientStatus.IMPLANTACAO, deletedAt: null } }),
    prisma.client.count({ where: { organizationId, status: ClientStatus.SUSPENSO, deletedAt: null } }),
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: OPEN_TASK_STATUSES },
        officialDueDate: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    }),
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { notIn: ["CONCLUIDA", "CANCELADA"] },
        officialDueDate: { lt: startOfDay(now) },
      },
    }),
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: OPEN_TASK_STATUSES },
        officialDueDate: { gte: startOfWeek(now), lte: endOfWeek(now) },
      },
    }),
    prisma.task.count({ where: { organizationId, deletedAt: null, status: "EM_REVISAO" } }),
    prisma.task.count({ where: { organizationId, deletedAt: null, status: "AGUARDANDO_CLIENTE" } }),
    prisma.task.count({
      where: { organizationId, deletedAt: null, officialDueDate: { gte: startOfMonth(now), lte: endOfMonth(now) } },
    }),
    prisma.task.count({
      where: {
        organizationId,
        deletedAt: null,
        status: "CONCLUIDA",
        officialDueDate: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: OPEN_TASK_STATUSES },
        officialDueDate: { not: null },
      },
      orderBy: { officialDueDate: "asc" },
      take: 8,
      include: { client: { select: { legalName: true, tradeName: true } } },
    }),
    prisma.receivable.aggregate({
      where: { organizationId, dueDate: { gte: startOfMonth(now), lte: endOfMonth(now) }, status: { not: "CANCELADO" } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        receivable: { organizationId },
        paidAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
      _sum: { amount: true },
    }),
    prisma.receivable.count({ where: { organizationId, status: "VENCIDO" } }),
    prisma.receivable.count({ where: { organizationId, status: { not: "CANCELADO" } } }),
    prisma.contract.count({
      where: { organizationId, status: { in: [ContractStatus.ENVIADO, ContractStatus.VISUALIZADO, ContractStatus.GERADO] } },
    }),
  ]);

  const receitaPrevista = Number(receivablesThisMonth._sum.amount ?? 0);
  const receitaRecebida = Number(paymentsThisMonth._sum.amount ?? 0);
  const receitaPendente = Math.max(receitaPrevista - receitaRecebida, 0);
  const inadimplenciaPercent = receivablesTotalCount > 0 ? (receivablesOverdueCount / receivablesTotalCount) * 100 : 0;
  const cumprimentoPrazo = tasksMonthTotal > 0 ? (tasksMonthDone / tasksMonthTotal) * 100 : 0;

  return {
    clients: {
      active: clientsActive,
      new: clientsNew,
      implantacao: clientsImplantacao,
      suspended: clientsSuspended,
    },
    tasks: {
      today: tasksToday,
      overdue: tasksOverdue,
      thisWeek: tasksThisWeek,
      inReview: tasksInReview,
      awaitingClient: tasksAwaitingClient,
      monthTotal: tasksMonthTotal,
      monthDone: tasksMonthDone,
      cumprimentoPrazo,
    },
    upcomingDeadlines,
    financeiro: {
      receitaPrevista,
      receitaRecebida,
      receitaPendente,
      inadimplenciaPercent,
    },
    contractsAwaitingSignature,
  };
}

export async function getDepartmentBreakdown(organizationId: string) {
  const departments = await prisma.department.findMany({
    where: { organizationId, active: true },
    include: {
      tasks: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  return departments
    .map((d) => {
      const total = d.tasks.length;
      const done = d.tasks.filter((t) => t.status === "CONCLUIDA").length;
      const overdue = d.tasks.filter((t) => t.status === "ATRASADA").length;
      const inProgress = d.tasks.filter((t) => !["CONCLUIDA", "CANCELADA", "ATRASADA"].includes(t.status)).length;
      return {
        id: d.id,
        name: d.name,
        color: d.color,
        total,
        done,
        overdue,
        inProgress,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    })
    .filter((d) => d.total > 0);
}

export async function getTeamWorkload(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { organizationId, active: true, deletedAt: null },
    include: {
      assignedTasks: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  return users
    .map((u) => {
      const total = u.assignedTasks.length;
      const done = u.assignedTasks.filter((t) => t.status === "CONCLUIDA").length;
      const overdue = u.assignedTasks.filter((t) => t.status === "ATRASADA").length;
      const onTimePercent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { id: u.id, name: u.name, total, done, overdue, onTimePercent };
    })
    .sort((a, b) => b.total - a.total);
}
