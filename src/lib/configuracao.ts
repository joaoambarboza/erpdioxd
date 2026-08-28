import { prisma } from "@/lib/prisma";

export const CONFIG_ID = "singleton";

export async function getConfiguracao() {
  const existente = await prisma.configuracaoEmpresa.findUnique({ where: { id: CONFIG_ID } });
  if (existente) return existente;

  return prisma.configuracaoEmpresa.create({ data: { id: CONFIG_ID } });
}
