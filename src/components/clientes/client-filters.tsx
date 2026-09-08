"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLIENT_STATUS_LABELS, TAX_REGIME_LABELS } from "@/lib/labels";

export function ClientFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Buscar por nome, CNPJ ou código..."
        defaultValue={searchParams.get("q") ?? ""}
        className="sm:max-w-xs"
        onChange={(e) => {
          const value = e.target.value;
          const timeout = setTimeout(() => setParam("q", value), 400);
          return () => clearTimeout(timeout);
        }}
      />
      <Select defaultValue={searchParams.get("status") ?? "all"} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.entries(CLIENT_STATUS_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("regime") ?? "all"} onValueChange={(v) => setParam("regime", v)}>
        <SelectTrigger className="sm:w-56">
          <SelectValue placeholder="Regime tributário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os regimes</SelectItem>
          {Object.entries(TAX_REGIME_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
