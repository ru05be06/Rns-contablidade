"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  roleId: z.string().min(1, "Selecione um perfil"),
  departmentIds: z.array(z.string()).optional(),
  password: z.string().optional(),
});

export async function saveUser(input: z.infer<typeof userSchema>) {
  const session = await requirePermission("team.manage");
  const data = userSchema.parse(input);
  const organizationId = session.user.organizationId;

  const role = await prisma.role.findFirst({ where: { id: data.roleId, organizationId } });
  if (!role) throw new Error("Perfil de acesso inválido");

  if (data.id) {
    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      roleId: data.roleId,
    };
    if (data.password && data.password.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    const { count } = await prisma.user.updateMany({
      where: { id: data.id, organizationId },
      data: updateData,
    });
    if (count === 0) throw new Error("Usuário não encontrado");

    if (data.departmentIds) {
      await prisma.userDepartment.deleteMany({ where: { userId: data.id } });
      await prisma.userDepartment.createMany({
        data: data.departmentIds.map((departmentId) => ({ userId: data.id!, departmentId })),
      });
    }

    await logAudit({
      organizationId,
      userId: session.user.id,
      entityType: "User",
      entityId: data.id,
      action: "UPDATE",
    });
  } else {
    if (!data.password || data.password.length < 6) {
      throw new Error("Defina uma senha com ao menos 6 caracteres");
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        organizationId,
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        roleId: data.roleId,
        passwordHash,
        departments: {
          create: (data.departmentIds ?? []).map((departmentId) => ({ departmentId })),
        },
      },
    });
    await logAudit({
      organizationId,
      userId: session.user.id,
      entityType: "User",
      entityId: user.id,
      action: "CREATE",
    });
  }

  revalidatePath("/equipe");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const session = await requirePermission("team.manage");
  await prisma.user.updateMany({
    where: { id: userId, organizationId: session.user.organizationId },
    data: { active },
  });
  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    entityType: "User",
    entityId: userId,
    action: "STATUS_CHANGE",
    field: "active",
    newValue: String(active),
  });
  revalidatePath("/equipe");
}

const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function saveDepartment(input: z.infer<typeof departmentSchema>) {
  const session = await requirePermission("team.manage");
  const data = departmentSchema.parse(input);
  const organizationId = session.user.organizationId;

  if (data.id) {
    await prisma.department.updateMany({
      where: { id: data.id, organizationId },
      data: { name: data.name, description: data.description, color: data.color },
    });
  } else {
    await prisma.department.create({
      data: {
        organizationId,
        name: data.name,
        description: data.description,
        color: data.color || "#6366f1",
      },
    });
  }
  revalidatePath("/equipe");
}

export async function toggleDepartmentActive(id: string, active: boolean) {
  const session = await requirePermission("team.manage");
  await prisma.department.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: { active },
  });
  revalidatePath("/equipe");
}

const roleSchema = z.object({
  id: z.string().optional(),
  key: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

export async function saveRole(input: z.infer<typeof roleSchema>) {
  const session = await requirePermission("team.manage");
  const data = roleSchema.parse(input);
  const organizationId = session.user.organizationId;
  const validPermissions = data.permissions.filter((p) => ALL_PERMISSION_KEYS.includes(p));

  if (data.id) {
    await prisma.role.updateMany({
      where: { id: data.id, organizationId },
      data: { name: data.name, description: data.description, permissions: validPermissions },
    });
  } else {
    const key = (data.name || "CUSTOM")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .slice(0, 40);
    await prisma.role.create({
      data: {
        organizationId,
        key: `${key}_${Date.now().toString(36).toUpperCase()}`,
        name: data.name,
        description: data.description,
        permissions: validPermissions,
      },
    });
  }
  revalidatePath("/equipe");
}

export async function deleteRole(id: string) {
  const session = await requirePermission("team.manage");
  const role = await prisma.role.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return;
  if (role.isSystem) throw new Error("Perfis padrão do sistema não podem ser excluídos");
  if (role._count.users > 0) throw new Error("Existem usuários vinculados a este perfil");
  await prisma.role.delete({ where: { id } });
  revalidatePath("/equipe");
}
