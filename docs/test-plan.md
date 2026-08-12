# Test Plan — EMI Calculator (emicalculator.net)

## What I'm testing and why

emicalculator.net has a loan EMI calculator with three tabs — Home Loan, Personal Loan, Car Loan. You punch in a loan amount, interest rate, and tenure (either by typing or dragging a slider), and it shows you the monthly EMI, total interest, and total payment, plus a chart and a year-by-year payment schedule you can also download as Excel.

The goal here is to make sure all of that actually works correctly, and to set up an automated suite that keeps checking it going forward instead of me having to click through it by hand every time.

## What's in scope

- The Home / Personal / Car Loan tabs on the homepage
- Loan Amount, Interest Rate, Loan Tenure — both the text boxes and the sliders (they're supposed to stay in sync)
- The EMI / Total Interest / Total Payment numbers
- The pie chart and the year-wise bar chart
- The amortization table (the one you can expand to see month-by-month)
- The "Download Excel Spreadsheet" button
- What happens with weird input (negative numbers, letters, empty fields, etc.)

## What's out of scope

- Other calculators on the site (Credit Card EMI, generic Loan Calculator) — different pages, not part of this
- Blog/article content, ads
- There's no login or payment on this site, so nothing to test there

## A note on the "API layer"

I poked around in the network tab expecting to find some backend API doing the EMI math, but there isn't one — everything happens in the browser with JavaScript. The amount/rate/tenure never leave the page, and even the Excel file gets built client-side. So there's no API to write contract tests against.

What I did instead: I wrote my own EMI formula in code (`EMI = P × r × (1+r)^n / ((1+r)^n − 1)`) and use it to double-check the numbers the site shows. If the site's own JavaScript has a bug in the math, this catches it — which is really the same goal an API test would have, just aimed at the in-browser calculation engine instead of a server.

If it turns out there IS a hidden API somewhere I missed, Playwright has a `request` fixture I can drop in later without touching anything else.

## How I'm approaching each type of testing

- **Functional** — mix of manual clicking around plus Playwright specs for the core flows
- **UI** — mostly manual (does it look right, is the chart legend readable, etc.), automation only checks that the text values are correct
- **Boundary/negative** — automated for the "does the math still work at min/max values" cases, manual for "what happens if I type garbage into the field"
- **Cross-browser** — the automated suite runs on Chromium, Firefox, and WebKit
- **Regression** — full suite runs on every push/PR, plus twice a day on a schedule
- **Data integrity** — this is the interesting one: I cross-check the EMI number against my own formula, cross-check the chart against the table, and cross-check the downloaded file against what's on screen. Three different "does this actually match" checks instead of just eyeballing one number.

## Environment

Testing straight against the live production site (`https://emicalculator.net/`) — there's no staging environment to point at. Browsers are Chromium/Firefox/WebKit via Playwright, CI runs on GitHub Actions (Ubuntu, Node 20).

## When am I done

Start: site loads, calculator shows default values.
Done: all automated specs pass on all 3 browsers, running the suite a few times in a row doesn't produce any flaky failures, and the manual test cases have been run through with no unresolved Critical/High bugs.

## Risks I thought about

- **The sliders aren't normal HTML sliders.** They're jQuery UI widgets, so you can't just fill them like a text input. I had to read the widget's actual min/max and drag the handle to the right pixel position.
- **It's someone else's site, so it can change without warning.** I kept all the selectors in one file (the Page Object) so if something breaks, I fix it in one place instead of hunting through every test.
- **Rounding.** My formula and the site's own math won't always land on the exact same rupee due to internal rounding, so comparisons allow a small tolerance instead of demanding an exact match.
- **Timing flakiness.** Nothing waits on a fixed sleep — every check polls for the value to actually update first.
- **It's production, I can't reset test data.** I only read values and do one download (into a temp file I delete right after), so there's nothing to clean up or worry about polluting.

## The 4 automated scenarios

Full details in the README, but briefly:
1. `slider-update.spec.ts` — drag the sliders, check the linked inputs and EMI update
2. `emi-calculation.spec.ts` — 5 different loan setups, check the EMI/interest/total against my own formula
3. `chart-table-consistency.spec.ts` — check the chart and the table agree, year by year
4. `excel-download.spec.ts` — download the file, actually open it and check the numbers inside match what's on screen

## CI/CD

GitHub Actions workflow (`.github/workflows/e2e.yml`) runs the suite on every push/PR, plus twice a day: 9am Nepal time and 9am Seoul time.
