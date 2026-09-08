import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";
import { BarChart3, CalendarCheck2, ShieldCheck } from "lucide-react";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              R
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">RNS Gestão Contábil</p>
              <p className="text-xs text-muted-foreground">Central de comando do escritório</p>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrar na sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe suas credenciais para acessar o sistema.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between p-10 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_45%)]" />
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">RNS Gestão Contábil</p>
          <h2 className="mt-6 max-w-md text-3xl font-semibold leading-tight">
            Todo o escritório contábil em um único lugar.
          </h2>
          <p className="mt-4 max-w-md text-sm opacity-80">
            Clientes, serviços, obrigações, tarefas, contratos e financeiro — do cadastro à
            cobrança, com prazos e produtividade sob controle.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureItem icon={<CalendarCheck2 className="h-4 w-4" />} title="Prazos no controle">
            Alertas visuais de vencimento e calendário de obrigações.
          </FeatureItem>
          <FeatureItem icon={<BarChart3 className="h-4 w-4" />} title="Indicadores">
            Dashboards por departamento, colaborador e cliente.
          </FeatureItem>
          <FeatureItem icon={<ShieldCheck className="h-4 w-4" />} title="Permissões">
            Perfis de acesso configuráveis por módulo.
          </FeatureItem>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15">{icon}</div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs opacity-70">{children}</p>
    </div>
  );
}
