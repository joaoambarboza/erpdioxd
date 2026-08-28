import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TipoBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getLancamentoOptions, toLancamentoInitial } from "@/lib/lancamento-options";
import { LancamentoDialog } from "@/app/(app)/lancamentos/lancamento-dialog";
import { toNum } from "@/lib/financials";
import { ConfirmarButton } from "./confirmar-button";

export default async function ProjecoesPage() {
  const [lancamentos, options] = await Promise.all([
    prisma.lancamento.findMany({
      where: { status: "PROJETADO" },
      orderBy: { dataVencimento: "asc" },
      include: { cliente: true, fornecedor: true, anexos: true },
    }),
    getLancamentoOptions(),
  ]);

  const receitaProjetada = lancamentos
    .filter((l) => l.tipo === "ENTRADA")
    .reduce((acc, l) => acc + toNum(l.valorFinal), 0);
  const despesaProjetada = lancamentos
    .filter((l) => l.tipo === "SAIDA")
    .reduce((acc, l) => acc + toNum(l.valorFinal), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projeções</h1>
          <p className="text-sm text-muted">
            Lançamentos previstos, ainda não confirmados — confirme quando a transação se tornar real
          </p>
        </div>
        <LancamentoDialog
          options={options}
          defaultStatus="PROJETADO"
          trigger={<Button>Nova Projeção</Button>}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Receita Projetada" value={formatCurrency(receitaProjetada)} tone="positive" />
        <StatCard label="Despesa Projetada" value={formatCurrency(despesaProjetada)} tone="negative" />
        <StatCard
          label="Resultado Projetado"
          value={formatCurrency(receitaProjetada - despesaProjetada)}
          tone={receitaProjetada - despesaProjetada >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Cliente/Fornecedor</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.dataVencimento)}</td>
                <td className="px-4 py-3">{l.descricao}</td>
                <td className="px-4 py-3">
                  <TipoBadge tipo={l.tipo} />
                </td>
                <td className="px-4 py-3 text-muted">{l.cliente?.nome ?? l.fornecedor?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                  {formatCurrency(toNum(l.valorFinal))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <ConfirmarButton id={l.id} />
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
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Nenhuma projeção em aberto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
