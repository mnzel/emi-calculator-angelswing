# Test Plan — EMI Calculator (emicalculator.net)

## 1. Objective

Validate the correctness, usability, and reliability of the EMI Calculator widget for Home Loan, Car Loan, and Personal Loan at `https://emicalculator.net/`, and establish an automated regression suite that runs on every change and on a daily schedule.

## 2. Scope

### In scope
- Home Loan / Personal Loan / Car Loan calculator tabs on the landing page
- Loan Amount, Interest Rate, Loan Tenure inputs (text field + slider, two-way bound)
- EMI, Total Interest Payable, Total Payment result values
- Break-up pie chart and year-wise bar/line chart (Highcharts)
- Year-wise amortization schedule table (with month-level drill-down rows)
- "Download Excel Spreadsheet" export
- Client-side input validation (min/max/negative/non-numeric)

### Out of scope
- Other calculators linked from the nav (Credit Card EMI, Loan Calculator, etc.) — separate pages, not covered by this plan
- Marketing/article content, ads
- Payment/authentication flows (site has none)

## 3. System Under Test — architecture notes

The calculator is **fully client-side**: loan amount/rate/tenure are read from `#loanamount` / `#loaninterest` / `#loanterm`, and EMI/interest/chart/table values are computed and rendered in-browser via JavaScript (jQuery UI for the sliders, Highcharts for the charts). No XHR/fetch calls were observed carrying loan data to a backend during manual inspection — the "Download Excel Spreadsheet" action is also client-generated (no network request), producing a `.xlsx` file directly in the browser.

**Implication for the "API layer" requirement**: there is no first-party REST/JSON API to contract-test. The equivalent of API-layer testing here is **formula-based verification of the client-side calculation logic** (Scenario 2 in the automation set) — treating the in-page JS calculation engine as the "service" under test and independently re-deriving expected values from the published EMI formula:

```
EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
```
where `P` = principal, `r` = monthly interest rate, `n` = tenure in months.

If a hidden API is discovered later (e.g. via deeper network tracing across all three loan types), the same Playwright `request` fixture can be added for direct contract tests without changing the page-object layer.

## 4. Test Types & Approach

| Type | Approach |
|---|---|
| Functional | Manual test cases (docs/test-cases.md) + automated Playwright specs for core flows |
| UI / Layout | Manual checks (responsive breakpoints, chart legend, slider handle visuals); automated assertions on visible result text |
| Boundary / Negative | Manual + a parametrized automated suite (Scenario 2) covering min/max amount, rate, tenure |
| Cross-browser | Automated suite runs on Chromium, Firefox, WebKit via Playwright projects |
| Regression | Full automated suite on every push/PR, plus daily scheduled runs (Nepal 9AM, Seoul 9AM) |
| Data integrity | Automated cross-validation: displayed EMI vs. independently computed formula; chart series vs. table rows; downloaded file contents vs. on-screen values |

## 5. Test Environment

- Target: production site `https://emicalculator.net/` (no staging environment available)
- Browsers: Chromium, Firefox, WebKit (desktop viewports) via Playwright
- CI: GitHub Actions, `ubuntu-latest`, Node 20

## 6. Entry / Exit Criteria

**Entry**: site reachable, calculator widget renders with default values.
**Exit**: all automated specs green across all 3 browser projects; no flaky test after a `--repeat-each` sanity run; manual test cases in `test-cases.md` executed with no unresolved Critical/High severity defects.

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| jQuery UI sliders aren't native `<input type=range>` — naive `fill()`/keyboard approaches don't work | Page Object drags the `.ui-slider-handle` using live-read min/max from the jQuery UI widget instance, computing target pixel position from the track's bounding box |
| Third-party site changes markup without notice | Selectors centralized in one Page Object (`EmiCalculatorPage.ts`); a markup change breaks one file, not every spec |
| Rounding differences between our formula and the site's internal rounding | Small tolerances (a few rupees) applied on numeric comparisons instead of exact equality |
| Flaky timing (chart/table not yet rendered after input change) | All reads follow explicit `expect.poll` on a results value settling; no fixed `waitForTimeout` sleeps |
| Live production site — no test data isolation | Tests only read/compute; the one mutating action (file download) writes to a temp path and deletes it afterward |

## 8. Automation Summary

See `README.md` for how to run, and `tests/*.spec.ts` for the 4 required automated scenarios:
1. `slider-update.spec.ts` — slider-driven updates to amount/rate/tenure
2. `emi-calculation.spec.ts` — EMI/interest/total cross-validated against the formula, parametrized across 5 boundary/typical cases
3. `chart-table-consistency.spec.ts` — Highcharts series vs. amortization table, year-by-year
4. `excel-download.spec.ts` — download triggered, file parsed, EMI value cross-checked inside the spreadsheet

## 9. CI/CD

GitHub Actions workflow `.github/workflows/e2e.yml`:
- Runs on every push to `main`/`master` and every PR
- Scheduled runs: **09:00 Nepal Time** (`15 3 * * *` UTC) and **09:00 Seoul Time** (`0 0 * * *` UTC)
- Uploads HTML report + traces as artifacts on failure for fast triage
