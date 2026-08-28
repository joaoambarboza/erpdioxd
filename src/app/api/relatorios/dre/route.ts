import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getPeriodFilter, getDREData } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { buildXlsxResponse, type ExcelColumn } from "@/lib/excel";

const columns: ExcelColumn[] = [
  { header: "Grupo", key: "grupo", width: 24 },
  { header: "Conta", key: "conta", width: 28 },
  { header: "Valor", key: "valor", width: 16, currency: true },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const configuracao = await getConfiguracao();
  const { periodStart, periodEnd, sharedFilter } = getPeriodFilter(params, configuracao.mesInicioAnoFiscal);
  const { linhasGrupo, resultado } = await getDREData({ where: sharedFilter, periodStart, periodEnd });

  const rows = linhasGrupo.flatMap((grupo) => [
    { grupo: grupo.nome, conta: "", valor: grupo.totalGrupo },
    ...grupo.contas.map((conta) => ({ grupo: grupo.nome, conta: conta.nome, valor: conta.total })),
  ]);
  rows.push({ grupo: "Resultado Líquido", conta: "", valor: resultado });

  return buildXlsxResponse("dre.xlsx", "DRE", columns, rows);
}
