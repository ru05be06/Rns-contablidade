import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { syncReceivableStatuses } from "@/lib/receivables";
import { PageHeader } from "@/components/page-header";
import { InadimplenciaList } from "@/components/financeiro/inadimplencia-list";

export default async function InadimplenciaPage() {
  const session = await requirePermission("financeiro.view");
  const organizationId = session.user.organizationId;
  await syncReceivableStatuses(organizationId);

  const receivables = await prisma.receivable.findMany({
    where: { organizationId, status: "VENCIDO" },
    include: {
      client: { select: { id: true, legalName: true, tradeName: true, cnpj: true, phone: true, whatsapp: true, email: true } },
      collectionLogs: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { dueDate: "asc" },
  });

  const canManage = session.user.permissions.includes("financeiro.manage");

  return (
    <div>
      <PageHeader title="Central de Inadimplência" description="Clientes com cobranças vencidas e histórico de contato." />
      <InadimplenciaList
        items={receivables.map((r) => ({
          id: r.id,
          clientName: r.client.tradeName || r.client.legalName,
          cnpj: r.client.cnpj,
          phone: r.client.phone,
          whatsapp: r.client.whatsapp,
          email: r.client.email,
          amount: Number(r.amount),
          dueDate: r.dueDate.toISOString(),
          logs: r.collectionLogs.map((l) => ({
            id: l.id,
            note: l.note,
            channel: l.channel,
            createdAt: l.createdAt.toISOString(),
          })),
        }))}
        canManage={canManage}
      />
    </div>
  );
}
