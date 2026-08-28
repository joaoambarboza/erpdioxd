import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { FechamentoBadge } from "@/components/ui/badge";
import { buildMonthWindow, toNum } from "@/lib/financials";
import { MesActions } from "./mes-actions";

const PENDENTES_STATUSES = ["EM_ABERTO", "VENCIDO", "PARCIAL_PAGO", "PARCIAL_RECEBIDO", "PROJETADO"] as const;

export default async function FechamentoMensalPage() {
  const { months } = buildMonthWindow(6, 5);

  const monthsAno = Array.from(new Set(months.map((m) => m.ano)));
  const fechamentos = await prisma.fechamentoMensal.findMany({
    where: { ano: { in: monthsAno } },
  });
  const fechamentoMap = new Map(fechamentos.map((f) => [`${f.ano}-${f.mes}`, f.status]));

  const linhas = await Promise.all(
    months.map(async (m) => {
      const start = new Date(Date.UTC(m.ano, m.mes, 1));
      const end = new Date(Date.UTC(m.ano, m.mes + 1, 1));

      const [receitaAgg, despesaAgg, pendentes] = await Promise.all([
        prisma.lancamento.aggregate({
          _sum: { valorFinal: true },
          where: { tipo: "ENTRADA", dataCompetencia: { gte: start, lt: end } },
        }),
        prisma.lancamento.aggregate({
          _sum: { valorFinal: true },
          where: { tipo: "SAIDA", dataCompetencia: { gte: start, lt: end } },
        }),
        prisma.lancamento.count({
          where: { status: { in: [...PENDENTES_STATUSES] }, dataCompetencia: { gte: start, lt: end } },
        }),
      ]);

      const receita = toNum(receitaAgg._sum.valorFinal);
      const despesa = toNum(despesaAgg._sum.valorFinal);
      const status = fechamentoMap.get(`${m.ano}-${m.mes + 1}`) ?? "ABERTO";

      return { ...m, receita, despesa, resultado: receita - despesa, pendentes, status };
    })
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Fechamento Mensal</h1>
        <p className="text-sm text-muted">
          Feche um mês para travar seus lançamentos e manter os relatórios estáveis
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Receita</th>
              <th className="px-4 py-3 text-right font-medium">Despesa</th>
              <th className="px-4 py-3 text-right font-medium">Resultado</th>
              <th className="px-4 py-3 text-right font-medium">Pendentes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={`${l.ano}-${l.mes}`} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3 font-medium">
                  {l.mesLabel}/{l.ano}
                </td>
                <td className="px-4 py-3">
                  <FechamentoBadge status={l.status} />
                </td>
                <td className="px-4 py-3 text-right text-entrada">{formatCurrency(l.receita)}</td>
                <td className="px-4 py-3 text-right text-saida">{formatCurrency(l.despesa)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(l.resultado)}</td>
                <td className="px-4 py-3 text-right text-muted">{l.pendentes}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <MesActions
                      ano={l.ano}
                      mes={l.mes + 1}
                      mesLabel={l.mesLabel}
                      status={l.status}
                      pendentes={l.pendentes}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
