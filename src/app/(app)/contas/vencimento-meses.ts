import type { Prisma } from "@/generated/prisma/client";

/**
 * Filtro de Contas a Pagar por mês de vencimento. `meses=1,3` (1–12) e `ano`
 * (padrão: ano corrente). Sem meses marcados não há filtro de data.
 */
export function getVencimentoMesesFilter(
  params: Record<string, string | string[] | undefined>
): Prisma.LancamentoWhereInput {
  const meses = (typeof params.meses === "string" ? params.meses : "")
    .split(",")
    .map(Number)
    .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12);
  if (meses.length === 0) return {};

  const ano = typeof params.ano === "string" && Number(params.ano) ? Number(params.ano) : new Date().getUTCFullYear();
  return {
    OR: meses.map((m) => ({
      dataVencimento: { gte: new Date(Date.UTC(ano, m - 1, 1)), lt: new Date(Date.UTC(ano, m, 1)) },
    })),
  };
}
