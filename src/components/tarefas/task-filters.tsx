"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";

export function TaskFilters({
  departments,
  users,
  clients,
}: {
  departments: { id: string; name: string }[];
  users: { id: string; name: string }[];
  clients: { id: string; legalName: string; tradeName: string | null }[];
}) {
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
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Buscar tarefa..."
        defaultValue={searchParams.get("q") ?? ""}
        className="w-48"
        onChange={(e) => {
          const value = e.target.value;
          setTimeout(() => setParam("q", value), 350);
        }}
      />
      <Select defaultValue={searchParams.get("status") ?? "all"} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("priority") ?? "all"} onValueChange={(v) => setParam("priority", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas prioridades</SelectItem>
          {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("departmentId") ?? "all"} onValueChange={(v) => setParam("departmentId", v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os departamentos</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("assigneeId") ?? "all"} onValueChange={(v) => setParam("assigneeId", v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os responsáveis</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select defaultValue={searchParams.get("clientId") ?? "all"} onValueChange={(v) => setParam("clientId", v)}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os clientes</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.tradeName || c.legalName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
