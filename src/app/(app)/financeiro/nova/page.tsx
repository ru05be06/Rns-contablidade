import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { NewReceivableForm } from "@/components/financeiro/new-receivable-form";

export default async function NovaCobrancaPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await requirePermission("financeiro.manage");
  const params = await searchParams;

  const clients = await prisma.client.findMany({
    where: { organizationId: session.user.organizationId, deletedAt: null },
    select: { id: true, legalName: true, tradeName: true, monthlyFee: true },
    orderBy: { legalName: "asc" },
  });

  return (
    <div>
      <PageHeader title="Nova cobrança" description="Registre uma mensalidade ou cobrança extraordinária." />
      <NewReceivableForm
        clients={clients.map((c) => ({
          id: c.id,
          name: c.tradeName || c.legalName,
          monthlyFee: c.monthlyFee ? Number(c.monthlyFee) : null,
        }))}
        defaultClientId={params.clientId}
      />
    </div>
  );
}
