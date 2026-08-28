"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertMesAberto } from "@/lib/fechamento";
import { requireRole } from "@/lib/permissions";

export type ActionState = { error?: string };

export async function confirmarProjecao(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const lancamento = await prisma.lancamento.findUnique({ where: { id } });
  if (!lancamento) return { error: "Lançamento não encontrado." };

  try {
    await assertMesAberto(lancamento.dataCompetencia);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível confirmar." };
  }

  await prisma.lancamento.update({ where: { id }, data: { status: "EM_ABERTO" } });

  revalidatePath("/projecoes");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  revalidatePath("/dre");
  revalidatePath("/projetado-x-realizado");
  return {};
}
