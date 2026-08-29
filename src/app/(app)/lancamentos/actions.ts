"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeValores, lancamentoSchema } from "@/lib/lancamento-schema";
import { assertMesAberto } from "@/lib/fechamento";
import { requireRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { saveAnexoForLancamento } from "./anexos-actions";
import { MAX_ANEXO_SIZE, ALLOWED_ANEXO_TYPES } from "@/lib/storage";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return lancamentoSchema.safeParse(raw);
}

export async function createLancamento(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const parsed = parseForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const data = parsed.data;

  try {
    await assertMesAberto(new Date(data.dataCompetencia));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar." };
  }

  const anexosNovos = formData
    .getAll("anexosNovos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of anexosNovos) {
    if (file.size > MAX_ANEXO_SIZE) {
      return { error: `Arquivo "${file.name}" muito grande. O limite é 10MB.` };
    }
    if (!ALLOWED_ANEXO_TYPES.has(file.type)) {
      return { error: `Arquivo "${file.name}": tipo não permitido. Envie PDF, imagem ou documento do Office.` };
    }
  }

  const { valorFinal, saldoAberto } = computeValores(data);

  const criado = await prisma.lancamento.create({
    data: {
      dataLancamento: new Date(data.dataLancamento),
      dataCompetencia: new Date(data.dataCompetencia),
      dataVencimento: new Date(data.dataVencimento),
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
      tipo: data.tipo,
      natureza: data.natureza,
      status: data.status,
      descricao: data.descricao,
      valorOriginal: data.valorOriginal,
      desconto: data.desconto,
      acrescimo: data.acrescimo,
      juros: data.juros,
      multa: data.multa,
      valorFinal,
      valorPago: data.valorPago,
      saldoAberto,
      categoriaId: data.categoriaId,
      subcategoriaId: data.subcategoriaId ?? null,
      contaDreId: data.contaDreId,
      centroCustoId: data.centroCustoId,
      regionalId: data.regionalId,
      projeto: data.projeto || null,
      contaBancariaId: data.contaBancariaId,
      clienteId: data.clienteId ?? null,
      fornecedorId: data.fornecedorId ?? null,
      formaPagamento: data.formaPagamento,
      tipoPagamento: data.tipoPagamento || null,
      observacao: data.observacao || null,
      numeroDocumento: data.numeroDocumento || null,
      numeroNotaFiscal: data.numeroNotaFiscal || null,
      createdById: session.user.id,
    },
  });

  for (const file of anexosNovos) {
    await saveAnexoForLancamento(criado.id, file, session.user.id);
  }

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "CRIAR",
    entidade: "Lancamento",
    entidadeId: criado.id,
    detalhes: criado.descricao,
  });

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return {};
}

export async function updateLancamento(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const parsed = parseForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const data = parsed.data;

  const existente = await prisma.lancamento.findUnique({
    where: { id },
    select: { dataCompetencia: true },
  });
  if (!existente) return { error: "Lançamento não encontrado." };

  try {
    await assertMesAberto(existente.dataCompetencia);
    await assertMesAberto(new Date(data.dataCompetencia));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar." };
  }

  const { valorFinal, saldoAberto } = computeValores(data);

  await prisma.lancamento.update({
    where: { id },
    data: {
      dataLancamento: new Date(data.dataLancamento),
      dataCompetencia: new Date(data.dataCompetencia),
      dataVencimento: new Date(data.dataVencimento),
      dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
      tipo: data.tipo,
      natureza: data.natureza,
      status: data.status,
      descricao: data.descricao,
      valorOriginal: data.valorOriginal,
      desconto: data.desconto,
      acrescimo: data.acrescimo,
      juros: data.juros,
      multa: data.multa,
      valorFinal,
      valorPago: data.valorPago,
      saldoAberto,
      categoriaId: data.categoriaId,
      subcategoriaId: data.subcategoriaId ?? null,
      contaDreId: data.contaDreId,
      centroCustoId: data.centroCustoId,
      regionalId: data.regionalId,
      projeto: data.projeto || null,
      contaBancariaId: data.contaBancariaId,
      clienteId: data.clienteId ?? null,
      fornecedorId: data.fornecedorId ?? null,
      formaPagamento: data.formaPagamento,
      tipoPagamento: data.tipoPagamento || null,
      observacao: data.observacao || null,
      numeroDocumento: data.numeroDocumento || null,
      numeroNotaFiscal: data.numeroNotaFiscal || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "EDITAR",
    entidade: "Lancamento",
    entidadeId: id,
    detalhes: data.descricao,
  });

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteLancamento(id: string): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const existente = await prisma.lancamento.findUnique({
    where: { id },
    select: { dataCompetencia: true, descricao: true },
  });
  if (!existente) return { error: "Lançamento não encontrado." };

  try {
    await assertMesAberto(existente.dataCompetencia);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível excluir." };
  }

  await prisma.lancamento.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
    acao: "EXCLUIR",
    entidade: "Lancamento",
    entidadeId: id,
    detalhes: existente.descricao,
  });

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return {};
}
