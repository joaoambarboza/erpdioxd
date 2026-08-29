import { prisma } from "@/lib/prisma";
import { AtivoBadge } from "@/components/ui/badge";
import { FornecedorDialog } from "./fornecedor-dialog";
import { RowActions } from "./row-actions";

export default async function FornecedoresPage() {
  const fornecedores = await prisma.fornecedor.findMany({ orderBy: { nome: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted">{fornecedores.length} fornecedor(es) cadastrado(s)</p>
        </div>
        <FornecedorDialog />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {fornecedores.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3">{f.nome}</td>
                <td className="px-4 py-3 text-muted">{f.documento ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{f.telefone ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{f.contato ?? "—"}</td>
                <td className="px-4 py-3">
                  <AtivoBadge ativo={f.ativo} />
                </td>
                <td className="px-4 py-3">
                  <RowActions initial={f} />
                </td>
              </tr>
            ))}
            {fornecedores.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Nenhum fornecedor cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
