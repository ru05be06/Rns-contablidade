import { prisma } from "@/lib/prisma";

interface AuditParams {
  organizationId: string;
  userId?: string | null;
  clientId?: string | null;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

/** Registra uma entrada de auditoria — nunca lança erro para não quebrar a operação principal. */
export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId ?? null,
        clientId: params.clientId ?? null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        field: params.field,
        oldValue: params.oldValue ?? null,
        newValue: params.newValue ?? null,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar auditoria", error);
  }
}
