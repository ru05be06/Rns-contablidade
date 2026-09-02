import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RECEIVABLE_STATUS_LABELS, RECEIVABLE_STATUS_COLORS } from "@/lib/labels";
import { formatCurrencyBRL, formatDateBR } from "@/lib/utils";

export async function FinanceTab({ clientId }: { clientId: string }) {
  const receivables = await prisma.receivable.findMany({
    where: { clientId },
    include: { payments: true },
    orderBy: { dueDate: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Link href={`/financeiro/nova?clientId=${clientId}`} className="text-sm text-primary hover:underline">
          Nova cobrança
        </Link>
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Recebido</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((r) => {
              const paid = r.payments.reduce((sum, p) => sum + Number(p.amount), 0);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.description}</TableCell>
                  <TableCell className="text-sm">{r.competence ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatDateBR(r.dueDate)}</TableCell>
                  <TableCell className="text-sm">{formatCurrencyBRL(Number(r.amount))}</TableCell>
                  <TableCell className="text-sm">{formatCurrencyBRL(paid)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} labels={RECEIVABLE_STATUS_LABELS} colors={RECEIVABLE_STATUS_COLORS} />
                  </TableCell>
                </TableRow>
              );
            })}
            {receivables.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum lançamento financeiro para este cliente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
