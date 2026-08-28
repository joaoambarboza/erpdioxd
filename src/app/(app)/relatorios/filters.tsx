"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { tipoLabels, statusLabels } from "@/lib/enum-labels";

type Option = { id: string; nome: string };

export function RelatoriosFilters({
  categorias,
  centrosCusto,
  regionais,
  clientes,
  fornecedores,
}: {
  categorias: Option[];
  centrosCusto: Option[];
  regionais: Option[];
  clientes: Option[];
  fornecedores: Option[];
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
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="w-40">
        <Select defaultValue={searchParams.get("tipo") ?? ""} onChange={(e) => setParam("tipo", e.target.value)}>
          <option value="">Tipo (todos)</option>
          {Object.entries(tipoLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-44">
        <Select defaultValue={searchParams.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)}>
          <option value="">Status (todos)</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select
          defaultValue={searchParams.get("categoriaId") ?? ""}
          onChange={(e) => setParam("categoriaId", e.target.value)}
        >
          <option value="">Categoria (todas)</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
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
      <div className="w-40">
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
      <div className="w-52">
        <Select
          defaultValue={searchParams.get("clienteId") ?? ""}
          onChange={(e) => setParam("clienteId", e.target.value)}
        >
          <option value="">Cliente (todos)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-52">
        <Select
          defaultValue={searchParams.get("fornecedorId") ?? ""}
          onChange={(e) => setParam("fornecedorId", e.target.value)}
        >
          <option value="">Fornecedor (todos)</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-36">
          <Input
            type="date"
            defaultValue={searchParams.get("de") ?? ""}
            onChange={(e) => setParam("de", e.target.value)}
          />
        </div>
        <span className="pb-2 text-sm text-muted">até</span>
        <div className="w-36">
          <Input
            type="date"
            defaultValue={searchParams.get("ate") ?? ""}
            onChange={(e) => setParam("ate", e.target.value)}
          />
        </div>
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
