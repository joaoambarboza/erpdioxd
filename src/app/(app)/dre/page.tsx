import { prisma } from "@/lib/prisma";
import { ComparisonCard, StatCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getFiscalQuarterFilter, getDREData } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { DrePeriodFilterBar } from "./dre-period-filter-bar";
import { DRETable } from "./dre-table";

export default async function DREPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const configuracao = await getConfiguracao();
  const { periodStart, periodEnd, sharedFilter } = getFiscalQuarterFilter(params, configuracao.mesInicioAnoFiscal);

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
        <p className="text-sm text-muted">Demonstração de resultado gerencial — projetado x realizado</p>
      </div>

      <DrePeriodFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ComparisonCard label="Receita" projetado={receita.projetado} realizado={receita.realizado} formatValue={formatCurrency} />
        <ComparisonCard label="Despesas" projetado={despesas.projetado} realizado={despesas.realizado} formatValue={formatCurrency} />
        <ComparisonCard label="Resultado" projetado={resultado.projetado} realizado={resultado.realizado} formatValue={formatCurrency} />
        <StatCard
          label="Margem"
          value={`${margem.realizado.toFixed(1)}%`}
          hint={`Projetado: ${margem.projetado.toFixed(1)}%`}
        />
      </div>

      <DRETable linhasGrupo={linhasGrupo} />
    </div>
  );
}
