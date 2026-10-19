import { prisma } from "@/lib/prisma";
import type {
  LancamentoOptions,
  LancamentoInitial,
} from "@/app/(app)/lancamentos/lancamento-dialog";
import type { Lancamento, Cliente, Fornecedor, Anexo } from "@/generated/prisma/client";

export async function getLancamentoOptions(): Promise<LancamentoOptions> {
  const [categorias, contasDreRaw, centrosCusto, regionais, contasBancarias, clientes, fornecedores] =
    await Promise.all([
      prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
      prisma.contaDRE.findMany({
        orderBy: [{ grupo: { ordem: "asc" } }, { ordem: "asc" }],
        include: { grupo: true },
      }),
      prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.contaBancaria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
      prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    ]);

  return {
    categorias: categorias.map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      parentId: c.parentId,
    })),
    contasDre: contasDreRaw.map((c) => ({
      id: c.id,
      nome: c.nome,
      grupoNome: c.grupo.nome,
    })),
    centrosCusto: centrosCusto.map((c) => ({ id: c.id, nome: c.nome })),
    regionais: regionais.map((r) => ({ id: r.id, nome: r.nome })),
    contasBancarias: contasBancarias.map((c) => ({ id: c.id, nome: c.nome })),
    clientes: clientes.map((c) => ({ id: c.id, nome: c.nome })),
    fornecedores: fornecedores.map((f) => ({ id: f.id, nome: f.nome })),
  };
}

export function toLancamentoInitial(
  l: Lancamento & { cliente?: Cliente | null; fornecedor?: Fornecedor | null; anexos?: Anexo[] }
): LancamentoInitial {
  return {
    id: l.id,
    dataLancamento: l.dataLancamento.toISOString(),
    dataCompetencia: l.dataCompetencia.toISOString(),
    dataVencimento: l.dataVencimento.toISOString(),
    dataPagamento: l.dataPagamento ? l.dataPagamento.toISOString() : null,
    tipo: l.tipo,
    natureza: l.natureza,
    status: l.status,
    descricao: l.descricao,
    valorOriginal: l.valorOriginal.toString(),
    desconto: l.desconto.toString(),
    acrescimo: l.acrescimo.toString(),
    juros: l.juros.toString(),
    multa: l.multa.toString(),
    valorPago: l.valorPago.toString(),
    categoriaId: l.categoriaId,
    subcategoriaId: l.subcategoriaId,
    contaDreId: l.contaDreId,
    centroCustoId: l.centroCustoId,
    regionalId: l.regionalId,
    projeto: l.projeto,
    contaBancariaId: l.contaBancariaId,
    clienteId: l.clienteId,
    fornecedorId: l.fornecedorId,
    formaPagamento: l.formaPagamento,
    tipoPagamento: l.tipoPagamento,
    observacao: l.observacao,
    numeroDocumento: l.numeroDocumento,
    numeroNotaFiscal: l.numeroNotaFiscal,
    recorrenciaId: l.recorrenciaId,
    parcelaNumero: l.parcelaNumero,
    anexos: (l.anexos ?? []).map((a) => ({ id: a.id, nomeArquivo: a.nomeArquivo, tamanho: a.tamanho })),
  };
}
