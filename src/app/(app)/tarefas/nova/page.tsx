import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { NewTaskForm } from "@/components/tarefas/new-task-form";

export default async function NovaTarefaPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await requirePermission("tasks.manage");
  const params = await searchParams;
  const organizationId = session.user.organizationId;

  const [clients, departments, users] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, legalName: true, tradeName: true },
      orderBy: { legalName: "asc" },
    }),
    prisma.department.findMany({ where: { organizationId, active: true }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { organizationId, active: true, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Nova tarefa" description="Crie uma tarefa avulsa para a equipe." />
      <NewTaskForm clients={clients} departments={departments} users={users} defaultClientId={params.clientId} />
    </div>
  );
}
