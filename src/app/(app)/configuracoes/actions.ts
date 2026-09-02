"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

const orgSchema = z.object({
  name: z.string().min(2),
  primaryColor: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

export async function saveOrganizationSettings(input: z.infer<typeof orgSchema>) {
  const session = await requirePermission("settings.manage");
  const data = orgSchema.parse(input);

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      name: data.name,
      primaryColor: data.primaryColor,
      timezone: data.timezone,
      currency: data.currency,
    },
  });

  revalidatePath("/configuracoes");
}
