import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "@/lib/labels";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";
import { ContractEditor } from "@/components/contratos/contract-editor";
import { ContractActions } from "@/components/contratos/contract-actions";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("contracts.view");

  const contract = await prisma.contract.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      client: { select: { id: true, legalName: true, tradeName: true } },
      services: true,
    },
  });
  if (!contract) notFound();

  const versions = await prisma.contract.findMany({
    where: { clientId: contract.clientId },
    orderBy: { version: "desc" },
    select: { id: true, version: true, type: true, status: true, createdAt: true },
  });

  const canManage = session.user.permissions.includes("contracts.manage");

  return (
    <div>
      <PageHeader
        title={`Contrato — ${contract.client.tradeName || contract.client.legalName}`}
        description={`Versão ${contract.version} · ${contract.type}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/contratos/${contract.id}/pdf`} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" /> Baixar PDF
              </a>
            </Button>
            <Link href={`/clientes/${contract.client.id}`} className="text-sm text-primary hover:underline self-center">
              Ver cliente
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Conteúdo do contrato</CardTitle>
              <StatusBadge status={contract.status} labels={CONTRACT_STATUS_LABELS} colors={CONTRACT_STATUS_COLORS} />
            </CardHeader>
            <CardContent>
              <ContractEditor
                contractId={contract.id}
                content={contract.content}
                canEdit={canManage && contract.status !== "ASSINADO" && contract.status !== "CANCELADO"}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Valor mensal" value={formatCurrencyBRL(contract.monthlyValue ? Number(contract.monthlyValue) : 0)} />
              <Row label="Vigência" value={formatDateBR(contract.startDate)} />
              <Row label="Dia de vencimento" value={contract.dueDay ? `Dia ${contract.dueDay}` : "—"} />
              <Row label="Gerado em" value={formatDateBR(contract.generatedAt)} />
              <Row label="Enviado em" value={formatDateBR(contract.sentAt)} />
              <Row label="Assinado em" value={formatDateBR(contract.signedAt)} />
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <ContractActions contractId={contract.id} status={contract.status} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Histórico de versões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {versions.map((v) => (
                <Link
                  key={v.id}
                  href={`/contratos/${v.id}`}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 ${v.id === contract.id ? "border-primary bg-primary/5" : ""}`}
                >
                  <span>
                    v{v.version} — {v.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateBR(v.createdAt)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
