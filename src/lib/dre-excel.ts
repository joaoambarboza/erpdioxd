import ExcelJS from "exceljs";
import { addLogo, xlsxResponse } from "@/lib/excel";
import {
  DRE_PERIODOS,
  RECEITA_LIQUIDA_LABEL,
  ehReceitaLiquida,
  labelPeriodo,
  type DrePeriodoKey,
  type DreResultado,
} from "@/lib/dre";

const FORMATO_MOEDA = '"R$" #,##0.00';
const FORMATO_PERCENTUAL = "0.0%";

const letra = (coluna: number) => String.fromCharCode(64 + coluna);

/**
 * Excel editável da DRE: 4 trimestres + acumulado, cada um com Projetado e
 * Realizado. Só os valores das contas por trimestre são números digitados;
 * totais de grupo, subtotais, acumulado, percentuais e margem líquida são
 * fórmulas do Excel e recalculam quando algum valor é editado. Cada fórmula
 * leva também o resultado já calculado, para visualizadores que não recalculam.
 */
export async function buildDreXlsxResponse({
  dre,
  ano,
  mesInicioAnoFiscal,
  logo,
}: {
  dre: Record<DrePeriodoKey, DreResultado>;
  ano: number;
  mesInicioAnoFiscal: number;
  logo?: { buffer: Buffer; extension: "png" | "jpeg" };
}): Promise<Response> {
  const workbook = new ExcelJS.Workbook();
  workbook.calcProperties.fullCalcOnLoad = true;
  const sheet = workbook.addWorksheet("DRE");
  sheet.getColumn(1).width = 42;
  for (let c = 2; c <= 1 + DRE_PERIODOS.length * 2; c++) sheet.getColumn(c).width = 17;

  const topRow = logo ? 4 : 1;
  if (logo) addLogo(workbook, sheet, logo);

  // Coluna de cada período/tipo: B,C = T1; D,E = T2; ... J,K = Acumulado.
  const colunaDe = (periodoIdx: number, tipo: 0 | 1) => 2 + periodoIdx * 2 + tipo;
  const campo = ["projetado", "realizado"] as const;

  const header1 = sheet.getRow(topRow);
  const header2 = sheet.getRow(topRow + 1);
  header1.getCell(1).value = `DRE — ano fiscal ${ano}`;
  header2.getCell(1).value = "Conta";
  DRE_PERIODOS.forEach((p, i) => {
    header1.getCell(colunaDe(i, 0)).value = labelPeriodo(p, mesInicioAnoFiscal);
    sheet.mergeCells(topRow, colunaDe(i, 0), topRow, colunaDe(i, 1));
    header2.getCell(colunaDe(i, 0)).value = "Projetado";
    header2.getCell(colunaDe(i, 1)).value = "Realizado";
  });
  for (const row of [header1, header2]) {
    row.font = { bold: true };
    row.alignment = { horizontal: "center" };
  }
  header1.getCell(1).alignment = { horizontal: "left" };
  header2.getCell(1).alignment = { horizontal: "left" };
  sheet.views = [{ state: "frozen", xSplit: 1, ySplit: topRow + 1 }];

  // 1ª passada: número de cada linha, para que fórmulas possam apontar para linhas posteriores.
  const grupos = dre.ACUM.linhasGrupo;
  let proxima = topRow + 2;
  const layout = grupos.map((g) => {
    const grupoRow = proxima++;
    const contaRows = g.contas.map(() => proxima++);
    const subtotalRow = g.subtotalLabel ? proxima++ : null;
    const percentualRow = g.mostrarPercentual && dre.ACUM.receitaLiquida ? proxima++ : null;
    return { grupoRow, contaRows, subtotalRow, percentualRow };
  });
  const rlIdx = grupos.findIndex((g) => ehReceitaLiquida(g.subtotalLabel));
  const rlRow = rlIdx >= 0 ? layout[rlIdx].subtotalRow : null;
  const margemRow = rlRow && grupos.length > 0 ? proxima++ : null;

  const escrever = (
    row: number,
    col: number,
    value: number | { formula: string; result: number | string },
    formato = FORMATO_MOEDA
  ) => {
    const cell = sheet.getCell(row, col);
    cell.value = value;
    cell.numFmt = formato;
    return cell;
  };

  // Soma dos totais de grupo 0..gi na coluna: o resultado parcial acumulado.
  const parcial = (gi: number, col: number) =>
    layout
      .slice(0, gi + 1)
      .map((l) => `${letra(col)}${l.grupoRow}`)
      .join("+");

  grupos.forEach((g, gi) => {
    const l = layout[gi];
    const rowGrupo = sheet.getRow(l.grupoRow);
    rowGrupo.getCell(1).value = g.nome;
    rowGrupo.font = { bold: true };
    sheet.getRow(l.grupoRow).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5EFEA" } };
    });
    g.contas.forEach((conta, ci) => {
      sheet.getCell(l.contaRows[ci], 1).value =
        `    ${conta.nome} (${conta.regime === "CAIXA" ? "caixa" : "competência"})`;
    });

    DRE_PERIODOS.forEach((p, pi) => {
      const linha = dre[p].linhasGrupo[gi];
      ([0, 1] as const).forEach((tipo) => {
        const col = colunaDe(pi, tipo);
        const k = campo[tipo];
        const L = letra(col);

        const grupoCell = escrever(
          l.grupoRow,
          col,
          l.contaRows.length > 0
            ? {
                formula: `SUM(${L}${l.contaRows[0]}:${L}${l.contaRows[l.contaRows.length - 1]})`,
                result: linha.totalGrupo[k],
              }
            : 0
        );
        grupoCell.font = { bold: true };

        l.contaRows.forEach((row, ci) => {
          const valor = linha.contas[ci][k];
          if (p === "ACUM") {
            const trimestres = [0, 1, 2, 3].map((t) => `${letra(colunaDe(t, tipo))}${row}`).join("+");
            escrever(row, col, { formula: trimestres, result: valor });
          } else {
            // Único tipo de célula editável: o valor da conta no trimestre.
            escrever(row, col, valor).font = { color: { argb: "FF1F4E9E" } };
          }
        });

        if (l.subtotalRow) {
          const cell = escrever(l.subtotalRow, col, {
            formula: parcial(gi, col),
            result: linha.resultadoParcial[k],
          });
          cell.font = { bold: true, italic: true };
        }

        if (l.percentualRow && rlRow) {
          const base = `${L}${rlRow}`;
          const alvo = l.subtotalRow ? `${L}${l.subtotalRow}` : `(${parcial(gi, col)})`;
          const pct = linha.percentual?.[k];
          escrever(
            l.percentualRow,
            col,
            { formula: `IF(${base}=0,"",${alvo}/${base})`, result: pct == null ? "" : pct / 100 },
            FORMATO_PERCENTUAL
          ).font = { italic: true };
        }
      });
    });

    if (l.subtotalRow) {
      const cell = sheet.getCell(l.subtotalRow, 1);
      cell.value = `= ${g.subtotalLabel}`;
      cell.font = { bold: true, italic: true };
      cell.alignment = { horizontal: "right" };
    }
    if (l.percentualRow) {
      const cell = sheet.getCell(l.percentualRow, 1);
      cell.value = `% sobre ${RECEITA_LIQUIDA_LABEL}`;
      cell.font = { italic: true };
      cell.alignment = { horizontal: "right" };
    }
  });

  if (margemRow && rlRow) {
    const ultimo = grupos.length - 1;
    const rotulo = sheet.getCell(margemRow, 1);
    rotulo.value = "Margem líquida (resultado final ÷ Receita Líquida)";
    rotulo.font = { bold: true };
    DRE_PERIODOS.forEach((p, pi) => {
      ([0, 1] as const).forEach((tipo) => {
        const col = colunaDe(pi, tipo);
        const L = letra(col);
        const m = dre[p].margemLiquida[campo[tipo]];
        escrever(
          margemRow,
          col,
          { formula: `IF(${L}${rlRow}=0,"",(${parcial(ultimo, col)})/${L}${rlRow})`, result: m == null ? "" : m / 100 },
          FORMATO_PERCENTUAL
        ).font = { bold: true };
      });
    });
  }

  const nota = sheet.getCell((margemRow ?? proxima - 1) + 2, 1);
  nota.value =
    "Valores em azul (contas por trimestre) são editáveis; totais, subtotais, acumulado, percentuais e margem são fórmulas.";
  nota.font = { italic: true, color: { argb: "FF6B7280" } };

  return xlsxResponse(workbook, `dre-${ano}.xlsx`);
}
