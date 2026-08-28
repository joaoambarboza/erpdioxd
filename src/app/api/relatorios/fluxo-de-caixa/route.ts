import { auth } from "@/lib/auth";
import { getSaldoAtual, getFluxoMensal } from "@/lib/financials";
import { buildXlsxResponse, type ExcelColumn } from "@/lib/excel";

const columns: ExcelColumn[] = [
  { header: "Mês", key: "mes", width: 12 },
  { header: "Saldo Inicial", key: "saldoInicial", width: 16, currency: true },
  { header: "Entradas", key: "entradas", width: 16, currency: true },
  { header: "Saídas", key: "saidas", width: 16, currency: true },
  { header: "Saldo Final", key: "saldoFinal", width: 16, currency: true },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Não autenticado.", { status: 401 });

  const saldoAtual = await getSaldoAtual();
  const fluxoMensal = await getFluxoMensal({ monthsBack: 6, monthsForward: 5, saldoAtual });

  const rows = fluxoMensal.map((m) => ({
    mes: `${m.mesLabel}/${m.ano}`,
    saldoInicial: m.saldoInicial,
    entradas: m.entradas,
    saidas: m.saidas,
    saldoFinal: m.saldoFinal,
  }));

  return buildXlsxResponse("fluxo-de-caixa.xlsx", "Fluxo de Caixa", columns, rows);
}
