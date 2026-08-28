import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/card";
import { PeriodFilterBar } from "@/components/filters/period-filter-bar";
import { formatCurrency } from "@/lib/utils";
import { getPeriodFilter, getDREData } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { DRETable } from "./dre-table";

export default async function DREPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const configuracao = await getConfiguracao();
  const { periodStart, periodEnd, sharedFilter } = getPeriodFilter(params, configuracao.mesInicioAnoFiscal);

  const [{ linhasGrupo, receita, despesas, resultado, margem }, regionais, centrosCusto] = await Promise.all([
    getDREData({ where: sharedFilter, periodStart, periodEnd }),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">DRE</h1>
        <p className="text-sm text-muted">Demonstração de resultado gerencial</p>
      </div>

      <PeriodFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receita" value={formatCurrency(receita)} tone="positive" />
        <StatCard label="Despesas" value={formatCurrency(despesas)} tone="negative" />
        <StatCard
          label="Resultado"
          value={formatCurrency(resultado)}
          tone={resultado >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Margem" value={`${margem.toFixed(1)}%`} />
      </div>

      <DRETable linhasGrupo={linhasGrupo} resultado={resultado} />
    </div>
  );
}
