import { prisma } from "@/lib/prisma";
import { PeriodFilterBar } from "@/components/filters/period-filter-bar";
import { toNum } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { OrcamentoTable, type OrcamentoRow } from "./orcamento-table";

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const configuracao = await getConfiguracao();
  const ano = typeof params.ano === "string" && params.ano ? Number(params.ano) : now.getUTCFullYear();
  const mes = typeof params.mes === "string" && params.mes ? Number(params.mes) : now.getUTCMonth() + 1;

  const periodStart = new Date(Date.UTC(ano, mes - 1, 1));
  const periodEnd = new Date(Date.UTC(ano, mes, 1));

  const [categorias, orcamentos, realizadoPorCategoria, regionais, centrosCusto] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.orcamentoItem.findMany({ where: { ano, mes } }),
    prisma.lancamento.groupBy({
      by: ["categoriaId"],
      _sum: { valorFinal: true },
      where: { status: { not: "CANCELADO" }, dataCompetencia: { gte: periodStart, lt: periodEnd } },
    }),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const orcamentoMap = new Map(orcamentos.map((o) => [o.categoriaId, o]));
  const realizadoMap = new Map(realizadoPorCategoria.map((r) => [r.categoriaId, toNum(r._sum.valorFinal)]));

  // Lançamentos referenciam a categoria específica escolhida (raiz ou
  // subcategoria) — a árvore inteira é listada para que o Realizado apareça
  // no nível certo, com raízes agrupando visualmente suas subcategorias.
  const raizes = categorias.filter((c) => !c.parentId);
  const toRow = (c: (typeof categorias)[number], indent: boolean): OrcamentoRow => ({
    categoriaId: c.id,
    categoriaNome: indent ? `↳ ${c.nome}` : c.nome,
    tipo: c.tipo,
    orcamentoId: orcamentoMap.get(c.id)?.id ?? null,
    orcado: toNum(orcamentoMap.get(c.id)?.valorOrcado),
    realizado: realizadoMap.get(c.id) ?? 0,
  });
  const rows: OrcamentoRow[] = raizes.flatMap((raiz) => [
    toRow(raiz, false),
    ...categorias.filter((c) => c.parentId === raiz.id).map((sub) => toRow(sub, true)),
  ]);

  const years = [now.getUTCFullYear() - 1, now.getUTCFullYear(), now.getUTCFullYear() + 1];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Orçamento</h1>
        <p className="text-sm text-muted">Defina metas por categoria e acompanhe o realizado</p>
      </div>

      <PeriodFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
      />

      <OrcamentoTable ano={ano} mes={mes} rows={rows} />
    </div>
  );
}
