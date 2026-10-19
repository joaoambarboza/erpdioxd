"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  computeValores,
  lancamentoSchema,
  type LancamentoFormValues,
} from "@/lib/lancamento-schema";
import { assertMesAberto, datasEmMesesFechados } from "@/lib/fechamento";
import { requireRole } from "@/lib/permissions";
import { logAudit, logAuditMany } from "@/lib/audit";
import { saveAnexoForLancamento } from "./anexos-actions";
import { MAX_ANEXO_SIZE, ALLOWED_ANEXO_TYPES } from "@/lib/storage";
import {
  descricaoComParcela,
  gerarParcelas,
  mesesDistintos,
  recorrenciaSchema,
} from "@/lib/recorrencia";
import { formatCurrency } from "@/lib/utils";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

export type EscopoSerie = "este" | "seguintes";

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return lancamentoSchema.safeParse(raw);
}

/** Campos de um lançamento a partir dos valores validados do formulário (sem `createdById`). */
function buildLancamentoData(data: LancamentoFormValues) {
  const { valorFinal, saldoAberto } = computeValores(data);
  return {
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
  };
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[], prefix = "") {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const campo = String(issue.path[0]);
    fieldErrors[prefix ? `${prefix}${campo[0].toUpperCase()}${campo.slice(1)}` : campo] = issue.message;
  }
  return fieldErrors;
}

function auditUser(session: { user: { id: string; name?: string | null; email?: string | null } }) {
  return {
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "—",
  };
}

