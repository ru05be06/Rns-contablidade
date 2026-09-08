import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogTable } from "@/components/servicos/catalog-table";
import { ChecklistLibrary } from "@/components/servicos/checklist-library";

export default async function ServicosPage() {
  const session = await requirePermission("services.view");
  const organizationId = session.user.organizationId;

  const [services, checklistTemplates] = await Promise.all([
    prisma.serviceCatalogItem.findMany({
      where: { organizationId },
      include: { department: true, checklistTemplate: true, _count: { select: { clientServices: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.checklistTemplate.findMany({
      where: { organizationId },
      include: { items: { orderBy: { order: "asc" } }, _count: { select: { serviceCatalogItems: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const canManage = session.user.permissions.includes("services.manage");

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços contábeis e biblioteca de checklists do escritório."
        actions={
          canManage && (
            <Button asChild size="sm">
              <Link href="/servicos/novo">
                <Plus className="h-4 w-4" /> Novo serviço
              </Link>
            </Button>
          )
        }
      />
      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo de serviços</TabsTrigger>
          <TabsTrigger value="checklists">Modelos de checklist</TabsTrigger>
        </TabsList>
        <TabsContent value="catalogo">
          <CatalogTable
            services={services.map((s) => ({
              id: s.id,
              code: s.code,
              name: s.name,
              category: s.category,
              departmentName: s.department?.name ?? null,
              periodicity: s.periodicity,
              defaultValue: s.defaultValue ? Number(s.defaultValue) : null,
              checklistTemplateName: s.checklistTemplate?.name ?? null,
              slaDays: s.slaDays,
              active: s.active,
              clientCount: s._count.clientServices,
            }))}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="checklists">
          <ChecklistLibrary
            templates={checklistTemplates.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              usageCount: t._count.serviceCatalogItems,
              items: t.items.map((i) => ({
                id: i.id,
                description: i.description,
                required: i.required,
                requiresDocument: i.requiresDocument,
              })),
            }))}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
