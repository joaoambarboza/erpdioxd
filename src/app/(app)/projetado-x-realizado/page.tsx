import { prisma } from "@/lib/prisma";
import { ComparisonCard } from "@/components/ui/card";
import { PeriodFilterBar } from "@/components/filters/period-filter-bar";
import { formatCurrency } from "@/lib/utils";
import { getPeriodFilter, getProjetadoRealizadoMensal, toNum } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { ReceitaProjetadoRealizadoChart, DespesaProjetadoRealizadoChart } from "./charts";

export default async function ProjetadoXRealizadoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const configuracao = await getConfiguracao();
  const { periodStart, periodEnd, sharedFilter } = getPeriodFilter(params, configuracao.mesInicioAnoFiscal);

  const [receitaProjetadaAgg, receitaRealizadaAgg, despesaProjetadaAgg, despesaRealizadaAgg, regionais, centrosCusto, mensal] =
    await Promise.all([
      prisma.lancamento.aggregate({
        _sum: { valorFinal: true },
        where: { ...sharedFilter, tipo: "ENTRADA", status: "PROJETADO", dataCompetencia: { gte: periodStart, lt: periodEnd } },
      }),
      prisma.lancamento.aggregate({
        _sum: { valorFinal: true },
        where: {
          ...sharedFilter,
          tipo: "ENTRADA",
          status: { notIn: ["PROJETADO", "CANCELADO"] },
          dataCompetencia: { gte: periodStart, lt: periodEnd },
        },
      }),
      prisma.lancamento.aggregate({
        _sum: { valorFinal: true },
        where: { ...sharedFilter, tipo: "SAIDA", status: "PROJETADO", dataCompetencia: { gte: periodStart, lt: periodEnd } },
      }),
      prisma.lancamento.aggregate({
        _sum: { valorFinal: true },
        where: {
          ...sharedFilter,
          tipo: "SAIDA",
          status: { notIn: ["PROJETADO", "CANCELADO"] },
          dataCompetencia: { gte: periodStart, lt: periodEnd },
        },
      }),
      prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      getProjetadoRealizadoMensal({ where: sharedFilter, monthsBack: 6, monthsForward: 5 }),
    ]);

  const receitaProjetada = toNum(receitaProjetadaAgg._sum.valorFinal);
  const receitaRealizada = toNum(receitaRealizadaAgg._sum.valorFinal);
  const despesaProjetada = toNum(despesaProjetadaAgg._sum.valorFinal);
  const despesaRealizada = toNum(despesaRealizadaAgg._sum.valorFinal);
  const resultadoProjetado = receitaProjetada - despesaProjetada;
  const resultadoRealizado = receitaRealizada - despesaRealizada;

  const receitaChartData = mensal.map((m) => ({
    mes: m.mesLabel,
    projetado: m.receitaProjetada,
    realizado: m.receitaRealizada,
  }));
  const despesaChartData = mensal.map((m) => ({
    mes: m.mesLabel,
    projetado: m.despesaProjetada,
    realizado: m.despesaRealizada,
  }));

  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Projetado x Realizado</h1>
        <p className="text-sm text-muted">Comparação entre o que foi previsto e o que de fato aconteceu</p>
      </div>

      <PeriodFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ComparisonCard
          label="Receita"
          projetado={receitaProjetada}
          realizado={receitaRealizada}
          formatValue={formatCurrency}
        />
        <ComparisonCard
          label="Despesas"
          projetado={despesaProjetada}
          realizado={despesaRealizada}
          formatValue={formatCurrency}
        />
        <ComparisonCard
          label="Resultado"
          projetado={resultadoProjetado}
          realizado={resultadoRealizado}
          formatValue={formatCurrency}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReceitaProjetadoRealizadoChart data={receitaChartData} />
        <DespesaProjetadoRealizadoChart data={despesaChartData} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 text-right font-medium">Receita Proj.</th>
              <th className="px-4 py-3 text-right font-medium">Receita Real.</th>
              <th className="px-4 py-3 text-right font-medium">Despesa Proj.</th>
              <th className="px-4 py-3 text-right font-medium">Despesa Real.</th>
              <th className="px-4 py-3 text-right font-medium">Result. Proj.</th>
              <th className="px-4 py-3 text-right font-medium">Result. Real.</th>
            </tr>
          </thead>
          <tbody>
            {mensal.map((m) => (
              <tr key={`${m.ano}-${m.mes}`} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">
                  {m.mesLabel}/{m.ano}
                </td>
                <td className="px-4 py-3 text-right text-muted">{formatCurrency(m.receitaProjetada)}</td>
                <td className="px-4 py-3 text-right text-entrada">{formatCurrency(m.receitaRealizada)}</td>
                <td className="px-4 py-3 text-right text-muted">{formatCurrency(m.despesaProjetada)}</td>
                <td className="px-4 py-3 text-right text-saida">{formatCurrency(m.despesaRealizada)}</td>
                <td className="px-4 py-3 text-right text-muted">{formatCurrency(m.resultadoProjetado)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.resultadoRealizado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
