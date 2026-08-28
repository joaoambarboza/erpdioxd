import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

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

export type DreLinhaGrupo = {
  id: string;
  nome: string;
  contas: { id: string; nome: string; total: number }[];
  totalGrupo: number;
  resultadoParcial: number;
};

export async function getDREData({
  where = {},
  periodStart,
  periodEnd,
}: {
  where?: Prisma.LancamentoWhereInput;
  periodStart: Date;
  periodEnd: Date;
}) {
  const [porConta, grupos] = await Promise.all([
    prisma.lancamento.groupBy({
      by: ["contaDreId", "tipo"],
      _sum: { valorFinal: true },
      where: { ...where, dataCompetencia: { gte: periodStart, lt: periodEnd } },
    }),
    prisma.grupoDRE.findMany({
      orderBy: { ordem: "asc" },
      include: { contas: { orderBy: { ordem: "asc" } } },
    }),
  ]);

  const totalPorConta = new Map<string, number>();
  for (const row of porConta) {
    const valor = toNum(row._sum.valorFinal);
    const signed = row.tipo === "ENTRADA" ? valor : -valor;
    totalPorConta.set(row.contaDreId, (totalPorConta.get(row.contaDreId) ?? 0) + signed);
  }

  const linhasGrupo = grupos.reduce<DreLinhaGrupo[]>((linhas, grupo) => {
    const contas = grupo.contas.map((conta) => ({
      id: conta.id,
      nome: conta.nome,
      total: totalPorConta.get(conta.id) ?? 0,
    }));
    const totalGrupo = contas.reduce((acc, c) => acc + c.total, 0);
    const acumuladoAnterior = linhas.at(-1)?.resultadoParcial ?? 0;
    linhas.push({
      id: grupo.id,
      nome: grupo.nome,
      contas,
      totalGrupo,
      resultadoParcial: acumuladoAnterior + totalGrupo,
    });
    return linhas;
  }, []);

  const receita = porConta.filter((r) => r.tipo === "ENTRADA").reduce((acc, r) => acc + toNum(r._sum.valorFinal), 0);
  const despesas = porConta.filter((r) => r.tipo === "SAIDA").reduce((acc, r) => acc + toNum(r._sum.valorFinal), 0);
  const resultado = receita - despesas;
  const margem = receita > 0 ? (resultado / receita) * 100 : 0;

  return { linhasGrupo, receita, despesas, resultado, margem };
}
