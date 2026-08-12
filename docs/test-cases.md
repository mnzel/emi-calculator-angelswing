# Test Cases — EMI Calculator (emicalculator.net)

[A] = Autoamted, [M] = Manual Check

## 1. Calculation basics

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| FN-01 | Page loads with sensible defaults | Just open the site | Amount/Rate/Tenure are pre-filled, EMI numbers show up right away | [M] |
| FN-02 | Changing the loan amount recalculates everything | Type a new amount | EMI/Interest/Total update, slider moves to match | [A] (emi-calculation.spec.ts) |
| FN-03 | Changing the interest rate recalculates everything | Type a new rate | Same as above | [A] |
| FN-04 | Changing the tenure recalculates everything | Type a new tenure (years) | Same as above | [A] |
| FN-05 | Switching between Years/Months keeps the tenure consistent | Toggle the Yr/Mo radio | 5 years should become 60 months, not some random number | [M] |
| FN-06 | EMI actually matches the real formula | Set a known amount/rate/tenure | `EMI = P·r·(1+r)^n / ((1+r)^n−1)`, give or take rounding | [A] |
| FN-07 | The three result numbers agree with each other | Any valid inputs | Total Payment should exactly equal Principal + Total Interest | [A] |
| FN-08 | Tabs (Home/Personal/Car) keep their own values | Set something on Home tab, flip to Car tab, flip back | Home tab should still show what we typed | [M] — **it doesn't, see BUG-001** |

## 2. Sliders

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| SL-01 | Dragging the amount slider updates the input | Drag the handle | Text box shows roughly the value we dragged to | [A] (slider-update.spec.ts) |
| SL-02 | Same, for the interest rate slider | Drag the handle | Same | [A] |
| SL-03 | Same, for the tenure slider | Drag the handle | Same | [A] |
| SL-04 | Slider at its lowest setting works fine | Drag all the way left | Shows the min value, no error | [M] |
| SL-05 | Slider at its highest setting works fine | Drag all the way right | Shows the max value, no error | [M] |
| SL-06 | Typing in the box also moves the slider | Type directly into the field | Slider handle jumps to match | [M] |

## 3. Edge cases / weird input

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| BD-01 | Lowest allowed interest rate | Set rate to 5% (the slider min) | Calculates fine, no errors | [A] |
| BD-02 | Highest allowed interest rate | Set rate to 20% (the slider max) | Calculates fine | [A] |
| BD-03 | Really small loan amount | e.g. ₹1,00,000 | Still calculates correctly, no divide-by-zero weirdness | [A] |
| BD-04 | Really big loan amount | ₹2,00,00,000 (slider max) | Numbers display correctly, nothing overflows or gets cut off | [A] |
| BD-05 | Very short tenure | 1 year | Formula still holds | [A] |
| BD-06 | Very long tenure | 30 years (slider max) | Formula still holds | [A] |
| BD-07 | Typing garbage into the amount field | Type `-5000` or `abc` | Should get rejected/ignored, not break the calculator | [M] |
| BD-08 | Decimal interest rate | Type `9.25` | Accepted, EMI uses the decimal properly | [M] |

## 4. Chart & table matching up

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| DC-01 | Pie chart adds up to 100% | Look at the Principal/Interest slices | Should sum to 100% (rounding aside) and match the actual breakdown | [M] |
| DC-02 | Bar chart's yearly Principal matches the table | Set a loan, compare chart vs table | Each year's numbers should be the same in both places | [A] (chart-table-consistency.spec.ts) |
| DC-03 | Same, for Interest | Compare chart vs table | Same | [A] |
| DC-04 | Balance hits ~zero by the end | Look at the last row of the table | Should be close to ₹0 in the final year | [M] |
| DC-05 | Expanding a year shows the monthly breakdown | Click the "+" next to a year | 12 months show up and they should add up to that year's total | [M] |
| DC-06 | All the yearly principal amounts add up to the loan amount | Sum the Principal column | Should roughly equal what we borrowed | [M] |

## 5. Excel download

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| EX-01 | Download button actually gives you a file | Click "Download Excel Spreadsheet" | File downloads, has an .xlsx extension, isn't empty | [A] (excel-download.spec.ts) |
| EX-02 | The file's EMI matches what's on screen | Open/parse the file | Same EMI number appears in the spreadsheet | [A] |
| EX-03 | The file has the full year-by-year schedule, and it's correct | Open/parse the file | Every year's Principal/Interest/Balance in the file matches the table on screen | [A] |
| EX-04 | File isn't corrupted | Open it in Excel/Sheets by hand | Opens cleanly, no warnings | [M] |

## 6. Cross-browser / layout

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| UI-01 | Works on Chrome | Load the site | Looks right, nothing overlapping | [A] (chromium) |
| UI-02 | Works on Firefox | Load the site | Same | [A] (firefox) |
| UI-03 | Works on Safari | Load the site | Same | [A] (webkit) |
| UI-04 | Works on mobile-sized screens | Shrink the browser | Table switches to a condensed layout, sliders still usable | [M] |
| UI-05 | Currency formatting is consistent everywhere | Scan all the rupee values on the page | Should all use the same ₹ X,XX,XXX style | [M] |

## 7. Regression / ongoing

| ID | What we're checking | How | What should happen | Status |
|---|---|---|---|---|
| RG-01 | Full suite passes on every code change | CI runs on push/PR | Everything green across all 3 browsers | [A] (CI) |
| RG-02 | We catch it if the live site breaks, even with no code changes | Scheduled run, 9am Nepal / 9am Seoul | Suite runs on its own, flags failures | [A] (CI) |
