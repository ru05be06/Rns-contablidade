"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContractStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { fillContractTemplate } from "@/lib/contract-template";
import { getSignatureProvider } from "@/lib/integrations/signature";

const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  content: z.string().min(10),
});

export async function saveContractTemplate(input: z.infer<typeof templateSchema>) {
  const session = await requirePermission("contracts.manage");
  const data = templateSchema.parse(input);
  const organizationId = session.user.organizationId;

  if (data.id) {
    await prisma.contractTemplate.updateMany({
      where: { id: data.id, organizationId },
      data: { name: data.name, content: data.content },
    });
  } else {
    await prisma.contractTemplate.create({ data: { organizationId, name: data.name, content: data.content } });
  }
  revalidatePath("/contratos/modelos");
}

const generateSchema = z.object({
  clientId: z.string(),
  templateId: z.string(),
  services: z.array(z.object({ description: z.string(), value: z.number().optional().nullable() })),
  monthlyValue: z.number().optional().nullable(),
  startDate: z.string().optional(),
  dueDay: z.number().optional().nullable(),
  type: z.string().default("CONTRATO"),
  previousVersionId: z.string().optional(),
});

export async function generateContract(input: z.infer<typeof generateSchema>) {
  const session = await requirePermission("contracts.manage");
  const data = generateSchema.parse(input);
  const organizationId = session.user.organizationId;

  const [client, template] = await Promise.all([
    prisma.client.findFirst({ where: { id: data.clientId, organizationId }, include: { partners: true } }),
    prisma.contractTemplate.findFirst({ where: { id: data.templateId, organizationId } }),
  ]);
  if (!client || !template) throw new Error("Cliente ou modelo de contrato não encontrado");

  const content = fillContractTemplate(template.content, {
    legalName: client.legalName,
    cnpj: client.cnpj,
    address: client.address ? `${client.address}, ${client.addressNumber ?? "s/n"}` : null,
    city: client.city,
    state: client.state,
    responsibleName: client.partners[0]?.name ?? null,
    responsibleCpf: client.partners[0]?.cpf ?? null,
    monthlyValue: data.monthlyValue ?? null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    dueDay: data.dueDay ?? null,
    servicesDescription: data.services.map((s) => s.description).join(", "),
  });

  const previousVersion = data.previousVersionId
    ? await prisma.contract.findUnique({ where: { id: data.previousVersionId } })
    : await prisma.contract.findFirst({ where: { clientId: data.clientId }, orderBy: { version: "desc" } });

  const contract = await prisma.contract.create({
    data: {
      organizationId,
      clientId: data.clientId,
      templateId: data.templateId,
      version: (previousVersion?.version ?? 0) + 1,
      previousVersionId: previousVersion?.id,
      content,
      status: "GERADO",
      type: data.type,
      monthlyValue: data.monthlyValue ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDay: data.dueDay ?? null,
      generatedAt: new Date(),
      createdBy: session.user.id,
      services: {
        create: data.services.map((s) => ({ description: s.description, value: s.value ?? null })),
      },
    },
  });

  await logAudit({
    organizationId,
    userId: session.user.id,
    clientId: data.clientId,
    entityType: "Contract",
    entityId: contract.id,
    action: "CREATE",
  });

  revalidatePath("/contratos");
  revalidatePath(`/clientes/${data.clientId}`);
  return contract.id;
}

export async function generateContractAndRedirect(input: z.infer<typeof generateSchema>) {
  const id = await generateContract(input);
  redirect(`/contratos/${id}`);
}

export async function updateContractContent(id: string, content: string) {
  const session = await requirePermission("contracts.manage");
  const contract = await prisma.contract.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!contract) throw new Error("Contrato não encontrado");
  await prisma.contract.update({ where: { id }, data: { content } });
  revalidatePath(`/contratos/${id}`);
}

export async function sendContractForSignature(id: string) {
  const session = await requirePermission("contracts.manage");
  const contract = await prisma.contract.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { client: { include: { partners: true } } },
  });
  if (!contract) throw new Error("Contrato não encontrado");

  const provider = getSignatureProvider();
  const result = await provider.sendForSignature({
    contractId: contract.id,
    documentContent: contract.content,
    signerName: contract.client.partners[0]?.name ?? contract.client.legalName,
    signerEmail: contract.client.email,
  });

  await prisma.contract.update({
    where: { id },
    data: {
      status: "ENVIADO",
      sentAt: new Date(),
      externalSignatureProvider: provider.name,
      externalSignatureId: result.externalId,
    },
  });

  revalidatePath(`/contratos/${id}`);
  return result.message;
}

export async function changeContractStatus(id: string, status: ContractStatus) {
  const session = await requirePermission("contracts.manage");
  const contract = await prisma.contract.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!contract) throw new Error("Contrato não encontrado");

  await prisma.contract.update({
    where: { id },
    data: {
      status,
      viewedAt: status === "VISUALIZADO" ? new Date() : contract.viewedAt,
      signedAt: status === "ASSINADO" ? new Date() : contract.signedAt,
      cancelledAt: status === "CANCELADO" ? new Date() : contract.cancelledAt,
    },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId: contract.clientId,
    entityType: "Contract",
    entityId: id,
    action: "STATUS_CHANGE",
    field: "status",
    oldValue: contract.status,
    newValue: status,
  });

  // Automação seção 76: contrato assinado -> cliente ativo
  if (status === "ASSINADO") {
    const client = await prisma.client.update({
      where: { id: contract.clientId },
      data: { status: "ATIVO" },
    });
    if (contract.createdBy) {
      await prisma.notification.create({
        data: {
          organizationId: session.user.organizationId,
          userId: contract.createdBy,
          title: `Contrato assinado: ${client.legalName}`,
          body: "O cliente foi automaticamente marcado como ativo.",
          link: `/contratos/${id}`,
        },
      });
    }
  }

  revalidatePath(`/contratos/${id}`);
  revalidatePath("/contratos");
  revalidatePath(`/clientes/${contract.clientId}`);
}
