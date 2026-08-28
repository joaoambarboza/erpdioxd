import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getLancamentoOptions, toLancamentoInitial } from "@/lib/lancamento-options";
import { LancamentoDialog } from "@/app/(app)/lancamentos/lancamento-dialog";
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog";
import type { StatusLancamento } from "@/generated/prisma/enums";

function diasEntre(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function ContasView({ tipo }: { tipo: "ENTRADA" | "SAIDA" }) {
  const isReceber = tipo === "ENTRADA";
  const path = isReceber ? "/contas-a-receber" : "/contas-a-pagar";
  const titulo = isReceber ? "Contas a Receber" : "Contas a Pagar";
  const contraparteLabel = isReceber ? "Cliente" : "Fornecedor";

  const now = new Date();
  const em = (dias: number) => new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

  const [lancamentos, options, abertoAgg, vencidoAgg, em7Agg, em15Agg, em30Agg, em60Agg] =
    await Promise.all([
      prisma.lancamento.findMany({
        where: { tipo, status: { not: "CANCELADO" } },
        orderBy: { dataVencimento: "asc" },
        take: 200,
        include: { cliente: true, fornecedor: true, anexos: true },
      }),
      getLancamentoOptions(),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { tipo, saldoAberto: { gt: 0 } },
      }),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { tipo, saldoAberto: { gt: 0 }, dataVencimento: { lt: now } },
      }),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { tipo, saldoAberto: { gt: 0 }, dataVencimento: { gte: now, lte: em(7) } },
      }),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { tipo, saldoAberto: { gt: 0 }, dataVencimento: { gte: now, lte: em(15) } },
      }),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { tipo, saldoAberto: { gt: 0 }, dataVencimento: { gte: now, lte: em(30) } },
      }),
      prisma.lancamento.aggregate({
        _sum: { saldoAberto: true },
        where: { tipo, saldoAberto: { gt: 0 }, dataVencimento: { gte: now, lte: em(60) } },
      }),
    ]);

  const toNum = (v: { toString(): string } | null | undefined) => Number(v?.toString() ?? 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
        <p className="text-sm text-muted">{lancamentos.length} lançamento(s) encontrado(s)</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total em aberto" value={formatCurrency(toNum(abertoAgg._sum.saldoAberto))} />
        <StatCard label="Vencido" value={formatCurrency(toNum(vencidoAgg._sum.saldoAberto))} tone="negative" />
        <StatCard label="Vence em 7 dias" value={formatCurrency(toNum(em7Agg._sum.saldoAberto))} tone="warning" />
        <StatCard label="Vence em 15 dias" value={formatCurrency(toNum(em15Agg._sum.saldoAberto))} tone="warning" />
        <StatCard label="Vence em 30 dias" value={formatCurrency(toNum(em30Agg._sum.saldoAberto))} />
        <StatCard label="Vence em 60 dias" value={formatCurrency(toNum(em60Agg._sum.saldoAberto))} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">{contraparteLabel}</th>
              <th className="px-4 py-3 font-medium">Dias</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Saldo aberto</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => {
              const dias = diasEntre(l.dataVencimento, now);
              const saldoAberto = toNum(l.saldoAberto);
              return (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.dataVencimento)}</td>
                  <td className="px-4 py-3">{l.descricao}</td>
                  <td className="px-4 py-3 text-muted">
                    {l.cliente?.nome ?? l.fornecedor?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {saldoAberto <= 0 ? (
                      "—"
                    ) : dias < 0 ? (
                      <span className="text-saida">{Math.abs(dias)}d em atraso</span>
                    ) : (
                      <span className="text-muted">em {dias}d</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status as StatusLancamento} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                    {formatCurrency(saldoAberto)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <RegistrarPagamentoDialog
                        id={l.id}
                        descricao={l.descricao}
                        saldoAberto={saldoAberto}
                        tipo={tipo}
                        revalidatePaths={[path, "/dashboard"]}
                      />
                      <LancamentoDialog
                        options={options}
                        initial={toLancamentoInitial(l)}
                        trigger={
                          <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-background hover:text-foreground"
                          >
                            Editar
                          </button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
