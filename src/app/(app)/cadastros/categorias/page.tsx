import React from "react";
import { prisma } from "@/lib/prisma";
import { AtivoBadge } from "@/components/ui/badge";
import { tipoLabels } from "@/lib/enum-labels";
import { CategoriaDialog } from "./categoria-dialog";
import { RowActions } from "./row-actions";

export default async function CategoriasPage() {
  const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });

  const raizes = categorias
    .filter((c) => !c.parentId)
    .map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo }));

  function renderGrupo(tipo: "ENTRADA" | "SAIDA") {
    const raizesDoTipo = categorias.filter((c) => !c.parentId && c.tipo === tipo);

    return (
      <div key={tipo}>
        <h2 className="mb-3 text-sm font-semibold text-muted">{tipoLabels[tipo]}</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {raizesDoTipo.map((raiz) => (
                <React.Fragment key={raiz.id}>
                  <tr className="border-b border-border hover:bg-background/50">
                    <td className="px-4 py-3 font-medium">{raiz.nome}</td>
                    <td className="px-4 py-3">
                      <AtivoBadge ativo={raiz.ativo} />
                    </td>
                    <td className="px-4 py-3">
                      <RowActions initial={raiz} raizes={raizes} />
                    </td>
                  </tr>
                  {categorias
                    .filter((sub) => sub.parentId === raiz.id)
                    .map((sub) => (
                      <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-background/50">
                        <td className="px-4 py-3 pl-8 text-muted">↳ {sub.nome}</td>
                        <td className="px-4 py-3">
                          <AtivoBadge ativo={sub.ativo} />
                        </td>
                        <td className="px-4 py-3">
                          <RowActions initial={sub} raizes={raizes} />
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
              {raizesDoTipo.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-muted">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
          <p className="text-sm text-muted">{categorias.length} categoria(s) cadastrada(s)</p>
        </div>
        <CategoriaDialog raizes={raizes} />
      </div>

      <div className="flex flex-col gap-8">
        {renderGrupo("ENTRADA")}
        {renderGrupo("SAIDA")}
      </div>
    </div>
  );
}
