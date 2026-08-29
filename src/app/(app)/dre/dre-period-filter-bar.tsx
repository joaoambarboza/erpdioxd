"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatAnoFiscal } from "@/lib/utils";

type Option = { id: string; nome: string };

const monthShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function trimestreLabel(trimestre: number, mesInicioAnoFiscal: number) {
  const startIdx = (mesInicioAnoFiscal - 1 + (trimestre - 1) * 3) % 12;
  const meses = [0, 1, 2].map((offset) => monthShort[(startIdx + offset) % 12]);
  return `T${trimestre} (${meses.join("-")})`;
}

export function DrePeriodFilterBar({
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
      <div className="w-48">
        <Select
          defaultValue={searchParams.get("trimestre") ?? ""}
          onChange={(e) => setParam("trimestre", e.target.value)}
        >
          <option value="">Ano fiscal inteiro</option>
          {[1, 2, 3, 4].map((t) => (
            <option key={t} value={t}>
              {trimestreLabel(t, mesInicioAnoFiscal)}
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
