# Test Summary Report — EMI Calculator (emicalculator.net)

## What I did

Went through the EMI Calculator on emicalculator.net (Home/Personal/Car Loan tabs) — wrote a test plan, ran a bunch of test cases by hand, automated the important flows with Playwright, and hooked it up to CI so it keeps running on its own. Full details in `docs/test-plan.md` and `docs/test-cases.md`.

## What I covered

- The core EMI/Interest/Total math, checked against my own formula
- Updating values via slider vs typing directly
- Edge cases — smallest/biggest amount, rate, tenure the site allows
- Making sure the chart and the table actually agree with each other
- The Excel download — not just "did a file appear" but "does it have the right numbers"
- Chrome, Firefox, and Safari
- A manual pass on things like weird input, switching tabs, resizing the browser

## How it went

- 35 test cases written up total
- 10 of those got automated, run across all 3 browsers = 30 test runs
- All 30 passed, every time I ran it — no flaky tests
- 8 more test cases were checked by hand
- Found 1 bug (low severity) — see below

## What the automated tests actually check

- **`slider-update.spec.ts`** — drag each slider, make sure the linked input and the EMI update
- **`emi-calculation.spec.ts`** — 5 different loan setups (typical + edge cases), check EMI/Interest/Total against my own formula, plus a sanity check that Principal + Interest = Total Payment
- **`chart-table-consistency.spec.ts`** — pull the numbers straight out of the chart and compare them to the table, year by year
- **`excel-download.spec.ts`** — download the file, open it, check the EMI is right, and check every single year's Principal/Interest/Balance matches the table (not just the first year)

## The bug I found

Switching between the Home/Personal/Car Loan tabs and back wipes out whatever you'd typed into the Home Loan fields — it resets to the default 50L/9%/20yr instead of remembering what you entered. Low severity, nothing's calculated wrong, but it's the kind of thing that could quietly bite someone who's comparing loan types. Steps to reproduce are in `docs/bugs.md`.

Nothing worse than that turned up — the actual math, the chart/table data, and the file export all check out.

## What I didn't automate (on purpose)

A handful of things are still manual because they're either one-off visual checks or not worth the upkeep of automating:
- Currency formatting consistency (just a visual scan)
- Mobile/responsive layout
- Expanding a table row to see the monthly breakdown
- Pie chart percentages
- Typing garbage into the amount field (`abc`, `-5000`) — didn't crash anything, but I haven't locked in exactly what the "correct" behavior should be, so didn't want to automate against a guess

## Recommendations

1. Fix the tab-switching bug — small fix, real annoyance for users
2. Once it's fixed, add a quick regression test for it so it doesn't come back unnoticed
3. Worth automating the garbage-input cases once someone confirms what the site's supposed to do with them
4. Right now automation only covers the Home Loan tab — a quick smoke test on Personal/Car Loan tabs would be cheap insurance
5. Running the full suite twice a day across 3 browsers works fine for now; if GitHub Actions minutes ever become a concern, the daily runs could drop to just Chromium
6. Nothing here should block a release — the one bug is cosmetic, not a math problem
