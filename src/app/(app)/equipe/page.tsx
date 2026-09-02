import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/equipe/users-tab";
import { DepartmentsTab } from "@/components/equipe/departments-tab";
import { RolesTab } from "@/components/equipe/roles-tab";

export default async function EquipePage() {
  const session = await requirePermission("team.view");
  const organizationId = session.user.organizationId;

  const [users, departments, roles] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId, deletedAt: null },
      include: { role: true, departments: { include: { department: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { organizationId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.role.findMany({
      where: { organizationId },
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const canManage = session.user.permissions.includes("team.manage");

  return (
    <div>
      <PageHeader title="Equipe" description="Usuários, departamentos e perfis de acesso do escritório." />
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
          <TabsTrigger value="perfis">Perfis de acesso</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <UsersTab
            users={users.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              active: u.active,
              roleId: u.roleId,
              roleName: u.role.name,
              departmentIds: u.departments.map((d) => d.departmentId),
              departmentNames: u.departments.map((d) => d.department.name),
            }))}
            roles={roles.map((r) => ({ id: r.id, name: r.name }))}
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="departamentos">
          <DepartmentsTab
            departments={departments.map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              color: d.color,
              active: d.active,
              userCount: d._count.users,
            }))}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value="perfis">
          <RolesTab
            roles={roles.map((r) => ({
              id: r.id,
              name: r.name,
              description: r.description,
              permissions: r.permissions,
              isSystem: r.isSystem,
              userCount: r._count.users,
            }))}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
