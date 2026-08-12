import { test, expect } from '@fixtures/base';
import { TYPICAL_LOAN } from '@fixtures/testData';

// Rupee rounding differences between chart data points and table cells.
const TOLERANCE = 5;

// Reads year-wise Principal/Interest directly from the live Highcharts instance
// (not pixel-scraped off the SVG) and cross-checks against the same years in the
// amortization table. Chart and table are separate site components, so this
// catches them silently drifting out of sync with each other.
test.describe('Scenario 3 — chart and table values match year-wise', () => {
  test('bar chart Principal/Interest series match the amortization table rows', async ({ emiPage }) => {
    await emiPage.setLoan(TYPICAL_LOAN);

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
