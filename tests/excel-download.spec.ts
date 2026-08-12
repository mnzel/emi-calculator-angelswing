import { test, expect } from '@fixtures/base';
import { TYPICAL_LOAN } from '@fixtures/testData';
import { downloadAndParseWorkbook, parseMonthlyAmortizationRows, aggregateByYear } from '@utils/excelFile';

// Rupee rounding differences between the site's own yearly rollup and our
// month-by-month sum of the exported file.
const TOLERANCE_PER_MONTH = 5;

// Guards against two failure modes a bare "download fired" check would miss:
// 1) the file is corrupt/empty (wrong format, 0 sheets, unparseable), and
// 2) the file downloads fine but its numbers are stale/wrong vs the on-screen
//    loan (EMI, first year row) — e.g. exported before recalculation.
test.describe('Scenario 4 — download Excel file and validate contents', () => {
  test('downloaded spreadsheet exists, is non-empty, and matches on-screen EMI', async ({ emiPage }) => {
    await emiPage.setLoan(TYPICAL_LOAN);

    const expectedEmi = await emiPage.getEmi();
    const expectedFirstYearRow = (await emiPage.getTableYearRows())[0];

    const download = await emiPage.clickDownloadExcel();
    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);

    const { sheetNames, flatText } = await downloadAndParseWorkbook(download);
    expect(sheetNames.length).toBeGreaterThan(0);

    // Cross-check the file actually contains the EMI value shown on screen,
    // not just "some file downloaded".
    expect(flatText.replace(/[^\d|]/g, '')).toContain(String(expectedEmi));

    if (expectedFirstYearRow) {
      expect(flatText).toContain(String(expectedFirstYearRow.year));
    }
  });

  test("every year's Principal/Interest in the file match the on-screen table", async ({ emiPage }) => {
    await emiPage.setLoan(TYPICAL_LOAN);

    const tableYearRows = await emiPage.getTableYearRows();
    expect(tableYearRows.length).toBeGreaterThan(0);

    const download = await emiPage.clickDownloadExcel();
    const { rows } = await downloadAndParseWorkbook(download);

    const monthlyRows = parseMonthlyAmortizationRows(rows);
    expect(monthlyRows.length).toBe(TYPICAL_LOAN.tenureYears * 12);

    const excelYearTotals = aggregateByYear(monthlyRows);

    for (const tableRow of tableYearRows) {
      const excelYear = excelYearTotals.get(tableRow.year);
      expect(excelYear, `no excel data for year ${tableRow.year}`).toBeDefined();

      // A calendar year at the start/end of the tenure may only have a few
      // months in it, so the tolerance scales with month count rather than
      // using a flat constant.
      const monthsInThisTableYear = monthlyRows.filter((m) => m.year === tableRow.year).length;
      const tolerance = TOLERANCE_PER_MONTH * monthsInThisTableYear;

      expect(Math.abs(excelYear!.principal - tableRow.principal)).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(excelYear!.interest - tableRow.interest)).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(excelYear!.balance - tableRow.balance)).toBeLessThanOrEqual(tolerance);
    }
  });
});
