# EMI Calculator — Test Automation

Playwright (TypeScript) automation suite for https://emicalculator.net/, plus QA docs and CI/CD.

## Contents

- `docs/test-plan.md` — test strategy, scope, architecture notes, risks
- `docs/test-cases.md` — test cases grouped by type (functional, sliders, boundary, data consistency, export, UI, regression)
- `docs/bugs.md` — bug reports found during testing
- `docs/test-summary-report.md` — results summary + recommendations
- `src/pages/EmiCalculatorPage.ts` — Page Object for the calculator widget
- `src/fixtures/base.ts` — custom `emiPage` fixture (auto-navigates before each test)
- `src/fixtures/testData.ts` — shared test-data constants (e.g. `TYPICAL_LOAN`)
- `src/utils/emiMath.ts` — independent EMI formula implementation used to cross-validate the site
- `src/utils/excelFile.ts` — download/parse/cleanup helpers for the exported spreadsheet
- `tests/*.spec.ts` — the 4 required automated scenarios
- `.github/workflows/e2e.yml` — CI: runs on push/PR + two daily scheduled runs

## Architecture

**Page Object Model + fixture**, one layer of indirection between tests and the DOM:

```
tests/*.spec.ts            <- assertions only, no selectors
   |
src/fixtures/base.ts       <- `emiPage` fixture: new page, navigated, ready
   |
src/pages/EmiCalculatorPage.ts  <- all selectors + interactions live here
   |
src/utils/{emiMath,excelFile}.ts  <- pure helpers, no page/browser dependency
```

If the site's markup changes, one file (`EmiCalculatorPage.ts`) needs updating, not four spec files. Shared setup (`setLoan()` — set amount/rate/tenure and wait for EMI to settle) and shared test data (`TYPICAL_LOAN`) live centrally so scenarios 2–4 don't each hardcode their own copy.

The sliders are jQuery UI widgets, not native `<input type="range">` — see "Why sliders needed special handling" below for how the Page Object handles that.

## Setup

```bash
npm install
npx playwright install --with-deps
```

## Running tests

```bash
npm test                 # headless, all 3 browsers (chromium/firefox/webkit)
npm run test:headed      # headed, see the browser
npm run test:ui          # Playwright UI mode
npx playwright test tests/slider-update.spec.ts   # single spec
npx playwright test --project=chromium             # single browser
npm run report            # open the last HTML report
npm run typecheck         # tsc --noEmit
```

## Scenarios

1. **`slider-update.spec.ts`** — drags the Loan Amount, Interest Rate, and Loan Tenure jQuery UI sliders and asserts the linked text inputs and EMI update.
2. **`emi-calculation.spec.ts`** — sets known Principal/Rate/Tenure combinations (including boundary values) and cross-validates the displayed EMI/Total Interest/Total Payment against an independently implemented EMI formula (`src/utils/emiMath.ts`).
3. **`chart-table-consistency.spec.ts`** — reads the live Highcharts series data for the year-wise bar chart and compares it row-by-row against the amortization table.
4. **`excel-download.spec.ts`** — triggers the "Download Excel Spreadsheet" action, parses the resulting `.xlsx` file, checks the EMI value is present, and aggregates all 180 monthly rows by year to verify every year's Principal/Interest/Balance matches the on-screen table (not just that a file exists).

## Why sliders needed special handling

The amount/rate/tenure sliders are **jQuery UI** widgets (`.ui-slider` / `.ui-slider-handle`), not native `<input type="range">` elements — `page.fill()` or keyboard-arrow tricks don't apply. `EmiCalculatorPage.dragSliderTo()` reads the widget's live `min`/`max` via `jQuery(el).data('uiSlider').options`, then computes the target pixel offset from the track's bounding box and performs a real `mouse.down → move → up` drag. This keeps the tests correct even if the site's slider range configuration changes.

## API layer

The site is fully client-side — EMI/chart/table values are computed in-browser with no backend XHR carrying loan data (confirmed via network inspection), and the Excel export is generated client-side too. There is no REST/JSON API to contract-test. The equivalent "service layer" here is the in-page JS calculation engine, which Scenario 2 tests by independently re-deriving expected values from the standard EMI formula rather than trusting the site's own arithmetic. See `docs/test-plan.md` §3 for details.

## Regression strategy

- **Every push/PR**: full suite (10 scenarios × 3 browsers = 30 runs) via `.github/workflows/e2e.yml`, blocking merge on failure.
- **Daily scheduled runs**: 09:00 Nepal Time and 09:00 Seoul Time (see CI/CD below) — catches the upstream production site regressing even with no code changes on our side, since this repo tests a live third-party site rather than one we deploy ourselves.
- **Failure triage**: HTML report + trace + video uploaded as CI artifacts on every run (retained 14 days), so a red build doesn't require a local re-run to diagnose.

## Flakiness

- No fixed `waitForTimeout` sleeps anywhere — every read waits on an `expect`/`expect.poll` for a settled value.
- The amortization table reader batches all rows/cells into a single `page.evaluate` (fast and avoids per-cell locator round-trips that timed out intermittently on WebKit during development).
- Numeric comparisons use small rupee tolerances to absorb the site's own internal rounding rather than asserting exact equality where that would be brittle.
- Verified 30/30 passing across chromium/firefox/webkit with zero retries needed across repeated full-suite runs.

## CI/CD

`.github/workflows/e2e.yml` runs the full suite on:
- every push to `main`/`master`
- every pull request
- **09:00 Nepal Time** daily (`15 3 * * *` UTC)
- **09:00 Seoul Time** daily (`0 0 * * *` UTC)
- manual `workflow_dispatch`

HTML report and traces are uploaded as build artifacts (14-day retention) for triage.
