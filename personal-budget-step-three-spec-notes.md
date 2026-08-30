# Personal Budget Step Three specification notes

Source: /home/ubuntu/upload/pasted_content.txt

The recurring architecture must be Rule -> Occurrence -> Actual Transaction. Rules support Daily, Weekly (specific weekday and every N weeks), Monthly (specific day and last-day-safe), Quarterly, Yearly, and Custom intervals (N days/weeks/months/years). Rules include fixed or variable amount, required start date, optional end date, person, payment method, notes, and active ON/OFF state.

Occurrences have Pending, Paid, Skipped, and Cancelled states. Paid occurrences must be linked to exactly one actual transaction and count once in Actual Expenses. Skipped occurrences remain as records, do not count as actual expenses, and support single occurrence, today, month, or date-range skipping. Paused rules suppress occurrences during a pause window while preserving history; resume continues from the original rule without duplicates.

Editing one occurrence must preserve its override for that date and not change future occurrences. Editing a rule changes future occurrences but preserves past paid/skipped historical values. Archive is preferred for history; deleting future recurrence must not remove historical paid transactions.

Recurring screen requirements include Active, Paused, Archived lists; each rule shows name, amount, frequency, next occurrence, and status. Dashboard metrics include monthly recurring commitment, recurring paid, pending, skipped, with yearly expenses shown as monthly provision/equivalent and distinguished from actual monthly payment. Daily commitment uses the actual number of applicable days and skipped days reduce current expected amount.

The recurring monthly view contains Today, Upcoming (next 7 days), This Month's Recurring Expenses, and Skipped sections. Each occurrence has Paid, Skip, Edit actions; bulk mark today's recurring expenses as paid requires confirmation. Calendar integrates income, recurring expenses, one-time expenses, and statuses; occurrence details show expense, date, expected, actual, status, recurring rule, and actions.

Budget rules: Pending counts toward planned/committed expenses; Paid counts toward actual expenses; Skipped and Cancelled do not count; Paused periods have no payable occurrences. Do not double count an occurrence and its actual transaction. Future occurrence materialization must be bounded and fast for 100+ rules and thousands of historical transactions. Handle start/end dates, month lengths, February, leap years, end-of-month dates, year transitions, pause windows, skip ranges, historical amounts, and variable actual payments.

Acceptance set: add recurring; all frequencies; fixed/variable; dates; next occurrence; paid/skip/skip range; pause/resume; edit occurrence/rule; archive/delete future; calendar; commitment; planned vs actual; no double counting; historical preservation; month-end/leap-year; dashboard integration; realistic household test data; all tests/build pass before delivery.
