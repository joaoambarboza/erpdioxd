import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { DreLinhaGrupo } from "@/lib/financials";

function ValorCell({ valor }: { valor: number }) {
  return (
    <td className={`px-4 py-2.5 text-right ${valor >= 0 ? "text-entrada" : "text-saida"}`}>
      {formatCurrency(valor)}
    </td>
  );
}

export function DRETable({ linhasGrupo }: { linhasGrupo: DreLinhaGrupo[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-medium">Conta</th>
            <th className="px-4 py-3 text-right font-medium">Projetado</th>
            <th className="px-4 py-3 text-right font-medium">Realizado</th>
          </tr>
        </thead>
        <tbody>
          {linhasGrupo.map((grupo) => (
            <React.Fragment key={grupo.id}>
              <tr className="border-b border-border bg-background/60">
                <td className="px-4 py-2.5 font-semibold text-foreground">{grupo.nome}</td>
                <ValorCell valor={grupo.totalGrupo.projetado} />
                <ValorCell valor={grupo.totalGrupo.realizado} />
              </tr>
              {grupo.contas.map((conta) => (
                <tr key={conta.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-4 py-2 pl-8 text-muted">
                    {conta.nome}
                    <span className="ml-2 text-xs text-muted/70">
                      ({conta.regime === "CAIXA" ? "caixa" : "competência"})
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-muted">{formatCurrency(conta.projetado)}</td>
                  <td className="px-4 py-2 text-right text-muted">{formatCurrency(conta.realizado)}</td>
                </tr>
              ))}
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 text-right italic text-muted" colSpan={1}>
                  = {grupo.subtotalLabel ?? "Resultado parcial"}
                </td>
                <td className="px-4 py-2.5 text-right font-medium italic">
                  <span className={grupo.resultadoParcial.projetado >= 0 ? "text-entrada" : "text-saida"}>
                    {formatCurrency(grupo.resultadoParcial.projetado)}
                  </span>
                  {grupo.percentual && (
                    <span className="ml-1 text-xs text-muted">({grupo.percentual.projetado.toFixed(1)}%)</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-medium italic">
                  <span className={grupo.resultadoParcial.realizado >= 0 ? "text-entrada" : "text-saida"}>
                    {formatCurrency(grupo.resultadoParcial.realizado)}
                  </span>
                  {grupo.percentual && (
                    <span className="ml-1 text-xs text-muted">({grupo.percentual.realizado.toFixed(1)}%)</span>
                  )}
                </td>
              </tr>
            </React.Fragment>
          ))}
          {linhasGrupo.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-muted">
                Nenhum grupo do DRE cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
