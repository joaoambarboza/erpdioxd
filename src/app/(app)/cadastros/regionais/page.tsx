import { prisma } from "@/lib/prisma";
import { AtivoBadge } from "@/components/ui/badge";
import { RegionalDialog } from "./regional-dialog";
import { RowActions } from "./row-actions";

export default async function RegionaisPage() {
  const regionais = await prisma.regional.findMany({ orderBy: { nome: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Regionais</h1>
          <p className="text-sm text-muted">{regionais.length} regional(is) cadastrada(s)</p>
        </div>
        <RegionalDialog />
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
            {regionais.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">{r.nome}</td>
                <td className="px-4 py-3">
                  <AtivoBadge ativo={r.ativo} />
                </td>
                <td className="px-4 py-3">
                  <RowActions id={r.id} nome={r.nome} ativo={r.ativo} />
                </td>
              </tr>
            ))}
            {regionais.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted">
                  Nenhuma regional cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
