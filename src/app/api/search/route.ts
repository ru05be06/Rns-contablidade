import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ clients: [], tasks: [], contracts: [] });

  const organizationId = session.user.organizationId;

  const [clients, tasks, contracts] = await Promise.all([
    prisma.client.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { legalName: { contains: q, mode: "insensitive" } },
          { tradeName: { contains: q, mode: "insensitive" } },
          { cnpj: { contains: q } },
          { cpf: { contains: q } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, legalName: true, tradeName: true, cnpj: true },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, code: true, status: true },
      take: 6,
    }),
    prisma.contract.findMany({
      where: {
        organizationId,
        client: { legalName: { contains: q, mode: "insensitive" } },
      },
      select: { id: true, type: true, status: true, client: { select: { legalName: true } } },
      take: 6,
    }),
  ]);

  return NextResponse.json({ clients, tasks, contracts });
}
