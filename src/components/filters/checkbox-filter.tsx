"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/field";

type Option = { value: string; label: string };

/**
 * Filtro de múltipla escolha por caixas de seleção. Guarda as opções marcadas
 * na URL, separadas por vírgula (`?param=a,b`). Com `vazioSignificaTudo`, sem
 * parâmetro todas aparecem marcadas (e desmarcar tudo volta a esse estado);
 * sem ele, nenhuma marcada significa "sem filtro".
 */
export function CheckboxFilter({
  label,
  param,
  options,
  vazioSignificaTudo = false,
}: {
  label: string;
  param: string;
  options: Option[];
  vazioSignificaTudo?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const valoresNaUrl = (searchParams.get(param) ?? "").split(",").filter(Boolean);
  const marcados = new Set(
    valoresNaUrl.length === 0 && vazioSignificaTudo ? options.map((o) => o.value) : valoresNaUrl
  );

  function toggle(value: string) {
    const proximos = new Set(marcados);
    if (proximos.has(value)) proximos.delete(value);
    else proximos.add(value);

    const params = new URLSearchParams(searchParams.toString());
    const ordenados = options.map((o) => o.value).filter((v) => proximos.has(v));
    if (ordenados.length === 0) params.delete(param);
    else params.set(param, ordenados.join(","));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <fieldset className="rounded-md border border-border bg-surface px-3 py-2">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            checked={marcados.has(o.value)}
            onChange={() => toggle(o.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
