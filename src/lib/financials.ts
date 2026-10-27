import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  DRE_TRIMESTRES,
  intervaloTrimestre,
  montarDre,
  somarMapas,
  somarValores,
  type DrePeriodoKey,
  type DreResultado,
  type DreTotais,
  type DreValores,
} from "@/lib/dre";

export const monthLabelsShort = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/**
 * Resolve os parâmetros de query mês/ano/regionalId/centroCustoId
 * compartilhados por Dashboard, DRE e Projetado x Realizado.
 *
 * `mesInicioAnoFiscal` (1–12, 1 = ano civil) só afeta a seleção de "Ano"
 * sem "Mês": nesse caso o período vai do mês de início do ano fiscal no
 * `ano` selecionado até o mesmo mês do ano seguinte. Uma seleção de "Mês"
 * é sempre um mês civil literal, independente do ano fiscal.
 */
export function getPeriodFilter(
  params: Record<string, string | string[] | undefined>,
  mesInicioAnoFiscal = 1
) {
  const now = new Date();
  const anoFiltro = typeof params.ano === "string" && params.ano ? Number(params.ano) : undefined;
  const mesFiltro = typeof params.mes === "string" && params.mes ? Number(params.mes) : undefined;
  const regionalId = typeof params.regionalId === "string" && params.regionalId ? params.regionalId : undefined;
  const centroCustoId =
    typeof params.centroCustoId === "string" && params.centroCustoId ? params.centroCustoId : undefined;

  const periodoAno = anoFiltro ?? now.getUTCFullYear();
  const periodoMes = mesFiltro ?? now.getUTCMonth() + 1;
  const usaMesEspecifico = Boolean(mesFiltro) || (!anoFiltro && !mesFiltro);

  const periodStart = usaMesEspecifico
    ? new Date(Date.UTC(periodoAno, periodoMes - 1, 1))
    : new Date(Date.UTC(periodoAno, mesInicioAnoFiscal - 1, 1));
  const periodEnd = usaMesEspecifico
    ? new Date(Date.UTC(periodoAno, periodoMes, 1))
    : new Date(Date.UTC(periodoAno + 1, mesInicioAnoFiscal - 1, 1));

  const sharedFilter: Prisma.LancamentoWhereInput = {
    ...(regionalId ? { regionalId } : {}),
    ...(centroCustoId ? { centroCustoId } : {}),
  };

  return { periodStart, periodEnd, sharedFilter, regionalId, centroCustoId };
}

/**
 * Filtros da DRE: ano fiscal (`ano`, padrão o ano corrente), regional e
 * centro de custo. Os períodos (trimestres fiscais e acumulado) não são um
 * filtro de consulta: a DRE sempre apura os 4 trimestres e a tela escolhe
 * quais colunas mostrar. Trimestres são relativos ao mês de início do ano
 * fiscal (T1 = mesInicioAnoFiscal e os dois meses seguintes), não Q1–Q4 de
 * calendário.
 */
export function getDreFilter(params: Record<string, string | string[] | undefined>) {
  const now = new Date();
  const ano = typeof params.ano === "string" && params.ano ? Number(params.ano) : now.getUTCFullYear();
  const regionalId = typeof params.regionalId === "string" && params.regionalId ? params.regionalId : undefined;
  const centroCustoId =
    typeof params.centroCustoId === "string" && params.centroCustoId ? params.centroCustoId : undefined;

  const sharedFilter: Prisma.LancamentoWhereInput = {
    ...(regionalId ? { regionalId } : {}),
    ...(centroCustoId ? { centroCustoId } : {}),
  };

  return { ano, sharedFilter };
}

export function sumDecimal(values: { toString(): string }[]) {
  return values.map((v) => Number(v.toString())).reduce((acc, v) => acc + v, 0);
}

export function toNum(v: { toString(): string } | null | undefined) {
  return Number(v?.toString() ?? 0);
}

