import { prisma } from "@/lib/prisma";
import { AtivoBadge } from "@/components/ui/badge";
import { ClienteDialog } from "./cliente-dialog";
import { RowActions } from "./row-actions";

export default async function ClientesPage() {
  const [clientes, regionais] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nome: "asc" }, include: { regional: true } }),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const regionaisOptions = regionais.map((r) => ({ id: r.id, nome: r.nome }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <ClienteDialog regionais={regionaisOptions} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Regional</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">{c.nome}</td>
                <td className="px-4 py-3 text-muted">{c.documento ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{c.regional?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{c.contato ?? "—"}</td>
                <td className="px-4 py-3">
                  <AtivoBadge ativo={c.ativo} />
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    initial={{
                      id: c.id,
                      nome: c.nome,
                      documento: c.documento,
                      contato: c.contato,
                      regionalId: c.regionalId,
                      ativo: c.ativo,
                    }}
                    regionais={regionaisOptions}
                  />
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
