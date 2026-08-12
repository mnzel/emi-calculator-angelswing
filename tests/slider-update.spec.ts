import { test, expect } from '@fixtures/base';

test.describe('Scenario 1 — updating inputs via slider', () => {
  test('dragging the loan amount slider updates the linked input and EMI', async ({ emiPage }) => {
    const before = await emiPage.getEmi();

    await emiPage.dragLoanAmountSlider(7_500_000);
    await expect.poll(() => emiPage.getLoanAmountInputValue()).toBeGreaterThan(0);

    const amount = await emiPage.getLoanAmountInputValue();
    // jQuery UI slider snaps to its configured step, so allow a small tolerance.
    expect(Math.abs(amount - 7_500_000)).toBeLessThanOrEqual(50_000);

    const after = await emiPage.getEmi();
    expect(after).not.toBe(before);
  });

  test('dragging the interest rate slider updates the linked input and EMI', async ({ emiPage }) => {
    const before = await emiPage.getEmi();

    await emiPage.dragInterestRateSlider(15);
    await expect.poll(() => emiPage.getInterestRateInputValue()).toBeGreaterThan(0);

    const rate = await emiPage.getInterestRateInputValue();
    expect(Math.abs(rate - 15)).toBeLessThanOrEqual(0.5);

    const after = await emiPage.getEmi();
    expect(after).not.toBe(before);
  });

  test('dragging the loan tenure slider updates the linked input and EMI', async ({ emiPage }) => {
    const before = await emiPage.getEmi();

    await emiPage.dragLoanTenureSlider(10);
    await expect.poll(() => emiPage.getTenureInputValue()).toBeGreaterThan(0);

    const tenure = await emiPage.getTenureInputValue();
    expect(Math.abs(tenure - 10)).toBeLessThanOrEqual(1);

    const after = await emiPage.getEmi();
    expect(after).not.toBe(before);
  });
});