/** Saldo de caixa real, hoje: saldo inicial das contas + tudo que já foi efetivamente pago/recebido. */
export async function getSaldoAtual(where: Prisma.LancamentoWhereInput = {}) {
  const [contasBancarias, entradasPagas, saidasPagas] = await Promise.all([
    prisma.contaBancaria.findMany({ where: { ativo: true } }),
    prisma.lancamento.aggregate({ _sum: { valorPago: true }, where: { ...where, tipo: "ENTRADA" } }),
    prisma.lancamento.aggregate({ _sum: { valorPago: true }, where: { ...where, tipo: "SAIDA" } }),
  ]);

  const saldoInicialTotal = sumDecimal(contasBancarias.map((c) => c.saldoInicial));
  return saldoInicialTotal + toNum(entradasPagas._sum.valorPago) - toNum(saidasPagas._sum.valorPago);
}

export function buildMonthWindow(monthsBack: number, monthsForward: number) {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  const windowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsForward + 1, 1));

  const months = [];
  for (let i = -monthsBack; i <= monthsForward; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    months.push({ ano: d.getUTCFullYear(), mes: d.getUTCMonth(), mesLabel: monthLabelsShort[d.getUTCMonth()] });
  }

  return { now, windowStart, windowEnd, months };
}

export type FluxoMensal = {
  ano: number;
  mes: number;
  mesLabel: string;
  entradas: number;
  saidas: number;
  saldoInicial: number;
  saldoFinal: number;
};

/**
 * Ledger gerencial mensal: entradas/saídas por competência, com saldo corrente
 * ancorado no Saldo Atual real no mês corrente e projetado para frente/trás
 * a partir dali. Não é uma reconciliação contábil estrita — é uma visão
 * gerencial, como o restante do fluxo de caixa/DRE deste ERP.
 */
export async function getFluxoMensal({
  where = {},
  monthsBack,
  monthsForward,
  saldoAtual,
}: {
  where?: Prisma.LancamentoWhereInput;
  monthsBack: number;
  monthsForward: number;
  saldoAtual: number;
}): Promise<FluxoMensal[]> {
  const { now, windowStart, windowEnd, months } = buildMonthWindow(monthsBack, monthsForward);

  const lancamentos = await prisma.lancamento.findMany({
    where: { ...where, dataCompetencia: { gte: windowStart, lt: windowEnd } },
    select: { dataCompetencia: true, tipo: true, valorFinal: true },
  });

  const totalMeses = months.length;
  const buckets: FluxoMensal[] = months.map((m) => ({
    ...m,
    entradas: 0,
    saidas: 0,
    saldoInicial: 0,
    saldoFinal: 0,
  }));

  const indexOf = (ano: number, mes: number) =>
    buckets.findIndex((b) => b.ano === ano && b.mes === mes);

  for (const l of lancamentos) {
    const idx = indexOf(l.dataCompetencia.getUTCFullYear(), l.dataCompetencia.getUTCMonth());
    if (idx === -1) continue;
    const valor = toNum(l.valorFinal);
    if (l.tipo === "ENTRADA") buckets[idx].entradas += valor;
    else buckets[idx].saidas += valor;
  }

  const currentIndex = indexOf(now.getUTCFullYear(), now.getUTCMonth());
  const anchor = currentIndex === -1 ? totalMeses - 1 : currentIndex;

  buckets[anchor].saldoFinal = saldoAtual;
  buckets[anchor].saldoInicial = saldoAtual - (buckets[anchor].entradas - buckets[anchor].saidas);

  for (let i = anchor - 1; i >= 0; i--) {
    buckets[i].saldoFinal = buckets[i + 1].saldoInicial;
    buckets[i].saldoInicial = buckets[i].saldoFinal - (buckets[i].entradas - buckets[i].saidas);
  }
  for (let i = anchor + 1; i < buckets.length; i++) {
    buckets[i].saldoInicial = buckets[i - 1].saldoFinal;
    buckets[i].saldoFinal = buckets[i].saldoInicial + (buckets[i].entradas - buckets[i].saidas);
  }

  return buckets;
}

