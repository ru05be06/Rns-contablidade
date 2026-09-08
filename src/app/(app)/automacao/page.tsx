import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { AutomationRulesManager } from "@/components/automacao/automation-rules-manager";
import { AiAssistantCard } from "@/components/automacao/ai-assistant-card";

export default async function AutomacaoPage() {
  const session = await requirePermission("settings.manage");
  const rules = await prisma.automationRule.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Automação"
        description="Motor de regras do escritório — notificações e ações automáticas configuráveis."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AutomationRulesManager
            rules={rules.map((r) => ({
              id: r.id,
              name: r.name,
              trigger: r.trigger,
              active: r.active,
              daysAhead: (r.conditions as { daysAhead?: number } | null)?.daysAhead,
            }))}
          />
        </div>
        <AiAssistantCard />
      </div>
    </div>
  );
}
