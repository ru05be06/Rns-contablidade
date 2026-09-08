import { prisma } from "@/lib/prisma";
import { DocumentsUploader } from "@/components/documentos/documents-uploader";
import { DocumentsList } from "@/components/documentos/documents-list";

const CATEGORIES = ["Fiscal", "Contábil", "DP", "Contratos", "Guias", "Declarações", "Certidões", "Societários"];

export async function DocumentsTab({ clientId, organizationId }: { clientId: string; organizationId: string }) {
  const documents = await prisma.document.findMany({
    where: { clientId, organizationId, deletedAt: null },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <DocumentsUploader clientId={clientId} categories={CATEGORIES} />
      <DocumentsList
        documents={documents.map((d) => ({
          id: d.id,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          category: d.category,
          fileSize: d.fileSize,
          uploadedByName: d.uploadedBy?.name ?? null,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
