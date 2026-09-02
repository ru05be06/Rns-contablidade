"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { runTaskDeadlineAutomations } from "@/lib/automation-engine";

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  trigger: z.string(),
  daysAhead: z.number().optional(),
  active: z.boolean().default(true),
});

export async function saveAutomationRule(input: z.infer<typeof ruleSchema>) {
  const session = await requirePermission("settings.manage");
  const data = ruleSchema.parse(input);
  const organizationId = session.user.organizationId;

  const conditions = data.trigger === "TASK_DUE_SOON" ? { daysAhead: data.daysAhead ?? 3 } : undefined;
  const actions =
    data.trigger === "TASK_OVERDUE"
      ? { type: "MARK_OVERDUE_AND_NOTIFY" }
      : data.trigger === "TASK_DUE_SOON"
      ? { type: "NOTIFY_ASSIGNEE" }
      : data.trigger === "CONTRACT_SIGNED"
      ? { type: "ACTIVATE_CLIENT" }
      : data.trigger === "RECEIVABLE_PAID"
      ? { type: "MARK_RECEIVED" }
      : { type: "GENERATE_TASKS" };

  if (data.id) {
    await prisma.automationRule.updateMany({
      where: { id: data.id, organizationId },
      data: { name: data.name, trigger: data.trigger, conditions, actions, active: data.active },
    });
  } else {
    await prisma.automationRule.create({
      data: {
        organizationId,
        name: data.name,
        trigger: data.trigger,
        conditions,
        actions,
        active: data.active,
      },
    });
  }
  revalidatePath("/automacao");
}

export async function toggleAutomationRule(id: string, active: boolean) {
  const session = await requirePermission("settings.manage");
  await prisma.automationRule.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data: { active },
  });
  revalidatePath("/automacao");
}

export async function deleteAutomationRule(id: string) {
  const session = await requirePermission("settings.manage");
  await prisma.automationRule.deleteMany({ where: { id, organizationId: session.user.organizationId } });
  revalidatePath("/automacao");
}

export async function runAutomationsNow() {
  const session = await requirePermission("settings.manage");
  const result = await runTaskDeadlineAutomations(session.user.organizationId);
  revalidatePath("/automacao");
  return result;
}
