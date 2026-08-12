import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as XLSX from 'xlsx';
import { test, expect } from '@fixtures/base';

test.describe('Scenario 4 — download Excel file and validate contents', () => {
  test('downloaded spreadsheet exists, is non-empty, and matches on-screen EMI', async ({ emiPage }) => {
    await emiPage.setLoanAmount(5_000_000);
    await emiPage.setInterestRate(9);
    await emiPage.setTenure(15, 'years');
    await expect.poll(() => emiPage.getEmi()).toBeGreaterThan(0);

    const expectedEmi = await emiPage.getEmi();
    const expectedFirstYearRow = (await emiPage.getTableYearRows())[0];

    const download = await emiPage.clickDownloadExcel();

    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);

    const savePath = path.join(os.tmpdir(), `emi-download-${Date.now()}-${download.suggestedFilename()}`);
    await download.saveAs(savePath);

    const stats = fs.statSync(savePath);
    expect(stats.size).toBeGreaterThan(0);

    const workbook = XLSX.readFile(savePath);
    expect(workbook.SheetNames.length).toBeGreaterThan(0);

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    const flatText = rows.flat().map((cell) => String(cell ?? '')).join(' | ');

    // Cross-check the file actually contains the EMI value shown on screen,
    // not just "some file downloaded".
    const emiDigitsOnly = String(expectedEmi);
    expect(flatText.replace(/[^\d|]/g, '')).toContain(emiDigitsOnly);

    if (expectedFirstYearRow) {
      expect(flatText).toContain(String(expectedFirstYearRow.year));
    }

    fs.unlinkSync(savePath);
  });
});
