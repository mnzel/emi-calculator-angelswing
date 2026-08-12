import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as XLSX from 'xlsx';
import type { Download } from '@playwright/test';

export interface ParsedWorkbook {
  sheetNames: string[];
  rows: unknown[][];
  /** All cell values flattened into one searchable string, e.g. for `.toContain()` checks. */
  flatText: string;
}

export interface MonthlyAmortizationRow {
  monthIndex: number;
  year: number;
  principal: number;
  interest: number;
  totalPayment: number;
  balance: number;
}

/**
 * Locates the "Loan Amortization Table" section inside the exported sheet's
 * raw rows (metadata + summary rows precede it) and parses the monthly
 * breakdown. Finds the header row by content rather than a hardcoded index,
 * since the number of metadata rows above it isn't a stable contract.
 */
export function parseMonthlyAmortizationRows(rows: unknown[][]): MonthlyAmortizationRow[] {
  const headerIndex = rows.findIndex((row) => row[0] === 'Month #');
  if (headerIndex === -1) throw new Error('Could not find "Month #" header row in workbook');

  const dataRows = rows.slice(headerIndex + 1).filter((row) => row.length > 0);

  return dataRows.map((row) => {
    const [monthIndex, monthYearLabel, principal, interest, totalPayment, balance] = row as [
      number,
      string,
      number,
      number,
      number,
      number,
    ];
    const year = Number(String(monthYearLabel).split('-')[1]);
    return { monthIndex, year, principal, interest, totalPayment, balance };
  });
}

/** Aggregates monthly rows into calendar-year totals, matching the site's year-wise table grouping. */
export function aggregateByYear(monthlyRows: MonthlyAmortizationRow[]): Map<
  number,
  { principal: number; interest: number; totalPayment: number; balance: number }
> {
  const byYear = new Map<number, { principal: number; interest: number; totalPayment: number; balance: number }>();

  for (const row of monthlyRows) {
    const existing = byYear.get(row.year);
    if (existing) {
      existing.principal += row.principal;
      existing.interest += row.interest;
      existing.totalPayment += row.totalPayment;
      existing.balance = row.balance; // last month of the year wins
    } else {
      byYear.set(row.year, {
        principal: row.principal,
        interest: row.interest,
        totalPayment: row.totalPayment,
        balance: row.balance,
      });
    }
  }

  return byYear;
}

/**
 * Saves a Playwright `Download` to a temp path, parses it as a workbook, and
 * deletes the temp file — the full "download it, read it, clean up" flow
 * shared by any test that needs to inspect the exported spreadsheet.
 */
export async function downloadAndParseWorkbook(download: Download): Promise<ParsedWorkbook> {
  const savePath = path.join(os.tmpdir(), `emi-download-${Date.now()}-${download.suggestedFilename()}`);
  await download.saveAs(savePath);

  try {
    const stats = fs.statSync(savePath);
    if (stats.size === 0) throw new Error(`Downloaded file is empty: ${savePath}`);

    const workbook = XLSX.readFile(savePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    const flatText = rows.flat().map((cell) => String(cell ?? '')).join(' | ');

    return { sheetNames: workbook.SheetNames, rows, flatText };
  } finally {
    fs.unlinkSync(savePath);
  }
}
