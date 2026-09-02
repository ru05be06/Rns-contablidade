import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ServiceForm } from "@/components/servicos/service-form";

export default async function NovoServicoPage() {
  const session = await requirePermission("services.manage");
  const [departments, checklistTemplates] = await Promise.all([
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

  return (
    <div>
      <PageHeader title="Novo serviço" description="Cadastre um serviço no catálogo do escritório." />
      <ServiceForm departments={departments} checklistTemplates={checklistTemplates} />
    </div>
  );
}
