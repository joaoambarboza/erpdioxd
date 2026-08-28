import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PeriodFilterBar } from "@/components/filters/period-filter-bar";
import { EntradasSaidasChart, DespesasPorCategoriaChart, EvolucaoCaixaChart } from "./charts";
import { getSaldoAtual, getFluxoMensal, getPeriodFilter, toNum } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const configuracao = await getConfiguracao();
  const { periodStart, periodEnd, sharedFilter } = getPeriodFilter(params, configuracao.mesInicioAnoFiscal);

  const [receitaAgg, despesaAgg, saldoAtual, aReceberAgg, vencidoAgg, despesasPorCategoria, regionais, centrosCusto] =
    await Promise.all([
      prisma.lancamento.aggregate({
        _sum: { valorFinal: true },
        where: { ...sharedFilter, tipo: "ENTRADA", dataCompetencia: { gte: periodStart, lt: periodEnd } },
      }),
      prisma.lancamento.aggregate({
        _sum: { valorFinal: true },
        where: { ...sharedFilter, tipo: "SAIDA", dataCompetencia: { gte: periodStart, lt: periodEnd } },
      }),
      getSaldoAtual(sharedFilter),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: {
          ...sharedFilter,
          tipo: "ENTRADA",
          status: { in: ["EM_ABERTO", "VENCIDO", "PARCIAL_RECEBIDO", "PROJETADO"] },
        },
      }),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { ...sharedFilter, tipo: "ENTRADA", dataVencimento: { lt: now }, saldoAberto: { gt: 0 } },
      }),
      prisma.lancamento.groupBy({
        by: ["categoriaId"],
        _sum: { valorFinal: true },
        where: { ...sharedFilter, tipo: "SAIDA", dataCompetencia: { gte: periodStart, lt: periodEnd } },
        orderBy: { _sum: { valorFinal: "desc" } },
        take: 8,
      }),
      prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    ]);

  const categoriaNomes = await prisma.categoria.findMany({
    where: { id: { in: despesasPorCategoria.map((d) => d.categoriaId) } },
  });
  const categoriaNomeMap = new Map(categoriaNomes.map((c) => [c.id, c.nome]));

  const receita = toNum(receitaAgg._sum.valorFinal);
  const despesas = toNum(despesaAgg._sum.valorFinal);
  const resultado = receita - despesas;
  const margem = receita > 0 ? (resultado / receita) * 100 : 0;

  const aReceber = toNum(aReceberAgg._sum.saldoAberto);
  const vencido = toNum(vencidoAgg._sum.saldoAberto);

  const fluxoMensal = await getFluxoMensal({
    where: sharedFilter,
    monthsBack: 5,
    monthsForward: 0,
    saldoAtual,
  });
  const entradasSaidasData = fluxoMensal.map((m) => ({
    mes: m.mesLabel,
    entradas: m.entradas,
    saidas: m.saidas,
  }));
  const evolucaoCaixaData = fluxoMensal.map((m) => ({ mes: m.mesLabel, saldo: m.saldoFinal }));

  const despesasPorCategoriaData = despesasPorCategoria.map((d) => ({
    categoria: categoriaNomeMap.get(d.categoriaId) ?? "—",
    valor: toNum(d._sum.valorFinal),
  }));

  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">Visão geral financeira da Dioxd</p>
      </div>

      <PeriodFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita" value={formatCurrency(receita)} tone="positive" />
        <StatCard label="Despesas" value={formatCurrency(despesas)} tone="negative" />
        <StatCard
          label="Resultado"
          value={formatCurrency(resultado)}
          tone={resultado >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Margem" value={`${margem.toFixed(1)}%`} />
        <StatCard label="Saldo Atual" value={formatCurrency(saldoAtual)} />
        <StatCard label="A Receber" value={formatCurrency(aReceber)} tone="warning" />
        <StatCard label="Vencido" value={formatCurrency(vencido)} tone="negative" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EntradasSaidasChart data={entradasSaidasData} />
        <EvolucaoCaixaChart data={evolucaoCaixaData} />
        <DespesasPorCategoriaChart data={despesasPorCategoriaData} />
      </div>
    </div>
  );
}