export type ProjetadoRealizadoMensal = {
  ano: number;
  mes: number;
  mesLabel: string;
  receitaProjetada: number;
  receitaRealizada: number;
  despesaProjetada: number;
  despesaRealizada: number;
  resultadoProjetado: number;
  resultadoRealizado: number;
};

/**
 * Projetado = lançamentos com status PROJETADO (previsão, ainda não é uma
 * transação confirmada). Realizado = qualquer outro status exceto CANCELADO
 * (mesmo status EM_ABERTO já conta como "realizado" no sentido gerencial
 * usado no restante deste ERP — é uma transação confirmada, só falta pagar).
 */
export async function getProjetadoRealizadoMensal({
  where = {},
  monthsBack,
  monthsForward,
}: {
  where?: Prisma.LancamentoWhereInput;
  monthsBack: number;
  monthsForward: number;
}): Promise<ProjetadoRealizadoMensal[]> {
  const { windowStart, windowEnd, months } = buildMonthWindow(monthsBack, monthsForward);

  const lancamentos = await prisma.lancamento.findMany({
    where: { ...where, status: { not: "CANCELADO" }, dataCompetencia: { gte: windowStart, lt: windowEnd } },
    select: { dataCompetencia: true, tipo: true, status: true, valorFinal: true },
  });

  const buckets: ProjetadoRealizadoMensal[] = months.map((m) => ({
    ...m,
    receitaProjetada: 0,
    receitaRealizada: 0,
    despesaProjetada: 0,
    despesaRealizada: 0,
    resultadoProjetado: 0,
    resultadoRealizado: 0,
  }));

  const indexOf = (ano: number, mes: number) =>
    buckets.findIndex((b) => b.ano === ano && b.mes === mes);

  for (const l of lancamentos) {
    const idx = indexOf(l.dataCompetencia.getUTCFullYear(), l.dataCompetencia.getUTCMonth());
    if (idx === -1) continue;
    const valor = toNum(l.valorFinal);
    const isProjetado = l.status === "PROJETADO";
    if (l.tipo === "ENTRADA") {
      if (isProjetado) buckets[idx].receitaProjetada += valor;
      else buckets[idx].receitaRealizada += valor;
    } else {
      if (isProjetado) buckets[idx].despesaProjetada += valor;
      else buckets[idx].despesaRealizada += valor;
    }
  }

  for (const b of buckets) {
    b.resultadoProjetado = b.receitaProjetada - b.despesaProjetada;
    b.resultadoRealizado = b.receitaRealizada - b.despesaRealizada;
  }

  return buckets;
}

type SomaPorContaTipo = { contaDreId: string; tipo: "ENTRADA" | "SAIDA"; valor: number };

function mapaAssinado(rows: SomaPorContaTipo[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.contaDreId, (map.get(row.contaDreId) ?? 0) + (row.tipo === "ENTRADA" ? row.valor : -row.valor));
  }
  return map;
}

function somaPorTipo(rows: SomaPorContaTipo[], tipo: "ENTRADA" | "SAIDA") {
  return rows.filter((r) => r.tipo === tipo).reduce((acc, r) => acc + r.valor, 0);
}

/**
 * Valores da DRE num intervalo [periodStart, periodEnd), por conta.
 *
 * Realizado = só lançamentos PAGO ou RECEBIDO, somando o campo "Pago/recebido"
 * (`valorPago`). Projetado = só lançamentos PROJETADO, pelo `valorFinal`.
 *
 * A DRE da Dioxd mistura regime de caixa e de competência por conta (ver
 * `ContaDRE.regime`): contas de competência são apuradas por `dataCompetencia`
 * (mês da venda/despesa, independente de quando o dinheiro se move); contas de
 * caixa são apuradas por `dataPagamento` no realizado — por isso um lançamento
 * PROJETADO de regime caixa, que ainda não tem `dataPagamento`, é projetado
 * pela `dataVencimento`, a única data que faz sentido como "quando esperamos
 * que o caixa se mova".
 */
