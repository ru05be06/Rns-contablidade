"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDateTimeBR } from "@/lib/utils";
import { addComment } from "@/app/(app)/tarefas/actions";

interface Comment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export function TaskComments({ taskId, comments }: { taskId: string; comments: Comment[] }) {
  const [list, setList] = useState(comments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      await addComment(taskId, body.trim());
      setList((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, authorName: "Você", body: body.trim(), createdAt: new Date().toISOString() },
      ]);
      setBody("");
      toast.success("Comentário adicionado");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {list.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px]">{initials(c.authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-md bg-muted/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">{c.authorName}</p>
                <p className="text-[10px] text-muted-foreground">{formatDateTimeBR(c.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm whitespace-pre-line">{c.body}</p>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva um comentário... use @nome para mencionar"
          rows={2}
          className="flex-1"
        />
        <Button size="icon" disabled={isPending || !body.trim()} onClick={submit}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
