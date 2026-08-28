import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, TipoBadge } from "@/components/ui/badge";
import { LancamentoDialog } from "./lancamento-dialog";
import { LancamentosFilters } from "./filters";
import { RowActions } from "./row-actions";
import { getLancamentoOptions, toLancamentoInitial } from "@/lib/lancamento-options";
import type { Prisma } from "@/generated/prisma/client";
import type { TipoLancamento, StatusLancamento } from "@/generated/prisma/enums";

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const where: Prisma.LancamentoWhereInput = {};
  if (typeof params.tipo === "string" && params.tipo) {
    where.tipo = params.tipo as TipoLancamento;
  }
  if (typeof params.status === "string" && params.status) {
    where.status = params.status as StatusLancamento;
  }
  if (typeof params.categoriaId === "string" && params.categoriaId) {
    where.categoriaId = params.categoriaId;
  }
  if (typeof params.centroCustoId === "string" && params.centroCustoId) {
    where.centroCustoId = params.centroCustoId;
  }
  if (typeof params.regionalId === "string" && params.regionalId) {
    where.regionalId = params.regionalId;
  }

  const [lancamentos, options, categorias, centrosCusto, regionais] = await Promise.all([
    prisma.lancamento.findMany({
      where,
      orderBy: { dataVencimento: "desc" },
      take: 200,
      include: { cliente: true, fornecedor: true, anexos: true },
    }),
    getLancamentoOptions(),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const categoriasRaiz = categorias.filter((c) => !c.parentId);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Lançamentos</h1>
          <p className="text-sm text-muted">
            {lancamentos.length} lançamento(s) encontrado(s)
          </p>
        </div>
        <LancamentoDialog options={options} />
      </div>

      <LancamentosFilters
        categorias={categoriasRaiz}
        centrosCusto={centrosCusto}
        regionais={regionais}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Cliente/Fornecedor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Valor final</th>
              <th className="px-4 py-3 text-right font-medium">Saldo aberto</th>
              <th className="px-4 py-3" />
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
                <td className="px-4 py-3 text-muted">
                  {l.cliente?.nome ?? l.fornecedor?.nome ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                  {formatCurrency(l.valorFinal.toString())}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-muted">
                  {formatCurrency(l.saldoAberto.toString())}
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    id={l.id}
                    descricao={l.descricao}
                    options={options}
                    initial={toLancamentoInitial(l)}
                  />
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
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
