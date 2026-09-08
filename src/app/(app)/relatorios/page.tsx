import { Download } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REPORTS = [
  { type: "clientes", title: "Clientes", description: "Lista completa de clientes com regime, status e responsável." },
  { type: "servicos", title: "Serviços", description: "Catálogo de serviços e quantidade de clientes vinculados." },
  { type: "tarefas", title: "Tarefas", description: "Todas as tarefas com status e prazos." },
  { type: "tarefas-atrasadas", title: "Tarefas atrasadas", description: "Somente tarefas com status atrasado." },
  { type: "produtividade", title: "Produtividade", description: "Tarefas por colaborador e percentual de cumprimento de prazo." },
  { type: "contratos", title: "Contratos", description: "Contratos gerados, versões e status de assinatura." },
  { type: "financeiro", title: "Financeiro", description: "Todos os lançamentos de contas a receber." },
  { type: "inadimplencia", title: "Inadimplência", description: "Somente cobranças vencidas." },
];

export default async function RelatoriosPage() {
  await requirePermission("reports.view");

  return (
    <div>
      <PageHeader title="Relatórios" description="Exporte dados do escritório em CSV para análise externa." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.type}>
            <CardHeader>
              <CardTitle>{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">{r.description}</p>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/relatorios/export?type=${r.type}`}>
                  <Download className="h-4 w-4" /> Exportar CSV
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
