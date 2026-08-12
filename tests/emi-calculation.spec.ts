import { test, expect } from '@fixtures/base';
import { calculateEmi } from '@utils/emiMath';
import { LoanInput } from '@pages/EmiCalculatorPage';

interface Case {
  name: string;
  loan: LoanInput;
}

// These 5 cases cover typical usage plus boundaries: min/max loan amount,
// min/max interest rate, and short/long tenure. Each is cross-checked against
// calculateEmi(), an independently-implemented formula (not the site's own JS),
// so a bug in the site's own calculation logic will actually be caught instead
// of the test just re-confirming whatever the site computes.
const cases: Case[] = [
  { name: 'typical home loan', loan: { amount: 5_000_000, ratePct: 9, tenureYears: 20 } },
  { name: 'small amount / short tenure', loan: { amount: 100_000, ratePct: 5, tenureYears: 1 } },
  { name: 'large amount / long tenure', loan: { amount: 20_000_000, ratePct: 20, tenureYears: 30 } },
  { name: 'low interest boundary', loan: { amount: 5_000_000, ratePct: 5, tenureYears: 10 } },
  { name: 'high interest boundary', loan: { amount: 5_000_000, ratePct: 20, tenureYears: 10 } },
];

// Rounding tolerance to absorb the site's own intermediate rounding.
const RUPEE_TOLERANCE = 5;

test.describe('Scenario 2 — EMI calculation matches formula', () => {
  for (const { name, loan } of cases) {
    test(`EMI/interest/total match formula for ${name}`, async ({ emiPage }) => {
      await emiPage.setLoan(loan);

      const expected = calculateEmi({
        principal: loan.amount,
        annualRatePct: loan.ratePct,
        tenureMonths: loan.tenureYears * 12,
      });

      const actualEmi = await emiPage.getEmi();
      const actualTotalInterest = await emiPage.getTotalInterest();
      const actualTotalPayment = await emiPage.getTotalPayment();
      const monthCount = loan.tenureYears * 12;

      expect(Math.abs(actualEmi - expected.emi)).toBeLessThanOrEqual(RUPEE_TOLERANCE);
      expect(Math.abs(actualTotalInterest - expected.totalInterest)).toBeLessThanOrEqual(
        RUPEE_TOLERANCE * monthCount,
      );
      expect(Math.abs(actualTotalPayment - expected.totalPayment)).toBeLessThanOrEqual(
        RUPEE_TOLERANCE * monthCount,
      );

      // Sanity check independent of the formula cross-check above: the 3 numbers
      // the site displays (principal, interest, total) must agree with each other,
      // regardless of whether they match the expected formula values.
      // Internal consistency: principal + interest breakdown must sum to total payment.
      const actualPrincipal = await emiPage.getLoanAmountInputValue();
      expect(actualTotalPayment).toBe(actualTotalInterest + actualPrincipal);
    });
  }
});
