import Link from "next/link";
import {
  Users,
  UserPlus,
  Building2,
  PauseCircle,
  CalendarClock,
  AlarmClockOff,
  CalendarRange,
  Eye,
  Clock3,
  Wallet,
  TrendingDown,
  FileSignature,
} from "lucide-react";
import { requirePermission } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DeadlineBadge } from "@/components/deadline-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrencyBRL } from "@/lib/utils";
import { runTaskDeadlineAutomations } from "@/lib/automation-engine";
import { getDashboardData, getDepartmentBreakdown, getTeamWorkload } from "./queries";

export default async function DashboardPage() {
  const session = await requirePermission("dashboard.view");
  const organizationId = session.user.organizationId;
  await runTaskDeadlineAutomations(organizationId);

  const [data, departments, workload] = await Promise.all([
    getDashboardData(organizationId),
    getDepartmentBreakdown(organizationId),
    getTeamWorkload(organizationId),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${session.user.name?.split(" ")[0] ?? ""}`}
        description="Central de comando do escritório — visão geral de hoje."
      />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Clientes</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Clientes ativos" value={data.clients.active} icon={Users} tone="success" />
          <StatCard label="Novos este mês" value={data.clients.new} icon={UserPlus} />
          <StatCard label="Em implantação" value={data.clients.implantacao} icon={Building2} tone="warning" />
          <StatCard label="Suspensos" value={data.clients.suspended} icon={PauseCircle} tone="destructive" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Tarefas</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Vencem hoje" value={data.tasks.today} icon={CalendarClock} tone="warning" />
          <StatCard label="Atrasadas" value={data.tasks.overdue} icon={AlarmClockOff} tone="destructive" />
          <StatCard label="Esta semana" value={data.tasks.thisWeek} icon={CalendarRange} />
          <StatCard label="Em revisão" value={data.tasks.inReview} icon={Eye} />
          <StatCard label="Aguardando cliente" value={data.tasks.awaitingClient} icon={Clock3} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximos vencimentos</CardTitle>
            <Link href="/calendario" className="text-xs text-primary hover:underline">
              Ver calendário
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingDeadlines.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma obrigação em aberto.</p>
            )}
            {data.upcomingDeadlines.map((task) => (
              <Link
                key={task.id}
                href={`/tarefas/${task.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.client?.tradeName || task.client?.legalName || "—"}
                  </p>
                </div>
                <DeadlineBadge date={task.officialDueDate} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro do mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatCard label="Receita prevista" value={formatCurrencyBRL(data.financeiro.receitaPrevista)} icon={Wallet} />
            <StatCard
              label="Receita recebida"
              value={formatCurrencyBRL(data.financeiro.receitaRecebida)}
              icon={Wallet}
              tone="success"
            />
            <StatCard
              label="Inadimplência"
              value={`${data.financeiro.inadimplenciaPercent.toFixed(1)}%`}
              icon={TrendingDown}
              tone="destructive"
            />
            <StatCard
              label="Contratos aguardando assinatura"
              value={data.contractsAwaitingSignature}
              icon={FileSignature}
              tone="warning"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cumprimento de prazo por departamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem tarefas registradas ainda.</p>
            )}
            {departments.map((d) => (
              <div key={d.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">
                    {d.done}/{d.total} concluídas · {d.overdue} atrasadas
                  </span>
                </div>
                <Progress value={d.percent} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carga da equipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload.slice(0, 6).map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.total} tarefas · {u.done} concluídas · {u.overdue} atrasadas
                  </p>
                </div>
                <span className="text-sm font-semibold">{u.onTimePercent}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
