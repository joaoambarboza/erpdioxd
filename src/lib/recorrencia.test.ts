import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deslocarMes,
  gerarParcelas,
  descricaoComParcela,
  mesesDistintos,
  recorrenciaSchema,
} from "./recorrencia";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

test("deslocarMes: avança meses mantendo o dia", () => {
  assert.equal(iso(deslocarMes(d("2026-10-15"), 1)), "2026-11-15");
  assert.equal(iso(deslocarMes(d("2026-10-15"), 3)), "2027-01-15");
});

test("deslocarMes: dia 31 usa o último dia do mês curto e volta ao 31 depois", () => {
  assert.equal(iso(deslocarMes(d("2026-01-31"), 1)), "2026-02-28");
  assert.equal(iso(deslocarMes(d("2026-01-31"), 2)), "2026-03-31");
  assert.equal(iso(deslocarMes(d("2026-01-31"), 3)), "2026-04-30");
});

test("deslocarMes: ano bissexto e virada de ano", () => {
  assert.equal(iso(deslocarMes(d("2027-12-15"), 2, 31)), "2028-02-29");
  assert.equal(iso(deslocarMes(d("2026-11-30"), 14)), "2028-01-30");
  assert.equal(iso(deslocarMes(d("2026-01-15"), 12)), "2027-01-15");
});

test("gerarParcelas: a primeira parcela é o original, sem alteração", () => {
  const original = {
    dataLancamento: d("2026-10-19"),
    dataCompetencia: d("2026-10-19"),
    dataVencimento: d("2026-10-25"),
  };
  const p = gerarParcelas({ ...original, meses: 3, dia: 5 });
  assert.equal(p.length, 3);
  assert.deepEqual(p[0], { parcela: 1, ...original });
  assert.equal(iso(p[1].dataVencimento), "2026-11-05");
  assert.equal(iso(p[2].dataVencimento), "2026-12-05");
  assert.equal(iso(p[1].dataCompetencia), "2026-11-19");
  assert.equal(iso(p[2].dataCompetencia), "2026-12-19");
  assert.equal(iso(p[2].dataLancamento), "2026-10-19");
});

test("gerarParcelas: dia 31 em série que passa por fevereiro e cruza o ano", () => {
  const p = gerarParcelas({
    dataLancamento: d("2026-12-10"),
    dataCompetencia: d("2026-12-31"),
    dataVencimento: d("2026-12-31"),
    meses: 4,
    dia: 31,
  });
  assert.deepEqual(
    p.map((x) => iso(x.dataVencimento)),
    ["2026-12-31", "2027-01-31", "2027-02-28", "2027-03-31"]
  );
  assert.deepEqual(
    p.map((x) => iso(x.dataCompetencia)),
    ["2026-12-31", "2027-01-31", "2027-02-28", "2027-03-31"]
  );
});

test("gerarParcelas: 60 meses geram 60 parcelas numeradas de 1 a 60", () => {
  const p = gerarParcelas({
    dataLancamento: d("2026-10-19"),
    dataCompetencia: d("2026-10-19"),
    dataVencimento: d("2026-10-19"),
    meses: 60,
    dia: 10,
  });
  assert.equal(p.length, 60);
  assert.deepEqual(
    p.map((x) => x.parcela),
    Array.from({ length: 60 }, (_, i) => i + 1)
  );
  assert.equal(iso(p[59].dataVencimento), "2031-09-10");
});

test("descricaoComParcela", () => {
  assert.equal(descricaoComParcela("Aluguel", 2, 12), "Aluguel (2/12)");
});

test("mesesDistintos: ordena e remove repetidos", () => {
  assert.deepEqual(
    mesesDistintos([d("2027-01-10"), d("2026-12-31"), d("2027-01-20")]),
    ["12/2026", "01/2027"]
  );
});

test("recorrenciaSchema: aceita valores válidos (strings de formulário)", () => {
  const r = recorrenciaSchema.safeParse({ meses: "12", dia: "5", chave: "abcdefgh-1234" });
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual([r.data.meses, r.data.dia], [12, 5]);
});

test("recorrenciaSchema: rejeita limites e valores inválidos", () => {
  const ok = { meses: "12", dia: "5", chave: "abcdefgh-1234" };
  assert.equal(recorrenciaSchema.safeParse({ ...ok, meses: "1" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ ...ok, meses: "61" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ ...ok, meses: "2.5" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ ...ok, meses: "" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ ...ok, dia: "0" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ ...ok, dia: "32" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ ...ok, chave: "" }).success, false);
  assert.equal(recorrenciaSchema.safeParse({ meses: "60", dia: "31", chave: "abcdefgh" }).success, true);
});
