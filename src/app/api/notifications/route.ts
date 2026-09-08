import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { organizationId: session.user.organizationId, userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      read: false,
    },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await prisma.notification.updateMany({
      where: {
        id: body.id,
        organizationId: session.user.organizationId,
        userId: session.user.id,
      },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
