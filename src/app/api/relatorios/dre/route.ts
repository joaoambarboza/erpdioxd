import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getDreFilter, getDREPeriodos } from "@/lib/financials";
import { getConfiguracao, getLogoForExcel } from "@/lib/configuracao";
import { buildDreXlsxResponse } from "@/lib/dre-excel";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const configuracao = await getConfiguracao();
  const { ano, sharedFilter } = getDreFilter(params);
  const dre = await getDREPeriodos({
    where: sharedFilter,
    ano,
    mesInicioAnoFiscal: configuracao.mesInicioAnoFiscal,
  });

  const logo = await getLogoForExcel();
  return buildDreXlsxResponse({
    dre,
    ano,
    mesInicioAnoFiscal: configuracao.mesInicioAnoFiscal,
    logo: logo ?? undefined,
  });
}
