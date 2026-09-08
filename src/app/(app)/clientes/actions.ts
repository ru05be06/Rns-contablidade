"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClientStatus, TaxRegime } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { generateClientCode } from "@/lib/codes";

const clientSchema = z.object({
  id: z.string().optional(),
  legalName: z.string().min(2, "Informe a razão social"),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  mainCnae: z.string().optional(),
  taxRegime: z.nativeEnum(TaxRegime),
  status: z.nativeEnum(ClientStatus),
  foundationDate: z.string().optional(),
  onboardingDate: z.string().optional(),
  responsibleUserId: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  monthlyFee: z.number().optional().nullable(),
  feeDueDay: z.number().optional().nullable(),
});

export type ClientFormInput = z.infer<typeof clientSchema>;

export async function saveClient(input: ClientFormInput) {
  const session = await requirePermission("clients.manage");
  const data = clientSchema.parse(input);
  const organizationId = session.user.organizationId;

  const payload = {
    legalName: data.legalName,
    tradeName: data.tradeName || null,
    cnpj: data.cnpj || null,
    cpf: data.cpf || null,
    stateRegistration: data.stateRegistration || null,
    municipalRegistration: data.municipalRegistration || null,
    mainCnae: data.mainCnae || null,
    taxRegime: data.taxRegime,
    status: data.status,
    foundationDate: data.foundationDate ? new Date(data.foundationDate) : null,
    onboardingDate: data.onboardingDate ? new Date(data.onboardingDate) : null,
    responsibleUserId: data.responsibleUserId || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    zipCode: data.zipCode || null,
    address: data.address || null,
    addressNumber: data.addressNumber || null,
    addressComplement: data.addressComplement || null,
    neighborhood: data.neighborhood || null,
    city: data.city || null,
    state: data.state || null,
    notes: data.notes || null,
    monthlyFee: data.monthlyFee ?? null,
    feeDueDay: data.feeDueDay ?? null,
    updatedBy: session.user.id,
  };

  let clientId = data.id;

  if (clientId) {
    const { count } = await prisma.client.updateMany({
      where: { id: clientId, organizationId },
      data: payload,
    });
    if (count === 0) throw new Error("Cliente não encontrado");
    await logAudit({
      organizationId,
      userId: session.user.id,
      clientId,
      entityType: "Client",
      entityId: clientId,
      action: "UPDATE",
    });
  } else {
    const code = await generateClientCode(organizationId);
    const client = await prisma.client.create({
      data: { ...payload, organizationId, code, createdBy: session.user.id },
    });
    clientId = client.id;
    await logAudit({
      organizationId,
      userId: session.user.id,
      clientId,
      entityType: "Client",
      entityId: clientId,
      action: "CREATE",
    });
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  return clientId;
}

export async function saveClientAndRedirect(input: ClientFormInput) {
  const id = await saveClient(input);
  redirect(`/clientes/${id}`);
}

export async function changeClientStatus(clientId: string, status: ClientStatus) {
  const session = await requirePermission("clients.manage");
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: session.user.organizationId },
  });
  if (!client) throw new Error("Cliente não encontrado");

  await prisma.client.update({ where: { id: clientId }, data: { status } });
  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId,
    entityType: "Client",
    entityId: clientId,
    action: "STATUS_CHANGE",
    field: "status",
    oldValue: client.status,
    newValue: status,
  });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
}

export async function archiveClient(clientId: string) {
  const session = await requirePermission("clients.delete");
  await prisma.client.updateMany({
    where: { id: clientId, organizationId: session.user.organizationId },
    data: { archived: true, deletedAt: new Date() },
  });
  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId,
    entityType: "Client",
    entityId: clientId,
    action: "DELETE",
  });
  revalidatePath("/clientes");
}

const partnerSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(2),
  cpf: z.string().optional(),
  equityShare: z.number().optional().nullable(),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  entryDate: z.string().optional(),
  exitDate: z.string().optional(),
});

export async function savePartner(input: z.infer<typeof partnerSchema>) {
  const session = await requirePermission("clients.manage");
  const data = partnerSchema.parse(input);

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, organizationId: session.user.organizationId },
  });
  if (!client) throw new Error("Cliente não encontrado");

  const payload = {
    name: data.name,
    cpf: data.cpf || null,
    equityShare: data.equityShare ?? null,
    role: data.role || null,
    phone: data.phone || null,
    email: data.email || null,
    entryDate: data.entryDate ? new Date(data.entryDate) : null,
    exitDate: data.exitDate ? new Date(data.exitDate) : null,
  };

  if (data.id) {
    await prisma.partner.updateMany({ where: { id: data.id, clientId: data.clientId }, data: payload });
  } else {
    await prisma.partner.create({ data: { ...payload, clientId: data.clientId } });
  }
  revalidatePath(`/clientes/${data.clientId}`);
}

export async function deletePartner(partnerId: string, clientId: string) {
  const session = await requirePermission("clients.manage");
  await prisma.partner.deleteMany({
    where: { id: partnerId, client: { id: clientId, organizationId: session.user.organizationId } },
  });
  revalidatePath(`/clientes/${clientId}`);
}
