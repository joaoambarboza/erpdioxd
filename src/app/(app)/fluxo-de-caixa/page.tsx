import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getSaldoAtual, getFluxoMensal, toNum } from "@/lib/financials";
import { EvolucaoCaixaChart } from "@/app/(app)/dashboard/charts";

async function getProjecao(dias: number, saldoAtual: number) {
  const now = new Date();
  const ate = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

  const [entradasAgg, saidasAgg] = await Promise.all([
    prisma.lancamento.aggregate({
      _sum: { saldoAberto: true },
      where: { tipo: "ENTRADA", saldoAberto: { gt: 0 }, dataVencimento: { lte: ate } },
    }),
    prisma.lancamento.aggregate({
      _sum: { saldoAberto: true },
      where: { tipo: "SAIDA", saldoAberto: { gt: 0 }, dataVencimento: { lte: ate } },
    }),
  ]);

  return saldoAtual + toNum(entradasAgg._sum.saldoAberto) - toNum(saidasAgg._sum.saldoAberto);
}

export default async function FluxoDeCaixaPage() {
  const saldoAtual = await getSaldoAtual();

  const [projecao30, projecao60, projecao90, fluxoMensal] = await Promise.all([
    getProjecao(30, saldoAtual),
    getProjecao(60, saldoAtual),
    getProjecao(90, saldoAtual),
    getFluxoMensal({ monthsBack: 6, monthsForward: 5, saldoAtual }),
  ]);

  const evolucaoCaixaData = fluxoMensal.map((m) => ({ mes: m.mesLabel, saldo: m.saldoFinal }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Fluxo de Caixa</h1>
        <p className="text-sm text-muted">Saldo atual e projeção de caixa da Dioxd</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saldo Atual" value={formatCurrency(saldoAtual)} />
        <StatCard label="Projeção 30 dias" value={formatCurrency(projecao30)} tone={projecao30 >= 0 ? "positive" : "negative"} />
        <StatCard label="Projeção 60 dias" value={formatCurrency(projecao60)} tone={projecao60 >= 0 ? "positive" : "negative"} />
        <StatCard label="Projeção 90 dias" value={formatCurrency(projecao90)} tone={projecao90 >= 0 ? "positive" : "negative"} />
      </div>

      <div className="mb-6">
        <EvolucaoCaixaChart data={evolucaoCaixaData} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 text-right font-medium">Saldo Inicial</th>
              <th className="px-4 py-3 text-right font-medium">Entradas</th>
              <th className="px-4 py-3 text-right font-medium">Saídas</th>
              <th className="px-4 py-3 text-right font-medium">Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            {fluxoMensal.map((m) => (
              <tr key={`${m.ano}-${m.mes}`} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">
                  {m.mesLabel}/{m.ano}
                </td>
                <td className="px-4 py-3 text-right text-muted">{formatCurrency(m.saldoInicial)}</td>
                <td className="px-4 py-3 text-right text-entrada">{formatCurrency(m.entradas)}</td>
                <td className="px-4 py-3 text-right text-saida">{formatCurrency(m.saidas)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(m.saldoFinal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
