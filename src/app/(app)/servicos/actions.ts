"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Periodicity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { generateServiceCode } from "@/lib/codes";
import { generateTasksForClientService } from "@/lib/task-generation";

// ---------------------------------------------------------------------------
// Catálogo de serviços
// ---------------------------------------------------------------------------

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  category: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  periodicity: z.nativeEnum(Periodicity),
  defaultValue: z.number().optional().nullable(),
  slaDays: z.number().optional().nullable(),
  internalDeadlineDay: z.number().optional().nullable(),
  defaultDeadlineDay: z.number().optional().nullable(),
  checklistTemplateId: z.string().optional().nullable(),
  requiredDocuments: z.array(z.string()).optional(),
});

export type ServiceFormInput = z.infer<typeof serviceSchema>;

export async function saveService(input: ServiceFormInput) {
  const session = await requirePermission("services.manage");
  const data = serviceSchema.parse(input);
  const organizationId = session.user.organizationId;

  const payload = {
    name: data.name,
    category: data.category || null,
    description: data.description || null,
    departmentId: data.departmentId || null,
    periodicity: data.periodicity,
    defaultValue: data.defaultValue ?? null,
    slaDays: data.slaDays ?? null,
    internalDeadlineDay: data.internalDeadlineDay ?? null,
    defaultDeadlineDay: data.defaultDeadlineDay ?? null,
    checklistTemplateId: data.checklistTemplateId || null,
    requiredDocuments: data.requiredDocuments ?? [],
  };

  if (data.id) {
    await prisma.serviceCatalogItem.update({ where: { id: data.id }, data: payload });
  } else {
    const code = await generateServiceCode(organizationId);
    await prisma.serviceCatalogItem.create({ data: { ...payload, organizationId, code } });
  }

  revalidatePath("/servicos");
}

export async function saveServiceAndRedirect(input: ServiceFormInput) {
  await saveService(input);
  redirect("/servicos");
}

export async function toggleServiceActive(id: string, active: boolean) {
  const session = await requirePermission("services.manage");
  await prisma.serviceCatalogItem.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: { active },
  });
  revalidatePath("/servicos");
}

// ---------------------------------------------------------------------------
// Modelos de checklist
// ---------------------------------------------------------------------------

const checklistTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      required: z.boolean().default(true),
      requiresDocument: z.boolean().default(false),
    })
  ),
});

export async function saveChecklistTemplate(input: z.infer<typeof checklistTemplateSchema>) {
  const session = await requirePermission("services.manage");
  const data = checklistTemplateSchema.parse(input);
  const organizationId = session.user.organizationId;

  if (data.id) {
    const existing = await prisma.checklistTemplate.findFirst({ where: { id: data.id, organizationId } });
    if (!existing) throw new Error("Modelo não encontrado");
    await prisma.checklistTemplateItem.deleteMany({ where: { checklistTemplateId: data.id } });
    await prisma.checklistTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        items: {
          create: data.items.map((item, idx) => ({
            order: idx + 1,
            description: item.description,
            required: item.required,
            requiresDocument: item.requiresDocument,
          })),
        },
      },
    });
  } else {
    await prisma.checklistTemplate.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        items: {
          create: data.items.map((item, idx) => ({
            order: idx + 1,
            description: item.description,
            required: item.required,
            requiresDocument: item.requiresDocument,
          })),
        },
      },
    });
  }

  revalidatePath("/servicos");
}

export async function deleteChecklistTemplate(id: string) {
  const session = await requirePermission("services.manage");
  const template = await prisma.checklistTemplate.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!template) throw new Error("Modelo não encontrado");
  const inUse = await prisma.serviceCatalogItem.count({ where: { checklistTemplateId: id } });
  if (inUse > 0) throw new Error("Este modelo está em uso por serviços do catálogo");
  await prisma.checklistTemplate.delete({ where: { id } });
  revalidatePath("/servicos");
}

// ---------------------------------------------------------------------------
// Serviços por cliente
// ---------------------------------------------------------------------------

const clientServiceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  serviceCatalogItemId: z.string(),
  departmentId: z.string().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  periodicity: z.nativeEnum(Periodicity),
  value: z.number().optional().nullable(),
  dueDay: z.number().optional().nullable(),
  internalDeadlineDay: z.number().optional().nullable(),
  billingType: z.string().optional(),
  notes: z.string().optional(),
});

export async function linkServiceToClient(input: z.infer<typeof clientServiceSchema>) {
  const session = await requirePermission("clients.manage");
  const data = clientServiceSchema.parse(input);
  const organizationId = session.user.organizationId;

  const [client, serviceCatalogItem] = await Promise.all([
    prisma.client.findFirst({ where: { id: data.clientId, organizationId } }),
    prisma.serviceCatalogItem.findFirst({ where: { id: data.serviceCatalogItemId, organizationId } }),
  ]);
  if (!client) throw new Error("Cliente não encontrado");
  if (!serviceCatalogItem) throw new Error("Serviço não encontrado no catálogo");

  const clientService = await prisma.clientService.create({
    data: {
      organizationId: session.user.organizationId,
      clientId: data.clientId,
      serviceCatalogItemId: data.serviceCatalogItemId,
      departmentId: data.departmentId || null,
      responsibleId: data.responsibleId || null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      periodicity: data.periodicity,
      value: data.value ?? null,
      dueDay: data.dueDay ?? null,
      internalDeadlineDay: data.internalDeadlineDay ?? null,
      billingType: data.billingType || null,
      notes: data.notes || null,
    },
  });

  await generateTasksForClientService(clientService.id);

  revalidatePath(`/clientes/${data.clientId}`);
  return clientService.id;
}

export async function updateClientService(input: z.infer<typeof clientServiceSchema>) {
  const session = await requirePermission("clients.manage");
  const data = clientServiceSchema.parse(input);
  if (!data.id) throw new Error("ID obrigatório");

  await prisma.clientService.updateMany({
    where: { id: data.id, organizationId: session.user.organizationId },
    data: {
      departmentId: data.departmentId || null,
      responsibleId: data.responsibleId || null,
      periodicity: data.periodicity,
      value: data.value ?? null,
      dueDay: data.dueDay ?? null,
      internalDeadlineDay: data.internalDeadlineDay ?? null,
      billingType: data.billingType || null,
      notes: data.notes || null,
    },
  });
  revalidatePath(`/clientes/${data.clientId}`);
}

export async function removeClientService(id: string, clientId: string) {
  const session = await requirePermission("clients.manage");
  await prisma.clientService.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: { active: false },
  });
  revalidatePath(`/clientes/${clientId}`);
}

export async function generateTasksNow(clientServiceId: string, clientId: string) {
  await requirePermission("clients.manage");
  const created = await generateTasksForClientService(clientServiceId, 3);
  revalidatePath(`/clientes/${clientId}`);
  return created.length;
}
