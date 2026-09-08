import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SemPermissaoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Você não tem permissão para acessar esta página</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Fale com o administrador do escritório para solicitar acesso a este módulo.
      </p>
      <Button asChild>
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
