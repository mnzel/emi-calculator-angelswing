# Test Cases — EMI Calculator (emicalculator.net)

Legend: **[A]** = automated in this repo, **[M]** = manual/exploratory.

## 1. Functional — Core Calculation

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| FN-01 | Default state loads with sane values | Open site | Loan Amount, Interest Rate, Tenure pre-filled with non-zero defaults; EMI/Interest/Total displayed | [M] |
| FN-02 | Changing Loan Amount recalculates EMI | Enter new amount in input, blur | EMI, Total Interest, Total Payment update; slider handle moves to match | [A] (emi-calculation.spec.ts) |
| FN-03 | Changing Interest Rate recalculates EMI | Enter new rate, blur | EMI/Interest/Total update accordingly | [A] |
| FN-04 | Changing Tenure (years) recalculates EMI | Enter new tenure, unit = Yr | EMI/Interest/Total update | [A] |
| FN-05 | Switching tenure unit Yr ↔ Mo converts value | Toggle radio, observe input | Tenure numeric value converts consistently (e.g. 5 Yr → 60 Mo) | [M] |
| FN-06 | EMI matches standard amortization formula | Set known P/r/n | `EMI = P·r·(1+r)^n / ((1+r)^n−1)` within rounding tolerance | [A] |
| FN-07 | Total Payment = Principal + Total Interest | Any valid input set | Displayed Total Payment equals Principal + Total Interest exactly | [A] |
| FN-08 | Switching Home/Personal/Car Loan tabs preserves independent state | Set values on Home tab, switch to Car tab, switch back | Each tab retains its own last-entered values (or documented reset behavior) | [M] |

## 2. Functional — Sliders

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| SL-01 | Drag Loan Amount slider updates input | Drag handle to a target position | Text input reflects dragged value (within one slider step) | [A] (slider-update.spec.ts) |
| SL-02 | Drag Interest Rate slider updates input | Drag handle | Text input reflects dragged value | [A] |
| SL-03 | Drag Loan Tenure slider updates input | Drag handle | Text input reflects dragged value | [A] |
| SL-04 | Slider drag to minimum bound | Drag to leftmost | Input shows slider's configured minimum, no error | [M] |
| SL-05 | Slider drag to maximum bound | Drag to rightmost | Input shows slider's configured maximum, no error | [M] |
| SL-06 | Typing in input moves slider handle | Type a value directly in the text field | Slider handle position updates to match (two-way binding) | [M] |

## 3. Boundary / Negative — Inputs

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| BD-01 | Minimum interest rate boundary | Set rate to slider minimum (5%) | Calculates without error | [A] (parametrized case) |
| BD-02 | Maximum interest rate boundary | Set rate to slider maximum (20%) | Calculates without error | [A] |
| BD-03 | Very small loan amount | Set amount to a small positive value (e.g. ₹1,00,000) | EMI calculates correctly, no divide-by-zero | [A] |
| BD-04 | Very large loan amount | Set amount to slider maximum (₹2,00,00,000) | EMI calculates correctly, numbers render without overflow/truncation | [A] |
| BD-05 | Short tenure (1 year) | Set tenure to 1 year | EMI ≈ amortized monthly principal + interest, matches formula | [A] |
| BD-06 | Long tenure (30 years) | Set tenure to slider maximum | EMI calculates correctly | [A] |
| BD-07 | Negative or non-numeric input typed directly | Type `-5000` or `abc` into Loan Amount field | Input rejects/clamps invalid value; no JS error; EMI stays valid | [M] |
| BD-08 | Empty input field | Clear Loan Amount field entirely, blur | Field reverts to last valid value or a sane default; no crash | [M] |
| BD-09 | Decimal interest rate | Enter `9.25` as interest rate | Accepted, EMI recalculates using the decimal rate | [M] |

## 4. Data Consistency — Chart & Table

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| DC-01 | Pie chart percentages sum to 100% | Read pie chart Principal/Interest slices | Slices sum to 100% (± rounding) and match Total Payment breakdown | [M] |
| DC-02 | Bar chart year-wise Principal matches table | Set a loan, read chart series vs. table rows | Each year's chart Principal value equals the table's Principal (A) column | [A] (chart-table-consistency.spec.ts) |
| DC-03 | Bar chart year-wise Interest matches table | Same as above for Interest | Chart Interest series equals table Interest (B) column per year | [A] |
| DC-04 | Table "Balance" trends to zero by final year | Inspect last row of amortization table | Balance ≈ ₹0 in the final year of the tenure | [M] |
| DC-05 | Table row expand shows monthly breakdown | Click "+" on a year row | Row expands into 12 monthly rows summing to the annual row | [M] |
| DC-06 | Sum of all yearly Principal rows ≈ Loan Amount | Sum table's Principal column across all years | Total ≈ original loan amount (± ₹ rounding) | [M] |

## 5. Excel Export

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| EX-01 | Download button produces a file | Click "Download Excel Spreadsheet" | Browser download event fires, file has `.xlsx`/`.xls` extension, size > 0 | [A] (excel-download.spec.ts) |
| EX-02 | Downloaded file content matches on-screen EMI | Parse downloaded file | Sheet contains the same EMI value shown on the page | [A] |
| EX-03 | Downloaded file contains full amortization schedule | Parse downloaded file | Row count / years present match the on-screen table | [M] (spot-checked automatically for first year; full parity manual) |
| EX-04 | File opens cleanly in Excel/Google Sheets | Manually open downloaded file | No corruption warnings, formatting intact | [M] |

## 6. UI / Cross-Browser / Responsiveness

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| UI-01 | Calculator renders correctly on Chromium | Load site | Layout matches design, no overlapping elements | [A] (all specs run on chromium project) |
| UI-02 | Calculator renders correctly on Firefox | Load site | Same | [A] (firefox project) |
| UI-03 | Calculator renders correctly on WebKit/Safari | Load site | Same | [A] (webkit project) |
| UI-04 | Mobile viewport layout | Resize to mobile width | Table switches to condensed columns (`d-sm-none` classes observed), sliders remain usable | [M] |
| UI-05 | Currency formatting | Inspect all rupee values | Consistent `₹ X,XX,XXX` Indian-digit-grouping format throughout | [M] |

## 7. Regression

| ID | Title | Steps | Expected | Status |
|---|---|---|---|---|
| RG-01 | Full automated suite passes on every push/PR | CI trigger | All specs green across chromium/firefox/webkit | [A] (CI) |
| RG-02 | Scheduled daily run catches upstream site regressions | Cron trigger (Nepal 9AM / Seoul 9AM) | Suite runs unattended, reports failures via CI artifacts | [A] (CI) |
