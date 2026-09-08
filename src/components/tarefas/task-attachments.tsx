"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Paperclip, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadTaskAttachment } from "@/app/(app)/tarefas/actions";

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedByName: string | null;
}

export function TaskAttachments({ taskId, attachments }: { taskId: string; attachments: Attachment[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {attachments.map((a) => (
        <a
          key={a.id}
          href={a.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{a.fileName}</span>
        </a>
      ))}
      {attachments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum anexo.</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.set("taskId", taskId);
          formData.set("file", file);
          startTransition(async () => {
            try {
              await uploadTaskAttachment(formData);
              toast.success("Arquivo anexado");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Erro ao anexar arquivo");
            } finally {
              if (inputRef.current) inputRef.current.value = "";
            }
          });
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4" /> {isPending ? "Enviando..." : "Anexar arquivo"}
      </Button>
    </div>
  );
}
