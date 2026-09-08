import { NextResponse } from "next/server";
import { chromium } from "playwright-core";
import { readdirSync } from "fs";
import { join } from "path";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function findChromiumExecutable() {
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsersPath) return undefined;
  try {
    const entries = readdirSync(browsersPath).filter((e) => e.startsWith("chromium-"));
    if (entries.length === 0) return undefined;
    return join(browsersPath, entries[0], "chrome-linux", "chrome");
  } catch {
    return undefined;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const contract = await prisma.contract.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { client: { select: { legalName: true, tradeName: true } } },
  });
  if (!contract) return NextResponse.json({ error: "not found" }, { status: 404 });

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; line-height: 1.6; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 24px; font-size: 11px; }
        pre { white-space: pre-wrap; font-family: inherit; }
      </style>
    </head>
    <body>
      <h1>${contract.client.tradeName || contract.client.legalName}</h1>
      <p class="meta">Contrato v${contract.version} · ${contract.type} · Gerado em ${
        contract.generatedAt?.toLocaleDateString("pt-BR") ?? ""
      }</p>
      <pre>${escapeHtml(contract.content)}</pre>
    </body>
  </html>`;

  const executablePath = findChromiumExecutable();
  const browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
    });

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="contrato-${contract.client.tradeName || contract.client.legalName}-v${contract.version}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
