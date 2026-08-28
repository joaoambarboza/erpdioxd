"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
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

export function PeriodFilterBar({
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

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="w-36">
        <Select
          defaultValue={searchParams.get("mes") ?? ""}
          onChange={(e) => setParam("mes", e.target.value)}
        >
          <option value="">Mês (todos)</option>
          {monthLabels.map((label, idx) => (
            <option key={label} value={String(idx + 1)}>
              {label}
            </option>
          ))}
        </Select>
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
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
