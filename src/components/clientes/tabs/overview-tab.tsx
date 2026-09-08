import Link from "next/link";
import type { Client, Contract } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "@/lib/labels";
import { formatDateBR } from "@/lib/utils";

export function OverviewTab({
  client,
  latestContract,
  taxRegimeLabel,
}: {
  client: Client;
  latestContract: Contract | null;
  taxRegimeLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Info label="Código interno" value={client.code} />
          <Info label="Regime tributário" value={taxRegimeLabel} />
          <Info label="Inscrição Estadual" value={client.stateRegistration} />
          <Info label="Inscrição Municipal" value={client.municipalRegistration} />
          <Info label="CNAE principal" value={client.mainCnae} />
          <Info label="Data de abertura" value={formatDateBR(client.foundationDate)} />
          <Info label="Entrada no escritório" value={formatDateBR(client.onboardingDate)} />
          <Info
            label="Endereço"
            value={
              client.address
                ? `${client.address}, ${client.addressNumber ?? "s/n"} — ${client.neighborhood ?? ""}, ${client.city}/${client.state}`
                : null
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contrato atual</CardTitle>
        </CardHeader>
        <CardContent>
          {latestContract ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge
                  status={latestContract.status}
                  labels={CONTRACT_STATUS_LABELS}
                  colors={CONTRACT_STATUS_COLORS}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span>v{latestContract.version}</span>
              </div>
              <Link href={`/contratos/${latestContract.id}`} className="mt-2 inline-block text-primary hover:underline">
                Ver contrato completo
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum contrato gerado ainda.</p>
          )}
        </CardContent>
      </Card>

      {client.notes && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
