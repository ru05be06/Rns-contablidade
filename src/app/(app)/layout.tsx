import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const overdueCount = await prisma.task.count({
    where: {
      organizationId: session.user.organizationId,
      deletedAt: null,
      status: { notIn: ["CONCLUIDA", "CANCELADA"] },
      officialDueDate: { lt: new Date() },
    },
  });

  return (
    <AppShell
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        roleName: session.user.roleName,
        permissions: session.user.permissions,
      }}
      organizationName={session.user.organizationName}
      overdueCount={overdueCount}
    >
      {children}
    </AppShell>
  );
}
