import type { Prisma } from "@/generated/prisma/client";
import type { TipoLancamento, StatusLancamento } from "@/generated/prisma/enums";

export function buildRelatorioWhere(
  params: Record<string, string | string[] | undefined>
): Prisma.LancamentoWhereInput {
  const where: Prisma.LancamentoWhereInput = {};

  const str = (key: string) => (typeof params[key] === "string" && params[key] ? (params[key] as string) : undefined);

  const tipo = str("tipo");
  if (tipo) where.tipo = tipo as TipoLancamento;

  const status = str("status");
  if (status) where.status = status as StatusLancamento;

  const categoriaId = str("categoriaId");
  if (categoriaId) where.categoriaId = categoriaId;

  const centroCustoId = str("centroCustoId");
  if (centroCustoId) where.centroCustoId = centroCustoId;

  const regionalId = str("regionalId");
  if (regionalId) where.regionalId = regionalId;

  const clienteId = str("clienteId");
  if (clienteId) where.clienteId = clienteId;

  const fornecedorId = str("fornecedorId");
  if (fornecedorId) where.fornecedorId = fornecedorId;

  const de = str("de");
  const ate = str("ate");
  if (de || ate) {
    where.dataCompetencia = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    };
  }

  return where;
}

const STATUS_COM_BAIXA: StatusLancamento[] = ["PAGO", "RECEBIDO", "PARCIAL_PAGO", "PARCIAL_RECEBIDO"];

/**
 * Data efetiva de pagamento/recebimento exibida nos relatórios e no Excel. É
 * sempre o campo `dataPagamento` do lançamento (a data da última baixa) — nunca
 * a data de vencimento. Sem data, `data` é null e `texto` diz por quê, sem
 * inventar nenhuma data.
 */
export function dataEfetivaPagamento(l: { dataPagamento: Date | null; status: StatusLancamento }): {
  data: Date | null;
  texto: string;
} {
  if (l.dataPagamento) return { data: l.dataPagamento, texto: "" };
  if (l.status === "CANCELADO") return { data: null, texto: "—" };
  if (STATUS_COM_BAIXA.includes(l.status)) return { data: null, texto: "Sem data registrada" };
  return { data: null, texto: "Em aberto" };
}
