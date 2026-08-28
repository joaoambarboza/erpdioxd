"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export type ActionState = { error?: string };

export async function fecharMes(ano: number, mes: number): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  await prisma.fechamentoMensal.upsert({
    where: { ano_mes: { ano, mes } },
    update: { status: "FECHADO", fechadoEm: new Date(), fechadoPorId: session.user.id },
    create: { ano, mes, status: "FECHADO", fechadoEm: new Date(), fechadoPorId: session.user.id },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "FECHAR_MES",
    entidade: "FechamentoMensal",
    entidadeId: `${ano}-${mes}`,
    detalhes: `${mes}/${ano}`,
  });

  revalidatePath("/fechamento-mensal");
  return {};
}

export async function reabrirMes(ano: number, mes: number): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  await prisma.fechamentoMensal.upsert({
    where: { ano_mes: { ano, mes } },
    update: { status: "ABERTO", fechadoEm: null, fechadoPorId: null },
    create: { ano, mes, status: "ABERTO" },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "REABRIR_MES",
    entidade: "FechamentoMensal",
    entidadeId: `${ano}-${mes}`,
    detalhes: `${mes}/${ano}`,
  });

  revalidatePath("/fechamento-mensal");
  return {};
}
