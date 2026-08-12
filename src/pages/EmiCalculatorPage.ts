import { Page, Locator, expect } from '@playwright/test';
import { parseRupees } from '@utils/emiMath';

export type TenureUnit = 'years' | 'months';

export interface YearRow {
  year: number;
  principal: number;
  interest: number;
  totalPayment: number;
  balance: number;
}

export interface ChartSeriesPoint {
  category: string | number;
  value: number;
}

/**
 * Page Object for https://emicalculator.net/ — the Home/Personal/Car Loan
 * EMI calculator widget on the landing page.
 */
export class EmiCalculatorPage {
  readonly page: Page;

  readonly loanAmountInput: Locator;
  readonly loanAmountSlider: Locator;
  readonly interestRateInput: Locator;
  readonly interestRateSlider: Locator;
  readonly loanTenureInput: Locator;
  readonly loanTenureSlider: Locator;
  readonly tenureYearsRadio: Locator;
  readonly tenureMonthsRadio: Locator;

  readonly emiValue: Locator;
  readonly totalInterestValue: Locator;
  readonly totalPaymentValue: Locator;

  readonly pieChartContainer: Locator;
  readonly barChartContainer: Locator;
  readonly paymentTable: Locator;
  readonly downloadExcelLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.loanAmountInput = page.locator('#loanamount');
    this.loanAmountSlider = page.locator('#loanamountslider');
    this.interestRateInput = page.locator('#loaninterest');
    this.interestRateSlider = page.locator('#loaninterestslider');
    this.loanTenureInput = page.locator('#loanterm');
    this.loanTenureSlider = page.locator('#loantermslider');
    this.tenureYearsRadio = page.locator('#loanyears');
    this.tenureMonthsRadio = page.locator('#loanmonths');

    this.emiValue = page.locator('#emiamount span');
    this.totalInterestValue = page.locator('#emitotalinterest span');
    this.totalPaymentValue = page.locator('#emitotalamount span');

    this.pieChartContainer = page.locator('#emipiechart');
    this.barChartContainer = page.locator('#emibarchart');
    this.paymentTable = page.locator('#emipaymenttable');
    this.downloadExcelLink = page.locator('a.ecaldownloadexcel');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.emiValue).not.toHaveText('');
  }

  // ---------- Direct input (fast path used by non-slider scenarios) ----------

  async setLoanAmount(value: number) {
    await this.fillAndCommit(this.loanAmountInput, String(value));
  }

  async setInterestRate(value: number) {
    await this.fillAndCommit(this.interestRateInput, String(value));
  }

  async setTenure(value: number, unit: TenureUnit = 'years') {
    if (unit === 'years') {
      await this.tenureYearsRadio.check();
    } else {
      await this.tenureMonthsRadio.check();
    }
    await this.fillAndCommit(this.loanTenureInput, String(value));
  }

  private async fillAndCommit(input: Locator, value: string) {
    await input.click();
    await input.fill('');
    await input.fill(value);
    await input.blur();
    await expect.poll(() => input.inputValue()).not.toBe('');
  }

  // ---------- Slider drag (jQuery UI slider, not a native <input type=range>) ----------

  /**
   * Drags a jQuery UI slider handle to the position corresponding to `value`,
   * reading min/max/step live from the widget so ranges never go stale.
   */
  async dragSliderTo(slider: Locator, value: number) {
    const handle = slider.locator('.ui-slider-handle');
    const options = await slider.evaluate((el) => {
      const $ = (window as unknown as { jQuery: any }).jQuery;
      const widget = $(el).data('uiSlider') ?? $(el).data('ui-slider');
      return {
        min: widget.options.min as number,
        max: widget.options.max as number,
      };
    });

    const track = await slider.boundingBox();
    const handleBox = await handle.boundingBox();
    if (!track || !handleBox) throw new Error('Slider bounding box unavailable');

    const clamped = Math.min(Math.max(value, options.min), options.max);
    const fraction = (clamped - options.min) / (options.max - options.min);
    const targetX = track.x + fraction * track.width;
    const targetY = track.y + track.height / 2;

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, targetY, { steps: 15 });
    await this.page.mouse.up();
  }

  async dragLoanAmountSlider(value: number) {
    await this.dragSliderTo(this.loanAmountSlider, value);
  }

  async dragInterestRateSlider(value: number) {
    await this.dragSliderTo(this.interestRateSlider, value);
  }

  async dragLoanTenureSlider(value: number) {
    await this.dragSliderTo(this.loanTenureSlider, value);
  }

  // ---------- Reading results ----------

  async getEmi(): Promise<number> {
    return parseRupees(await this.emiValue.innerText());
  }

  async getTotalInterest(): Promise<number> {
    return parseRupees(await this.totalInterestValue.innerText());
  }

  async getTotalPayment(): Promise<number> {
    return parseRupees(await this.totalPaymentValue.innerText());
  }

  async getLoanAmountInputValue(): Promise<number> {
    return parseRupees(await this.loanAmountInput.inputValue());
  }

  async getInterestRateInputValue(): Promise<number> {
    return Number(await this.interestRateInput.inputValue());
  }

  async getTenureInputValue(): Promise<number> {
    return Number(await this.loanTenureInput.inputValue());
  }

  /**
   * Year-wise rows from the amortization table (annual summary rows only).
   * Reads the whole table in a single page.evaluate to avoid per-cell
   * locator round-trips, which are slow (and timeout-prone in WebKit) once
   * multiplied across dozens of rows/cells.
   */
  async getTableYearRows(): Promise<YearRow[]> {
    const raw = await this.paymentTable.evaluate((table) => {
      const toNumber = (text: string) => Number(text.replace(/[^\d]/g, ''));
      const rows = [...table.querySelectorAll('tbody tr')];
      const out: { year: number; principal: number; interest: number; totalPayment: number; balance: number }[] = [];

      for (const row of rows) {
        const cells = [...row.children] as HTMLElement[];
        if (cells.length < 5) continue;

        const yearText = cells[0].textContent?.trim() ?? '';
        if (!/^\d{4}$/.test(yearText)) continue;

        out.push({
          year: Number(yearText),
          principal: toNumber(cells[1].textContent ?? ''),
          interest: toNumber(cells[2].textContent ?? ''),
          totalPayment: toNumber(cells[3].textContent ?? ''),
          balance: toNumber(cells[4].textContent ?? ''),
        });
      }

      return out;
    });

    return raw as YearRow[];
  }

  /** Year-wise Principal/Interest series pulled straight from the live Highcharts instance. */
  async getBarChartSeries(): Promise<Record<string, ChartSeriesPoint[]>> {
    return this.barChartContainer.evaluate((el) => {
      const Highcharts = (window as unknown as { Highcharts: any }).Highcharts;
      const chart = Highcharts.charts.find((c: any) => c && c.renderTo === el);
      if (!chart) throw new Error('Highcharts instance not found for bar chart container');

      const categories: (string | number)[] = chart.xAxis[0].categories ?? [];
      const series: Record<string, ChartSeriesPoint[]> = {};
      for (const s of chart.series) {
        series[s.name] = s.data.map((point: any, idx: number) => ({
          category: categories[idx] ?? point.category ?? idx,
          value: point.y,
        }));
      }
      return series;
    });
  }

  async clickDownloadExcel(): Promise<import('@playwright/test').Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadExcelLink.click(),
    ]);
    return download;
  }
}
