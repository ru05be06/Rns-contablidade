import { Badge } from "@/components/ui/badge";
import { cn, deadlineUrgency, formatDateBR, daysUntil } from "@/lib/utils";

const STYLES: Record<string, string> = {
  verde: "bg-success/15 text-success border-success/20",
  amarelo: "bg-warning/15 text-warning border-warning/20",
  laranja: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  vermelho: "bg-destructive/15 text-destructive border-destructive/20",
};

/** Indicador visual de prazo — seção 18 do escopo (verde/amarelo/laranja/vermelho). */
export function DeadlineBadge({ date, label }: { date: Date | string | null | undefined; label?: string }) {
  if (!date) return <span className="text-xs text-muted-foreground">Sem prazo</span>;
  const urgency = deadlineUrgency(date);
  const days = daysUntil(date);
  const text =
    label ??
    (days === null
      ? formatDateBR(date)
      : days < 0
      ? `Atrasado há ${Math.abs(days)}d`
      : days === 0
      ? "Vence hoje"
      : `${formatDateBR(date)} (${days}d)`);

  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[urgency])}>
      {text}
    </Badge>
  );
}
