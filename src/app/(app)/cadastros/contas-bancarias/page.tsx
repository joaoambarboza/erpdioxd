import { prisma } from "@/lib/prisma";
import { AtivoBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toNum } from "@/lib/financials";
import { ContaBancariaDialog } from "./conta-bancaria-dialog";
import { RowActions } from "./row-actions";

export default async function ContasBancariasPage() {
  const contas = await prisma.contaBancaria.findMany({ orderBy: { nome: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contas Bancárias</h1>
          <p className="text-sm text-muted">{contas.length} conta(s) cadastrada(s)</p>
        </div>
        <ContaBancariaDialog />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Banco</th>
              <th className="px-4 py-3 font-medium">Saldo inicial</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => {
              const saldoInicial = toNum(c.saldoInicial);
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-4 py-3">{c.nome}</td>
                  <td className="px-4 py-3 text-muted">{c.banco}</td>
                  <td className="px-4 py-3 text-muted">{formatCurrency(saldoInicial)}</td>
                  <td className="px-4 py-3">
                    <AtivoBadge ativo={c.ativo} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions id={c.id} nome={c.nome} banco={c.banco} saldoInicial={saldoInicial} ativo={c.ativo} />
                  </td>
                </tr>
              );
            })}
            {contas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nenhuma conta bancária cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
