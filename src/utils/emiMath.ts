/**
 * Independent re-implementation of the standard EMI formula, used to
 * cross-validate values rendered by the site rather than trust its own JS.
 */
export interface EmiInputs {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
}

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
}

export function calculateEmi({ principal, annualRatePct, tenureMonths }: EmiInputs): EmiResult {
  const monthlyRate = annualRatePct / 12 / 100;
  const emiRaw =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * (1 + monthlyRate) ** tenureMonths) /
        ((1 + monthlyRate) ** tenureMonths - 1);

  const emi = Math.round(emiRaw);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return { emi, totalInterest, totalPayment };
}

/** Parses a rupee-formatted string like "₹ 1,07,96,711" into a number. */
export function parseRupees(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return Number(digits);
}
