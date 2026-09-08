import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/clientes/client-form";

export default async function NovoClientePage() {
  const session = await requirePermission("clients.manage");
  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId, active: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Novo cliente" description="Cadastre uma nova empresa atendida pelo escritório." />
      <ClientForm users={users} />
    </div>
  );
}
