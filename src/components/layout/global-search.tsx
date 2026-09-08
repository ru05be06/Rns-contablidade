"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

interface SearchResults {
  clients: { id: string; legalName: string; tradeName: string | null; cnpj: string | null }[];
  tasks: { id: string; title: string; code: string; status: string }[];
  contracts: { id: string; type: string; status: string; client: { legalName: string } }[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        setResults(await res.json());
        setOpen(true);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const hasResults =
    results && (results.clients.length || results.tasks.length || results.contracts.length);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar CNPJ, cliente, tarefa, contrato..."
            className="pl-8"
            onFocus={() => hasResults && setOpen(true)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[420px] p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {!hasResults && <p className="p-2 text-sm text-muted-foreground">Nenhum resultado.</p>}
        {results?.clients && results.clients.length > 0 && (
          <div className="mb-2">
            <p className="px-2 text-xs font-semibold text-muted-foreground">Clientes</p>
            {results.clients.map((c) => (
              <button
                key={c.id}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  router.push(`/clientes/${c.id}`);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {c.tradeName || c.legalName}{" "}
                <span className="text-xs text-muted-foreground">{c.cnpj}</span>
              </button>
            ))}
          </div>
        )}
        {results?.tasks && results.tasks.length > 0 && (
          <div className="mb-2">
            <p className="px-2 text-xs font-semibold text-muted-foreground">Tarefas</p>
            {results.tasks.map((t) => (
              <button
                key={t.id}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  router.push(`/tarefas/${t.id}`);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {t.title} <span className="text-xs text-muted-foreground">#{t.code}</span>
              </button>
            ))}
          </div>
        )}
        {results?.contracts && results.contracts.length > 0 && (
          <div>
            <p className="px-2 text-xs font-semibold text-muted-foreground">Contratos</p>
            {results.contracts.map((c) => (
              <button
                key={c.id}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  router.push(`/contratos/${c.id}`);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {c.client.legalName} <span className="text-xs text-muted-foreground">{c.type}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
