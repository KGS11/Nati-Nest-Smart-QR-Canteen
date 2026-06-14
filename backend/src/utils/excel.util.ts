import ExcelJS from "exceljs";
import { AppError } from "./AppError";

export interface ExcelColumn {
  header: string;
  key: string;
  width: number;
}

export type ExcelCellValue = string | number | Date | null;

export interface ExcelSheetData {
  sheetName: string;
  columns: ExcelColumn[];
  rows: Record<string, ExcelCellValue>[];
  totals?: Record<string, number>;
}

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const parseDate = (value: string, label: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${label} must be a valid date`, 400);
  }
  return date;
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const generateExcelBuffer = async (
  sheets: ExcelSheetData[],
  workbookTitle: string,
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Nati Nest";
  workbook.created = new Date();
  workbook.title = workbookTitle;

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.sheetName);
    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
    headerRow.alignment = { horizontal: "center" };
    headerRow.border = {
      top: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
    };

    sheet.rows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);
      dataRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? "FFFFFFFF" : "FFF9F9F9" },
      };
      dataRow.alignment = { horizontal: "left" };
      dataRow.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
    });

    if (sheet.totals) {
      worksheet.addRow({});
      const totalsRowData = sheet.columns.reduce<Record<string, ExcelCellValue>>(
        (acc, column, index) => ({
          ...acc,
          [column.key]: index === 0 ? "TOTAL" : sheet.totals?.[column.key] ?? null,
        }),
        {},
      );
      const totalsRow = worksheet.addRow(totalsRowData);
      totalsRow.font = { bold: true, color: { argb: "FF1A1A1A" } };
      totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF59E0B" } };
      totalsRow.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const escapeCsvValue = (value: ExcelCellValue | undefined) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number") return String(value);
  return `"${value.replace(/"/g, '""')}"`;
};

export const generateCSV = (
  columns: ExcelColumn[],
  rows: Record<string, ExcelCellValue>[],
): string => {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const data = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(","),
  );
  return "\ufeff" + [header, ...data].join("\n");
};

export const parseDateRange = (params: {
  filter?: string;
  startDate?: string;
  endDate?: string;
}): { from: Date; to: Date } => {
  const now = new Date();

  if (params.filter === "custom") {
    if (!params.startDate || !params.endDate) {
      throw new AppError("startDate and endDate required for custom range", 400);
    }
    return {
      from: startOfDay(parseDate(params.startDate, "startDate")),
      to: endOfDay(parseDate(params.endDate, "endDate")),
    };
  }

  if (params.filter === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
  }

  if (params.filter === "this_week") {
    const monday = new Date(now);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    return { from: startOfDay(monday), to: endOfDay(now) };
  }

  if (params.filter === "this_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      to: endOfDay(now),
    };
  }

  return { from: startOfDay(now), to: endOfDay(now) };
};
