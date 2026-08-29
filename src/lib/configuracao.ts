import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { resolveLogoPath } from "@/lib/storage";

export const CONFIG_ID = "singleton";

/** Só png/jpeg são suportados como imagem embutida em planilhas (limitação do exceljs) — webp é ignorado. */
const EXCEL_EXTENSION_BY_FILE_EXT: Record<string, "png" | "jpeg"> = {
  ".png": "png",
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
};

/** Lê o logo salvo para embutir em relatórios .xlsx. Retorna null se não houver logo ou o formato não for suportado. */
export async function getLogoForExcel(): Promise<{ buffer: Buffer; extension: "png" | "jpeg" } | null> {
  const configuracao = await getConfiguracao();
  if (!configuracao.logoPath) return null;

  const fileExt = configuracao.logoPath.slice(configuracao.logoPath.lastIndexOf("."));
  const extension = EXCEL_EXTENSION_BY_FILE_EXT[fileExt];
  if (!extension) return null;

  try {
    const buffer = await readFile(resolveLogoPath(configuracao.logoPath));
    return { buffer, extension };
  } catch {
    return null;
  }
}

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
