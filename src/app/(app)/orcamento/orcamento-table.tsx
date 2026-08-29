"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrcamentoDialog } from "./orcamento-dialog";
import { deleteOrcamento } from "./actions";

export type OrcamentoRow = {
  categoriaId: string;
  categoriaNome: string;
  tipo: "ENTRADA" | "SAIDA";
  orcamentoId: string | null;
  orcado: number;
  realizado: number;
};

export function OrcamentoTable({
  ano,
  mes,
  editavel,
  rows,
}: {
  ano: number;
  mes: number;
  editavel: boolean;
  rows: OrcamentoRow[];
}) {
  const [selected, setSelected] = React.useState<OrcamentoRow | null>(null);
  const [isPending, startTransition] = React.useTransition();

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 text-right font-medium">Orçado</th>
              <th className="px-4 py-3 text-right font-medium">Realizado</th>
              <th className="px-4 py-3 text-right font-medium">Desvio</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const desvio = row.realizado - row.orcado;
              const isGood = row.tipo === "ENTRADA" ? desvio >= 0 : desvio <= 0;
              return (
                <tr key={row.categoriaId} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="px-4 py-3">{row.categoriaNome}</td>
                  <td className="px-4 py-3 text-right text-muted">
                    {row.orcado > 0 ? formatCurrency(row.orcado) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.realizado)}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      row.orcado === 0 ? "text-muted" : isGood ? "text-entrada" : "text-saida"
                    }`}
                  >
                    {row.orcado > 0 ? formatCurrency(desvio) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {editavel ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground"
                          aria-label="Definir orçamento"
                          onClick={() => setSelected(row)}
                        >
                          <Pencil size={16} />
                        </button>
                        {row.orcamentoId && (
                          <button
                            type="button"
                            disabled={isPending}
                            className="rounded-md p-1.5 text-muted hover:bg-saida-bg hover:text-saida disabled:opacity-50"
                            aria-label="Remover orçamento"
                            onClick={() => {
                              startTransition(() => {
                                deleteOrcamento(row.orcamentoId!);
                              });
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-muted">soma do período</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <OrcamentoDialog
          ano={ano}
          mes={mes}
          categoriaId={selected.categoriaId}
          categoriaNome={selected.categoriaNome.replace(/^↳ /, "")}
          valorAtual={selected.orcado}
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
