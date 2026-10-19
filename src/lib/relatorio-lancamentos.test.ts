import { test } from "node:test";
import assert from "node:assert/strict";
import { dataEfetivaPagamento } from "./relatorio-lancamentos";

const data = new Date("2026-10-05T00:00:00.000Z");

test("dataEfetivaPagamento: usa a data gravada, qualquer que seja o status", () => {
  for (const status of ["PAGO", "RECEBIDO", "PARCIAL_PAGO", "PARCIAL_RECEBIDO"] as const) {
    assert.equal(dataEfetivaPagamento({ dataPagamento: data, status }).data, data);
  }
});

test("dataEfetivaPagamento: em aberto não recebe data inventada", () => {
  for (const status of ["EM_ABERTO", "PROJETADO", "VENCIDO"] as const) {
    assert.deepEqual(dataEfetivaPagamento({ dataPagamento: null, status }), { data: null, texto: "Em aberto" });
  }
});

test("dataEfetivaPagamento: baixado sem data e cancelado são sinalizados, não preenchidos", () => {
  assert.deepEqual(dataEfetivaPagamento({ dataPagamento: null, status: "PAGO" }), {
    data: null,
    texto: "Sem data registrada",
  });
  assert.deepEqual(dataEfetivaPagamento({ dataPagamento: null, status: "CANCELADO" }), {
    data: null,
    texto: "—",
  });
});
