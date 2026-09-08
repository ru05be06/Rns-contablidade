import { prisma } from "@/lib/prisma";
import { formatDateTimeBR } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "criou",
  UPDATE: "atualizou",
  DELETE: "excluiu",
  STATUS_CHANGE: "alterou status de",
};

export async function HistoryTab({ clientId }: { clientId: string }) {
  const logs = await prisma.auditLog.findMany({
    where: { clientId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="rounded-lg border bg-background">
      {logs.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
      )}
      <ol className="divide-y">
        {logs.map((log) => (
          <li key={log.id} className="flex items-start gap-3 px-4 py-3 text-sm">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <div>
              <p>
                <span className="font-medium">{log.user?.name ?? "Sistema"}</span>{" "}
                {ACTION_LABELS[log.action] ?? log.action.toLowerCase()} {log.entityType.toLowerCase()}
                {log.field && <> — campo <span className="font-medium">{log.field}</span></>}
                {log.oldValue && log.newValue && (
                  <>
                    {" "}
                    (<span className="text-muted-foreground">{log.oldValue}</span> →{" "}
                    <span className="font-medium">{log.newValue}</span>)
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTimeBR(log.createdAt)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
