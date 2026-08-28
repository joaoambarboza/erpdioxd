import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildXlsxResponse, type ExcelColumn } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import { statusLabels } from "@/lib/enum-labels";

const columns: ExcelColumn[] = [
  { header: "Vencimento", key: "vencimento", width: 14 },
  { header: "Descrição", key: "descricao", width: 32 },
  { header: "Fornecedor", key: "fornecedor", width: 28 },
  { header: "Status", key: "status", width: 18 },
  { header: "Saldo Aberto", key: "saldoAberto", width: 16, currency: true },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const lancamentos = await prisma.lancamento.findMany({
    where: { tipo: "SAIDA", status: { not: "CANCELADO" } },
    orderBy: { dataVencimento: "asc" },
    include: { fornecedor: true },
  });

  const rows = lancamentos.map((l) => ({
    vencimento: formatDate(l.dataVencimento),
    descricao: l.descricao,
    fornecedor: l.fornecedor?.nome ?? "",
    status: statusLabels[l.status],
    saldoAberto: Number(l.saldoAberto.toString()),
  }));

  return buildXlsxResponse("contas-a-pagar.xlsx", "Contas a Pagar", columns, rows);
}
