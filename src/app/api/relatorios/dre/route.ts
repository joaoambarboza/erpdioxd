import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getFiscalQuarterFilter, getDREData } from "@/lib/financials";
import { getConfiguracao, getLogoForExcel } from "@/lib/configuracao";
import { buildXlsxResponse, type ExcelColumn } from "@/lib/excel";

const columns: ExcelColumn[] = [
  { header: "Grupo", key: "grupo", width: 24 },
  { header: "Conta", key: "conta", width: 28 },
  { header: "Projetado", key: "projetado", width: 16, currency: true },
  { header: "Realizado", key: "realizado", width: 16, currency: true },
];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const configuracao = await getConfiguracao();
  const { periodStart, periodEnd, sharedFilter } = getFiscalQuarterFilter(params, configuracao.mesInicioAnoFiscal);
  const { linhasGrupo } = await getDREData({ where: sharedFilter, periodStart, periodEnd });

  const rows = linhasGrupo.flatMap((grupo) => [
    { grupo: grupo.nome, conta: "", projetado: grupo.totalGrupo.projetado, realizado: grupo.totalGrupo.realizado },
    ...grupo.contas.map((conta) => ({
      grupo: grupo.nome,
      conta: conta.nome,
      projetado: conta.projetado,
      realizado: conta.realizado,
    })),
    {
      grupo: grupo.subtotalLabel ?? "Resultado parcial",
      conta: "",
      projetado: grupo.resultadoParcial.projetado,
      realizado: grupo.resultadoParcial.realizado,
    },
  ]);

  const logo = await getLogoForExcel();
  return buildXlsxResponse("dre.xlsx", "DRE", columns, rows, { logo: logo ?? undefined });
}
