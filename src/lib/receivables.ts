import { prisma } from "@/lib/prisma";
import type { ReceivableStatus } from "@prisma/client";

/**
 * Deriva o status de uma cobrança a partir da data de vencimento — seção 26.
 * Nunca altera status terminais (PAGO, PARCIALMENTE_PAGO, CANCELADO).
 */
export function computeReceivableStatus(
  dueDate: Date,
  now: Date,
  currentStatus?: ReceivableStatus
): ReceivableStatus {
  if (currentStatus === "PAGO" || currentStatus === "PARCIALMENTE_PAGO" || currentStatus === "CANCELADO") {
    return currentStatus;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  if (due.getTime() < today.getTime()) return "VENCIDO";
  if (due.getTime() === today.getTime()) return "VENCENDO_HOJE";
  return "A_VENCER";
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/**
 * Recalcula o status de cobranças com base na data de vencimento.
 * Idempotente e barato — chamado antes de listar o financeiro (seção 26).
 */
export async function syncReceivableStatuses(organizationId: string) {
  const now = new Date();

  await prisma.receivable.updateMany({
    where: {
      organizationId,
      status: { in: ["A_VENCER", "VENCENDO_HOJE"] },
      dueDate: { lt: startOfDay(now) },
    },
    data: { status: "VENCIDO" },
  });

  await prisma.receivable.updateMany({
    where: {
      organizationId,
      status: "A_VENCER",
      dueDate: { gte: startOfDay(now), lte: endOfDay(now) },
    },
    data: { status: "VENCENDO_HOJE" },
  });

  await prisma.receivable.updateMany({
    where: {
      organizationId,
      status: { in: ["VENCIDO", "VENCENDO_HOJE"] },
      dueDate: { gt: endOfDay(now) },
    },
    data: { status: "A_VENCER" },
  });
}
