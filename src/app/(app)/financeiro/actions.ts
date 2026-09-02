"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { computeReceivableStatus } from "@/lib/receivables";

const receivableSchema = z.object({
  clientId: z.string(),
  description: z.string().min(2),
  competence: z.string().optional(),
  dueDate: z.string(),
  amount: z.number().positive(),
  recurring: z.boolean().default(false),
});

export async function createReceivable(input: z.infer<typeof receivableSchema>) {
  const session = await requirePermission("financeiro.manage");
  const data = receivableSchema.parse(input);
  const organizationId = session.user.organizationId;

  const dueDate = new Date(data.dueDate);
  const status = computeReceivableStatus(dueDate, new Date());

  const receivable = await prisma.receivable.create({
    data: {
      organizationId,
      clientId: data.clientId,
      description: data.description,
      competence: data.competence || null,
      dueDate,
      amount: data.amount,
      recurring: data.recurring,
      status,
    },
  });

  await logAudit({
    organizationId,
    userId: session.user.id,
    clientId: data.clientId,
    entityType: "Receivable",
    entityId: receivable.id,
    action: "CREATE",
  });

  revalidatePath("/financeiro");
  revalidatePath(`/clientes/${data.clientId}`);
  return receivable.id;
}

export async function createReceivableAndRedirect(input: z.infer<typeof receivableSchema>) {
  await createReceivable(input);
  redirect("/financeiro");
}

const paymentSchema = z.object({
  receivableId: z.string(),
  amount: z.number().positive(),
  method: z.string().optional(),
  paidAt: z.string().optional(),
});

export async function registerPayment(input: z.infer<typeof paymentSchema>) {
  const session = await requirePermission("financeiro.manage");
  const data = paymentSchema.parse(input);

  const receivable = await prisma.receivable.findFirst({
    where: { id: data.receivableId, organizationId: session.user.organizationId },
    include: { payments: true },
  });
  if (!receivable) throw new Error("Cobrança não encontrada");

  await prisma.payment.create({
    data: {
      receivableId: data.receivableId,
      amount: data.amount,
      method: data.method || null,
      paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    },
  });

  const totalPaid = receivable.payments.reduce((sum, p) => sum + Number(p.amount), 0) + data.amount;
  const newStatus = totalPaid >= Number(receivable.amount) ? "PAGO" : "PARCIALMENTE_PAGO";

  await prisma.receivable.update({ where: { id: data.receivableId }, data: { status: newStatus } });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId: receivable.clientId,
    entityType: "Receivable",
    entityId: data.receivableId,
    action: "STATUS_CHANGE",
    field: "status",
    oldValue: receivable.status,
    newValue: newStatus,
  });

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/inadimplencia");
  revalidatePath(`/clientes/${receivable.clientId}`);
}

export async function cancelReceivable(id: string) {
  const session = await requirePermission("financeiro.manage");
  const receivable = await prisma.receivable.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!receivable) throw new Error("Cobrança não encontrada");

  await prisma.receivable.update({ where: { id }, data: { status: "CANCELADO", cancelledAt: new Date() } });
  revalidatePath("/financeiro");
  revalidatePath(`/clientes/${receivable.clientId}`);
}

export async function addCollectionLog(receivableId: string, note: string, channel?: string) {
  const session = await requirePermission("financeiro.manage");
  const receivable = await prisma.receivable.findFirst({
    where: { id: receivableId, organizationId: session.user.organizationId },
  });
  if (!receivable) throw new Error("Cobrança não encontrada");
  await prisma.collectionLog.create({ data: { receivableId, note, channel } });
  revalidatePath("/financeiro/inadimplencia");
}

/** Gera as mensalidades do mês corrente para todos os clientes ativos com valor definido. */
export async function generateMonthlyBilling() {
  const session = await requirePermission("financeiro.manage");
  const organizationId = session.user.organizationId;
  const now = new Date();
  const competence = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  const clients = await prisma.client.findMany({
    where: { organizationId, status: "ATIVO", deletedAt: null, monthlyFee: { not: null } },
  });

  let created = 0;
  for (const client of clients) {
    const existing = await prisma.receivable.findFirst({
      where: { clientId: client.id, competence, description: "Mensalidade" },
    });
    if (existing) continue;

    const dueDate = new Date(now.getFullYear(), now.getMonth(), client.feeDueDay ?? 10);
    await prisma.receivable.create({
      data: {
        organizationId,
        clientId: client.id,
        description: "Mensalidade",
        competence,
        dueDate,
        amount: client.monthlyFee!,
        recurring: true,
        status: computeReceivableStatus(dueDate, now),
      },
    });
    created++;
  }

  revalidatePath("/financeiro");
  return created;
}
