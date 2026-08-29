import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRelatorioWhere } from "@/lib/relatorio-lancamentos";
import { getLogoForExcel } from "@/lib/configuracao";
import { buildXlsxResponse, type ExcelColumn } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import { tipoLabels, statusLabels } from "@/lib/enum-labels";

const columns: ExcelColumn[] = [
  { header: "Vencimento", key: "vencimento", width: 14 },
  { header: "Descrição", key: "descricao", width: 32 },
  { header: "Tipo", key: "tipo", width: 12 },
  { header: "Cliente/Fornecedor", key: "contraparte", width: 28 },
  { header: "Documento", key: "documento", width: 20 },
  { header: "Telefone", key: "telefone", width: 16 },
  { header: "Categoria", key: "categoria", width: 20 },
  { header: "Centro de Custo", key: "centroCusto", width: 18 },
  { header: "Regional", key: "regional", width: 14 },
  { header: "Status", key: "status", width: 16 },
  { header: "Valor Final", key: "valorFinal", width: 16, currency: true },
  { header: "Saldo Aberto", key: "saldoAberto", width: 16, currency: true },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const where = buildRelatorioWhere(params);

  const lancamentos = await prisma.lancamento.findMany({
    where,
    orderBy: { dataVencimento: "desc" },
    include: { cliente: true, fornecedor: true, categoria: true, centroCusto: true, regional: true },
  });

  const rows = lancamentos.map((l) => ({
    vencimento: formatDate(l.dataVencimento),
    descricao: l.descricao,
    tipo: tipoLabels[l.tipo],
    contraparte: l.cliente?.nome ?? l.fornecedor?.nome ?? "",
    documento: l.cliente?.documento ?? l.fornecedor?.documento ?? "",
    telefone: l.cliente?.telefone ?? l.fornecedor?.telefone ?? "",
    categoria: l.categoria.nome,
    centroCusto: l.centroCusto.nome,
    regional: l.regional.nome,
    status: statusLabels[l.status],
    valorFinal: Number(l.valorFinal.toString()),
    saldoAberto: Number(l.saldoAberto.toString()),
  }));

  const logo = await getLogoForExcel();
  return buildXlsxResponse("lancamentos.xlsx", "Lançamentos", columns, rows, { logo: logo ?? undefined });
}
