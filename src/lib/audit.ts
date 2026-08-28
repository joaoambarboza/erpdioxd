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
