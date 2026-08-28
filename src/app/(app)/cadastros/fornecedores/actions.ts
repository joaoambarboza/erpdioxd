"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string };

const schema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  documento: z.string().optional(),
  contato: z.string().optional(),
  ativo: z.coerce.boolean(),
});

function parseForm(formData: FormData) {
  return schema.safeParse({
    nome: formData.get("nome"),
    documento: formData.get("documento") || undefined,
    contato: formData.get("contato") || undefined,
    ativo: formData.get("ativo") === "on",
  });
}

export async function createFornecedor(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.fornecedor.create({ data: parsed.data });
  revalidatePath("/cadastros/fornecedores");
  return {};
}

export async function updateFornecedor(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.fornecedor.update({ where: { id }, data: parsed.data });
  revalidatePath("/cadastros/fornecedores");
  return {};
}

export async function deleteFornecedor(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  await prisma.fornecedor.delete({ where: { id } });
  revalidatePath("/cadastros/fornecedores");
  return {};
}
