"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CheckboxFilter } from "@/components/filters/checkbox-filter";

const monthLabelsShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function ContasMesFilter({ years }: { years: number[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setAno(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("ano", value);
    else params.delete("ano");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="w-28">
        <Select value={searchParams.get("ano") ?? ""} onChange={(e) => setAno(e.target.value)}>
          <option value="">Ano atual</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
      <CheckboxFilter
        label="Mês de vencimento"
        param="meses"
        options={monthLabelsShort.map((label, i) => ({ value: String(i + 1), label }))}
      />
      {searchParams.toString().length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
