import { prisma } from "@/lib/prisma";

export async function isMesFechado(data: Date): Promise<boolean> {
  const fechamento = await prisma.fechamentoMensal.findUnique({
    where: { ano_mes: { ano: data.getUTCFullYear(), mes: data.getUTCMonth() + 1 } },
  });
  return fechamento?.status === "FECHADO";
}

export async function assertMesAberto(data: Date): Promise<void> {
  if (await isMesFechado(data)) {
    throw new Error(
      "Este mês está fechado. Reabra o mês em Fechamento Mensal para editar."
    );
  }
}

/**
 * Entre as datas informadas, devolve as que caem em meses já fechados. Uma
 * única consulta, para validar séries inteiras (recorrência) de uma vez.
 */
export async function datasEmMesesFechados(datas: Date[]): Promise<Date[]> {
  if (datas.length === 0) return [];
  const fechados = await prisma.fechamentoMensal.findMany({
    where: { status: "FECHADO" },
    select: { ano: true, mes: true },
  });
  const chaves = new Set(fechados.map((f) => f.ano * 12 + (f.mes - 1)));
  return datas.filter((d) => chaves.has(d.getUTCFullYear() * 12 + d.getUTCMonth()));
}
