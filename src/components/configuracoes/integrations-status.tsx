import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const INTEGRATIONS = [
  { key: "WHATSAPP_API_TOKEN", name: "WhatsApp Business API", description: "Envio de lembretes, guias e cobranças." },
  { key: "EMAIL_SMTP_HOST", name: "E-mail (SMTP)", description: "Envio de guias, documentos e avisos por e-mail." },
  { key: "SIGNATURE_PROVIDER", name: "Assinatura digital", description: "ZapSign, Clicksign, D4Sign ou DocuSign." },
  { key: "AI_PROVIDER_API_KEY", name: "Assistente de IA", description: "Resumos, sugestões e comandos em linguagem natural." },
  { key: "NEXT_PUBLIC_SUPABASE_URL", name: "Armazenamento em nuvem (Supabase)", description: "Alternativa ao armazenamento local de documentos." },
];

/** Painel somente leitura — nunca expõe o valor das chaves, apenas se estão configuradas. */
export function IntegrationsStatus() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {INTEGRATIONS.map((i) => {
        const configured = Boolean(process.env[i.key]);
        return (
          <Card key={i.key}>
            <CardContent className="flex items-start gap-3 p-4">
              {configured ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.description}</p>
                <p className="mt-1 text-xs">
                  {configured ? (
                    <span className="text-success">Configurado</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Não configurado — defina <code className="rounded bg-muted px-1">{i.key}</code> no .env
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
