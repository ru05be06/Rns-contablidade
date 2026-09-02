import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DELAY_REASON_LABELS } from "@/lib/labels";

interface DelayLogRow {
  id: string;
  taskTitle: string;
  departmentName: string;
  clientName: string;
  reason: string;
  daysLate: number | null;
  reportedByName: string;
}

/** Mapa de Atrasos — seção 93 do escopo: distingue atraso do cliente x operacional. */
export function DelayMap({ logs }: { logs: DelayLogRow[] }) {
  const byReason = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.reason] = (acc[l.reason] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(DELAY_REASON_LABELS).map(([key, label]) => (
          <Card key={key}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-semibold">{byReason[key] ?? 0}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de atraso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Dias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{l.taskTitle}</TableCell>
                  <TableCell className="text-sm">{l.departmentName}</TableCell>
                  <TableCell className="text-sm">{l.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{DELAY_REASON_LABELS[l.reason] ?? l.reason}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{l.daysLate ?? "—"}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum atraso registrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
