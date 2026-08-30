# Personal Budget Step Two Preview Findings

The `/personal-budget` route loaded successfully with the nine-tab navigation and the updated dashboard cards for Expected Income, Actual Received Income, Actual Expenses, Remaining, Planned Expenses, and Budget Used. The month selector changed from September 2026 to August 2026 and the dashboard remained scoped to the selected month.

The Income tab opened successfully and displayed separate actions for Record Actual Income and Add Income Source, an empty income-source state, and Income History (0). The UI kept the source and transaction concepts distinct as required by Step Two.

The Add Income Source modal exposes the requested mobile-friendly fields: name, category, frequency, amount, amount type, expected/start/end dates, person, and household-budget inclusion toggle. Submitting without entering an amount correctly showed the validation message requiring a valid non-negative amount, so empty/invalid income is blocked.

After entering a valid name and amount, the income source saved successfully, displayed a green confirmation toast, and returned to the Income list with Salary, ₹90,000, Monthly, Active, and Include in Household Budget visible. This confirms the basic source persistence flow in the preview.

The Record Actual Income modal opened separately from the income source card and exposed title, actual amount, transaction date, optional source, and Received/Partial/Expected status. The form accepted a business payment title and ₹25,000 amount for the acceptance-flow check.

The business transaction saved successfully and appeared as Income History (1) with ₹25,000 and Received status. The Expenses tab then opened with This Month, Last Month, and Custom Date Range filters, a Manage Categories action, an Add Expense action, an empty-state card, and optional budget inputs for all system categories.

The Add Expense modal exposes amount, category, subcategory, transaction date, payment method, person, note, and Mark as paid controls. Submitting without a valid amount correctly displayed “Enter an amount greater than zero, category, and valid date,” confirming validation for empty/zero expense entries.

After entering ₹8,000 and a note, the expense saved successfully with a confirmation toast. The Expenses list showed the Housing/Rent item dated 2026-08-18, UPI payment method, Paid status, Edit/Delete controls, and Actual Expenses: ₹8,000. This also updated the Housing category actual total to ₹8,000.

Setting the Housing category budget to ₹10,000 and blurring the field persisted the optional limit. The UI displayed Near Limit, ₹8,000 / ₹10,000, 80% used, and ₹2,000 remaining, confirming visible status text, percentage, and remaining amount rather than relying only on colour.
