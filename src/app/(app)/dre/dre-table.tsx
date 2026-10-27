import React from "react";
import { formatCurrency } from "@/lib/utils";
import { labelPeriodo, type DrePeriodoKey, type DrePercentual, type DreResultado } from "@/lib/dre";

function ValorCell({ valor, className = "" }: { valor: number; className?: string }) {
  return (
    <td className={`px-4 py-2.5 text-right whitespace-nowrap ${valor >= 0 ? "text-entrada" : "text-saida"} ${className}`}>
      {formatCurrency(valor)}
    </td>
  );
}

function formatPercentual(valor: number | null) {
  return valor === null ? null : `${valor.toFixed(1)}%`;
}

function SubtotalCell({ valor, percentual }: { valor: number; percentual: number | null }) {
  return (
    <td className="px-4 py-2.5 text-right font-medium italic whitespace-nowrap">
      <span className={valor >= 0 ? "text-entrada" : "text-saida"}>{formatCurrency(valor)}</span>
      {percentual !== null && <span className="ml-1 text-xs text-muted">({formatPercentual(percentual)})</span>}
    </td>
  );
}

export function DRETable({
  dre,
  periodos,
  mesInicioAnoFiscal,
}: {
  dre: Record<DrePeriodoKey, DreResultado>;
  periodos: DrePeriodoKey[];
  mesInicioAnoFiscal: number;
}) {
  const grupos = dre[periodos[0]].linhasGrupo;
  const colSpanTotal = 1 + periodos.length * 2;
  const percentualDe = (p: DrePercentual | null, campo: "projetado" | "realizado") => p?.[campo] ?? null;
  const bordaEsquerda = "border-l border-border";

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th rowSpan={2} className="px-4 py-3 text-left font-medium">
              Conta
            </th>
            {periodos.map((p) => (
              <th key={p} colSpan={2} className={`px-4 py-2 text-center font-medium ${bordaEsquerda}`}>
                {labelPeriodo(p, mesInicioAnoFiscal)}
              </th>
            ))}
          </tr>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            {periodos.map((p) => (
              <React.Fragment key={p}>
                <th className={`px-4 py-2 text-right font-medium ${bordaEsquerda}`}>Projetado</th>
                <th className="px-4 py-2 text-right font-medium">Realizado</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map((grupo, gi) => (
            <React.Fragment key={grupo.id}>
              <tr className="border-b border-border bg-background/60">
                <td className="px-4 py-2.5 font-semibold text-foreground">{grupo.nome}</td>
                {periodos.map((p) => (
                  <React.Fragment key={p}>
                    <ValorCell valor={dre[p].linhasGrupo[gi].totalGrupo.projetado} className={bordaEsquerda} />
                    <ValorCell valor={dre[p].linhasGrupo[gi].totalGrupo.realizado} />
                  </React.Fragment>
                ))}
              </tr>
              {grupo.contas.map((conta, ci) => (
                <tr key={conta.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-4 py-2 pl-8 text-muted">
                    {conta.nome}
                    <span className="ml-2 text-xs text-muted/70">
                      ({conta.regime === "CAIXA" ? "caixa" : "competência"})
                    </span>
                  </td>
                  {periodos.map((p) => {
                    const c = dre[p].linhasGrupo[gi].contas[ci];
                    return (
                      <React.Fragment key={p}>
                        <td className={`px-4 py-2 text-right whitespace-nowrap text-muted ${bordaEsquerda}`}>
                          {formatCurrency(c.projetado)}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap text-muted">
                          {formatCurrency(c.realizado)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              {grupo.subtotalLabel && (
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 text-right italic text-muted">= {grupo.subtotalLabel}</td>
                  {periodos.map((p) => {
                    const l = dre[p].linhasGrupo[gi];
                    return (
                      <React.Fragment key={p}>
                        <SubtotalCell
                          valor={l.resultadoParcial.projetado}
                          percentual={percentualDe(l.percentual, "projetado")}
                        />
                        <SubtotalCell
                          valor={l.resultadoParcial.realizado}
                          percentual={percentualDe(l.percentual, "realizado")}
                        />
                      </React.Fragment>
                    );
                  })}
                </tr>
              )}
            </React.Fragment>
          ))}
          {grupos.length === 0 && (
            <tr>
              <td colSpan={colSpanTotal} className="px-4 py-10 text-center text-muted">
                Nenhum grupo do DRE cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
