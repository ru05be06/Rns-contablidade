"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeBR } from "@/lib/utils";
import { deleteDocument } from "@/app/(app)/documentos/actions";

interface DocumentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  category: string;
  fileSize: number | null;
  uploadedByName: string | null;
  createdAt: string;
}

export function DocumentsList({ documents }: { documents: DocumentItem[] }) {
  const [isPending, startTransition] = useTransition();

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>;
  }

  return (
    <div className="divide-y rounded-lg border bg-background">
      {documents.map((d) => (
        <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {d.uploadedByName ?? "—"} · {formatDateTimeBR(d.createdAt)}
                {d.fileSize ? ` · ${(d.fileSize / 1024).toFixed(0)} KB` : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline">{d.category}</Badge>
            <Button variant="ghost" size="icon" asChild>
              <a href={d.fileUrl} target="_blank" rel="noreferrer" download>
                <Download className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteDocument(d.id);
                  toast.success("Documento removido");
                });
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
