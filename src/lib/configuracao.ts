import { prisma } from "@/lib/prisma";

export const CONFIG_ID = "singleton";

export async function getConfiguracao() {
  return prisma.configuracaoEmpresa.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID },
  });
}
