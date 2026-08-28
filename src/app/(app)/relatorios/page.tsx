import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, TipoBadge } from "@/components/ui/badge";
import { buildRelatorioWhere } from "@/lib/relatorio-lancamentos";
import { RelatoriosFilters } from "./filters";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const where = buildRelatorioWhere(params);

  const [lancamentos, categorias, centrosCusto, regionais, clientes, fornecedores] = await Promise.all([
    prisma.lancamento.findMany({
      where,
      orderBy: { dataVencimento: "desc" },
      include: { cliente: true, fornecedor: true, categoria: true, centroCusto: true, regional: true },
    }),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.fornecedor.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const exportHref = `/api/relatorios/lancamentos?${new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => (typeof v === "string" && v ? [[k, v]] : []))
  ).toString()}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted">
            {lancamentos.length} lançamento(s) encontrado(s) — combine todos os filtros para responder qualquer pergunta
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Exportar Excel
        </a>
      </div>

      <RelatoriosFilters
        categorias={categorias}
        centrosCusto={centrosCusto}
        regionais={regionais}
        clientes={clientes}
        fornecedores={fornecedores}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Cliente/Fornecedor</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Centro de custo</th>
              <th className="px-4 py-3 font-medium">Regional</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Valor final</th>
              <th className="px-4 py-3 text-right font-medium">Saldo aberto</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(l.dataVencimento)}</td>
                <td className="px-4 py-3">{l.descricao}</td>
                <td className="px-4 py-3">
                  <TipoBadge tipo={l.tipo} />
                </td>
                <td className="px-4 py-3 text-muted">{l.cliente?.nome ?? l.fornecedor?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{l.categoria.nome}</td>
                <td className="px-4 py-3 text-muted">{l.centroCusto.nome}</td>
                <td className="px-4 py-3 text-muted">{l.regional.nome}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                  {formatCurrency(l.valorFinal.toString())}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-muted">
                  {formatCurrency(l.saldoAberto.toString())}
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
