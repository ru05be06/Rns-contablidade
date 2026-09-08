import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ContractTemplatesManager } from "@/components/contratos/contract-templates-manager";

export default async function ContractTemplatesPage() {
  const session = await requirePermission("contracts.manage");
  const templates = await prisma.contractTemplate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Modelos de contrato" description="Modelos com variáveis preenchidas automaticamente ao gerar um contrato." />
      <ContractTemplatesManager
        templates={templates.map((t) => ({ id: t.id, name: t.name, content: t.content, active: t.active }))}
      />
    </div>
  );
}
