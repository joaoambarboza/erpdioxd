"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isRestrictError, RESTRICT_DELETE_MESSAGE } from "@/lib/prisma-errors";
import { ehReceitaLiquida, padronizarRotuloSubtotal, RECEITA_LIQUIDA_LABEL } from "@/lib/dre";

export type ActionState = { error?: string };

const grupoSchema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  ordem: z.coerce.number().int().min(0),
  // Vazio vira null (e limpa o rótulo salvo); "Receita Líquida" é gravado sempre na grafia padrão.
  subtotalLabel: z.string().nullable().transform(padronizarRotuloSubtotal),
  mostrarPercentual: z.coerce.boolean(),
});

function parseGrupoForm(formData: FormData) {
  return grupoSchema.safeParse({
    nome: formData.get("nome"),
    ordem: formData.get("ordem") || 0,
    subtotalLabel: (formData.get("subtotalLabel") as string | null) ?? "",
    mostrarPercentual: formData.get("mostrarPercentual") === "on",
  });
}

/** Só um grupo pode ter o subtotal "Receita Líquida": é a base dos percentuais e da margem. */
async function receitaLiquidaDuplicada(subtotalLabel: string | null, ignorarId?: string) {
  if (!ehReceitaLiquida(subtotalLabel)) return false;
  const outros = await prisma.grupoDRE.findMany({
    where: { subtotalLabel: { not: null }, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
    select: { subtotalLabel: true },
  });
  return outros.some((g) => ehReceitaLiquida(g.subtotalLabel));
}

const RECEITA_LIQUIDA_DUPLICADA = `Já existe outro grupo com o subtotal "${RECEITA_LIQUIDA_LABEL}". Só um grupo pode usá-lo.`;

export async function createGrupoDRE(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseGrupoForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  if (await receitaLiquidaDuplicada(parsed.data.subtotalLabel)) return { error: RECEITA_LIQUIDA_DUPLICADA };

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

  if (await receitaLiquidaDuplicada(parsed.data.subtotalLabel, id)) return { error: RECEITA_LIQUIDA_DUPLICADA };

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
  regime: z.enum(["CAIXA", "COMPETENCIA"]),
});

function parseContaForm(formData: FormData) {
  return contaSchema.safeParse({
    nome: formData.get("nome"),
    ordem: formData.get("ordem") || 0,
    grupoId: formData.get("grupoId"),
    regime: formData.get("regime") || "COMPETENCIA",
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
