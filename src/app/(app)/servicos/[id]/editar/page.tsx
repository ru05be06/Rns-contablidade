import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ServiceForm } from "@/components/servicos/service-form";

export default async function EditarServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("services.manage");

  const [service, departments, checklistTemplates] = await Promise.all([
    prisma.serviceCatalogItem.findFirst({ where: { id, organizationId: session.user.organizationId } }),
    prisma.department.findMany({
      where: { organizationId: session.user.organizationId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.checklistTemplate.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!service) notFound();

  return (
    <div>
      <PageHeader title={`Editar serviço — ${service.name}`} />
      <ServiceForm
        departments={departments}
        checklistTemplates={checklistTemplates}
        service={{
          id: service.id,
          name: service.name,
          category: service.category ?? "",
          description: service.description ?? "",
          departmentId: service.departmentId ?? "",
          periodicity: service.periodicity,
          defaultValue: service.defaultValue ? Number(service.defaultValue) : undefined,
          slaDays: service.slaDays ?? undefined,
          internalDeadlineDay: service.internalDeadlineDay ?? undefined,
          defaultDeadlineDay: service.defaultDeadlineDay ?? undefined,
          checklistTemplateId: service.checklistTemplateId ?? "",
        }}
      />
    </div>
  );
}
