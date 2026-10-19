import ExcelJS from "exceljs";

export type ExcelColumn = {
  header: string;
  key: string;
  width?: number;
  currency?: boolean;
  /** Células com `Date` (UTC) formatadas como data dd/mm/aaaa — reconhecidas como data pelo Excel. */
  date?: boolean;
};

export async function buildXlsxResponse(
  filename: string,
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
  options?: { logo?: { buffer: Buffer; extension: "png" | "jpeg" } }
): Promise<Response> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({ key: c.key, width: c.width ?? 20 }));

  const headerRowNumber = options?.logo ? 4 : 1;
  if (options?.logo) {
    // exceljs's bundled Buffer type predates Node's current generic Buffer<ArrayBufferLike> — same runtime value, just a type-def mismatch.
    const imageId = workbook.addImage({
      buffer: options.logo.buffer as unknown as NonNullable<ExcelJS.Image["buffer"]>,
      extension: options.logo.extension,
    });
    sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 130, height: 48 } });
    sheet.getRow(1).height = 24;
    sheet.getRow(2).height = 24;
  }

  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = columns.map((c) => c.header);
  headerRow.font = { bold: true };

  for (const row of rows) {
    sheet.addRow(row);
  }

  for (const col of columns) {
    if (col.currency) {
      sheet.getColumn(col.key).numFmt = '"R$" #,##0.00';
    }
    if (col.date) {
      const column = sheet.getColumn(col.key);
      column.numFmt = "dd/mm/yyyy";
      column.alignment = { horizontal: "left" };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
