import { prisma } from "@/lib/prisma";

export async function logAudit({
  userId,
  userName,
  acao,
  entidade,
  entidadeId,
  detalhes,
}: {
  userId?: string | null;
  userName: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhes?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: { userId: userId ?? null, userName, acao, entidade, entidadeId, detalhes },
    });
  } catch (error) {
    console.error("Falha ao registrar log de auditoria:", error);
  }
}

/** Várias entradas de auditoria em uma só consulta (ex.: séries de recorrência). */
export async function logAuditMany(
  entries: {
    userId?: string | null;
    userName: string;
    acao: string;
    entidade: string;
    entidadeId?: string;
    detalhes?: string;
  }[]
) {
  if (entries.length === 0) return;
  try {
    await prisma.auditLog.createMany({
      data: entries.map((e) => ({ ...e, userId: e.userId ?? null })),
    });
  } catch (error) {
    console.error("Falha ao registrar log de auditoria:", error);
  }
}
