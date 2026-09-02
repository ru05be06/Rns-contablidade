import { prisma } from "@/lib/prisma";

/** Gera um código sequencial com prefixo, único dentro da organização. */
async function nextSequence(
  organizationId: string,
  prefix: string,
  count: () => Promise<number>
) {
  const total = await count();
  const seq = String(total + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}

export async function generateClientCode(organizationId: string) {
  return nextSequence(organizationId, "CLI", () =>
    prisma.client.count({ where: { organizationId } })
  );
}

export async function generateTaskCode(organizationId: string) {
  return nextSequence(organizationId, "TAR", () =>
    prisma.task.count({ where: { organizationId } })
  );
}

export async function generateServiceCode(organizationId: string) {
  return nextSequence(organizationId, "SRV", () =>
    prisma.serviceCatalogItem.count({ where: { organizationId } })
  );
}
