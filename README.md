# EMI Calculator — Test Automation

Playwright (TypeScript) automation suite for https://emicalculator.net/, plus QA docs and CI/CD.

## Contents

- `docs/test-plan.md` — test strategy, scope, architecture notes, risks
- `docs/test-cases.md` — test cases grouped by type (functional, sliders, boundary, data consistency, export, UI, regression)
- `src/pages/EmiCalculatorPage.ts` — Page Object for the calculator widget
- `src/fixtures/base.ts` — custom `emiPage` fixture
- `src/utils/emiMath.ts` — independent EMI formula implementation used to cross-validate the site
- `tests/*.spec.ts` — the 4 required automated scenarios
- `.github/workflows/e2e.yml` — CI: runs on push/PR + two daily scheduled runs

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
4. **`excel-download.spec.ts`** — triggers the "Download Excel Spreadsheet" action, parses the resulting `.xlsx` file, and checks its contents (not just that a file exists) against the on-screen EMI value.

## Why sliders needed special handling

The amount/rate/tenure sliders are **jQuery UI** widgets (`.ui-slider` / `.ui-slider-handle`), not native `<input type="range">` elements — `page.fill()` or keyboard-arrow tricks don't apply. `EmiCalculatorPage.dragSliderTo()` reads the widget's live `min`/`max` via `jQuery(el).data('uiSlider').options`, then computes the target pixel offset from the track's bounding box and performs a real `mouse.down → move → up` drag. This keeps the tests correct even if the site's slider range configuration changes.

## API layer

The site is fully client-side — EMI/chart/table values are computed in-browser with no backend XHR carrying loan data (confirmed via network inspection), and the Excel export is generated client-side too. There is no REST/JSON API to contract-test. The equivalent "service layer" here is the in-page JS calculation engine, which Scenario 2 tests by independently re-deriving expected values from the standard EMI formula rather than trusting the site's own arithmetic. See `docs/test-plan.md` §3 for details.

## Flakiness

- No fixed `waitForTimeout` sleeps anywhere — every read waits on an `expect`/`expect.poll` for a settled value.
- The amortization table reader batches all rows/cells into a single `page.evaluate` (fast and avoids per-cell locator round-trips that timed out intermittently on WebKit during development).
- Numeric comparisons use small rupee tolerances to absorb the site's own internal rounding rather than asserting exact equality where that would be brittle.
- Verified 30/30 passing across chromium/firefox/webkit with zero retries needed before this was committed.

## CI/CD

`.github/workflows/e2e.yml` runs the full suite on:
- every push to `main`/`master`
- every pull request
- **09:00 Nepal Time** daily (`15 3 * * *` UTC)
- **09:00 Seoul Time** daily (`0 0 * * *` UTC)
- manual `workflow_dispatch`

HTML report and traces are uploaded as build artifacts (14-day retention) for triage.
