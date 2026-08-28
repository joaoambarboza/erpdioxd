"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { CONFIG_ID } from "@/lib/configuracao";
import { saveLogoFile, clearLogoFiles, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES } from "@/lib/storage";

export type ActionState = { error?: string };

const schema = z.object({
  nome: z.string().min(1, "Obrigatório"),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  mesInicioAnoFiscal: z.coerce.number().int().min(1).max(12),
});

export async function updateConfiguracao(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const parsed = schema.safeParse({
    nome: formData.get("nome"),
    cnpj: formData.get("cnpj") || undefined,
    endereco: formData.get("endereco") || undefined,
    mesInicioAnoFiscal: formData.get("mesInicioAnoFiscal"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  await prisma.configuracaoEmpresa.upsert({
    where: { id: CONFIG_ID },
    update: parsed.data,
    create: { id: CONFIG_ID, ...parsed.data },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "EDITAR",
    entidade: "Configuracao",
    detalhes: `${parsed.data.nome} — ano fiscal a partir do mês ${parsed.data.mesInicioAnoFiscal}`,
  });

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return {};
}

export async function uploadLogo(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }
  if (file.size > MAX_LOGO_SIZE) {
    return { error: "Imagem muito grande. O limite é 2MB." };
  }
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return { error: "Envie uma imagem JPG, PNG ou WEBP." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const logoPath = await saveLogoFile(file.name, buffer);

  await prisma.configuracaoEmpresa.upsert({
    where: { id: CONFIG_ID },
    update: { logoPath },
    create: { id: CONFIG_ID, logoPath },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "EDITAR",
    entidade: "Configuracao",
    detalhes: "Logo atualizado",
  });

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return {};
}

export async function removeLogo(): Promise<ActionState> {
  const check = await requireRole("ADMIN");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  await clearLogoFiles();
  await prisma.configuracaoEmpresa.upsert({
    where: { id: CONFIG_ID },
    update: { logoPath: null },
    create: { id: CONFIG_ID },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "EDITAR",
    entidade: "Configuracao",
    detalhes: "Logo removido",
  });

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return {};
}
