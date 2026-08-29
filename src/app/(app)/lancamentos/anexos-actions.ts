"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { saveAnexoFile, deleteAnexoFile, MAX_ANEXO_SIZE, ALLOWED_ANEXO_TYPES } from "@/lib/storage";

export type ActionState = { error?: string };

/** Valida e salva um único arquivo como Anexo de um lançamento já existente. Lança erro em vez de retornar `{error}` — quem chama decide como reportar. */
export async function saveAnexoForLancamento(
  lancamentoId: string,
  file: File,
  uploadedById: string
) {
  if (file.size === 0) throw new Error(`Arquivo "${file.name}" está vazio.`);
  if (file.size > MAX_ANEXO_SIZE) {
    throw new Error(`Arquivo "${file.name}" muito grande. O limite é 10MB.`);
  }
  if (!ALLOWED_ANEXO_TYPES.has(file.type)) {
    throw new Error(
      `Arquivo "${file.name}": tipo não permitido. Envie PDF, imagem ou documento do Office.`
    );
  }

  const anexo = await prisma.anexo.create({
    data: {
      lancamentoId,
      nomeArquivo: file.name,
      caminhoArquivo: "",
      tamanho: file.size,
      tipoMime: file.type,
      uploadedById,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const caminhoArquivo = await saveAnexoFile(lancamentoId, anexo.id, file.name, buffer);

  await prisma.anexo.update({ where: { id: anexo.id }, data: { caminhoArquivo } });
}

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

  const lancamento = await prisma.lancamento.findUnique({
    where: { id: lancamentoId },
    select: { id: true },
  });
  if (!lancamento) return { error: "Lançamento não encontrado." };

  try {
    await saveAnexoForLancamento(lancamentoId, file, session.user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível anexar o arquivo." };
  }

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
