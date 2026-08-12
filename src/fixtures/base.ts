import { test as base } from '@playwright/test';
import { EmiCalculatorPage } from '@pages/EmiCalculatorPage';

export const test = base.extend<{ emiPage: EmiCalculatorPage }>({
  emiPage: async ({ page }, use) => {
    const emiPage = new EmiCalculatorPage(page);
    await emiPage.goto();
    await use(emiPage);
  },
});

export { expect } from '@playwright/test';
