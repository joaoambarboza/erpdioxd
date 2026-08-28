"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isRestrictError, RESTRICT_DELETE_MESSAGE } from "@/lib/prisma-errors";

export type ActionState = { error?: string };

const schema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  ativo: z.coerce.boolean(),
});

function parseForm(formData: FormData) {
  return schema.safeParse({
    nome: formData.get("nome"),
    ativo: formData.get("ativo") === "on",
  });
}

export async function createRegional(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.regional.create({ data: parsed.data });
  revalidatePath("/cadastros/regionais");
  return {};
}

export async function updateRegional(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.regional.update({ where: { id }, data: parsed.data });
  revalidatePath("/cadastros/regionais");
  return {};
}

export async function deleteRegional(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  try {
    await prisma.regional.delete({ where: { id } });
  } catch (error) {
    if (isRestrictError(error)) return { error: RESTRICT_DELETE_MESSAGE };
    throw error;
  }

  revalidatePath("/cadastros/regionais");
  return {};
}
