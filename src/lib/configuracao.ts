import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const CONFIG_ID = "singleton";

export async function getConfiguracao() {
  const existente = await prisma.configuracaoEmpresa.findUnique({ where: { id: CONFIG_ID } });
  if (existente) return existente;

  try {
    return await prisma.configuracaoEmpresa.create({ data: { id: CONFIG_ID } });
  } catch (error) {
    // Corrida: outra requisição criou a linha entre o findUnique e o create acima.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const criadaEmParalelo = await prisma.configuracaoEmpresa.findUnique({ where: { id: CONFIG_ID } });
      if (criadaEmParalelo) return criadaEmParalelo;
    }
    throw error;
  }
}
