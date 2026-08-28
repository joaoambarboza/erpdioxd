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
  regionalId: z.string().optional(),
  ativo: z.coerce.boolean(),
});

function parseForm(formData: FormData) {
  return schema.safeParse({
    nome: formData.get("nome"),
    documento: formData.get("documento") || undefined,
    contato: formData.get("contato") || undefined,
    regionalId: formData.get("regionalId") || undefined,
    ativo: formData.get("ativo") === "on",
  });
}

export async function createCliente(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  const { regionalId, ...rest } = parsed.data;
  await prisma.cliente.create({
    data: { ...rest, regionalId: regionalId ?? null },
  });
  revalidatePath("/cadastros/clientes");
  return {};
}

export async function updateCliente(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Verifique os campos." };

  const { regionalId, ...rest } = parsed.data;
  await prisma.cliente.update({
    where: { id },
    data: { ...rest, regionalId: regionalId ?? null },
  });
  revalidatePath("/cadastros/clientes");
  return {};
}

export async function deleteCliente(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/cadastros/clientes");
  return {};
}
