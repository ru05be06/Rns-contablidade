import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from "@/lib/labels";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";

export async function ContractsTab({ clientId }: { clientId: string }) {
  const contracts = await prisma.contract.findMany({
    where: { clientId },
    orderBy: { version: "desc" },
  });

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Link href={`/contratos/novo?clientId=${clientId}`} className="text-sm text-primary hover:underline">
          Gerar novo contrato
        </Link>
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
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
                    {c.type}
                  </Link>
                </TableCell>
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
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum contrato gerado para este cliente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
