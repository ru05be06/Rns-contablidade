import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const EXAMPLES = [
  "Quais clientes possuem tarefas atrasadas hoje?",
  "Quais obrigações vencem nesta semana?",
  "Liste clientes inadimplentes há mais de 30 dias.",
  "Crie uma mensagem cobrando documentos da Empresa ABC.",
  "Mostre os funcionários com mais tarefas atrasadas.",
];

/** Preparado para integração futura via API com modelos de IA — seção 49/50. */
export function AiAssistantCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <CardTitle>Assistente IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant="outline">Em preparação</Badge>
        <p className="text-sm text-muted-foreground">
          Estrutura pronta para integração com um provedor de IA (defina{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">AI_PROVIDER_API_KEY</code> no ambiente). Quando
          ativado, permitirá perguntas em linguagem natural sobre o escritório:
        </p>
        <ul className="space-y-1.5">
          {EXAMPLES.map((ex) => (
            <li key={ex} className="rounded-md bg-muted/40 px-3 py-2 text-xs">
              &ldquo;{ex}&rdquo;
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
