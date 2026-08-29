import { prisma } from "@/lib/prisma";
import { toNum } from "@/lib/financials";
import { getConfiguracao } from "@/lib/configuracao";
import { OrcamentoFilterBar } from "./orcamento-filter-bar";
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

  const mesesSelecionados = (typeof params.meses === "string" ? params.meses : "")
    .split(",")
    .filter(Boolean)
    .map(Number)
    .filter((m) => m >= 1 && m <= 12)
    .sort((a, b) => a - b);
  // "todos" (nenhum mês selecionado) soma o ano inteiro, em vez de cair
  // silenciosamente no mês atual como acontecia antes.
  const mesesParaSomar = mesesSelecionados.length > 0 ? mesesSelecionados : Array.from({ length: 12 }, (_, i) => i + 1);
  const editavel = mesesSelecionados.length === 1;
  const mesParaEdicao = editavel ? mesesSelecionados[0] : now.getUTCMonth() + 1;

  const [categorias, orcamentos, realizadoPorMes, regionais, centrosCusto] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.orcamentoItem.findMany({ where: { ano, mes: { in: mesesParaSomar } } }),
    Promise.all(
      mesesParaSomar.map((mes) =>
        prisma.lancamento.groupBy({
          by: ["categoriaId"],
          _sum: { valorFinal: true },
          where: {
            status: { not: "CANCELADO" },
            dataCompetencia: { gte: new Date(Date.UTC(ano, mes - 1, 1)), lt: new Date(Date.UTC(ano, mes, 1)) },
          },
        })
      )
    ),
    prisma.regional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const orcamentoSomaMap = new Map<string, number>();
  const orcamentoIdMap = new Map<string, string>();
  for (const o of orcamentos) {
    orcamentoSomaMap.set(o.categoriaId, (orcamentoSomaMap.get(o.categoriaId) ?? 0) + toNum(o.valorOrcado));
    orcamentoIdMap.set(o.categoriaId, o.id);
  }

  const realizadoMap = new Map<string, number>();
  for (const r of realizadoPorMes.flat()) {
    realizadoMap.set(r.categoriaId, (realizadoMap.get(r.categoriaId) ?? 0) + toNum(r._sum.valorFinal));
  }

  // Lançamentos referenciam a categoria específica escolhida (raiz ou
  // subcategoria) — a árvore inteira é listada para que o Realizado apareça
  // no nível certo, com raízes agrupando visualmente suas subcategorias.
  const raizes = categorias.filter((c) => !c.parentId);
  const toRow = (c: (typeof categorias)[number], indent: boolean): OrcamentoRow => ({
    categoriaId: c.id,
    categoriaNome: indent ? `↳ ${c.nome}` : c.nome,
    tipo: c.tipo,
    orcamentoId: editavel ? (orcamentoIdMap.get(c.id) ?? null) : null,
    orcado: orcamentoSomaMap.get(c.id) ?? 0,
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

      <OrcamentoFilterBar
        regionais={regionais}
        centrosCusto={centrosCusto}
        years={years}
        mesInicioAnoFiscal={configuracao.mesInicioAnoFiscal}
      />

      <OrcamentoTable ano={ano} mes={mesParaEdicao} editavel={editavel} rows={rows} />
    </div>
  );
}
