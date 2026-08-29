import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLogoForExcel } from "@/lib/configuracao";
import { buildXlsxResponse, type ExcelColumn } from "@/lib/excel";
import { formatDate } from "@/lib/utils";
import { statusLabels } from "@/lib/enum-labels";

const columns: ExcelColumn[] = [
  { header: "Vencimento", key: "vencimento", width: 14 },
  { header: "Descrição", key: "descricao", width: 32 },
  { header: "Cliente", key: "cliente", width: 28 },
  { header: "Documento", key: "documento", width: 20 },
  { header: "Telefone", key: "telefone", width: 16 },
  { header: "Status", key: "status", width: 18 },
  { header: "Saldo Aberto", key: "saldoAberto", width: 16, currency: true },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const lancamentos = await prisma.lancamento.findMany({
    where: { tipo: "ENTRADA", status: { not: "CANCELADO" } },
    orderBy: { dataVencimento: "asc" },
    include: { cliente: true },
  });

  const rows = lancamentos.map((l) => ({
    vencimento: formatDate(l.dataVencimento),
    descricao: l.descricao,
    cliente: l.cliente?.nome ?? "",
    documento: l.cliente?.documento ?? "",
    telefone: l.cliente?.telefone ?? "",
    status: statusLabels[l.status],
    saldoAberto: Number(l.saldoAberto.toString()),
  }));

  const logo = await getLogoForExcel();
  return buildXlsxResponse("contas-a-receber.xlsx", "Contas a Receber", columns, rows, { logo: logo ?? undefined });
}
