"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isRestrictError, RESTRICT_DELETE_MESSAGE } from "@/lib/prisma-errors";

export type ActionState = { error?: string };

const grupoSchema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  ordem: z.coerce.number().int().min(0),
});

function parseGrupoForm(formData: FormData) {
  return grupoSchema.safeParse({
    nome: formData.get("nome"),
    ordem: formData.get("ordem") || 0,
  });
}

export async function createGrupoDRE(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseGrupoForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.grupoDRE.create({ data: parsed.data });
  revalidatePath("/cadastros/plano-de-contas");
  return {};
}

export async function updateGrupoDRE(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseGrupoForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.grupoDRE.update({ where: { id }, data: parsed.data });
  revalidatePath("/cadastros/plano-de-contas");
  return {};
}

export async function deleteGrupoDRE(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  try {
    await prisma.grupoDRE.delete({ where: { id } });
  } catch (error) {
    if (isRestrictError(error)) return { error: RESTRICT_DELETE_MESSAGE };
    throw error;
  }

  revalidatePath("/cadastros/plano-de-contas");
  return {};
}

const contaSchema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  ordem: z.coerce.number().int().min(0),
  grupoId: z.string().min(1, "Obrigatório"),
});

function parseContaForm(formData: FormData) {
  return contaSchema.safeParse({
    nome: formData.get("nome"),
    ordem: formData.get("ordem") || 0,
    grupoId: formData.get("grupoId"),
  });
}

export async function createContaDRE(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseContaForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.contaDRE.create({ data: parsed.data });
  revalidatePath("/cadastros/plano-de-contas");
  return {};
}

export async function updateContaDRE(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseContaForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  await prisma.contaDRE.update({ where: { id }, data: parsed.data });
  revalidatePath("/cadastros/plano-de-contas");
  return {};
}

export async function deleteContaDRE(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  try {
    await prisma.contaDRE.delete({ where: { id } });
  } catch (error) {
    if (isRestrictError(error)) return { error: RESTRICT_DELETE_MESSAGE };
    throw error;
  }

  revalidatePath("/cadastros/plano-de-contas");
  return {};
}
