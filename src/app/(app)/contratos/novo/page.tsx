import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { GenerateContractForm } from "@/components/contratos/generate-contract-form";

export default async function NovoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await requirePermission("contracts.manage");
  const params = await searchParams;
  const organizationId = session.user.organizationId;

  const [clients, templates] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId, deletedAt: null },
      include: { services: { include: { serviceCatalogItem: true }, where: { active: true } } },
      orderBy: { legalName: "asc" },
    }),
    prisma.contractTemplate.findMany({ where: { organizationId, active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Gerar contrato" description="Selecione o cliente, o modelo e os serviços contratados." />
      <GenerateContractForm
        clients={clients.map((c) => ({
          id: c.id,
          name: c.tradeName || c.legalName,
          monthlyFee: c.monthlyFee ? Number(c.monthlyFee) : null,
          feeDueDay: c.feeDueDay,
          services: c.services.map((s) => ({
            name: s.serviceCatalogItem.name,
            value: s.value ? Number(s.value) : null,
          })),
        }))}
        templates={templates.map((t) => ({ id: t.id, name: t.name, content: t.content }))}
        defaultClientId={params.clientId}
      />
    </div>
  );
}
