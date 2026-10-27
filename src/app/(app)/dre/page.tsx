import { prisma } from "@/lib/prisma";
import { ComparisonCard, StatCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getDreFilter, getDREPeriodos } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { DRE_TRIMESTRES, labelPeriodo, parsePeriodosDre } from "@/lib/dre";
import { DrePeriodFilterBar } from "./dre-period-filter-bar";
import { DRETable } from "./dre-table";
import { GrupoTrimestresChart, MargemLiquidaChart } from "./dre-charts";

const formatMargem = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`);

export default async function DREPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const configuracao = await getConfiguracao();
  const mesInicio = configuracao.mesInicioAnoFiscal;
  const { ano, sharedFilter } = getDreFilter(params);
  const periodos = parsePeriodosDre(params);

  const [dre, regionais, centrosCusto] = await Promise.all([
    getDREPeriodos({ where: sharedFilter, ano, mesInicioAnoFiscal: mesInicio }),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1];

  // Os cartões resumem uma única coluna: a escolhida, ou o acumulado quando há várias.
  const resumoKey = periodos.length === 1 ? periodos[0] : "ACUM";
  const { receita, despesas, resultado, margemLiquida } = dre[resumoKey];

  const chartPeriodos = [...DRE_TRIMESTRES, "ACUM" as const];
  const margemData = chartPeriodos.map((p) => ({
    periodo: labelPeriodo(p, mesInicio, true),
    projetado: dre[p].margemLiquida.projetado,
    realizado: dre[p].margemLiquida.realizado,
  }));
  const gruposData = dre.ACUM.linhasGrupo.map((grupo, gi) => ({
    id: grupo.id,
    nome: grupo.nome,
    data: DRE_TRIMESTRES.map((t) => ({
      periodo: t,
      projetado: dre[t].linhasGrupo[gi].totalGrupo.projetado,
      realizado: dre[t].linhasGrupo[gi].totalGrupo.realizado,
    })),
  }));

  // O Excel traz sempre os 4 trimestres + acumulado; só ano, regional e centro de custo acompanham a tela.
  const exportHref = `/api/relatorios/dre?${new URLSearchParams(
    ["ano", "regionalId", "centroCustoId"].flatMap((k) => {
      const v = params[k];
      return typeof v === "string" && v ? [[k, v]] : [];
    })
  ).toString()}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">DRE</h1>
          <p className="text-sm text-muted">Demonstração de resultado gerencial — projetado x realizado</p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Baixar Excel (editável)
        </a>
      </div>

      <DrePeriodFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={mesInicio}
      />

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Resumo — {labelPeriodo(resumoKey, mesInicio)}
      </p>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ComparisonCard label="Receita" projetado={receita.projetado} realizado={receita.realizado} formatValue={formatCurrency} />
        <ComparisonCard label="Despesas" projetado={despesas.projetado} realizado={despesas.realizado} formatValue={formatCurrency} />
        <ComparisonCard label="Resultado" projetado={resultado.projetado} realizado={resultado.realizado} formatValue={formatCurrency} />
        <StatCard
          label="Margem líquida"
          value={formatMargem(margemLiquida.realizado)}
          hint={`Projetada: ${formatMargem(margemLiquida.projetado)}`}
        />
      </div>

      <div className="mb-6">
        <DRETable dre={dre} periodos={periodos} mesInicioAnoFiscal={mesInicio} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-foreground">Gráficos</h2>
      <div className="mb-4">
        <MargemLiquidaChart data={margemData} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {gruposData.map((g) => (
          <GrupoTrimestresChart key={g.id} nome={`${g.nome}: Projetado x Realizado por trimestre`} data={g.data} />
        ))}
      </div>
    </div>
  );
}
