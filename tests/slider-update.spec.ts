import { test, expect } from '@fixtures/base';
import { EmiCalculatorPage } from '@pages/EmiCalculatorPage';

interface SliderCase {
  name: string;
  targetValue: number;
  tolerance: number;
  drag: (emiPage: EmiCalculatorPage, value: number) => Promise<void>;
  getInputValue: (emiPage: EmiCalculatorPage) => Promise<number>;
}

// These 3 cases (amount, rate, tenure) exercise the same assertion shape:
// drag a slider -> its linked input updates to roughly the target value ->
// the EMI result changes. Each case just plugs in the slider-specific
// drag/read helpers.
// jQuery UI sliders snap to their configured step, so each case allows a
// small tolerance around the requested target value.
const cases: SliderCase[] = [
  {
    name: 'loan amount',
    targetValue: 7_500_000,
    tolerance: 50_000,
    drag: (emiPage, value) => emiPage.dragLoanAmountSlider(value),
    getInputValue: (emiPage) => emiPage.getLoanAmountInputValue(),
  },
  {
    name: 'interest rate',
    targetValue: 15,
    tolerance: 0.5,
    drag: (emiPage, value) => emiPage.dragInterestRateSlider(value),
    getInputValue: (emiPage) => emiPage.getInterestRateInputValue(),
  },
  {
    name: 'loan tenure',
    targetValue: 10,
    tolerance: 1,
    drag: (emiPage, value) => emiPage.dragLoanTenureSlider(value),
    getInputValue: (emiPage) => emiPage.getTenureInputValue(),
  },
];

// For each case: drag the slider, poll the linked input until it reflects
// a value (handles UI update lag), then assert it landed within tolerance
// of the target (slider snaps to step, so exact match isn't guaranteed),
// and finally confirm the EMI recalculated.
test.describe('Scenario 1 — updating inputs via slider', () => {
  for (const { name, targetValue, tolerance, drag, getInputValue } of cases) {
    test(`dragging the ${name} slider updates the linked input and EMI`, async ({ emiPage }) => {
      const before = await emiPage.getEmi();

      await drag(emiPage, targetValue);
      await expect.poll(() => getInputValue(emiPage)).toBeGreaterThan(0);

      const actual = await getInputValue(emiPage);
      expect(Math.abs(actual - targetValue)).toBeLessThanOrEqual(tolerance);

      const after = await emiPage.getEmi();
      expect(after).not.toBe(before);
    });
  }
});
