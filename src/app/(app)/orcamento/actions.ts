"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export type ActionState = { error?: string };

const schema = z.object({
  ano: z.coerce.number().int(),
  mes: z.coerce.number().int().min(1).max(12),
  categoriaId: z.string().min(1),
  valorOrcado: z.coerce.number().min(0, "Deve ser maior ou igual a zero"),
});

export async function setOrcamento(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = schema.safeParse({
    ano: formData.get("ano"),
    mes: formData.get("mes"),
    categoriaId: formData.get("categoriaId"),
    valorOrcado: formData.get("valorOrcado"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  const { ano, mes, categoriaId, valorOrcado } = parsed.data;

  await prisma.orcamentoItem.upsert({
    where: { ano_mes_categoriaId: { ano, mes, categoriaId } },
    update: { valorOrcado },
    create: { ano, mes, categoriaId, valorOrcado },
  });

  revalidatePath("/orcamento");
  return {};
}

export async function deleteOrcamento(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  await prisma.orcamentoItem.delete({ where: { id } });

  revalidatePath("/orcamento");
  return {};
}
