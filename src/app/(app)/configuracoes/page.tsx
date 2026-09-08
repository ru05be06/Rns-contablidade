import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettingsForm } from "@/components/configuracoes/organization-settings-form";
import { IntegrationsStatus } from "@/components/configuracoes/integrations-status";
import { AuditLogViewer } from "@/components/configuracoes/audit-log-viewer";

export default async function ConfiguracoesPage() {
  const session = await requirePermission("settings.manage");
  const organizationId = session.user.organizationId;

  const [organization, auditLogs] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    prisma.auditLog.findMany({
      where: { organizationId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Configurações" description="Dados do escritório, integrações e auditoria." />
      <Tabs defaultValue="escritorio">
        <TabsList>
          <TabsTrigger value="escritorio">Dados do escritório</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="escritorio">
          <OrganizationSettingsForm
            organization={{
              name: organization.name,
              primaryColor: organization.primaryColor ?? "#0f172a",
              timezone: organization.timezone,
              currency: organization.currency,
            }}
          />
        </TabsContent>
        <TabsContent value="integracoes">
          <IntegrationsStatus />
        </TabsContent>
        <TabsContent value="auditoria">
          <AuditLogViewer
            logs={auditLogs.map((l) => ({
              id: l.id,
              userName: l.user?.name ?? "Sistema",
              entityType: l.entityType,
              action: l.action,
              field: l.field,
              oldValue: l.oldValue,
              newValue: l.newValue,
              createdAt: l.createdAt.toISOString(),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
