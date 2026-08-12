# application under test: https://emicalculator.net/

## Description of the platform:
Platform is an EMI Calculator for Home Loan, Car Loan & Personal Loan.

## What is EMI?
Equated Monthly Installment - EMI for short - is the amount payable every month to the bank or any other financial institution until the loan amount is fully paid off. It consists of the interest on loan as well as part of the principal amount to be repaid. The sum of principal amount and interest is divided by the tenure, i.e., number of months, in which the loan has to be repaid. This amount has to be paid monthly. The interest component of the EMI would be larger during the initial months and gradually reduce with each payment. The exact percentage allocated towards payment of the principal depends on the interest rate. Even though your monthly EMI payment won't change, the proportion of principal and interest components will change with time. With each successive payment, you'll pay more towards the principal and less in interest.

## To do List
- Prepare a Test Plan for EMI Calculator
- Prepare test cases for EMI Calculator and group them by types of testing
- Automate the following scenarios using Playwright (Make use of Playwright MCP to discover selectors)
    Scenarios:
        - Update Home Loan Amount, Interest Rate and Loan Tenure using slider
        - Capture EMI and validate using formula-based recalculation in test code.
        - Validate Chart and Table value match year-wise
        - Download Excel File and add checks
- Implement CI/CD using Github Actions (add scheduled test: one to run in Nepal time 9 am, and another in Seoul, Korea 9 AM)


# Steps
- Ask as many questions if you are unclear
- We should build the Automation script with the highest level of Engineering
- Apply best practices in Playwright
    - Use Page objects, fixtures where needed.
- Explore what can be done in the API layer.
- Flakiness should be zero.