async function getValoresPeriodo({
  where,
  periodStart,
  periodEnd,
}: {
  where: Prisma.LancamentoWhereInput;
  periodStart: Date;
  periodEnd: Date;
}): Promise<{ valores: Map<string, DreValores>; totais: DreTotais }> {
  const intervalo = { gte: periodStart, lt: periodEnd };

  const realizado = async (regime: "COMPETENCIA" | "CAIXA") => {
    const rows = await prisma.lancamento.groupBy({
      by: ["contaDreId", "tipo"],
      _sum: { valorPago: true },
      where: {
        ...where,
        contaDre: { regime },
        status: { in: ["PAGO", "RECEBIDO"] },
        ...(regime === "COMPETENCIA" ? { dataCompetencia: intervalo } : { dataPagamento: intervalo }),
      },
    });
    return rows.map((r) => ({ contaDreId: r.contaDreId, tipo: r.tipo, valor: toNum(r._sum.valorPago) }));
  };

  const projetado = async (regime: "COMPETENCIA" | "CAIXA") => {
    const rows = await prisma.lancamento.groupBy({
      by: ["contaDreId", "tipo"],
      _sum: { valorFinal: true },
      where: {
        ...where,
        contaDre: { regime },
        status: "PROJETADO",
        ...(regime === "COMPETENCIA" ? { dataCompetencia: intervalo } : { dataVencimento: intervalo }),
      },
    });
    return rows.map((r) => ({ contaDreId: r.contaDreId, tipo: r.tipo, valor: toNum(r._sum.valorFinal) }));
  };

  const [compReal, caixaReal, compProj, caixaProj] = await Promise.all([
    realizado("COMPETENCIA"),
    realizado("CAIXA"),
    projetado("COMPETENCIA"),
    projetado("CAIXA"),
  ]);
  const linhasRealizado = [...compReal, ...caixaReal];
  const linhasProjetado = [...compProj, ...caixaProj];

  const realizadoMap = mapaAssinado(linhasRealizado);
  const projetadoMap = mapaAssinado(linhasProjetado);
  const valores = new Map<string, DreValores>();
  for (const id of new Set([...realizadoMap.keys(), ...projetadoMap.keys()])) {
    valores.set(id, { projetado: projetadoMap.get(id) ?? 0, realizado: realizadoMap.get(id) ?? 0 });
  }

  return {
    valores,
    totais: {
      receita: {
        projetado: somaPorTipo(linhasProjetado, "ENTRADA"),
        realizado: somaPorTipo(linhasRealizado, "ENTRADA"),
      },
      despesas: {
        projetado: somaPorTipo(linhasProjetado, "SAIDA"),
        realizado: somaPorTipo(linhasRealizado, "SAIDA"),
      },
    },
  };
}

/**
 * DRE completa do ano fiscal `ano`: um resultado por trimestre fiscal (T1–T4)
 * e o acumulado do ano fiscal (soma dos 4 trimestres, que cobrem o ano sem
 * sobreposição).
 */
export async function getDREPeriodos({
  where = {},
  ano,
  mesInicioAnoFiscal,
}: {
  where?: Prisma.LancamentoWhereInput;
  ano: number;
  mesInicioAnoFiscal: number;
}): Promise<Record<DrePeriodoKey, DreResultado>> {
  const [grupos, trimestres] = await Promise.all([
    prisma.grupoDRE.findMany({
      orderBy: { ordem: "asc" },
      include: { contas: { orderBy: { ordem: "asc" } } },
    }),
    Promise.all(
      DRE_TRIMESTRES.map((_, i) =>
        getValoresPeriodo({ where, ...intervaloTrimestre(ano, i + 1, mesInicioAnoFiscal) })
      )
    ),
  ]);

  const resultado = {} as Record<DrePeriodoKey, DreResultado>;
  DRE_TRIMESTRES.forEach((key, i) => {
    resultado[key] = montarDre(grupos, trimestres[i].valores, trimestres[i].totais);
  });
  resultado.ACUM = montarDre(grupos, somarMapas(trimestres.map((t) => t.valores)), {
    receita: trimestres.map((t) => t.totais.receita).reduce(somarValores),
    despesas: trimestres.map((t) => t.totais.despesas).reduce(somarValores),
  });

  return resultado;
}
