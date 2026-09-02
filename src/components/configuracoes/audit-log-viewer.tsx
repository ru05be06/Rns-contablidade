import { formatDateTimeBR } from "@/lib/utils";

interface AuditLogRow {
  id: string;
  userName: string;
  entityType: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "criou",
  UPDATE: "atualizou",
  DELETE: "excluiu",
  STATUS_CHANGE: "alterou status de",
};

export function AuditLogViewer({ logs }: { logs: AuditLogRow[] }) {
  return (
    <div className="rounded-lg border bg-background">
      {logs.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">Nenhum evento de auditoria registrado.</p>
      )}
      <ol className="divide-y">
        {logs.map((log) => (
          <li key={log.id} className="px-4 py-2.5 text-sm">
            <span className="font-medium">{log.userName}</span> {ACTION_LABELS[log.action] ?? log.action.toLowerCase()}{" "}
            {log.entityType.toLowerCase()}
            {log.field && (
              <>
                {" "}
                — campo <span className="font-medium">{log.field}</span>
              </>
            )}
            {log.oldValue && log.newValue && (
              <>
                {" "}
                (<span className="text-muted-foreground">{log.oldValue}</span> → <span className="font-medium">{log.newValue}</span>)
              </>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTimeBR(log.createdAt)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
