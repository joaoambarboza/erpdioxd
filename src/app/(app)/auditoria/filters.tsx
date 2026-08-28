"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { acaoLabels } from "./acao-labels";

type Option = { id: string; nome: string };

export function AuditoriaFilters({ usuarios }: { usuarios: Option[] }) {
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
      <div className="w-52">
        <Select
          defaultValue={searchParams.get("userId") ?? ""}
          onChange={(e) => setParam("userId", e.target.value)}
        >
          <option value="">Usuário (todos)</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select defaultValue={searchParams.get("acao") ?? ""} onChange={(e) => setParam("acao", e.target.value)}>
          <option value="">Ação (todas)</option>
          {Object.entries(acaoLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-36">
          <Input type="date" defaultValue={searchParams.get("de") ?? ""} onChange={(e) => setParam("de", e.target.value)} />
        </div>
        <span className="pb-2 text-sm text-muted">até</span>
        <div className="w-36">
          <Input type="date" defaultValue={searchParams.get("ate") ?? ""} onChange={(e) => setParam("ate", e.target.value)} />
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
