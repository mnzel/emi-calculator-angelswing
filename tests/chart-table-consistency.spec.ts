import { test, expect } from '@fixtures/base';

// Rupee rounding differences between chart data points and table cells.
const TOLERANCE = 5;

test.describe('Scenario 3 — chart and table values match year-wise', () => {
  test('bar chart Principal/Interest series match the amortization table rows', async ({ emiPage }) => {
    await emiPage.setLoanAmount(5_000_000);
    await emiPage.setInterestRate(9);
    await emiPage.setTenure(15, 'years');
    await expect.poll(() => emiPage.getEmi()).toBeGreaterThan(0);

    const [series, tableRows] = await Promise.all([
      emiPage.getBarChartSeries(),
      emiPage.getTableYearRows(),
    ]);

    expect(tableRows.length).toBeGreaterThan(0);
    expect(series['Principal']).toBeDefined();
    expect(series['Interest']).toBeDefined();

    for (const row of tableRows) {
      const principalPoint = series['Principal'].find((p) => Number(p.category) === row.year);
      const interestPoint = series['Interest'].find((p) => Number(p.category) === row.year);

      expect(principalPoint, `missing chart Principal point for year ${row.year}`).toBeDefined();
      expect(interestPoint, `missing chart Interest point for year ${row.year}`).toBeDefined();

      expect(Math.abs(principalPoint!.value - row.principal)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(interestPoint!.value - row.interest)).toBeLessThanOrEqual(TOLERANCE);
    }
  });
});
