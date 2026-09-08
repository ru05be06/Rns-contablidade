import Link from "next/link";
import { FileText } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeBR } from "@/lib/utils";

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const session = await requirePermission("documents.view");
  const params = await searchParams;
  const organizationId = session.user.organizationId;

  const documents = await prisma.document.findMany({
    where: {
      organizationId,
      deletedAt: null,
      ...(params.category ? { category: params.category } : {}),
      ...(params.q
        ? { fileName: { contains: params.q, mode: "insensitive" } }
        : {}),
    },
    include: { client: { select: { id: true, legalName: true, tradeName: true } }, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const categories = Array.from(new Set(documents.map((d) => d.category)));

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Central de documentos de todos os clientes. Acesse a página de cada cliente para enviar novos arquivos."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/documentos">
          <Badge variant={!params.category ? "default" : "outline"}>Todos</Badge>
        </Link>
        {categories.map((c) => (
          <Link key={c} href={`/documentos?category=${encodeURIComponent(c)}`}>
            <Badge variant={params.category === c ? "default" : "outline"}>{c}</Badge>
          </Link>
        ))}
      </div>
      <div className="divide-y rounded-lg border bg-background">
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:underline">
                  {d.fileName}
                </a>
                <p className="text-xs text-muted-foreground">
                  <Link href={`/clientes/${d.client.id}`} className="hover:underline">
                    {d.client.tradeName || d.client.legalName}
                  </Link>
                  {" · "}
                  {d.uploadedBy?.name ?? "—"} · {formatDateTimeBR(d.createdAt)}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {d.category}
            </Badge>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum documento encontrado.</p>
        )}
      </div>
    </div>
  );
}
