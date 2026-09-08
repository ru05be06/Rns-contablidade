"use server";

import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Armazenamento local em disco (public/uploads) — camada isolada para permitir
 * troca futura por Supabase Storage / S3 sem alterar o restante do sistema.
 */
export async function uploadDocument(formData: FormData) {
  const session = await requirePermission("documents.manage");
  const clientId = String(formData.get("clientId") || "");
  const category = String(formData.get("category") || "Fiscal");
  const file = formData.get("file") as File | null;

  if (!clientId || !file || file.size === 0) {
    throw new Error("Selecione um arquivo válido");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Arquivo maior que 20MB");
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: session.user.organizationId },
  });
  if (!client) throw new Error("Cliente não encontrado");

  const dir = path.join(UPLOAD_ROOT, session.user.organizationId, clientId);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  const fileUrl = `/uploads/${session.user.organizationId}/${clientId}/${storedName}`;

  const document = await prisma.document.create({
    data: {
      organizationId: session.user.organizationId,
      clientId,
      category,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedById: session.user.id,
    },
  });

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId,
    entityType: "Document",
    entityId: document.id,
    action: "CREATE",
    newValue: file.name,
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/documentos");
}

export async function deleteDocument(documentId: string) {
  const session = await requirePermission("documents.manage");
  const document = await prisma.document.findFirst({
    where: { id: documentId, organizationId: session.user.organizationId },
  });
  if (!document) return;

  await prisma.document.update({ where: { id: documentId }, data: { deletedAt: new Date() } });

  try {
    await unlink(path.join(process.cwd(), "public", document.fileUrl));
  } catch {
    // arquivo já pode não existir em disco; ignoramos silenciosamente
  }

  await logAudit({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    clientId: document.clientId,
    entityType: "Document",
    entityId: documentId,
    action: "DELETE",
  });

  revalidatePath(`/clientes/${document.clientId}`);
  revalidatePath("/documentos");
}
