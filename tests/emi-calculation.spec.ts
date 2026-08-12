import { test, expect } from '@fixtures/base';
import { calculateEmi } from '@utils/emiMath';

interface Case {
  name: string;
  amount: number;
  rate: number;
  tenureYears: number;
}

const cases: Case[] = [
  { name: 'typical home loan', amount: 5_000_000, rate: 9, tenureYears: 20 },
  { name: 'small amount / short tenure', amount: 100_000, rate: 5, tenureYears: 1 },
  { name: 'large amount / long tenure', amount: 20_000_000, rate: 20, tenureYears: 30 },
  { name: 'low interest boundary', amount: 5_000_000, rate: 5, tenureYears: 10 },
  { name: 'high interest boundary', amount: 5_000_000, rate: 20, tenureYears: 10 },
];

// Rounding tolerance to absorb the site's own intermediate rounding.
const RUPEE_TOLERANCE = 5;

test.describe('Scenario 2 — EMI calculation matches formula', () => {
  for (const { name, amount, rate, tenureYears } of cases) {
    test(`EMI/interest/total match formula for ${name}`, async ({ emiPage }) => {
      await emiPage.setLoanAmount(amount);
      await emiPage.setInterestRate(rate);
      await emiPage.setTenure(tenureYears, 'years');

      const expected = calculateEmi({
        principal: amount,
        annualRatePct: rate,
        tenureMonths: tenureYears * 12,
      });

      await expect.poll(() => emiPage.getEmi()).toBeGreaterThan(0);

      const actualEmi = await emiPage.getEmi();
      const actualTotalInterest = await emiPage.getTotalInterest();
      const actualTotalPayment = await emiPage.getTotalPayment();

      expect(Math.abs(actualEmi - expected.emi)).toBeLessThanOrEqual(RUPEE_TOLERANCE);
      expect(Math.abs(actualTotalInterest - expected.totalInterest)).toBeLessThanOrEqual(
        RUPEE_TOLERANCE * tenureYears * 12,
      );
      expect(Math.abs(actualTotalPayment - expected.totalPayment)).toBeLessThanOrEqual(
        RUPEE_TOLERANCE * tenureYears * 12,
      );

      // Internal consistency: principal + interest breakdown must sum to total payment.
      const actualPrincipal = await emiPage.getLoanAmountInputValue();
      expect(actualTotalPayment).toBe(actualTotalInterest + actualPrincipal);
    });
  }
});
