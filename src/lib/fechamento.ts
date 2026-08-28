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
