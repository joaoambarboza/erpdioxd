import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ehReceitaLiquida,
  montarDre,
  padronizarRotuloSubtotal,
  parsePeriodosDre,
  somarMapas,
  type DreGrupoInput,
  type DreValores,
} from "./dre";

const grupos: DreGrupoInput[] = [
  {
    id: "g1",
    nome: "Receita Bruta",
    subtotalLabel: "Receita Bruta",
    mostrarPercentual: false,
    contas: [{ id: "c1", nome: "Vendas", regime: "COMPETENCIA" }],
  },
  {
    id: "g2",
    nome: "Deduções",
    subtotalLabel: "receita liquida",
    mostrarPercentual: true,
    contas: [{ id: "c2", nome: "Impostos", regime: "COMPETENCIA" }],
  },
  {
    id: "g3",
    nome: "Custos",
    subtotalLabel: "   ",
    mostrarPercentual: true,
    contas: [{ id: "c3", nome: "CMV", regime: "CAIXA" }],
  },
  {
    id: "g4",
    nome: "Despesas",
    subtotalLabel: "Lucro Líquido",
    mostrarPercentual: true,
    contas: [{ id: "c4", nome: "Aluguel", regime: "CAIXA" }],
  },
];

const valores = new Map<string, DreValores>([
  ["c1", { projetado: 1200, realizado: 1000 }],
  ["c2", { projetado: -200, realizado: -100 }],
  ["c3", { projetado: -300, realizado: -300 }],
  ["c4", { projetado: -100, realizado: -200 }],
]);
const totais = {
  receita: { projetado: 1200, realizado: 1000 },
  despesas: { projetado: 600, realizado: 600 },
};

test("ehReceitaLiquida: ignora caixa, acento e espaços, mas não aceita outros rótulos", () => {
  assert.equal(ehReceitaLiquida("Receita Líquida"), true);
  assert.equal(ehReceitaLiquida("  receita liquida "), true);
  assert.equal(ehReceitaLiquida("RECEITA  LÍQUIDA"), true);
  assert.equal(ehReceitaLiquida("Receita Bruta"), false);
  assert.equal(ehReceitaLiquida(null), false);
});

test("padronizarRotuloSubtotal: grafia padrão para Receita Líquida, vazio vira null", () => {
  assert.equal(padronizarRotuloSubtotal("receita liquida"), "Receita Líquida");
  assert.equal(padronizarRotuloSubtotal("  EBITDA "), "EBITDA");
  assert.equal(padronizarRotuloSubtotal("   "), null);
  assert.equal(padronizarRotuloSubtotal(undefined), null);
});

test("montarDre: subtotal acumula e rótulo em branco fica null (linha oculta)", () => {
  const dre = montarDre(grupos, valores, totais);
  assert.deepEqual(
    dre.linhasGrupo.map((l) => l.subtotalLabel),
    ["Receita Bruta", "receita liquida", null, "Lucro Líquido"]
  );
  assert.deepEqual(dre.linhasGrupo[1].resultadoParcial, { projetado: 1000, realizado: 900 });
  assert.deepEqual(dre.linhasGrupo[2].resultadoParcial, { projetado: 700, realizado: 600 });
});

test("montarDre: percentuais e margem líquida são sobre a Receita Líquida", () => {
  const dre = montarDre(grupos, valores, totais);
  assert.deepEqual(dre.receitaLiquida, { projetado: 1000, realizado: 900 });
  assert.equal(dre.linhasGrupo[0].percentual, null);
  assert.equal(dre.linhasGrupo[3].percentual?.projetado, 60);
  assert.deepEqual(dre.resultadoFinal, { projetado: 600, realizado: 400 });
  assert.equal(dre.margemLiquida.projetado, 60);
  assert.ok(Math.abs((dre.margemLiquida.realizado ?? 0) - (400 / 900) * 100) < 1e-9);
});

test("montarDre: sem grupo Receita Líquida (ou base zero) não calcula percentual", () => {
  const semRl = grupos.map((g) => (g.id === "g2" ? { ...g, subtotalLabel: "Outro" } : g));
  const dre = montarDre(semRl, valores, totais);
  assert.equal(dre.receitaLiquida, null);
  assert.equal(dre.linhasGrupo[3].percentual, null);
  assert.deepEqual(dre.margemLiquida, { projetado: null, realizado: null });

  const baseZero = montarDre(grupos, new Map(), { receita: { projetado: 0, realizado: 0 }, despesas: { projetado: 0, realizado: 0 } });
  assert.deepEqual(baseZero.margemLiquida, { projetado: null, realizado: null });
});

test("somarMapas: acumulado é a soma dos trimestres, conta a conta", () => {
  const soma = somarMapas([
    new Map([["c1", { projetado: 1, realizado: 2 }]]),
    new Map([
      ["c1", { projetado: 10, realizado: 20 }],
      ["c2", { projetado: 5, realizado: 0 }],
    ]),
  ]);
  assert.deepEqual(soma.get("c1"), { projetado: 11, realizado: 22 });
  assert.deepEqual(soma.get("c2"), { projetado: 5, realizado: 0 });
});

test("parsePeriodosDre: padrão mostra tudo; seleção vem em ordem fixa", () => {
  assert.deepEqual(parsePeriodosDre({}), ["T1", "T2", "T3", "T4", "ACUM"]);
  assert.deepEqual(parsePeriodosDre({ periodos: "acum,T3" }), ["T3", "ACUM"]);
  assert.deepEqual(parsePeriodosDre({ periodos: ["T2", "T1"] }), ["T1", "T2"]);
  assert.deepEqual(parsePeriodosDre({ periodos: "lixo" }), ["T1", "T2", "T3", "T4", "ACUM"]);
});
