"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isRestrictError, RESTRICT_DELETE_MESSAGE } from "@/lib/prisma-errors";

export type ActionState = { error?: string };

const schema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  parentId: z.string().optional(),
  ativo: z.coerce.boolean(),
});

function parseForm(formData: FormData) {
  return schema.safeParse({
    nome: formData.get("nome"),
    tipo: formData.get("tipo"),
    parentId: formData.get("parentId") || undefined,
    ativo: formData.get("ativo") === "on",
  });
}

export async function createCategoria(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  const { parentId, ...rest } = parsed.data;
  await prisma.categoria.create({ data: { ...rest, parentId: parentId ?? null } });
  revalidatePath("/cadastros/categorias");
  return {};
}

export async function updateCategoria(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  if (parsed.data.parentId === id) {
    return { error: "Uma categoria não pode ser subcategoria de si mesma." };
  }

  const { parentId, ...rest } = parsed.data;
  await prisma.categoria.update({
    where: { id },
    data: { ...rest, parentId: parentId ?? null },
  });
  revalidatePath("/cadastros/categorias");
  return {};
}

export async function deleteCategoria(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  try {
    await prisma.categoria.delete({ where: { id } });
  } catch (error) {
    if (isRestrictError(error)) return { error: RESTRICT_DELETE_MESSAGE };
    throw error;
  }

  revalidatePath("/cadastros/categorias");
  return {};
}
