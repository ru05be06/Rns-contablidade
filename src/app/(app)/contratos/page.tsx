import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "@/lib/labels";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";

export default async function ContratosPage() {
  const session = await requirePermission("contracts.view");
  const contracts = await prisma.contract.findMany({
    where: { organizationId: session.user.organizationId },
    include: { client: { select: { legalName: true, tradeName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const canManage = session.user.permissions.includes("contracts.manage");

  return (
    <div>
      <PageHeader
        title="Contratos"
        description={`${contracts.length} contrato(s)`}
        actions={
          canManage && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/contratos/modelos">
                  <Settings className="h-4 w-4" /> Modelos
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/contratos/novo">
                  <Plus className="h-4 w-4" /> Gerar contrato
                </Link>
              </Button>
            </div>
          )
        }
      />
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Valor mensal</TableHead>
              <TableHead>Gerado em</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/contratos/${c.id}`} className="font-medium hover:underline">
                    {c.client.tradeName || c.client.legalName}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{c.type}</TableCell>
                <TableCell className="text-sm">v{c.version}</TableCell>
                <TableCell className="text-sm">{formatCurrencyBRL(c.monthlyValue ? Number(c.monthlyValue) : 0)}</TableCell>
                <TableCell className="text-sm">{formatDateBR(c.generatedAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} labels={CONTRACT_STATUS_LABELS} colors={CONTRACT_STATUS_COLORS} />
                </TableCell>
              </TableRow>
            ))}
            {contracts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum contrato gerado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
