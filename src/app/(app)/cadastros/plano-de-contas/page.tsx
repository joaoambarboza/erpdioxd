import { prisma } from "@/lib/prisma";
import { GrupoDialog } from "./grupo-dialog";
import { ContaDialog } from "./conta-dialog";
import { GrupoRowActions, ContaRowActions } from "./row-actions";

export default async function PlanoDeContasPage() {
  const grupos = await prisma.grupoDRE.findMany({
    orderBy: { ordem: "asc" },
    include: { contas: { orderBy: { ordem: "asc" } } },
  });

  const gruposOptions = grupos.map((g) => ({ id: g.id, nome: g.nome }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Plano de Contas</h1>
        <p className="text-sm text-muted">Estrutura de grupos e contas do DRE</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <GrupoDialog />
        <ContaDialog grupos={gruposOptions} />
      </div>

      <div className="flex flex-col gap-8">
        {grupos.map((grupo) => (
          <div key={grupo.id}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {grupo.ordem}. {grupo.nome}
                {grupo.subtotalLabel && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    = {grupo.subtotalLabel}
                    {grupo.mostrarPercentual && " (%)"}
                  </span>
                )}
              </h2>
              <GrupoRowActions
                id={grupo.id}
                nome={grupo.nome}
                ordem={grupo.ordem}
                subtotalLabel={grupo.subtotalLabel}
                mostrarPercentual={grupo.mostrarPercentual}
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Ordem</th>
                    <th className="px-4 py-3 font-medium">Conta</th>
                    <th className="px-4 py-3 font-medium">Regime</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {grupo.contas.map((conta) => (
                    <tr key={conta.id} className="border-b border-border last:border-0 hover:bg-background/50">
                      <td className="px-4 py-3 text-muted">{conta.ordem}</td>
                      <td className="px-4 py-3">{conta.nome}</td>
                      <td className="px-4 py-3 text-muted">
                        {conta.regime === "CAIXA" ? "Caixa" : "Competência"}
                      </td>
                      <td className="px-4 py-3">
                        <ContaRowActions
                          id={conta.id}
                          nome={conta.nome}
                          ordem={conta.ordem}
                          grupoId={conta.grupoId}
                          regime={conta.regime}
                          grupos={gruposOptions}
                        />
                      </td>
                    </tr>
                  ))}
                  {grupo.contas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted">
                        Nenhuma conta neste grupo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {grupos.length === 0 && (
          <p className="text-center text-muted">Nenhum grupo do DRE cadastrado.</p>
        )}
      </div>
    </div>
  );
}
