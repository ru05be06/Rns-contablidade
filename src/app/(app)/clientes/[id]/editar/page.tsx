import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/clientes/client-form";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("clients.manage");

  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!client) notFound();

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId, active: true, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title={`Editar cliente — ${client.legalName}`} />
      <ClientForm
        users={users}
        client={{
          id: client.id,
          legalName: client.legalName,
          tradeName: client.tradeName ?? "",
          cnpj: client.cnpj ?? "",
          cpf: client.cpf ?? "",
          stateRegistration: client.stateRegistration ?? "",
          municipalRegistration: client.municipalRegistration ?? "",
          mainCnae: client.mainCnae ?? "",
          taxRegime: client.taxRegime,
          status: client.status,
          foundationDate: client.foundationDate?.toISOString() ?? "",
          onboardingDate: client.onboardingDate?.toISOString() ?? "",
          responsibleUserId: client.responsibleUserId ?? "",
          phone: client.phone ?? "",
          whatsapp: client.whatsapp ?? "",
          email: client.email ?? "",
          zipCode: client.zipCode ?? "",
          address: client.address ?? "",
          addressNumber: client.addressNumber ?? "",
          addressComplement: client.addressComplement ?? "",
          neighborhood: client.neighborhood ?? "",
          city: client.city ?? "",
          state: client.state ?? "",
          notes: client.notes ?? "",
          monthlyFee: client.monthlyFee ? Number(client.monthlyFee) : undefined,
          feeDueDay: client.feeDueDay ?? undefined,
        }}
      />
    </div>
  );
}
