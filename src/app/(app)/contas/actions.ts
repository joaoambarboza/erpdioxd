"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertMesAberto } from "@/lib/fechamento";
import { requireRole } from "@/lib/permissions";

export type ActionState = { error?: string };

const schema = z.object({
  valorRegistrado: z.coerce.number().positive("Deve ser maior que zero"),
  dataPagamento: z.string().min(1, "Obrigatório"),
});

export async function registrarPagamento(
  id: string,
  revalidatePaths: string[],
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };

  const parsed = schema.safeParse({
    valorRegistrado: formData.get("valorRegistrado"),
    dataPagamento: formData.get("dataPagamento"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  const lancamento = await prisma.lancamento.findUnique({ where: { id } });
  if (!lancamento) return { error: "Lançamento não encontrado." };

  try {
    await assertMesAberto(lancamento.dataCompetencia);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar." };
  }

  const valorFinal = Number(lancamento.valorFinal.toString());
  const valorPagoAtual = Number(lancamento.valorPago.toString());
  const novoValorPago = Math.min(valorPagoAtual + parsed.data.valorRegistrado, valorFinal);
  const saldoAberto = Math.round((valorFinal - novoValorPago) * 100) / 100;

  const quitado = saldoAberto <= 0;
  const status =
    lancamento.tipo === "ENTRADA"
      ? quitado
        ? "RECEBIDO"
        : "PARCIAL_RECEBIDO"
      : quitado
        ? "PAGO"
        : "PARCIAL_PAGO";

  await prisma.lancamento.update({
    where: { id },
    data: {
      valorPago: novoValorPago,
      saldoAberto,
      status,
      dataPagamento: new Date(parsed.data.dataPagamento),
    },
  });

  for (const path of revalidatePaths) revalidatePath(path);
  return {};
}
