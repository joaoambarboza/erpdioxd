"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { saveAnexoFile, deleteAnexoFile, MAX_ANEXO_SIZE, ALLOWED_ANEXO_TYPES } from "@/lib/storage";

export type ActionState = { error?: string };

export async function uploadAnexo(
  lancamentoId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }

  if (file.size > MAX_ANEXO_SIZE) {
    return { error: "Arquivo muito grande. O limite é 10MB." };
  }

  if (!ALLOWED_ANEXO_TYPES.has(file.type)) {
    return { error: "Tipo de arquivo não permitido. Envie PDF, imagem ou documento do Office." };
  }

  const lancamento = await prisma.lancamento.findUnique({
    where: { id: lancamentoId },
    select: { id: true },
  });
  if (!lancamento) return { error: "Lançamento não encontrado." };

  const anexo = await prisma.anexo.create({
    data: {
      lancamentoId,
      nomeArquivo: file.name,
      caminhoArquivo: "",
      tamanho: file.size,
      tipoMime: file.type,
      uploadedById: session.user.id,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const caminhoArquivo = await saveAnexoFile(lancamentoId, anexo.id, file.name, buffer);

  await prisma.anexo.update({ where: { id: anexo.id }, data: { caminhoArquivo } });

  revalidatePath("/lancamentos");
  revalidatePath("/contas-a-receber");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/projecoes");
  return {};
}

export async function deleteAnexo(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const anexo = await prisma.anexo.findUnique({ where: { id } });
  if (!anexo) return { error: "Anexo não encontrado." };

  await prisma.anexo.delete({ where: { id } });
  await deleteAnexoFile(anexo.caminhoArquivo);

  revalidatePath("/lancamentos");
  revalidatePath("/contas-a-receber");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/projecoes");
  return {};
}
