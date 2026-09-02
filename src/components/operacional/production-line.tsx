import { Badge } from "@/components/ui/badge";

const STAGES = [
  "Documentos recebidos",
  "Escrituração",
  "Conferência",
  "Apuração",
  "Revisão",
  "Guia emitida",
  "Envio ao cliente",
  "Concluído",
];

interface ProductionTask {
  id: string;
  title: string;
  clientName: string;
  productionStage: string | null;
  status: string;
}

/** Linha de Produção Contábil — seção 92 do escopo. */
export function ProductionLine({ tasks }: { tasks: ProductionTask[] }) {
  const grouped = STAGES.map((stage) => ({
    stage,
    tasks: tasks.filter((t) => (t.productionStage ?? "Documentos recebidos") === stage),
  }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 thin-scrollbar">
      {grouped.map((g) => (
        <div key={g.stage} className="flex w-56 shrink-0 flex-col rounded-lg border bg-muted/30 p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold">{g.stage}</p>
            <Badge variant="outline">{g.tasks.length}</Badge>
          </div>
          <div className="space-y-1.5">
            {g.tasks.slice(0, 8).map((t) => (
              <div key={t.id} className="rounded-md border bg-background p-2 text-xs">
                <p className="font-medium leading-snug">{t.title}</p>
                <p className="text-muted-foreground">{t.clientName}</p>
              </div>
            ))}
            {g.tasks.length === 0 && <p className="px-1 text-xs text-muted-foreground">Vazio</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
