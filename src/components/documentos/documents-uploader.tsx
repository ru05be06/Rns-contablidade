"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadDocument } from "@/app/(app)/documentos/actions";

export function DocumentsUploader({ clientId, categories }: { clientId: string; categories: string[] }) {
  const [category, setCategory] = useState(categories[0]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const formData = new FormData();
          formData.set("clientId", clientId);
          formData.set("category", category);
          formData.set("file", file);
          startTransition(async () => {
            try {
              await uploadDocument(formData);
              toast.success("Documento enviado");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Erro ao enviar arquivo");
            } finally {
              if (inputRef.current) inputRef.current.value = "";
            }
          });
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" /> {isPending ? "Enviando..." : "Enviar documento"}
      </Button>
      <p className="text-xs text-muted-foreground">PDF, imagens ou planilhas — até 20MB.</p>
    </div>
  );
}
