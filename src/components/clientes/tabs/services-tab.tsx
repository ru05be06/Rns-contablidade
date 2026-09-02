import { prisma } from "@/lib/prisma";
import { ClientServicesManager } from "@/components/servicos/client-services-manager";

export async function ServicesTab({ clientId, organizationId }: { clientId: string; organizationId: string }) {
  const [clientServices, catalogItems, users, departments] = await Promise.all([
    prisma.clientService.findMany({
      where: { clientId, active: true },
      include: {
        serviceCatalogItem: true,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceCatalogItem.findMany({
      where: { organizationId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId, active: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ClientServicesManager
      clientId={clientId}
      clientServices={clientServices.map((cs) => ({
        id: cs.id,
        serviceName: cs.serviceCatalogItem.name,
        departmentName: cs.department?.name ?? null,
        periodicity: cs.periodicity,
        value: cs.value ? Number(cs.value) : null,
        dueDay: cs.dueDay,
        internalDeadlineDay: cs.internalDeadlineDay,
        billingType: cs.billingType,
      }))}
      catalogItems={catalogItems.map((s) => ({
        id: s.id,
        name: s.name,
        periodicity: s.periodicity,
        defaultValue: s.defaultValue ? Number(s.defaultValue) : null,
        departmentId: s.departmentId,
        internalDeadlineDay: s.internalDeadlineDay,
        defaultDeadlineDay: s.defaultDeadlineDay,
      }))}
      users={users}
      departments={departments}
    />
  );
}
