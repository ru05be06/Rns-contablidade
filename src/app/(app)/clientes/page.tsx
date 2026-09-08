import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, TAX_REGIME_LABELS } from "@/lib/labels";
import { ClientFilters } from "@/components/clientes/client-filters";
import { formatCurrencyBRL } from "@/lib/utils";
import type { ClientStatus, TaxRegime, Prisma } from "@prisma/client";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; regime?: string }>;
}) {
  const session = await requirePermission("clients.view");
  const params = await searchParams;

  const where: Prisma.ClientWhereInput = {
    organizationId: session.user.organizationId,
    deletedAt: null,
  };

  if (params.status) where.status = params.status as ClientStatus;
  if (params.regime) where.taxRegime = params.regime as TaxRegime;
  if (params.q) {
    where.OR = [
      { legalName: { contains: params.q, mode: "insensitive" } },
      { tradeName: { contains: params.q, mode: "insensitive" } },
      { cnpj: { contains: params.q } },
      { code: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      responsibleUser: { select: { name: true } },
      _count: { select: { services: true, tasks: true } },
    },
    orderBy: { legalName: "asc" },
    take: 200,
  });

  const canManage = session.user.permissions.includes("clients.manage");

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients.length} cliente(s) encontrados`}
        actions={
          canManage && (
            <Button asChild size="sm">
              <Link href="/clientes/novo">
                <Plus className="h-4 w-4" /> Novo cliente
              </Link>
            </Button>
          )
        }
      />

      <ClientFilters />

      <div className="mt-4 rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Regime</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Serviços</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs text-muted-foreground">{c.code}</TableCell>
                <TableCell>
                  <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">
                    {c.tradeName || c.legalName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{c.cnpj || c.cpf || "—"}</p>
                </TableCell>
                <TableCell className="text-sm">{TAX_REGIME_LABELS[c.taxRegime]}</TableCell>
                <TableCell className="text-sm">{c.responsibleUser?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">{formatCurrencyBRL(c.monthlyFee ? Number(c.monthlyFee) : 0)}</TableCell>
                <TableCell className="text-sm">{c._count.services}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} labels={CLIENT_STATUS_LABELS} colors={CLIENT_STATUS_COLORS} />
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
