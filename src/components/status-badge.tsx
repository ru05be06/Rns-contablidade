import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  labels,
  colors,
}: {
  status: string;
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", colors[status])}>
      {labels[status] ?? status}
    </Badge>
  );
}
