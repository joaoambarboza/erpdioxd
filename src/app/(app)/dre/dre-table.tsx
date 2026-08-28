import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { DreLinhaGrupo } from "@/lib/financials";

export function DRETable({ linhasGrupo, resultado }: { linhasGrupo: DreLinhaGrupo[]; resultado: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Conta</th>
            <th className="px-4 py-3 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {linhasGrupo.map((grupo) => (
            <React.Fragment key={grupo.id}>
              <tr className="border-b border-border bg-background/60">
                <td className="px-4 py-2.5 font-semibold text-foreground">{grupo.nome}</td>
                <td
                  className={`px-4 py-2.5 text-right font-semibold ${
                    grupo.totalGrupo >= 0 ? "text-entrada" : "text-saida"
                  }`}
                >
                  {formatCurrency(grupo.totalGrupo)}
                </td>
              </tr>
              {grupo.contas.map((conta) => (
                <tr key={conta.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-4 py-2 pl-8 text-muted">{conta.nome}</td>
                  <td className="px-4 py-2 text-right text-muted">{formatCurrency(conta.total)}</td>
                </tr>
              ))}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-right italic text-muted" colSpan={1}>
                  = Resultado parcial
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-medium italic ${
                    grupo.resultadoParcial >= 0 ? "text-entrada" : "text-saida"
                  }`}
                >
                  {formatCurrency(grupo.resultadoParcial)}
                </td>
              </tr>
            </React.Fragment>
          ))}
          {linhasGrupo.length === 0 && (
            <tr>
              <td colSpan={2} className="px-4 py-10 text-center text-muted">
                Nenhum grupo do DRE cadastrado.
              </td>
            </tr>
          )}
          {linhasGrupo.length > 0 && (
            <tr className="border-t-2 border-border">
              <td className="px-4 py-3 font-semibold text-foreground">Resultado Líquido</td>
              <td
                className={`px-4 py-3 text-right text-lg font-semibold ${
                  resultado >= 0 ? "text-entrada" : "text-saida"
                }`}
              >
                {formatCurrency(resultado)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