export async function createLancamento(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const parsed = parseForm(formData);
  const recorrente = formData.get("recorrente") === "on";
  const recorrenciaParsed = recorrente
    ? recorrenciaSchema.safeParse({
        meses: formData.get("recorrenciaMeses"),
        dia: formData.get("recorrenciaDia"),
        chave: formData.get("recorrenciaChave"),
      })
    : null;

  if (!parsed.success || (recorrenciaParsed && !recorrenciaParsed.success)) {
    const fieldErrors = {
      ...(parsed.success ? {} : fieldErrorsFrom(parsed.error.issues)),
      ...(recorrenciaParsed && !recorrenciaParsed.success
        ? fieldErrorsFrom(recorrenciaParsed.error.issues, "recorrencia")
        : {}),
    };
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const data = parsed.data;

  const anexosNovos = formData
    .getAll("anexosNovos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (recorrenciaParsed?.success) {
    return createLancamentoRecorrente(data, recorrenciaParsed.data, anexosNovos, session);
  }

  try {
    await assertMesAberto(new Date(data.dataCompetencia));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar." };
  }

  for (const file of anexosNovos) {
    if (file.size > MAX_ANEXO_SIZE) {
      return { error: `Arquivo "${file.name}" muito grande. O limite é 10MB.` };
    }
    if (!ALLOWED_ANEXO_TYPES.has(file.type)) {
      return { error: `Arquivo "${file.name}": tipo não permitido. Envie PDF, imagem ou documento do Office.` };
    }
  }

  const criado = await prisma.lancamento.create({
    data: { ...buildLancamentoData(data), createdById: session.user.id },
  });

  for (const file of anexosNovos) {
    await saveAnexoForLancamento(criado.id, file, session.user.id);
  }

  await logAudit({
    ...auditUser(session),
    acao: "CRIAR",
    entidade: "Lancamento",
    entidadeId: criado.id,
    detalhes: criado.descricao,
  });

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return {};
}

async function createLancamentoRecorrente(
  data: LancamentoFormValues,
  recorrencia: { meses: number; dia: number; chave: string },
  anexosNovos: File[],
  session: { user: { id: string; name?: string | null; email?: string | null } }
): Promise<ActionState> {
  // Reenvio da mesma requisição (duplo clique, retry de rede): a série já foi
  // criada, então responde sucesso sem criar nada de novo.
  const jaCriada = await prisma.recorrencia.findUnique({
    where: { chaveIdempotencia: recorrencia.chave },
    select: { id: true },
  });
  if (jaCriada) {
    revalidatePath("/lancamentos");
    revalidatePath("/dashboard");
    return {};
  }

  for (const file of anexosNovos) {
    if (file.size > MAX_ANEXO_SIZE) {
      return { error: `Arquivo "${file.name}" muito grande. O limite é 10MB.` };
    }
    if (!ALLOWED_ANEXO_TYPES.has(file.type)) {
      return { error: `Arquivo "${file.name}": tipo não permitido. Envie PDF, imagem ou documento do Office.` };
    }
  }

  const base = buildLancamentoData(data);
  const parcelas = gerarParcelas({
    dataLancamento: base.dataLancamento,
    dataCompetencia: base.dataCompetencia,
    dataVencimento: base.dataVencimento,
    meses: recorrencia.meses,
    dia: recorrencia.dia,
  });

  const fechadas = await datasEmMesesFechados(parcelas.map((p) => p.dataCompetencia));
  if (fechadas.length > 0) {
    return {
      error: `Nenhum lançamento foi criado: o(s) mês(es) ${mesesDistintos(fechadas).join(", ")} está(ão) fechado(s). Reabra em Fechamento Mensal ou reduza a quantidade de meses.`,
    };
  }

  // Parcelas seguintes nascem sem pagamento. Uma projeção continua projeção;
  // qualquer outro status (inclusive PAGO/RECEBIDO do original) vira "em aberto".
  const statusSeguintes = data.status === "PROJETADO" ? "PROJETADO" : "EM_ABERTO";

  let criados: { id: string; descricao: string }[];
  try {
    criados = await prisma.$transaction(
      async (tx) => {
        const serie = await tx.recorrencia.create({
          data: {
            frequencia: "MENSAL",
            dataInicio: parcelas[0].dataVencimento,
            dataFim: parcelas[parcelas.length - 1].dataVencimento,
            parcelas: recorrencia.meses,
            chaveIdempotencia: recorrencia.chave,
          },
        });

        const resultado: { id: string; descricao: string }[] = [];
        for (const p of parcelas) {
          const original = p.parcela === 1;
          const descricao = descricaoComParcela(base.descricao, p.parcela, recorrencia.meses);
          const criado = await tx.lancamento.create({
            data: original
              ? {
                  ...base,
                  descricao,
                  recorrenciaId: serie.id,
                  parcelaNumero: p.parcela,
                  createdById: session.user.id,
                }
              : {
                  ...base,
                  descricao,
                  dataLancamento: p.dataLancamento,
                  dataCompetencia: p.dataCompetencia,
                  dataVencimento: p.dataVencimento,
                  dataPagamento: null,
                  status: statusSeguintes,
                  valorPago: 0,
                  saldoAberto: base.valorFinal,
                  numeroDocumento: null,
                  numeroNotaFiscal: null,
                  recorrenciaId: serie.id,
                  parcelaNumero: p.parcela,
                  createdById: session.user.id,
                },
            select: { id: true, descricao: true },
          });
          resultado.push(criado);
        }
        return resultado;
      },
      { timeout: 30_000 }
    );
  } catch (error) {
    // Requisição idêntica concorrente: a outra transação venceu a corrida pela chave única.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const existe = await prisma.recorrencia.findUnique({
        where: { chaveIdempotencia: recorrencia.chave },
        select: { id: true },
      });
      if (existe) {
        revalidatePath("/lancamentos");
        revalidatePath("/dashboard");
        return {};
      }
    }
    throw error;
  }

  // Anexos ficam só no lançamento original (parcela 1).
  for (const file of anexosNovos) {
    await saveAnexoForLancamento(criados[0].id, file, session.user.id);
  }

  await logAuditMany(
    criados.map((c) => ({
      ...auditUser(session),
      acao: "CRIAR",
      entidade: "Lancamento",
      entidadeId: c.id,
      detalhes: `${c.descricao} — recorrência mensal de ${recorrencia.meses} lançamentos`,
    }))
  );

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
    return { error: "Verifique os campos destacados.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const data = parsed.data;

  const existente = await prisma.lancamento.findUnique({
    where: { id },
    select: { dataCompetencia: true, recorrenciaId: true, parcelaNumero: true },
  });
  if (!existente) return { error: "Lançamento não encontrado." };

  try {
    await assertMesAberto(existente.dataCompetencia);
    await assertMesAberto(new Date(data.dataCompetencia));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar." };
  }

  const dadosAtualizados = buildLancamentoData(data);
  const aplicarAosSeguintes =
    formData.get("escopo") === "seguintes" &&
    existente.recorrenciaId !== null &&
    existente.parcelaNumero !== null;

  if (!aplicarAosSeguintes) {
    await prisma.lancamento.update({ where: { id }, data: dadosAtualizados });

    await logAudit({
      ...auditUser(session),
      acao: "EDITAR",
      entidade: "Lancamento",
      entidadeId: id,
      detalhes: data.descricao,
    });

    revalidatePath("/lancamentos");
    revalidatePath("/dashboard");
    return {};
  }

  // "Este e os seguintes": propaga classificação e valores. Datas, status,
  // descrição, documento e NF de cada parcela seguinte não mudam.
  const seguintes = await prisma.lancamento.findMany({
    where: {
      recorrenciaId: existente.recorrenciaId!,
      parcelaNumero: { gt: existente.parcelaNumero! },
      status: { not: "CANCELADO" },
    },
    select: { id: true, descricao: true, dataCompetencia: true, valorPago: true },
    orderBy: { parcelaNumero: "asc" },
  });

  const comBaixa = seguintes.filter((s) => Number(s.valorPago.toString()) > 0);
  if (comBaixa.length > 0) {
    return {
      error: `Não foi possível aplicar aos seguintes: ${comBaixa.length} já tem pagamento/recebimento registrado (${mesesDistintos(comBaixa.map((s) => s.dataCompetencia)).join(", ")}). Edite-os individualmente ou escolha "Somente este".`,
    };
  }
  const fechadas = await datasEmMesesFechados(seguintes.map((s) => s.dataCompetencia));
  if (fechadas.length > 0) {
    return {
      error: `Nenhum lançamento foi alterado: o(s) mês(es) ${mesesDistintos(fechadas).join(", ")} está(ão) fechado(s). Reabra em Fechamento Mensal ou escolha "Somente este".`,
    };
  }

  const {
    tipo, natureza, valorOriginal, desconto, acrescimo, juros, multa, valorFinal,
    categoriaId, subcategoriaId, contaDreId, centroCustoId, regionalId, projeto,
    contaBancariaId, clienteId, fornecedorId, formaPagamento, tipoPagamento, observacao,
  } = dadosAtualizados;

  await prisma.$transaction([
    prisma.lancamento.update({ where: { id }, data: dadosAtualizados }),
    prisma.lancamento.updateMany({
      where: { id: { in: seguintes.map((s) => s.id) } },
      data: {
        tipo, natureza, valorOriginal, desconto, acrescimo, juros, multa, valorFinal,
        saldoAberto: valorFinal, // seguintes sem baixa: saldo = valor final
        categoriaId, subcategoriaId, contaDreId, centroCustoId, regionalId, projeto,
        contaBancariaId, clienteId, fornecedorId, formaPagamento, tipoPagamento, observacao,
      },
    }),
  ]);

  await logAuditMany([
    { ...auditUser(session), acao: "EDITAR", entidade: "Lancamento", entidadeId: id, detalhes: data.descricao },
    ...seguintes.map((s) => ({
      ...auditUser(session),
      acao: "EDITAR",
      entidade: "Lancamento",
      entidadeId: s.id,
      detalhes: `${s.descricao} — alteração em "este e os seguintes" (${formatCurrency(valorFinal)})`,
    })),
  ]);

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteLancamento(
  id: string,
  escopo: EscopoSerie = "este"
): Promise<ActionState> {
  const check = await requireRole("FINANCEIRO");
  if (check.error !== undefined) return { error: check.error };
  const { session } = check;

  const existente = await prisma.lancamento.findUnique({
    where: { id },
    select: { dataCompetencia: true, descricao: true, recorrenciaId: true, parcelaNumero: true },
  });
  if (!existente) return { error: "Lançamento não encontrado." };

  try {
    await assertMesAberto(existente.dataCompetencia);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível excluir." };
  }

  if (escopo === "seguintes" && existente.recorrenciaId !== null && existente.parcelaNumero !== null) {
    const seguintes = await prisma.lancamento.findMany({
      where: {
        recorrenciaId: existente.recorrenciaId,
        parcelaNumero: { gt: existente.parcelaNumero },
      },
      select: { id: true, descricao: true, dataCompetencia: true, valorPago: true },
      orderBy: { parcelaNumero: "asc" },
    });

    const comBaixa = seguintes.filter((s) => Number(s.valorPago.toString()) > 0);
    if (comBaixa.length > 0) {
      return {
        error: `Nenhum lançamento foi excluído: ${comBaixa.length} dos seguintes já tem pagamento/recebimento registrado (${mesesDistintos(comBaixa.map((s) => s.dataCompetencia)).join(", ")}). Exclua-os individualmente ou escolha "Somente este".`,
      };
    }
    const fechadas = await datasEmMesesFechados(seguintes.map((s) => s.dataCompetencia));
    if (fechadas.length > 0) {
      return {
        error: `Nenhum lançamento foi excluído: o(s) mês(es) ${mesesDistintos(fechadas).join(", ")} está(ão) fechado(s). Reabra em Fechamento Mensal ou escolha "Somente este".`,
      };
    }

    const alvos = [{ id, descricao: existente.descricao }, ...seguintes];
    await prisma.lancamento.deleteMany({ where: { id: { in: alvos.map((a) => a.id) } } });

    // Série esvaziada: remove o registro de recorrência órfão.
    const restantes = await prisma.lancamento.count({ where: { recorrenciaId: existente.recorrenciaId } });
    if (restantes === 0) {
      await prisma.recorrencia.deleteMany({ where: { id: existente.recorrenciaId } });
    }

    await logAuditMany(
      alvos.map((a) => ({
        ...auditUser(session),
        acao: "EXCLUIR",
        entidade: "Lancamento",
        entidadeId: a.id,
        detalhes: `${a.descricao} — exclusão de "este e os seguintes"`,
      }))
    );

    revalidatePath("/lancamentos");
    revalidatePath("/dashboard");
    return {};
  }

  await prisma.lancamento.delete({ where: { id } });

  await logAudit({
    ...auditUser(session),
    acao: "EXCLUIR",
    entidade: "Lancamento",
    entidadeId: id,
    detalhes: existente.descricao,
  });

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  return {};
}
