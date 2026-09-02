import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkloadUser {
  id: string;
  name: string;
  total: number;
  overdue: number;
  today: number;
  urgent: number;
  load: "Baixa" | "Normal" | "Alta" | "Crítica";
}

const LOAD_COLORS: Record<string, string> = {
  Baixa: "bg-success/15 text-success border-success/20",
  Normal: "bg-blue-50 text-blue-700 border-blue-200",
  Alta: "bg-warning/15 text-warning border-warning/20",
  Crítica: "bg-destructive/15 text-destructive border-destructive/20",
};

/** Carga da Equipe — seção 94 do escopo: apoia o gestor a redistribuir tarefas. */
export function TeamWorkload({ users }: { users: WorkloadUser[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {users
        .sort((a, b) => b.total - a.total)
        .map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{u.name}</p>
                <Badge variant="outline" className={cn(LOAD_COLORS[u.load])}>
                  {u.load}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-lg font-semibold">{u.total}</p>
                  <p className="text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{u.today}</p>
                  <p className="text-muted-foreground">Hoje</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-destructive">{u.overdue}</p>
                  <p className="text-muted-foreground">Atrasadas</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{u.urgent}</p>
                  <p className="text-muted-foreground">Urgentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      {users.length === 0 && <p className="text-sm text-muted-foreground">Nenhum colaborador ativo.</p>}
    </div>
  );
}
