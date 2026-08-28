import { prisma } from "@/lib/prisma";
import { AtivoBadge } from "@/components/ui/badge";
import { CentroCustoDialog } from "./centro-custo-dialog";
import { RowActions } from "./row-actions";

export default async function CentrosDeCustoPage() {
  const centros = await prisma.centroCusto.findMany({ orderBy: { nome: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Centros de Custo</h1>
          <p className="text-sm text-muted">{centros.length} centro(s) de custo cadastrado(s)</p>
        </div>
        <CentroCustoDialog />
      </div>

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
            {centros.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">{c.nome}</td>
                <td className="px-4 py-3">
                  <AtivoBadge ativo={c.ativo} />
                </td>
                <td className="px-4 py-3">
                  <RowActions id={c.id} nome={c.nome} ativo={c.ativo} />
                </td>
              </tr>
            ))}
            {centros.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted">
                  Nenhum centro de custo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
