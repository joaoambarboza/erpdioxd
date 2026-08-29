"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatAnoFiscal } from "@/lib/utils";

type Option = { id: string; nome: string };

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function OrcamentoFilterBar({
  regionais,
  centrosCusto,
  years,
  mesInicioAnoFiscal = 1,
}: {
  regionais: Option[];
  centrosCusto: Option[];
  years: number[];
  mesInicioAnoFiscal?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mesesOpen, setMesesOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Estado local (não relido da URL a cada clique) para que cliques rápidos
  // em sequência não percam uns aos outros por uma navegação anterior ainda
  // não ter terminado de atualizar os searchParams.
  const [mesesSelecionados, setMesesSelecionados] = React.useState<number[]>(() =>
    (searchParams.get("meses") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((m) => m >= 1 && m <= 12)
  );

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Evita o aviso "Cannot update a component (Router) while rendering a
    // different component" que aparece quando essa navegação é disparada
    // no mesmo tick de um setState local (como em toggleMes).
    React.startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function toggleMes(mes: number) {
    const next = mesesSelecionados.includes(mes)
      ? mesesSelecionados.filter((m) => m !== mes)
      : [...mesesSelecionados, mes].sort((a, b) => a - b);
    setMesesSelecionados(next);
    setParam("meses", next.join(","));
  }

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMesesOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const mesesLabel =
    mesesSelecionados.length === 0
      ? "Mês (todos)"
      : mesesSelecionados.length === 1
        ? monthLabels[mesesSelecionados[0] - 1]
        : `${mesesSelecionados.length} meses selecionados`;

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="relative w-52" ref={containerRef}>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          onClick={() => setMesesOpen((v) => !v)}
        >
          <span className="truncate">{mesesLabel}</span>
          <ChevronDown size={16} className="shrink-0 text-muted" />
        </button>
        {mesesOpen && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-surface p-2 shadow-md">
            {monthLabels.map((label, idx) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-background"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                  checked={mesesSelecionados.includes(idx + 1)}
                  onChange={() => toggleMes(idx + 1)}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="w-32">
        <Select
          defaultValue={searchParams.get("ano") ?? ""}
          onChange={(e) => setParam("ano", e.target.value)}
        >
          <option value="">Ano</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {formatAnoFiscal(y, mesInicioAnoFiscal)}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-44">
        <Select
          defaultValue={searchParams.get("regionalId") ?? ""}
          onChange={(e) => setParam("regionalId", e.target.value)}
        >
          <option value="">Regional (todas)</option>
          {regionais.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select
          defaultValue={searchParams.get("centroCustoId") ?? ""}
          onChange={(e) => setParam("centroCustoId", e.target.value)}
        >
          <option value="">Centro de custo (todos)</option>
          {centrosCusto.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMesesSelecionados([]);
            React.startTransition(() => {
              router.push(pathname);
            });
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
