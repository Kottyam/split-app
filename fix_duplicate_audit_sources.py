from pathlib import Path

path = Path('client/src/contexts/languageAudit.ts')
text = path.read_text()
block = (
    "auditSharedHomeSummaryReport: 'Summary Report', auditHomeName: 'Home Name', "
    "auditReportingPeriod: 'Reporting Period', auditTotalRent: 'Total Rent', "
    "auditTotalHouseholdOutlay: 'Total Household Outlay', auditCategoryWiseExpenses: 'Category-wise Expenses', "
    "auditMemberWiseSummary: 'Member-wise Summary', auditShareLabel: 'Share:', auditBalanceLabel: 'Balance:', "
    "auditAddedFromContacts: 'Added {{count}} members from contacts', auditSharedHomeExpensesReason: 'Shared Home expenses', "
    "auditSharedHomeShareTitle: 'Shared Home summary', "
)
if text.count(block) != 2:
    raise SystemExit(f'expected exactly two duplicate blocks, found {text.count(block)}')
first, second = text.split(block, 1)
if block not in second:
    raise SystemExit('second duplicate block not found')
second = second.replace(block, '', 1)
path.write_text(first + block + second)
print('removed one duplicate audit source block')
