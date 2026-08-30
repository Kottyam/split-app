import React, { createContext, useContext, useMemo, useState } from 'react';
import { languageExtras } from './languageExtras';
import { auditEnglishSources, localizeFallback } from './languageAudit';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
export type TranslationKey =
  | 'language'
  | 'splitExpenses'
  | 'oneTrip'
  | 'oneTap'
  | 'loadingTrips'
  | 'noTrips'
  | 'createTrip'
  | 'yourTrips'
  | 'newestFirst'
  | 'oldestFirst'
  | 'nameAZ'
  | 'nameZA'
  | 'membersCount'
  | 'tripNotFound'
  | 'backToTrips'
  | 'total'
  | 'expenses'
  | 'members'
  | 'payAddExpenseAutomatically'
  | 'shareThisTrip'
  | 'dashboard'
  | 'settle'
  | 'howToSplitAddExpense'
  | 'addMember'
  | 'noMembers'
  | 'paid'
  | 'owes'
  | 'edit'
  | 'delete'
  | 'createNewTrip'
  | 'startPlanning'
  | 'tripName'
  | 'description'
  | 'startDate'
  | 'endDate'
  | 'cancel'
  | 'copyLink'
  | 'viewOnly'
  | 'settlementSummary'
  | 'allSettled'
  | 'noPaymentsNeeded'
  | 'makePayments'
  | 'pays'
  | 'receives'
  | 'pay'
  | 'mark'
  | 'undo'
  | 'summary'
  | 'outstanding'
  | 'pendingTransactions'
  | 'shareTrip'
  | 'shareByName'
  | 'tripToShare'
  | 'recipientsViewOnly'
  | 'close'
  | 'sharing'
  | 'copied'
  | 'tripShared'
  | 'editAndSyncTitle'
  | 'editAndSyncDescription'
  | 'editAndSyncShareMessage'
  | 'editSyncSelectedItem'
  | 'editSyncOwnerProtection'
  | 'editSyncLinkShared'
  | 'editSyncLinkCopied'
  | 'editSyncUnavailable'
  | 'editSyncOpenTitle'
  | 'editSyncRecipientDescription'
  | 'editSyncEditCopy'
  | 'editSyncSendBack'
  | 'editSyncPending'
  | 'editSyncReviewTitle'
  | 'editSyncReviewDescription'
  | 'editSyncReviewChanges'
  | 'editSyncSynchronize'
  | 'editSyncConflict'
  | 'editSyncCompleted'
  | 'editSyncCopyCreated'
  | 'editSyncOwnerVerificationFailed'
  | 'editSyncRecipientUnknown'
  | 'editSyncAdded'
  | 'editSyncChanged'
  | 'editSyncRemoved'
  | 'editSyncConflictFields'
  | 'linkCopied'
  | 'failedCopy'
  | 'addExpense'
  | 'recordExpense'
  | 'pleaseAddMembers'
  | 'fillRequired'
  | 'customSplitError'
  | 'amount'
  | 'category'
  | 'paidBy'
  | 'date'
  | 'splitType'
  | 'equalSplit'
  | 'customSplit'
  | 'splitAmong'
  | 'addMemberDetails'
  | 'addFromContacts'
  | 'addManually'
  | 'picking'
  | 'memberNameRequired'
  | 'mobileOptional'
  | 'forUpiSharing'
  | 'upiOptional'
  | 'payTo'
  | 'openUpiApp'
  | 'sharePaymentLink'
  | 'contactImported'
  | 'failedContact'
  | 'paymentCompleteQuestion'
  | 'confirmPayment'
  | 'paymentDetails'
  | 'from'
  | 'to'
  | 'amountLabel'
  | 'onlyConfirm'
  | 'yesPaid'
  | 'noCancel'
  | 'budget'
  | 'budgetDetails'
  | 'budgetAmount'
  | 'budgetPeriod'
  | 'budgetEntireTrip'
  | 'budgetWarningThreshold'
  | 'budgetWarningThresholdHelp'
  | 'budgetUseSameEveryMonth'
  | 'budgetUseSameEveryMonthHelp'
  | 'budgetSave'
  | 'budgetAmountRequired'
  | 'budgetThresholdInvalid'
  | 'budgetTotal'
  | 'budgetSpent'
  | 'budgetTrackedSpending'
  | 'budgetActualSpending'
  | 'budgetExcludedExplanation'
  | 'budgetRemaining'
  | 'budgetOver'
  | 'budgetUsed'
  | 'budgetUnderBudget'
  | 'budgetNearLimit'
  | 'budgetExceeded'
  | 'budgetNoBudget'
  | 'budgetSetDescription'
  | 'budgetSet'
  | 'budgetEdit'
  | 'budgetHistory'
  | 'budgetBreakdown'
  | 'budgetNoSpend'
  | 'budgetSavedActivity'
  | 'welcomeTitle'
  | 'welcomeSubtitle'
  | 'kharchaNotes'
  | 'okGotIt'
  | 'kharchaTagline'
  | 'whatManage'
  | 'tripsDescription'
  | 'sharedHomesDescription'
  | 'openTrips'
  | 'openSharedHomes'
  | 'myTrips'
  | 'mySharedHomes'
  | 'addTrip'
  | 'addSharedHome'
  | 'quickTrip'
  | 'quickTripDescription'
  | 'settings'
  | 'search'
  | 'notifications'
  | 'more'
  | 'chooseCategory'
  | 'home'
  | 'tripsNav'
  | 'sharedNav'
  | 'languagePersistenceNote'
  | 'searchKharchaTitle'
  | 'searchKharchaPlaceholder'
  | 'searchKharchaHint'
  | 'searchKharchaNoResults'
  | 'notificationsTitle'
  | 'markAllRead'
  | 'noNotifications'
  | 'unread'
  | 'moreTitle'
  | 'openFunds'
  | 'personalBudgetOverview'
  | 'openSettings'
  | 'backToKharcha'
  | 'sharedHomeCurrentBalance'
  | 'sharedHomeCurrentMonth'
  | 'sharedHomeRecent'
  | 'noTrips'
  | 'noSharedHomes'
  | 'tripExpenseTotal'
  | 'tripMembers'
  | 'sharedHomeMembersLabel'
  | 'sharedHomeExpenseTotal'
  | 'sharedHomeBalance'
  | 'sharedHomeOpen'
  | 'tripOpen'
  | 'searchTrips'
  | 'noSearchResults'
  | 'deleteTripConfirm'
  | 'searchSharedHomes'
  | 'deleteSharedHomeConfirm'
  | 'sharedHome'
  | 'sharedHomeOverview'
  | 'sharedHomeExpenses'
  | 'sharedHomeRent'
  | 'sharedHomeBills'
  | 'sharedHomeGroceries'
  | 'sharedHomeMembers'
  | 'sharedHomeRooms'
  | 'sharedHomeSettlements'
  | 'sharedHomeReports'
  | 'sharedHomePrimaryNavigation'
  | 'sharedHomeManage'
  | 'sharedHomeAddExpense'
  | 'sharedHomeAddRent'
  | 'sharedHomeAddBill'
  | 'sharedHomeAddGrocery'
  | 'sharedHomeAddMember'
  | 'sharedHomeAddRoom'
  | 'sharedHomeShare'
  | 'sharedHomeManagerMode'
  | 'sharedHomeOfflineFirst'
  | 'sharedHomeMonthlyView'
  | 'sharedHomeTotalExpense'
  | 'sharedHomeTotalShare'
  | 'sharedHomeTotalPaid'
  | 'sharedHomePendingSettlements'
  | 'sharedHomeRecurring'
  | 'sharedHomeRecurringRules'
  | 'sharedHomeAddRule'
  | 'sharedHomePause'
  | 'sharedHomeResume'
  | 'sharedHomeSkipNext'
  | 'sharedHomeUnskip'
  | 'sharedHomeCurrentMonth'
  | 'sharedHomeFullGroupHistory'
  | 'sharedHomeCustomDateRange'
  | 'sharedHomeViewOnlySnapshot'
  | 'sharedHomeOriginalNotEditable'
  | 'sharedHomePaymentHistory'
  | 'sharedHomeMarkSettled'
  | 'sharedHomeNoPaymentHistory'
  | 'sharedHomeNoCurrentMembers'
  | 'sharedHomeNoRoomHistory'
  | 'sharedHomeNothingThisMonth'
  | 'sharedHomeCalculationDetails'
  | 'sharedHomeName'
  | 'sharedHomeCategory'
  | 'sharedHomeDate'
  | 'sharedHomePaidBy'
  | 'sharedHomeSharedBy'
  | 'sharedHomeSplitMethod'
  | 'sharedHomeEqual'
  | 'sharedHomeSelectedEqually'
  | 'sharedHomeCustomAmount'
  | 'sharedHomePercentage'
  | 'sharedHomeSave'
  | 'sharedHomeInvalidExpense'
  | 'sharedHomeCustomMustEqual'
  | 'sharedHomePercentageMustEqual'
  | 'sharedHomeChoosePayer'
  | 'sharedHomeSelectMembers'
  | 'sharedHomeAddPeople'
  | 'sharedHomeNoMembers'
  | 'sharedHomeMemberName'
  | 'sharedHomeMobile'
  | 'sharedHomeMobileOptional'
  | 'sharedHomeUpiId'
  | 'sharedHomeUpiIdPlaceholder'
  | 'sharedHomeInvalidUpiId'
  | 'sharedHomeEmail'
  | 'sharedHomeAvatar'
  | 'sharedHomeMoveIn'
  | 'sharedHomeMoveOut'
  | 'sharedHomeActive'
  | 'sharedHomeInactive'
  | 'sharedHomeNoRoomHistory'
  | 'sharedHomeUnassigned'
  | 'sharedHomeRoomsOptional'
  | 'sharedHomeNoRooms'
  | 'sharedHomeConfigureRent'
  | 'sharedHomeEditRent'
  | 'sharedHomeCalculation'
  | 'sharedHomeShareRange'
  | 'sharedHomeShareRangeHelp'
  | 'sharedHomeShareLinkNote'
  | 'sharedHomeShareUnable'
  | 'sharedHomeRentSetup'
  | 'sharedHomeTotalRent'
  | 'sharedHomeDueDate'
  | 'sharedHomeEndDate'
  | 'sharedHomeNotes'
  | 'sharedHomeAutoGenerateRent'
  | 'sharedHomeStayDayBasis'
  | 'sharedHomeCalendarDays'
  | 'sharedHomeFixed30Days'
  | 'sharedHomeManualOverride'
  | 'sharedHomeAdjustedTotal'
  | 'sharedHomeAdjustmentReason'
  | 'sharedHomeAllocationsEqualTotal'
  | 'sharedHomeRoomAllocationsEqualTotal'
  | 'sharedHomeRoomMemberAllocationsEqual'
  | 'sharedHomeCreate'
  | 'sharedHomeHomeType'
  | 'sharedHomeStartDate'
  | 'sharedHomeAddress'
  | 'sharedHomeDescription'
  | 'sharedHomeCreateHome'
  | 'sharedHomeAddRoom'
  | 'sharedHomeDefaultRent'
  | 'sharedHomeRoomNotes'
  | 'sharedHomeTripOption'
  | 'sharedHomeSharedHomeOption'
  | 'sharedHomeGroceryItems'
  | 'sharedHomeGroceryItem'
  | 'sharedHomeGroceryMode'
  | 'sharedHomeCommon'
  | 'sharedHomePersonal'
  | 'sharedHomeAddItem'
  | 'sharedHomeChooseMember'
  | 'sharedHomeTypeFlat'
  | 'sharedHomeTypeHouse'
  | 'sharedHomeTypeHostel'
  | 'sharedHomeTypePg'
  | 'sharedHomeTypeSharedRoom'
  | 'sharedHomeTypeOther'
  | 'sharedHomeOptional'
  | 'sharedHomeRequired'
  | 'sharedHomeCategoryFood'
  | 'sharedHomeCategoryElectricity'
  | 'sharedHomeCategoryWater'
  | 'sharedHomeCategoryGas'
  | 'sharedHomeCategoryInternet'
  | 'sharedHomeCategoryMaintenance'
  | 'sharedHomeCategoryCleaning'
  | 'sharedHomeCategorySupplies'
  | 'sharedHomeCategoryOther'
  | 'sharedHomeThisMonth'
  | 'sharedHomeRecentActivity'
  | 'sharedHomeAddPeopleToSeeBalances'
  | 'sharedHomeAddMembers'
  | 'sharedHomeShareAmount'
  | 'sharedHomePaidAmount'
  | 'sharedHomeCarryAmount'
  | 'sharedHomeGetsAmount'
  | 'sharedHomeOwesAmount'
  | 'sharedHomeBillsUtilities'
  | 'sharedHomeGroceriesHousehold'
  | 'sharedHomeHouseholdExpenses'
  | 'sharedHomeNoRecurringRules'
  | 'sharedHomeRecurringHelp'
  | 'sharedHomeEditRule'
  | 'sharedHomeIncludeInBudget'
  | 'sharedHomeIncludeInBudgetQuestion'
  | 'sharedHomeIncludeInBudgetHelp'
  | 'sharedHomeIncludedInBudget'
  | 'sharedHomeNotIncludedInBudget'
  | 'sharedHomePaymentRequest'
  | 'sharedHomeInvalidPaymentRequest'
  | 'sharedHomePaymentRequestHelp'
  | 'sharedHomePayViaUpi'
  | 'sharedHomeSharePaymentRequest'
  | 'sharedHomeCopyPaymentLink'
  | 'sharedHomeCopyUpi'
  | 'sharedHomeCopyAmount'
  | 'sharedHomeShowUpiQr'
  | 'sharedHomeHideUpiQr'
  | 'sharedHomeWhoPays'
  | 'sharedHomeWhoReceives'
  | 'sharedHomeReason'
  | 'sharedHomePaymentFallback'
  | 'sharedHomeNoUpiPaymentFallback'
  | 'sharedHomePaymentPending'
  | 'sharedHomePaymentLinkCopied'
  | 'sharedHomeShareSuccess'
  | 'sharedHomeMarkPaid'
  | 'sharedHomeQrUnavailable'
  | 'sharedHomeVariable'
  | 'sharedHomeRoom'
  | 'sharedHomeCurrent'
  | 'sharedHomeNoRoomHistory'
  | 'sharedHomeRoomsOptional'
  | 'sharedHomeMembersCount'
  | 'sharedHomeNoCurrentMembers'
  | 'sharedHomeCloseMonth'
  | 'sharedHomeEveryoneSettled'
  | 'sharedHomeSuggestedMinimum'
  | 'sharedHomeMonthSummary'
  | 'sharedHomeTotalHouseholdExpense'
  | 'sharedHomeActivityHistory'
  | 'sharedHomeViewCalculation'
  | 'sharedHomeApplicableDaysRate'
  | 'sharedHomeUnknown'
  | 'sharedHomeCategoryGroceries'
  | 'sharedHomeCategoryUtilities'
  | 'sharedHomeExpenseNamePlaceholder'
  | 'sharedHomeAmountPlaceholder'
  | 'sharedHomeGroceryItemPlaceholder'
  | 'sharedHomeZeroAmountPlaceholder'
  | 'sharedHomeType'
  | 'sharedHomeAmountMode'
  | 'sharedHomeFixedAmount'
  | 'sharedHomeVariableAmount'
  | 'sharedHomeAutoAddFixed'
  | 'sharedHomeNotFound'
  | 'sharedHomeBack'
  | 'sharedHomeBasis'
  | 'sharedHomePaidByLabel'
  | 'sharedHomeSharedByLabel'
  | 'sharedHomeInactiveLabel'
  | 'sharedHomeMoveInLabel'
  | 'sharedHomeRemovedRoom'
  | 'sharedHomePaymentPaidTo'
  | 'sharedHomeSummaryOf'
  | 'sharedHomeManualOverrideActivity'
  | 'sharedHomeEditRent'
  | 'sharedHomeConfigureRent'
  | 'sharedHomeOwesTo'
  | 'sharedHomePaidTo'
  | 'sharedHomeCalculationDaysRate'
  | 'sharedHomeInvalidLink'
  | 'sharedHomeMonthLabel'
  | 'sharedHomeAvatarPlaceholder'
  | 'sharedHomeZeroPercentagePlaceholder'
  | 'sharedHomeEqualPerPerson'
  | 'sharedHomeEqualPerRoom'
  | 'sharedHomeRoomFixedRent'
  | 'sharedHomeStayDaysBased'
  | 'sharedHomeCustomAmount'
  | 'sharedHomeRequiredMessage'
  | 'sharedHomeGreaterThanZeroMessage'
  | 'sharedHomeChangedTotalReasonMessage'
  | 'sharedHomeAmountPlaceholder'
  | 'sharedHomeOptionalPlaceholder'
  | 'sharedHomeRoomNamePlaceholder'
  | 'sharedHomeRecurringAdded'
  | 'sharedHomeRecurringRuleAdded'
  | 'sharedHomeRecurringRuleUpdated'
  | 'sharedHomeExpenseAdded'
  | 'sharedHomeMemberUpdated'
  | 'sharedHomeMemberAdded'
  | 'sharedHomeRemoveMemberConfirm'
  | 'sharedHomeMemberInactive'
  | 'sharedHomeDeleteRoomConfirm'
  | 'sharedHomeRoomUpdated'
  | 'sharedHomeRoomAdded'
  | 'sharedHomeRoomDeleted'
  | 'sharedHomeMemberAssigned'
  | 'sharedHomeRentConfigured'
  | 'sharedHomeSettlementRecorded'
  | 'sharedHomeShareCopied'
  | 'sharedHomeShareFailed'
  | 'sharedHomeUnsettledCloseConfirm'
  | 'sharedHomeClosed'
  | 'sharedHomeSettlementCancelled'
  | 'sharedHomeCreateNamePlaceholder'
  | 'sharedHomeBackToKharcha'
  | 'sharedHomeBackAriaLabel'
  | 'sharedHomeEmptyPrompt'
  | 'sharedHomeListTitle'
  | 'sharedHomeDescriptionFallback'
  | 'sharedHomeMembersShort'
  | 'sharedHomeCreatedActivity'
  | 'sharedHomeSearchPlaceholder'
  | 'sharedHomeFilterCategory'
  | 'sharedHomeFilterMember'
  | 'sharedHomeAllCategories'
  | 'sharedHomeAllMembers'
  | 'sharedHomeSortNewest'
  | 'sharedHomeSortOldest'
  | 'sharedHomeSortHighest'
  | 'sharedHomeSortLowest'
  | 'sharedHomeCancelExpenseConfirm'
  | 'sharedHomeExpenseCancelled'
  | 'sharedHomeReceipt'
  | 'sharedHomeReceiptOptional'
  | 'sharedHomeDownloadCsv'
  | 'sharedHomePrintPdf'
  | 'sharedHomeStop'
  | 'sharedHomeStopRuleConfirm'
  | 'sharedHomeRuleStopped'
  | 'sharedHomeRuleHistory'
  | 'sharedHomeNoHistory'
  | 'sharedHomeCloseSummary'
  | 'sharedHomeCancel'
  | 'sharedHomeCancelled'
  | 'groupFunds'
  | 'groupFundsDescription'
  | 'openFunds'
  | 'personalBudget'
  | 'personalBudgetDescription'
  | 'personalBudgetOverview'
  | 'personalBudgetIncome'
  | 'personalBudgetExpenses'
  | 'personalBudgetRecurring'
  | 'personalBudgetFamily'
  | 'personalBudgetGoals'
  | 'personalBudgetCalendar'
  | 'personalBudgetReports'
  | 'personalBudgetSettings'
  | 'personalBudgetExpectedIncome'
  | 'personalBudgetPlannedExpenses'
  | 'personalBudgetActualExpenses'
  | 'personalBudgetRemaining'
  | 'personalBudgetSavings'
  | 'personalBudgetUsed'
  | 'personalBudgetNoIncome'
  | 'personalBudgetAddFirstIncome'
  | 'personalBudgetNoExpenses'
  | 'personalBudgetAddFirstExpense'
  | 'personalBudgetStartTitle'
  | 'personalBudgetStartDescription'
  | 'personalBudgetPreviousMonth'
  | 'personalBudgetNextMonth'
  | 'personalBudgetAddIncome'
  | 'personalBudgetAddExpense'
  | 'personalBudgetAddRecurring'
  | 'personalBudgetAddGoal'
  | 'personalBudgetComingSoon'
  | 'personalBudgetNoData'
  | 'personalBudgetAddIncomeSource'
  | 'personalBudgetAddIncomeTransaction'
  | 'personalBudgetIncomeSources'
  | 'personalBudgetIncomeHistory'
  | 'personalBudgetActualReceived'
  | 'personalBudgetExpected'
  | 'personalBudgetReceived'
  | 'personalBudgetPending'
  | 'personalBudgetVariable'
  | 'personalBudgetActive'
  | 'personalBudgetArchived'
  | 'personalBudgetEdit'
  | 'personalBudgetArchive'
  | 'personalBudgetDelete'
  | 'personalBudgetViewHistory'
  | 'personalBudgetIncomeName'
  | 'personalBudgetRecurringSaved'
  | 'personalBudgetRecurringDescription'
  | 'personalBudgetRuleName'
  | 'personalBudgetNoRecurringRules'
  | 'personalBudgetOccurrences'
  | 'personalBudgetNoOccurrences'
  | 'personalBudgetPaused'
  | 'personalBudgetPause'
  | 'personalBudgetResume'
  | 'personalBudgetPaid'
  | 'personalBudgetSkipped'
  | 'personalBudgetMarkPaid'
  | 'personalBudgetMarkPending'
  | 'personalBudgetMarkSkipped'
  | 'personalBudgetExcludeFromBudget'
  | 'personalBudgetRecurringBudgetQuestion'
  | 'personalBudgetCategory'
  | 'personalBudgetAmount'
  | 'personalBudgetFrequency'
  | 'personalBudgetExpectedDate'
  | 'personalBudgetStartDate'
  | 'personalBudgetEndDate'
  | 'personalBudgetPerson'
  | 'personalBudgetIncludeInBudget'
  | 'personalBudgetSave'
  | 'personalBudgetAddTransaction'
  | 'personalBudgetTransactionDate'
  | 'personalBudgetActualAmount'
  | 'personalBudgetThisMonth'
  | 'personalBudgetLastMonth'
  | 'personalBudgetCustomRange'
  | 'personalBudgetFrom'
  | 'personalBudgetTo'
  | 'personalBudgetPaymentMethod'
  | 'personalBudgetNote'
  | 'personalBudgetSubcategory'
  | 'personalBudgetManageCategories'
  | 'personalBudgetAddCustomCategory'
  | 'personalBudgetCategoryName'
  | 'personalBudgetIcon'
  | 'personalBudgetCategoryBudget'
  | 'personalBudgetBudgetAmount'
  | 'personalBudgetSetBudget'
  | 'personalBudgetUnderBudget'
  | 'personalBudgetNearLimit'
  | 'personalBudgetOverBudget'
  | 'personalBudgetTopCategories'
  | 'personalBudgetConfirmDelete'
  | 'personalBudgetAdd'
  | 'personalBudgetSuccessIncome'
  | 'personalBudgetSuccessExpense'
  | 'personalBudgetNoSources'
  | 'personalBudgetNoExpensesMonth'
  | 'personalBudgetArchiveConfirm'
  | 'personalBudgetHistoryEmpty'
  | 'personalBudgetExpectedAmount'
  | 'personalBudgetNextOccurrence'
  | 'personalBudgetMonthlyCommitment'
  | 'personalBudgetRecurringPaid'
  | 'personalBudgetRecurringPending'
  | 'personalBudgetRecurringSkipped'
  | 'personalBudgetToday'
  | 'personalBudgetUpcoming'
  | 'personalBudgetActiveRules'
  | 'personalBudgetArchivedRules'
  | 'personalBudgetSkipFrom'
  | 'personalBudgetSkipTo'
  | 'personalBudgetPauseFrom'
  | 'personalBudgetPauseTo'
  | 'personalBudgetBulkPaidConfirm'
  | 'personalBudgetDeleteFutureConfirm'
  | 'personalBudgetDeleteFuture'
  | 'personalBudgetArchiveRule'
  | 'personalBudgetCancelled'
  | 'personalBudgetMarkCancelled'
  | 'personalBudgetViewDetails'
  | 'personalBudgetActualAmountPrompt'
  | 'personalBudgetOccurrenceDetails'
  | 'personalBudgetMonthlyProvision'
  | 'personalBudgetUpcomingEmpty'
  | 'personalBudgetNoSkipped'
  | 'personalBudgetDailyExpense'
  | 'personalBudgetWeeklyExpense'
  | 'personalBudgetOneTimeExpense'


  | 'personalBudgetCommitted'
  | 'personalBudgetDaily'
  | 'personalBudgetWeekly'
  | 'personalBudgetRemainingCash'
  | 'sharedHomeSummaryReport'
  | 'sharedHomeTotalRent'
  | 'sharedHomeTotalOutlay'
  | 'sharedHomeMajorCategories'
  | 'sharedHomeBalances'
  | 'sharedHomeTotalExpenses'
  | 'personalBudgetCommitted'
  | 'personalBudgetDaily'
  | 'personalBudgetWeekly'
  | 'personalBudgetRemainingCash'
  | 'personalBudgetSafeSpendingAmount'
  | 'personalBudgetSuggestedDailyLimit'
  | 'personalBudgetTodaysSpending'
  | 'personalBudgetGoalCommitments'
  | 'personalBudgetSmartGuidance'
  | 'personalBudgetGuidanceOnly'
  | 'personalBudgetGoalsTitle'
  | 'personalBudgetAddToGoal'
  | 'personalBudgetEditGoal'
  | 'personalBudgetGoalName'
  | 'personalBudgetTargetAmount'
  | 'personalBudgetCurrentSavedAmount'
  | 'personalBudgetTargetDate'
  | 'personalBudgetPriority'
  | 'personalBudgetMonthlyAllocation'
  | 'personalBudgetGoalNote'
  | 'personalBudgetActiveGoal'
  | 'personalBudgetGoalSaved'
  | 'personalBudgetGoalContributionSaved'
  | 'helpGuideTitle'
  | 'helpGuideSubtitle'
  | 'needHelp'
  | 'emailUsAt'
  | 'backToGuides'
  | 'reportsAnalytics'
  | 'reportsSubtitle'
  | 'thisMonth'
  | 'allRecords'
  | 'totalIncome'
  | 'verifiedInflow'
  | 'totalExpenses'
  | 'paidActive'
  | 'netSavings'
  | 'incomeMinusExpense'
  | 'savingsRate'
  | 'healthySurplus'
  | 'deficit'
  | 'expenseBreakdown'
  | 'noExpenseRecords'
  | 'budgetLimitsPerformance'
  | 'noCategoryBudgets'
  | 'used'
  | 'spent'
  | 'limit'
  | 'generalTab'
  | 'backupTab'
  | 'securityTab'
  | 'helpGuideTab'
  | 'editMember'
  | 'updateMemberName'
  | 'memberName'
  | 'enterMemberNamePlaceholder'
  | 'mobileNumberOptional'
  | 'tenDigitNumber'
  | 'upiIdOptional'
  | 'upiPlaceholder'
  | 'upiExample'
  | 'saveChanges'
  | 'enterMemberName'
  | 'memberAlreadyExists'
  | 'selectContactsToAdd'
  | 'contactsSelected'
  | 'selectAll'
  | 'clearAll'
  | 'unnamedContact'
  | 'noPhoneEmail'
  | 'addSelected'
  | 'backupRestoreData'
  | 'backupDesc'
  | 'lastBackup'
  | 'localStorageActive'
  | 'exportBackupJson'
  | 'importBackup'
  | 'shareBackupApps'
  | 'restorePreview'
  | 'backupDate'
  | 'transactions'
  | 'goals'
  | 'cancel'
  | 'continueRestore'
  | 'appLockSecurity'
  | 'appLockDesc'
  | 'enableAppLock'
  | 'lockMethodLabel'
  | 'pinMethod'
  | 'deviceLockMethod'
  | 'deviceLockHint'
  | 'deviceLockUnavailable'
  | 'pinCodeLabel'
  | 'enterPinPlaceholder'
  | 'confirmPinLabel'
  | 'confirmPinPlaceholder'
  | 'autoLockTimeout'
  | 'timeoutImmediate'
  | 'timeout1min'
  | 'timeout5min'
  | 'unlockTitle'
  | 'unlockDescription'
  | 'unlockPinButton'
  | 'unlockUseDevice'
  | 'unlockIncorrectPin'
  | 'deviceAuthUnavailable'
  | 'deviceAuthCanceled'
  | 'deviceAuthFailed';

type TranslationDictionary = Partial<Record<TranslationKey, string>>;
type Variables = Record<string, string | number>;

const english: Record<TranslationKey, string> = {
  language: 'Language',
  splitExpenses: 'Split expenses, travel smart',
  oneTrip: 'One Trip.',
  oneTap: 'One Tap.',
  loadingTrips: 'Loading trips...',
  noTrips: 'No trips yet. Create your first one!',
  createTrip: 'Create Trip',
  yourTrips: 'Your Trips',
  newestFirst: 'Newest First',
  oldestFirst: 'Oldest First',
  nameAZ: 'Name A-Z',
  nameZA: 'Name Z-A',
  membersCount: '{{count}} members',
  tripNotFound: 'Trip not found',
  backToTrips: 'Back to Trips',
  total: 'Total',
  expenses: 'Expenses',
  members: 'Members',
  payAddExpenseAutomatically: 'Pay & Add Expense Automatically',
  shareThisTrip: 'Share this trip',
  dashboard: 'Dashboard',
  settle: 'Settle',
  howToSplitAddExpense: 'How to split & add expense',
  addMember: 'Add Member',
  noMembers: 'No members yet',
  paid: 'Paid',
  owes: 'Owes',
  edit: 'Edit',
  delete: 'Delete',
  createNewTrip: 'Create New Trip',
  startPlanning: 'Start planning your next adventure',
  tripName: 'Trip Name',
  description: 'Description',
  startDate: 'Start Date',
  endDate: 'End Date',
  cancel: 'Cancel',
  copyLink: 'Copy Link',
  viewOnly: 'View Only',
  settlementSummary: 'Settlement Summary',
  allSettled: '✨ All settled!',
  noPaymentsNeeded: 'No payments needed',
  makePayments: 'Make these {{count}} payments to settle all debts:',
  pays: 'pays',
  receives: 'receives',
  pay: 'Pay',
  mark: 'Mark',
  undo: 'Undo',
  summary: 'Summary',
  outstanding: 'Outstanding:',
  pendingTransactions: 'Pending transactions:',
  shareTrip: 'Share Trip',
  shareByName: 'Share the trip by name. The technical URL stays hidden.',
  tripToShare: 'Trip to share',
  recipientsViewOnly: 'Recipients can view this trip snapshot only. They cannot edit or change your original trip from the shared link.',
  close: 'Close',
  sharing: 'Sharing...',
  copied: 'Copied!',
  tripShared: 'Trip shared',
  editAndSyncTitle: 'Edit & Sync',
  editAndSyncDescription: 'Create a temporary editable copy of {{name}}. Your original data stays unchanged until you synchronize reviewed changes.',
  editAndSyncShareMessage: 'Edit and sync {{name}}',
  editSyncSelectedItem: 'Selected item',
  editSyncOwnerProtection: 'Ownership and security settings remain protected.',
  editSyncLinkShared: 'Edit & Sync link shared',
  editSyncLinkCopied: 'Edit & Sync link copied',
  editSyncUnavailable: 'Edit & Sync is temporarily unavailable',
  editSyncOpenTitle: 'Editable shared copy',
  editSyncRecipientDescription: 'This is a local editable copy. Changes remain on this device until you send them back.',
  editSyncEditCopy: 'Open editable copy',
  editSyncSendBack: 'Send to Original Sender for Synchronization',
  editSyncPending: 'Your synchronization is pending',
  editSyncReviewTitle: 'Review synchronization',
  editSyncReviewDescription: 'Review changes before applying them to the original item.',
  editSyncReviewChanges: 'Review Changes',
  editSyncSynchronize: 'Synchronize Changes',
  editSyncConflict: 'Changes need review',
  editSyncCompleted: 'Synchronization completed',
  editSyncCopyCreated: 'Editable copy saved on this device',
  editSyncOwnerVerificationFailed: 'Owner verification failed',
  editSyncRecipientUnknown: 'Recipient',
  editSyncAdded: 'Added',
  editSyncChanged: 'Changed',
  editSyncRemoved: 'Removed',
  editSyncConflictFields: 'conflicting fields were found. Review before synchronizing.',
  linkCopied: 'link copied!',
  failedCopy: 'Failed to copy trip link',
  addExpense: 'Add Expense',
  recordExpense: 'Record a new expense for the trip',
  pleaseAddMembers: 'Please add members to the trip first',
  fillRequired: 'Please fill all required fields',
  customSplitError: 'Custom splits must equal ₹{{amount}}',
  amount: 'Amount (₹)',
  category: 'Category',
  paidBy: 'Paid By',
  date: 'Date',
  splitType: 'Split Type',
  equalSplit: 'Equal Split',
  customSplit: 'Custom Split',
  splitAmong: 'Split Among',
  addMemberDetails: 'Add a friend or group member to this trip',
  addFromContacts: '📱 Add from Contacts',
  addManually: 'Add Manually',
  picking: 'Picking...',
  memberNameRequired: 'Member Name *',
  mobileOptional: 'Mobile Number (Optional)',
  forUpiSharing: 'For UPI payments and sharing',
  upiOptional: 'UPI ID (Optional)',
  payTo: 'Pay ₹{{amount}} to {{name}}',
  openUpiApp: 'Open UPI App',
  sharePaymentLink: 'Share Payment Link',
  contactImported: 'Contact imported!',
  failedContact: 'Failed to pick contact',
  paymentCompleteQuestion: 'Payment Complete?',
  confirmPayment: 'Confirm if you completed the payment',
  paymentDetails: 'Payment Details',
  from: 'From:',
  to: 'To:',
  amountLabel: 'Amount:',
  onlyConfirm: 'ℹ️ Only confirm if you successfully sent the payment',
  yesPaid: 'Yes, Paid Successfully',
  noCancel: 'No, Cancel',
  budget: 'Budget',
  budgetDetails: 'Budget Details',
  budgetAmount: 'Budget Amount',
  budgetPeriod: 'Budget Period',
  budgetEntireTrip: 'Entire Trip',
  budgetWarningThreshold: 'Warning threshold (%)',
  budgetWarningThresholdHelp: 'Show a warning when this percentage of the budget is used.',
  budgetUseSameEveryMonth: 'Use same budget every month',
  budgetUseSameEveryMonthHelp: 'New months use this amount unless you set a different monthly budget.',
  budgetSave: 'Save Budget',
  budgetAmountRequired: 'Enter a budget amount greater than zero.',
  budgetThresholdInvalid: 'Warning threshold must be between 1% and 100%.',
  budgetTotal: 'Total Budget',
  budgetSpent: 'Spent',
  budgetTrackedSpending: 'Budget Tracked Spending',
  budgetActualSpending: 'Total Actual Spending',
  budgetExcludedExplanation: '{{amount}} is excluded from budget tracking.',
  budgetRemaining: 'Remaining',
  budgetOver: 'Over Budget',
  budgetUsed: 'Used',
  budgetUnderBudget: 'Under Budget',
  budgetNearLimit: 'Near Limit',
  budgetExceeded: 'Budget Exceeded',
  budgetNoBudget: 'No Budget Set',
  budgetSetDescription: 'Set a budget to track how much you have spent and how much remains.',
  budgetSet: 'Set Budget',
  budgetEdit: 'Edit Budget',
  budgetHistory: 'Budget History',
  budgetBreakdown: 'Spending Breakdown',
  budgetNoSpend: 'No eligible spending yet.',
  budgetSavedActivity: 'Budget saved for {{period}}.',
  kharchaTagline: 'Split Smart. Live Smart.',
  whatManage: 'What do you want to manage?',
  tripsDescription: 'Manage travel expenses and split trip costs.',
  sharedHomesDescription: 'Manage rent, bills, groceries, and household expenses.',
  openTrips: 'Open Trips',
  openSharedHomes: 'Open Shared Homes',
  myTrips: 'My Trips',
  mySharedHomes: 'My Shared Homes',
  addTrip: 'Add Trip',
  addSharedHome: 'Add Shared Home',
  quickTrip: 'Quick Trip',
  quickTripDescription: 'Start a new trip in seconds.',
  settings: 'Settings',
  search: 'Search',
  notifications: 'Notifications',
  more: 'More',
  chooseCategory: 'Choose a category to get started',
  home: 'Home',
  tripsNav: 'Trips',
  sharedNav: 'Shared',
  languagePersistenceNote: 'Your language choice is saved on this device and applies across Kharcha.',
  searchKharchaTitle: 'Search Kharcha',
  searchKharchaPlaceholder: 'Search trips, shared homes, group funds, or budget',
  searchKharchaHint: 'Search your saved Kharcha data to open a module or record.',
  searchKharchaNoResults: 'No matching Kharcha items found.',
  notificationsTitle: 'Notifications',
  markAllRead: 'Mark all read',
  noNotifications: 'You have no notifications yet.',
  unread: 'Unread',
  moreTitle: 'More features',
  openSettings: 'Manage app settings',
  backToKharcha: 'Back to Kharcha',
  sharedHomeCurrentBalance: 'Current balance',
  sharedHomeRecent: 'Recently used',
  noSharedHomes: 'No shared homes yet. Add your first home to get started.',
  tripExpenseTotal: 'Total expenses',
  tripMembers: 'members',
  sharedHomeMembersLabel: 'members',
  sharedHomeExpenseTotal: 'Total expense',
  sharedHomeBalance: 'Balance',
  sharedHomeOpen: 'Open Shared Home',
  tripOpen: 'Open Trip',
  searchTrips: 'Search trips',
  noSearchResults: 'No matching items found.',
  deleteTripConfirm: 'Delete this trip? This cannot be undone.',
  searchSharedHomes: 'Search shared homes',
  deleteSharedHomeConfirm: 'Delete this Shared Home? This cannot be undone.',
  sharedHome: 'Shared Home',
  sharedHomeOverview: 'Overview',
  sharedHomeExpenses: 'Expenses',
  sharedHomeRent: 'Rent',
  sharedHomeBills: 'Bills',
  sharedHomeGroceries: 'Groceries',
  sharedHomeMembers: 'Members',
  sharedHomeRooms: 'Rooms',
  sharedHomeSettlements: 'Settlements',
  sharedHomeReports: 'Reports',
  sharedHomePrimaryNavigation: 'Primary navigation',
  sharedHomeManage: 'Manage',
  sharedHomeAddExpense: 'Add Expense',
  sharedHomeAddRent: 'Add Rent',
  sharedHomeAddBill: 'Add Bill',
  sharedHomeAddGrocery: 'Add Grocery',
  sharedHomeAddMember: 'Add Member',
  sharedHomeAddRoom: 'Add Room',
  sharedHomeShare: 'Share',
  sharedHomeManagerMode: 'Manager mode',
  sharedHomeOfflineFirst: 'Offline first',
  sharedHomeMonthlyView: 'Monthly view',
  sharedHomeTotalExpense: 'Total Expense',
  sharedHomeTotalShare: 'Total Share',
  sharedHomeTotalPaid: 'Total Paid',
  sharedHomePendingSettlements: 'Pending Settlements',
  sharedHomeRecurring: 'Recurring',
  sharedHomeRecurringRules: 'Recurring monthly rules',
  sharedHomeAddRule: 'Add Rule',
  sharedHomePause: 'Pause',
  sharedHomeResume: 'Resume',
  sharedHomeSkipNext: 'Skip next',
  sharedHomeUnskip: 'Unskip',
  sharedHomeCurrentMonth: 'Current month',
  sharedHomeFullGroupHistory: 'Full group history',
  sharedHomeCustomDateRange: 'Custom date range',
  sharedHomeViewOnlySnapshot: 'Read-only snapshot',
  sharedHomeOriginalNotEditable: 'Original manager data is not shared for editing.',
  sharedHomePaymentHistory: 'Payment history',
  sharedHomeMarkSettled: 'Mark Settled',
  sharedHomeNoPaymentHistory: 'No recorded payments yet.',
  sharedHomeNoCurrentMembers: 'No current members',
  sharedHomeNoRoomHistory: 'No room history',
  sharedHomeNothingThisMonth: 'Nothing recorded for this month yet.',
  sharedHomeCalculationDetails: 'Calculation details',
  sharedHomeName: 'Name',
  sharedHomeCategory: 'Category',
  sharedHomeDate: 'Date',
  sharedHomePaidBy: 'Paid By',
  sharedHomeSharedBy: 'Shared By',
  sharedHomeSplitMethod: 'Split Method',
  sharedHomeEqual: 'Equal',
  sharedHomeSelectedEqually: 'Selected members equally',
  sharedHomeCustomAmount: 'Custom amount',
  sharedHomePercentage: 'Percentage',
  sharedHomeSave: 'Save',
  sharedHomeInvalidExpense: 'Enter a name, amount, payer, and at least one shared member.',
  sharedHomeCustomMustEqual: 'Custom shares must equal the total amount.',
  sharedHomePercentageMustEqual: 'Percentages must add up to exactly 100%.',
  sharedHomeChoosePayer: 'Choose payer',
  sharedHomeSelectMembers: 'Select members',
  sharedHomeAddPeople: 'Add the people who share this home.',
  sharedHomeNoMembers: 'No members yet.',
  sharedHomeMemberName: 'Member Name',
  sharedHomeMobile: 'Mobile Number',
  sharedHomeMobileOptional: 'Optional contact number',
  sharedHomeUpiId: 'UPI ID (optional)',
  sharedHomeUpiIdPlaceholder: 'name@upi',
  sharedHomeInvalidUpiId: 'Enter a valid UPI ID such as name@upi.',
  sharedHomeEmail: 'Email',
  sharedHomeAvatar: 'Avatar',
  sharedHomeMoveIn: 'Move-in date',
  sharedHomeMoveOut: 'Move-out date',
  sharedHomeActive: 'Active member',
  sharedHomeInactive: 'Inactive',
  sharedHomeUnassigned: 'Unassigned',
  sharedHomeRoomsOptional: 'Rooms are optional. Add them for room-based rent splits.',
  sharedHomeNoRooms: 'No rooms yet.',
  sharedHomeConfigureRent: 'Configure rent to calculate each member\'s monthly share.',
  sharedHomeEditRent: 'Edit Rent',
  sharedHomeCalculation: 'Calculation details',
  sharedHomeShareRange: 'Share range',
  sharedHomeShareRangeHelp: 'Choose how much household history to include.',
  sharedHomeShareLinkNote: 'Recipients can view this snapshot only. Your local manager data is not editable.',
  sharedHomeShareUnable: 'Unable to share or copy the Shared Home link.',
  sharedHomeRentSetup: 'Rent Setup',
  sharedHomeTotalRent: 'Total Rent (₹)',
  sharedHomeDueDate: 'Due date',
  sharedHomeEndDate: 'End date',
  sharedHomeNotes: 'Notes',
  sharedHomeAutoGenerateRent: 'Auto-generate monthly rent',
  sharedHomeStayDayBasis: 'Stay-Day Basis',
  sharedHomeCalendarDays: 'Calendar days',
  sharedHomeFixed30Days: 'Fixed 30-day basis',
  sharedHomeManualOverride: 'Manual rent adjustment',
  sharedHomeAdjustedTotal: 'Adjusted total (₹)',
  sharedHomeAdjustmentReason: 'Adjustment reason',
  sharedHomeAllocationsEqualTotal: 'Custom member allocations must equal the total rent.',
  sharedHomeRoomAllocationsEqualTotal: 'Room allocations must equal the total rent.',
  sharedHomeRoomMemberAllocationsEqual: 'Allocations inside this room must equal its room share.',
  sharedHomeCreate: 'Create Shared Home',
  sharedHomeHomeType: 'Home type',
  sharedHomeStartDate: 'Start date',
  sharedHomeAddress: 'Address',
  sharedHomeDescription: 'Description',
  sharedHomeCreateHome: 'Create Home',
  sharedHomeDefaultRent: 'Default rent (₹)',
  sharedHomeRoomNotes: 'Room notes',
  sharedHomeTripOption: 'Trip',
  sharedHomeSharedHomeOption: 'Shared Home',
  sharedHomeGroceryItems: 'Grocery items',
  sharedHomeGroceryItem: 'Item',
  sharedHomeGroceryMode: 'Item split',
  sharedHomeCommon: 'Common',
  sharedHomePersonal: 'Personal',
  sharedHomeAddItem: 'Add item',
  sharedHomeChooseMember: 'Choose member',
  sharedHomeTypeFlat: 'Flat / Apartment',
  sharedHomeTypeHouse: 'House',
  sharedHomeTypeHostel: 'Hostel',
  sharedHomeTypePg: 'PG',
  sharedHomeTypeSharedRoom: 'Shared Room',
  sharedHomeTypeOther: 'Other',
  sharedHomeOptional: 'Optional',
  sharedHomeRequired: 'is required.',
  sharedHomeCategoryFood: 'Food',
  sharedHomeCategoryElectricity: 'Electricity',
  sharedHomeCategoryWater: 'Water',
  sharedHomeCategoryGas: 'Gas',
  sharedHomeCategoryInternet: 'Wi-Fi / Internet',
  sharedHomeCategoryMaintenance: 'Maintenance',
  sharedHomeCategoryCleaning: 'Cleaning',
  sharedHomeCategorySupplies: 'Household Supplies',
  sharedHomeCategoryOther: 'Other',
  sharedHomeThisMonth: 'This Month',
  sharedHomeRecentActivity: 'Recent activity',
  sharedHomeAddPeopleToSeeBalances: 'Add members and expenses to see balances.',
  sharedHomeAddMembers: 'Add the people who share this home.',
  sharedHomeShareAmount: 'Share',
  sharedHomePaidAmount: 'Paid',
  sharedHomeCarryAmount: 'Carry',
  sharedHomeGetsAmount: 'Gets',
  sharedHomeOwesAmount: 'Owes',
  sharedHomeBillsUtilities: 'Bills & Utilities',
  sharedHomeGroceriesHousehold: 'Groceries & Household',
  sharedHomeHouseholdExpenses: 'Household Expenses',
  sharedHomeNoRecurringRules: 'No recurring rules yet.',
  sharedHomeRecurringHelp: 'Fixed rules auto-add once per selected month; variable rules stay pending for manual entry.',
  sharedHomeEditRule: 'Edit recurring rule',
  sharedHomeIncludeInBudget: 'Include in Budget',
  sharedHomeIncludeInBudgetQuestion: 'Should this recurring expense reduce the Shared Home budget?',
  sharedHomeIncludeInBudgetHelp: 'Turn off if this expense should not reduce your budget. It will still be recorded normally.',
  sharedHomeIncludedInBudget: 'Included in Budget',
  sharedHomeNotIncludedInBudget: 'Not Included in Budget',
  sharedHomePaymentRequest: 'Kharcha Payment Request',
  sharedHomeInvalidPaymentRequest: 'This payment request is invalid or expired.',
  sharedHomePaymentRequestHelp: 'Ask the Manager to create a new Shared Home payment request.',
  sharedHomePayViaUpi: 'Pay via UPI',
  sharedHomeSharePaymentRequest: 'Share Payment Request',
  sharedHomeCopyPaymentLink: 'Copy Payment Link',
  sharedHomeCopyUpi: 'Copy UPI ID',
  sharedHomeCopyAmount: 'Copy Amount',
  sharedHomeShowUpiQr: 'Show UPI QR',
  sharedHomeHideUpiQr: 'Hide UPI QR',
  sharedHomeWhoPays: 'Who pays',
  sharedHomeWhoReceives: 'Who receives',
  sharedHomeReason: 'Reason',
  sharedHomePaymentFallback: 'If your UPI app cannot open, use these payment details:',
  sharedHomeNoUpiPaymentFallback: 'No valid UPI ID is available. Share the request or use the contact details in the Shared Home.',
  sharedHomePaymentPending: 'Opening UPI never marks this settlement as paid. The Manager must mark it as Paid after confirmation.',
  sharedHomePaymentLinkCopied: 'Payment link copied',
  sharedHomeShareSuccess: 'Payment request shared',
  sharedHomeMarkPaid: 'Mark as Paid',
  sharedHomeQrUnavailable: 'QR could not be generated. Copy the UPI ID or payment link instead.',
  sharedHomeVariable: 'Variable',
  sharedHomeRoom: 'Room',
  sharedHomeCurrent: 'current',
  sharedHomeMembersCount: 'members',
  sharedHomeCloseMonth: 'Close Month',
  sharedHomeEveryoneSettled: 'Everyone is settled for this month.',
  sharedHomeSuggestedMinimum: 'Suggested minimum settlement',
  sharedHomeMonthSummary: 'summary',
  sharedHomeTotalHouseholdExpense: 'Total household expense',
  sharedHomeActivityHistory: 'Activity history',
  sharedHomeViewCalculation: 'View Calculation',
  sharedHomeApplicableDaysRate: '{{days}} applicable days · daily rate {{rate}}',
  sharedHomeUnknown: 'Unknown',
  sharedHomeCategoryGroceries: 'Groceries',
  sharedHomeCategoryUtilities: 'Utilities',
  sharedHomeExpenseNamePlaceholder: 'Electricity, groceries, cleaning...',
  sharedHomeAmountPlaceholder: '₹100',
  sharedHomeGroceryItemPlaceholder: 'Item',
  sharedHomeZeroAmountPlaceholder: '₹0',
  sharedHomeType: 'Type',
  sharedHomeAmountMode: 'Amount mode',
  sharedHomeFixedAmount: 'Fixed amount',
  sharedHomeVariableAmount: 'Variable — enter each month',
  sharedHomeAutoAddFixed: 'Automatically add fixed amount each month',
  sharedHomeNotFound: 'Shared Home not found.',
  sharedHomeBack: 'Back',
  sharedHomeBasis: 'basis',
  sharedHomePaidByLabel: 'Paid by',
  sharedHomeSharedByLabel: 'Shared by',
  sharedHomeInactiveLabel: 'Inactive',
  sharedHomeMoveInLabel: 'Move-in',
  sharedHomeRemovedRoom: 'Removed room',
  sharedHomePaymentPaidTo: 'paid',
  sharedHomeSummaryOf: 'summary',
  sharedHomeManualOverrideActivity: 'manual override',
  sharedHomeOwesTo: 'owes',
  sharedHomePaidTo: 'paid to',
  sharedHomeCalculationDaysRate: '{{days}} applicable days · daily rate {{rate}}',
  sharedHomeInvalidLink: 'This Shared Home link is invalid or expired.',
  sharedHomeMonthLabel: 'Month',
  sharedHomeAvatarPlaceholder: '🙂 or https://...',
  sharedHomeZeroPercentagePlaceholder: '0%',
  sharedHomeEqualPerPerson: 'Equal Per Person',
  sharedHomeEqualPerRoom: 'Equal Per Room',
  sharedHomeRoomFixedRent: 'Room-wise Fixed Rent',
  sharedHomeStayDaysBased: 'Stay Days Based',
  sharedHomeRequiredMessage: '{{field}} is required.',
  sharedHomeGreaterThanZeroMessage: '{{field}} must be greater than zero.',
  sharedHomeChangedTotalReasonMessage: '{{field}} is required when the total is changed.',
  sharedHomeOptionalPlaceholder: 'Optional',
  sharedHomeRoomNamePlaceholder: 'Master Bedroom',
  sharedHomeRecurringAdded: '{{count}} recurring expense(s) added for {{month}}.',
  sharedHomeRecurringRuleAdded: '{{name}} was added as a monthly recurring rule.',
  sharedHomeRecurringRuleUpdated: '{{name}} recurring rule was updated.',
  sharedHomeExpenseAdded: '{{name}} of {{amount}} was added.',
  sharedHomeMemberUpdated: '{{name}} was updated in the home.',
  sharedHomeMemberAdded: '{{name}} was added to the home.',
  sharedHomeRemoveMemberConfirm: 'Remove {{name}} from this home? Historical expenses remain unchanged.',
  sharedHomeMemberInactive: '{{name}} was marked inactive.',
  sharedHomeDeleteRoomConfirm: 'Delete {{name}}? Member history will be retained.',
  sharedHomeRoomUpdated: '{{name}} was updated.',
  sharedHomeRoomAdded: '{{name}} was added.',
  sharedHomeRoomDeleted: '{{name}} was deleted.',
  sharedHomeMemberAssigned: '{{member}} was assigned to {{room}}.',
  sharedHomeRentConfigured: '{{month}} rent of {{amount}} was configured{{adjustment}}.',
  sharedHomeSettlementRecorded: '{{from}} recorded a {{amount}} settlement to {{to}}.',
  sharedHomeShareCopied: 'Shared Home link copied.',
  sharedHomeShareFailed: 'Unable to share or copy the Shared Home link.',
  sharedHomeUnsettledCloseConfirm: 'There are {{count}} unsettled balances. Close {{month}} anyway?',
  sharedHomeClosed: '{{month}} was closed.',
  sharedHomeSettlementCancelled: '{{member}} settlement was cancelled.',
  sharedHomeCreateNamePlaceholder: 'Kochi Flatmates',
  sharedHomeBackToKharcha: 'Back to Kharcha',
  sharedHomeBackAriaLabel: 'Back',
  sharedHomeEmptyPrompt: 'Create your first trip or shared home.',
  sharedHomeListTitle: 'Shared Homes',
  sharedHomeDescriptionFallback: 'Shared household expenses',
  sharedHomeMembersShort: '{{count}} members',
  sharedHomeCreatedActivity: 'Shared Home “{{name}}” was created.',
  sharedHomeSearchPlaceholder: 'Search expense name, category, member, amount, or date',
  sharedHomeFilterCategory: 'Category',
  sharedHomeFilterMember: 'Member',
  sharedHomeAllCategories: 'All categories',
  sharedHomeAllMembers: 'All members',
  sharedHomeSortNewest: 'Latest first',
  sharedHomeSortOldest: 'Oldest first',
  sharedHomeSortHighest: 'Highest amount',
  sharedHomeSortLowest: 'Lowest amount',
  sharedHomeCancelExpenseConfirm: 'Cancelling this expense will change member balances. Continue?',
  sharedHomeExpenseCancelled: '{{name}} was cancelled and retained in history.',
  sharedHomeReceipt: 'Receipt',
  sharedHomeReceiptOptional: 'Optional image, PDF, or receipt URL',
  sharedHomeDownloadCsv: 'Download CSV',
  sharedHomePrintPdf: 'Print / Save PDF',
  sharedHomeStop: 'Stop',
  sharedHomeStopRuleConfirm: 'Stop {{name}} permanently? Previous records will be preserved.',
  sharedHomeRuleStopped: '{{name}} was stopped.',
  sharedHomeRuleHistory: 'History',
  sharedHomeNoHistory: 'No generated records yet.',
  sharedHomeCloseSummary: 'Review: {{expenses}} expenses, {{total}} total household expense, {{pending}} pending settlements.',
  sharedHomeCancel: 'Cancel record',
  sharedHomeCancelled: 'Cancelled (kept in history)',
  groupFunds: 'Group Funds',
  groupFundsDescription: 'Manage office, club, and common collections.',
  openFunds: 'Open Funds',
  personalBudget: 'Personal Budget',
  personalBudgetDescription: 'Private income, expenses, goals, and household planning.',
  personalBudgetOverview: 'Overview',
  personalBudgetIncome: 'Income',
  personalBudgetExpenses: 'Expenses',
  personalBudgetRecurring: 'Recurring',
  personalBudgetFamily: 'Family',
  personalBudgetGoals: 'Goals',
  personalBudgetCalendar: 'Calendar',
  personalBudgetReports: 'Reports',
  personalBudgetSettings: 'Settings',
  personalBudgetExpectedIncome: 'Expected Income',
  personalBudgetPlannedExpenses: 'Planned Expenses',
  personalBudgetActualExpenses: 'Actual Expenses',
  personalBudgetRemaining: 'Remaining',
  personalBudgetSavings: 'Savings',
  personalBudgetUsed: 'Budget Used',
  personalBudgetNoIncome: 'No income added yet',
  personalBudgetAddFirstIncome: 'Add your first income',
  personalBudgetNoExpenses: 'No expenses planned yet',
  personalBudgetAddFirstExpense: 'Add your first expense',
  personalBudgetStartTitle: 'Start managing your personal finances',
  personalBudgetStartDescription: 'Add your income and regular expenses to see your budget.',
  personalBudgetPreviousMonth: 'Previous Month',
  personalBudgetNextMonth: 'Next Month',
  personalBudgetAddIncome: 'Add Income',
  personalBudgetAddExpense: 'Add Expense',
  personalBudgetAddRecurring: 'Add Recurring',
  personalBudgetAddGoal: 'Add Goal',
  personalBudgetComingSoon: 'This Step One foundation is ready. Detailed management will be added in the next step.',
  personalBudgetNoData: 'No data for this month yet.',
  personalBudgetAddIncomeSource: 'Add Income Source',
  personalBudgetAddIncomeTransaction: 'Record Actual Income',
  personalBudgetIncomeSources: 'Income Sources',
  personalBudgetIncomeHistory: 'Income History',
  personalBudgetActualReceived: 'Actual Received Income',
  personalBudgetExpected: 'Expected',
  personalBudgetReceived: 'Received',
  personalBudgetPending: 'Pending',
  personalBudgetVariable: 'Variable',
  personalBudgetActive: 'Active',
  personalBudgetArchived: 'Archived',
  personalBudgetEdit: 'Edit',
  personalBudgetArchive: 'Archive',
  personalBudgetDelete: 'Delete',
  personalBudgetViewHistory: 'View History',
  personalBudgetIncomeName: 'Income Name',
  personalBudgetRecurringSaved: 'Recurring expense saved',
  personalBudgetRecurringDescription: 'Rules create planned expenses for each applicable day, week, or month.',
  personalBudgetRuleName: 'Recurring Expense Name',
  personalBudgetNoRecurringRules: 'No recurring expenses yet',
  personalBudgetOccurrences: 'This Month\'s Recurring Occurrences',
  personalBudgetNoOccurrences: 'No recurring occurrences for this month.',
  personalBudgetPaused: 'Paused',
  personalBudgetPause: 'Pause',
  personalBudgetResume: 'Resume',
  personalBudgetPaid: 'Paid',
  personalBudgetSkipped: 'Skipped',
  personalBudgetMarkPaid: 'Mark Paid',
  personalBudgetMarkPending: 'Mark Pending',
  personalBudgetMarkSkipped: 'Skip',
  personalBudgetExcludeFromBudget: 'Excluded from budget',
  personalBudgetRecurringBudgetQuestion: 'Include recurring expenses in this household budget',
  personalBudgetCategory: 'Category',
  personalBudgetAmount: 'Amount',
  personalBudgetFrequency: 'Frequency',
  personalBudgetExpectedDate: 'Expected Date',
  personalBudgetStartDate: 'Start Date',
  personalBudgetEndDate: 'End Date',
  personalBudgetPerson: 'Person',
  personalBudgetIncludeInBudget: 'Include in Household Budget',
  personalBudgetSave: 'Save',
  personalBudgetAddTransaction: 'Add Transaction',
  personalBudgetTransactionDate: 'Transaction Date',
  personalBudgetActualAmount: 'Actual Amount',
  personalBudgetThisMonth: 'This Month',
  personalBudgetLastMonth: 'Last Month',
  personalBudgetCustomRange: 'Custom Date Range',
  personalBudgetFrom: 'From',
  personalBudgetTo: 'To',
  personalBudgetPaymentMethod: 'Payment Method',
  personalBudgetNote: 'Note',
  personalBudgetSubcategory: 'Subcategory',
  personalBudgetManageCategories: 'Manage Categories',
  personalBudgetAddCustomCategory: 'Add Custom Category',
  personalBudgetCategoryName: 'Category Name',
  personalBudgetIcon: 'Icon (optional)',
  personalBudgetCategoryBudget: 'Category Budget',
  personalBudgetBudgetAmount: 'Budget Amount',
  personalBudgetSetBudget: 'Set Budget',
  personalBudgetUnderBudget: 'Under Budget',
  personalBudgetNearLimit: 'Near Limit',
  personalBudgetOverBudget: 'Over Budget',
  personalBudgetTopCategories: 'Top Expense Categories',
  personalBudgetConfirmDelete: 'Delete this record? This cannot be undone.',
  personalBudgetAdd: 'Add',
  personalBudgetSuccessIncome: 'Income added',
  personalBudgetSuccessExpense: 'Expense added',
  personalBudgetNoSources: 'No income sources yet',
  personalBudgetNoExpensesMonth: 'No expenses recorded for this month.',
  personalBudgetArchiveConfirm: 'Archive this income source?',
  personalBudgetHistoryEmpty: 'No history recorded yet.',
  personalBudgetExpectedAmount: 'Expected Amount',
  personalBudgetDailyExpense: 'Daily Expense',
  personalBudgetWeeklyExpense: 'Weekly Expense',
  personalBudgetOneTimeExpense: 'Other / One-Time',
  personalBudgetCommitted: 'Committed',
  personalBudgetDaily: 'Daily',
  personalBudgetWeekly: 'Weekly',
  personalBudgetRemainingCash: 'Remaining Cash',
  personalBudgetSafeSpendingAmount: 'Safe Spending Amount',
  personalBudgetSuggestedDailyLimit: 'Suggested Daily Limit',
  personalBudgetTodaysSpending: "Today's Spending",
  personalBudgetGoalCommitments: 'Goal Commitments',
  personalBudgetSmartGuidance: 'Smart Budget Guidance',
  personalBudgetGuidanceOnly: 'Guidance only — Kharcha never moves money automatically.',
  personalBudgetGoalsTitle: 'Goals',
  personalBudgetAddToGoal: 'Add to Goal',
  personalBudgetEditGoal: 'Edit Goal',
  personalBudgetGoalName: 'Goal Name',
  personalBudgetTargetAmount: 'Target Amount',
  personalBudgetCurrentSavedAmount: 'Current Saved Amount',
  personalBudgetTargetDate: 'Target Date',
  personalBudgetPriority: 'Priority',
  personalBudgetMonthlyAllocation: 'Monthly Allocation (optional)',
  personalBudgetGoalNote: 'Goal Note (optional)',
  personalBudgetActiveGoal: 'Active Goal',
  personalBudgetGoalSaved: 'Goal saved',
  personalBudgetGoalContributionSaved: 'Goal contribution saved',
  welcomeTitle: 'Welcome to Kharcha',
  welcomeSubtitle: 'Kharcha is a secure local-first expense management app for trips, shared homes, group funds, and personal budgets. All your data is stored locally on your device for complete privacy and offline use. You manage everything locally, and can share read-only expense views with others easily.',
  kharchaNotes: 'Kharcha Notes',
  okGotIt: 'OK, Let\'s Start',
  personalBudgetNextOccurrence: 'Next occurrence', personalBudgetMonthlyCommitment: 'Monthly Recurring Commitment', personalBudgetRecurringPaid: 'Recurring Paid', personalBudgetRecurringPending: 'Recurring Pending', personalBudgetRecurringSkipped: 'Recurring Skipped', personalBudgetToday: 'Today', personalBudgetUpcoming: 'Upcoming', personalBudgetActiveRules: 'Active Rules', personalBudgetArchivedRules: 'Archived', personalBudgetSkipFrom: 'Skip from date', personalBudgetSkipTo: 'Skip until date', personalBudgetPauseFrom: 'Pause from date', personalBudgetPauseTo: 'Pause until date', personalBudgetBulkPaidConfirm: 'Mark all today\'s recurring expenses as paid?', personalBudgetDeleteFutureConfirm: 'Delete this recurring rule and future occurrences? Historical paid records will remain.', personalBudgetDeleteFuture: 'Delete Future Recurrence', personalBudgetArchiveRule: 'Archive Rule', personalBudgetCancelled: 'Cancelled', personalBudgetMarkCancelled: 'Cancel occurrence', personalBudgetViewDetails: 'View details', personalBudgetActualAmountPrompt: 'Enter actual amount', personalBudgetOccurrenceDetails: 'Occurrence Details', personalBudgetMonthlyProvision: 'Monthly provision/equivalent',   personalBudgetUpcomingEmpty: 'No recurring expenses due in the next 7 days.', personalBudgetNoSkipped: 'No skipped recurring expenses.',
  helpGuideTitle: 'Help & Guide',
  helpGuideSubtitle: 'Learn how to use Kharcha',
  needHelp: 'Need help?',
  emailUsAt: 'Email us at:',
  backToGuides: 'Back to Guides',
  reportsAnalytics: 'Reports & Analytics',
  reportsSubtitle: 'Comprehensive financial insights and spending summaries.',
  thisMonth: 'This Month',
  allRecords: 'All Records',
  totalIncome: 'Total Income',
  verifiedInflow: 'Verified Inflow',
  totalExpenses: 'Total Expenses',
  paidActive: 'Paid & Active',
  netSavings: 'Net Savings',
  incomeMinusExpense: 'Income Minus Expense',
  savingsRate: 'Savings Rate',
  healthySurplus: 'Healthy Surplus',
  deficit: 'Deficit',
  expenseBreakdown: 'Expense Breakdown',
  noExpenseRecords: 'No expense records found for this period.',
  budgetLimitsPerformance: 'Budget Limits & Performance',
  noCategoryBudgets: 'No category budget limits set for this month.',
  used: 'Used',
  spent: 'Spent',
  limit: 'Limit',
  generalTab: 'General',
  backupTab: 'Backup & Restore',
  securityTab: 'Security',
  helpGuideTab: '❓ Help & Guide',
  editMember: 'Edit Member',
  updateMemberName: "Update the member's name",
  memberName: 'Member Name',


  enterMemberNamePlaceholder: 'Enter member name',
  mobileNumberOptional: 'Mobile Number (Optional)',
  tenDigitNumber: '10-digit number',
  upiIdOptional: 'UPI ID (Optional)',
  upiPlaceholder: 'name@bankcode',
  upiExample: 'Example: user@okhdfcbank, name@ybl',
  saveChanges: 'Save Changes',
  enterMemberName: 'Please enter a member name',
  memberAlreadyExists: 'A member with this name already exists',
  selectContactsToAdd: 'Select contacts to add as trip members',
  contactsSelected: 'contacts selected',
  selectAll: 'Select All',
  clearAll: 'Clear All',
  unnamedContact: 'Unnamed Contact',
  noPhoneEmail: 'No phone/email',
  addSelected: 'Add Selected',
  sharedHomeSummaryReport: 'Summary Report',
  sharedHomeTotalExpenses: 'Total Expenses',
  sharedHomeTotalOutlay: 'Total Household Outlay',
  sharedHomeMajorCategories: 'Major Expense Categories',
  sharedHomeBalances: 'Balances',
  backupRestoreData: 'Backup & Restore Data',
  backupDesc: 'Your Kharcha data is stored locally on this device. Export regularly to prevent loss.',
  lastBackup: 'Last Backup',
  localStorageActive: 'Local storage active',
  exportBackupJson: 'Export Backup (.json)',
  importBackup: 'Import Backup',
  shareBackupApps: 'Share Backup via WhatsApp / Apps',
  restorePreview: 'Restore Preview',
  backupDate: 'Backup Date',
  transactions: 'Transactions',
  goals: 'Goals',
  continueRestore: 'Continue Restore',
  appLockSecurity: 'App Lock Security',
  appLockDesc: 'Protect your financial records with a Kharcha PIN or your phone screen lock.',
  enableAppLock: 'Enable App Lock',
  lockMethodLabel: 'Unlock with',
  pinMethod: 'Kharcha PIN',
  deviceLockMethod: 'Phone screen lock',
  deviceLockHint: 'Uses your phone PIN, pattern, password, or biometrics in the Android app.',
  deviceLockUnavailable: 'Set a secure screen lock on your phone first, then select this option.',
  pinCodeLabel: 'PIN Code (4 or 6 digits)',
  enterPinPlaceholder: 'Enter PIN',
  confirmPinLabel: 'Confirm PIN',
  confirmPinPlaceholder: 'Confirm PIN',
  autoLockTimeout: 'Auto-lock Timeout',
  timeoutImmediate: 'Immediately',
  timeout1min: 'After 1 minute',
  timeout5min: 'After 5 minutes',
  unlockTitle: 'Unlock Kharcha',
  unlockDescription: 'Enter your Kharcha PIN to continue.',
  unlockPinButton: 'Unlock',
  unlockUseDevice: 'Use phone lock',
  unlockIncorrectPin: 'Incorrect PIN. Try again.',
  deviceAuthUnavailable: 'Phone screen lock is not available on this device.',
  deviceAuthCanceled: 'Phone authentication was cancelled.',
  deviceAuthFailed: 'Phone authentication failed. Try again.',
};

const translations: Record<LanguageCode, TranslationDictionary> = {
  en: english,
  ml: {
    language: 'ഭാഷ', splitExpenses: 'ചെലവ് പങ്കിടൂ, യാത്ര സ്മാർട്ടാക്കൂ', oneTrip: 'ഒരു യാത്ര.', oneTap: 'ഒരു ടാപ്പ്.', loadingTrips: 'യാത്രകൾ ലോഡ് ചെയ്യുന്നു...', noTrips: 'ഇതുവരെ യാത്രകളില്ല. ആദ്യ യാത്ര സൃഷ്ടിക്കൂ!', createTrip: 'യാത്ര സൃഷ്ടിക്കുക', yourTrips: 'നിങ്ങളുടെ യാത്രകൾ', newestFirst: 'പുതിയത് ആദ്യം', oldestFirst: 'പഴയത് ആദ്യം', nameAZ: 'പേര് A-Z', nameZA: 'പേര് Z-A', membersCount: '{{count}} അംഗങ്ങൾ', tripNotFound: 'യാത്ര കണ്ടെത്തിയില്ല', backToTrips: 'യാത്രകളിലേക്ക് മടങ്ങുക', total: 'ആകെ', expenses: 'ചെലവുകൾ', members: 'അംഗങ്ങൾ', payAddExpenseAutomatically: 'പണമടച്ച് ചെലവ് ചേർക്കുക', shareThisTrip: 'ഈ യാത്ര പങ്കിടുക', dashboard: 'ഡാഷ്ബോർഡ്', settle: 'സെറ്റിൽ ചെയ്യുക', howToSplitAddExpense: 'എങ്ങനെ പങ്കിടാം & ചെലവ് ചേർക്കാം', addMember: 'അംഗത്തെ ചേർക്കുക', noMembers: 'ഇതുവരെ അംഗങ്ങളില്ല', paid: 'അടച്ചത്', owes: 'നൽകാനുള്ളത്', edit: 'തിരുത്തുക', delete: 'ഇല്ലാതാക്കുക', createNewTrip: 'പുതിയ യാത്ര സൃഷ്ടിക്കുക', startPlanning: 'അടുത്ത യാത്ര ആസൂത്രണം ചെയ്യാം', tripName: 'യാത്രയുടെ പേര്', description: 'വിവരണം', startDate: 'ആരംഭ തീയതി', endDate: 'അവസാന തീയതി', cancel: 'റദ്ദാക്കുക', copyLink: 'ലിങ്ക് പകർത്തുക', viewOnly: 'കാണാൻ മാത്രം',
  },
  hi: {
    language: 'भाषा', splitExpenses: 'खर्च बाँटें, यात्रा स्मार्ट बनाएं', oneTrip: 'एक यात्रा।', oneTap: 'एक टैप।', loadingTrips: 'यात्राएं लोड हो रही हैं...', noTrips: 'अभी कोई यात्रा नहीं। अपनी पहली यात्रा बनाएं!', createTrip: 'यात्रा बनाएं', yourTrips: 'आपकी यात्राएं', newestFirst: 'नवीनतम पहले', oldestFirst: 'पुरानी पहले', nameAZ: 'नाम A-Z', nameZA: 'नाम Z-A', membersCount: '{{count}} सदस्य', tripNotFound: 'यात्रा नहीं मिली', backToTrips: 'यात्राओं पर वापस जाएं', total: 'कुल', expenses: 'खर्चे', members: 'सदस्य', payAddExpenseAutomatically: 'भुगतान करें और खर्च जोड़ें', shareThisTrip: 'यह यात्रा साझा करें', dashboard: 'डैशबोर्ड', settle: 'निपटान', howToSplitAddExpense: 'कैसे बांटें और खर्च जोड़ें', addMember: 'सदस्य जोड़ें', noMembers: 'अभी कोई सदस्य नहीं', paid: 'भुगतान किया', owes: 'देना है', edit: 'संपादित करें', delete: 'हटाएं', createNewTrip: 'नई यात्रा बनाएं', startPlanning: 'अपने अगले रोमांच की योजना बनाएं', tripName: 'यात्रा का नाम', description: 'विवरण', startDate: 'आरंभ तिथि', endDate: 'अंतिम तिथि', cancel: 'रद्द करें', copyLink: 'लिंक कॉपी करें', viewOnly: 'केवल देखें',
  },
  ta: {
    language: 'மொழி', splitExpenses: 'செலவைப் பகிர்ந்து, பயணத்தை எளிதாக்குங்கள்', oneTrip: 'ஒரு பயணம்.', oneTap: 'ஒரு தட்டு.', loadingTrips: 'பயணங்கள் ஏற்றப்படுகின்றன...', noTrips: 'பயணங்கள் இல்லை. முதல் பயணத்தை உருவாக்குங்கள்!', createTrip: 'பயணம் உருவாக்கு', yourTrips: 'உங்கள் பயணங்கள்', newestFirst: 'புதியது முதலில்', oldestFirst: 'பழையது முதலில்', nameAZ: 'பெயர் A-Z', nameZA: 'பெயர் Z-A', membersCount: '{{count}} உறுப்பினர்கள்', tripNotFound: 'பயணம் கிடைக்கவில்லை', backToTrips: 'பயணங்களுக்குத் திரும்பு', total: 'மொத்தம்', expenses: 'செலவுகள்', members: 'உறுப்பினர்கள்', payAddExpenseAutomatically: 'பணம் செலுத்தி செலவைச் சேர்க்கவும்', shareThisTrip: 'இந்தப் பயணத்தைப் பகிரவும்', dashboard: 'டாஷ்போர்டு', settle: 'தீர்வு', howToSplitAddExpense: 'எப்படிப் பகிர்ந்து செலவைச் சேர்ப்பது', addMember: 'உறுப்பினரைச் சேர்', noMembers: 'உறுப்பினர்கள் இல்லை', paid: 'செலுத்தியது', owes: 'செலுத்த வேண்டியது', edit: 'திருத்து', delete: 'நீக்கு', createNewTrip: 'புதிய பயணத்தை உருவாக்கு', startPlanning: 'அடுத்த சாகசத்தைத் திட்டமிடுங்கள்', tripName: 'பயணப் பெயர்', description: 'விளக்கம்', startDate: 'தொடக்க தேதி', endDate: 'முடிவு தேதி', cancel: 'ரத்து', copyLink: 'இணைப்பை நகலெடு', viewOnly: 'பார்வைக்கு மட்டும்',
  },
  kn: {
    language: 'ಭಾಷೆ', splitExpenses: 'ಖರ್ಚು ಹಂಚಿ, ಪ್ರಯಾಣ ಸ್ಮಾರ್ಟ್ ಮಾಡಿ', oneTrip: 'ಒಂದು ಪ್ರವಾಸ.', oneTap: 'ಒಂದು ಟ್ಯಾಪ್.', loadingTrips: 'ಪ್ರವಾಸಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ...', noTrips: 'ಇನ್ನೂ ಪ್ರವಾಸಗಳಿಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಪ್ರವಾಸ ರಚಿಸಿ!', createTrip: 'ಪ್ರವಾಸ ರಚಿಸಿ', yourTrips: 'ನಿಮ್ಮ ಪ್ರವಾಸಗಳು', newestFirst: 'ಹೊಸದು ಮೊದಲು', oldestFirst: 'ಹಳೆಯದು ಮೊದಲು', nameAZ: 'ಹೆಸರು A-Z', nameZA: 'ಹೆಸರು Z-A', membersCount: '{{count}} ಸದಸ್ಯರು', tripNotFound: 'ಪ್ರವಾಸ ಕಂಡುಬಂದಿಲ್ಲ', backToTrips: 'ಪ್ರವಾಸಗಳಿಗೆ ಹಿಂತಿರುಗಿ', total: 'ಒಟ್ಟು', expenses: 'ಖರ್ಚುಗಳು', members: 'ಸದಸ್ಯರು', payAddExpenseAutomatically: 'ಪಾವತಿಸಿ ಮತ್ತು ಖರ್ಚು ಸೇರಿಸಿ', shareThisTrip: 'ಈ ಪ್ರವಾಸ ಹಂಚಿಕೊಳ್ಳಿ', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', settle: 'ಸೆಟಲ್ ಮಾಡಿ', howToSplitAddExpense: 'ಹೇಗೆ ಹಂಚಿ ಖರ್ಚು ಸೇರಿಸುವುದು', addMember: 'ಸದಸ್ಯ ಸೇರಿಸಿ', noMembers: 'ಇನ್ನೂ ಸದಸ್ಯರಿಲ್ಲ', paid: 'ಪಾವತಿಸಿದ', owes: 'ಕೊಡಬೇಕಾದದ್ದು', edit: 'ತಿದ್ದು', delete: 'ಅಳಿಸಿ', createNewTrip: 'ಹೊಸ ಪ್ರವಾಸ ರಚಿಸಿ', startPlanning: 'ಮುಂದಿನ ಸಾಹಸವನ್ನು ಯೋಜಿಸಿ', tripName: 'ಪ್ರವಾಸದ ಹೆಸರು', description: 'ವಿವರಣೆ', startDate: 'ಆರಂಭ ದಿನಾಂಕ', endDate: 'ಅಂತಿಮ ದಿನಾಂಕ', cancel: 'ರದ್ದುಮಾಡಿ', copyLink: 'ಲಿಂಕ್ ನಕಲಿಸಿ', viewOnly: 'ನೋಡಲು ಮಾತ್ರ',
  },
  te: {
    language: 'భాష', splitExpenses: 'ఖర్చులు పంచుకోండి, ప్రయాణాన్ని స్మార్ట్‌గా చేయండి', oneTrip: 'ఒక ప్రయాణం.', oneTap: 'ఒక ట్యాప్.', loadingTrips: 'ప్రయాణాలు లోడ్ అవుతున్నాయి...', noTrips: 'ఇంకా ప్రయాణాలు లేవు. మొదటి ప్రయాణాన్ని సృష్టించండి!', createTrip: 'ప్రయాణం సృష్టించండి', yourTrips: 'మీ ప్రయాణాలు', newestFirst: 'కొత్తది ముందు', oldestFirst: 'పాతది ముందు', nameAZ: 'పేరు A-Z', nameZA: 'పేరు Z-A', membersCount: '{{count}} సభ్యులు', tripNotFound: 'ప్రయాణం కనబడలేదు', backToTrips: 'ప్రయాణాలకు తిరిగి వెళ్లండి', total: 'మొత్తం', expenses: 'ఖర్చులు', members: 'సభ్యులు', payAddExpenseAutomatically: 'చెల్లించి ఖర్చు జోడించండి', shareThisTrip: 'ఈ ప్రయాణాన్ని పంచుకోండి', dashboard: 'డాష్‌బోర్డ్', settle: 'సెటిల్', howToSplitAddExpense: 'ఎలా పంచి ఖర్చు జోడించాలి', addMember: 'సభ్యుడిని జోడించండి', noMembers: 'ఇంకా సభ్యులు లేరు', paid: 'చెల్లించినది', owes: 'చెల్లించాలి', edit: 'సవరించు', delete: 'తొలగించు', createNewTrip: 'కొత్త ప్రయాణం సృష్టించండి', startPlanning: 'మీ తదుపరి సాహసాన్ని ప్లాన్ చేయండి', tripName: 'ప్రయాణం పేరు', description: 'వివరణ', startDate: 'ప్రారంభ తేదీ', endDate: 'ముగింపు తేదీ', cancel: 'రద్దు', copyLink: 'లింక్ కాపీ చేయండి', viewOnly: 'చూడటానికి మాత్రమే',
  },
  mr: {
    language: 'भाषा', splitExpenses: 'खर्च वाटा, प्रवास स्मार्ट करा', oneTrip: 'एक प्रवास.', oneTap: 'एक टॅप.', loadingTrips: 'प्रवास लोड होत आहेत...', noTrips: 'अजून प्रवास नाहीत. पहिला प्रवास तयार करा!', createTrip: 'प्रवास तयार करा', yourTrips: 'तुमचे प्रवास', newestFirst: 'नवीनतम प्रथम', oldestFirst: 'जुने प्रथम', nameAZ: 'नाव A-Z', nameZA: 'नाव Z-A', membersCount: '{{count}} सदस्य', tripNotFound: 'प्रवास सापडला नाही', backToTrips: 'प्रवासांकडे परत जा', total: 'एकूण', expenses: 'खर्च', members: 'सदस्य', payAddExpenseAutomatically: 'पैसे भरा आणि खर्च जोडा', shareThisTrip: 'हा प्रवास शेअर करा', dashboard: 'डॅशबोर्ड', settle: 'सेटल करा', howToSplitAddExpense: 'खर्च कसा वाटायचा आणि जोडायचा', addMember: 'सदस्य जोडा', noMembers: 'अजून सदस्य नाहीत', paid: 'भरले', owes: 'देणे आहे', edit: 'संपादित करा', delete: 'हटवा', createNewTrip: 'नवीन प्रवास तयार करा', startPlanning: 'पुढील साहसाचे नियोजन करा', tripName: 'प्रवासाचे नाव', description: 'वर्णन', startDate: 'सुरुवातीची तारीख', endDate: 'शेवटची तारीख', cancel: 'रद्द करा', copyLink: 'लिंक कॉपी करा', viewOnly: 'फक्त पाहण्यासाठी',
  },
  bn: {
    language: 'ভাষা', splitExpenses: 'খরচ ভাগ করুন, ভ্রমণ সহজ করুন', oneTrip: 'একটি ভ্রমণ।', oneTap: 'একটি ট্যাপ।', loadingTrips: 'ভ্রমণ লোড হচ্ছে...', noTrips: 'এখনও কোনো ভ্রমণ নেই। প্রথম ভ্রমণ তৈরি করুন!', createTrip: 'ভ্রমণ তৈরি করুন', yourTrips: 'আপনার ভ্রমণ', newestFirst: 'নতুন আগে', oldestFirst: 'পুরনো আগে', nameAZ: 'নাম A-Z', nameZA: 'নাম Z-A', membersCount: '{{count}} জন সদস্য', tripNotFound: 'ভ্রমণ পাওয়া যায়নি', backToTrips: 'ভ্রমণে ফিরে যান', total: 'মোট', expenses: 'খরচ', members: 'সদস্য', payAddExpenseAutomatically: 'পেমেন্ট করে খরচ যোগ করুন', shareThisTrip: 'এই ভ্রমণ শেয়ার করুন', dashboard: 'ড্যাশবোর্ড', settle: 'মীমাংসা', howToSplitAddExpense: 'কীভাবে ভাগ করে খরচ যোগ করবেন', addMember: 'সদস্য যোগ করুন', noMembers: 'এখনও কোনো সদস্য নেই', paid: 'দেওয়া হয়েছে', owes: 'দিতে হবে', edit: 'সম্পাদনা', delete: 'মুছুন', createNewTrip: 'নতুন ভ্রমণ তৈরি করুন', startPlanning: 'আপনার পরবর্তী অভিযানের পরিকল্পনা করুন', tripName: 'ভ্রমণের নাম', description: 'বিবরণ', startDate: 'শুরুর তারিখ', endDate: 'শেষের তারিখ', cancel: 'বাতিল', copyLink: 'লিঙ্ক কপি করুন', viewOnly: 'শুধু দেখুন',
  },
  gu: {
    language: 'ભાષા', splitExpenses: 'ખર્ચ વહેંચો, પ્રવાસ સ્માર્ટ બનાવો', oneTrip: 'એક પ્રવાસ.', oneTap: 'એક ટેપ.', loadingTrips: 'પ્રવાસ લોડ થઈ રહ્યા છે...', noTrips: 'હજુ કોઈ પ્રવાસ નથી. પહેલો પ્રવાસ બનાવો!', createTrip: 'પ્રવાસ બનાવો', yourTrips: 'તમારા પ્રવાસો', newestFirst: 'નવું પહેલા', oldestFirst: 'જૂનું પહેલા', nameAZ: 'નામ A-Z', nameZA: 'નામ Z-A', membersCount: '{{count}} સભ્યો', tripNotFound: 'પ્રવાસ મળ્યો નથી', backToTrips: 'પ્રવાસો પર પાછા જાઓ', total: 'કુલ', expenses: 'ખર્ચ', members: 'સભ્યો', payAddExpenseAutomatically: 'ચુકવણી કરો અને ખર્ચ ઉમેરો', shareThisTrip: 'આ પ્રવાસ શેર કરો', dashboard: 'ડેશબોર્ડ', settle: 'સેટલ કરો', howToSplitAddExpense: 'ખર્ચ કેવી રીતે વહેંચવો અને ઉમેરવો', addMember: 'સભ્ય ઉમેરો', noMembers: 'હજુ સભ્યો નથી', paid: 'ચૂકવેલ', owes: 'ચૂકવવાનું', edit: 'ફેરફાર', delete: 'કાઢી નાખો', createNewTrip: 'નવો પ્રવાસ બનાવો', startPlanning: 'આગામી સાહસનું આયોજન કરો', tripName: 'પ્રવાસનું નામ', description: 'વર્ણન', startDate: 'શરૂઆતની તારીખ', endDate: 'અંતિમ તારીખ', cancel: 'રદ કરો', copyLink: 'લિંક કૉપી કરો', viewOnly: 'માત્ર જોવા માટે',
  },
  pa: {
    language: 'ਭਾਸ਼ਾ', splitExpenses: 'ਖਰਚੇ ਵੰਡੋ, ਯਾਤਰਾ ਆਸਾਨ ਬਣਾਓ', oneTrip: 'ਇੱਕ ਯਾਤਰਾ।', oneTap: 'ਇੱਕ ਟੈਪ।', loadingTrips: 'ਯਾਤਰਾਵਾਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...', noTrips: 'ਹਾਲੇ ਕੋਈ ਯਾਤਰਾ ਨਹੀਂ। ਆਪਣੀ ਪਹਿਲੀ ਯਾਤਰਾ ਬਣਾਓ!', createTrip: 'ਯਾਤਰਾ ਬਣਾਓ', yourTrips: 'ਤੁਹਾਡੀਆਂ ਯਾਤਰਾਵਾਂ', newestFirst: 'ਨਵਾਂ ਪਹਿਲਾਂ', oldestFirst: 'ਪੁਰਾਣਾ ਪਹਿਲਾਂ', nameAZ: 'ਨਾਮ A-Z', nameZA: 'ਨਾਮ Z-A', membersCount: '{{count}} ਮੈਂਬਰ', tripNotFound: 'ਯਾਤਰਾ ਨਹੀਂ ਮਿਲੀ', backToTrips: 'ਯਾਤਰਾਵਾਂ ਵੱਲ ਵਾਪਸ', total: 'ਕੁੱਲ', expenses: 'ਖਰਚੇ', members: 'ਮੈਂਬਰ', payAddExpenseAutomatically: 'ਭੁਗਤਾਨ ਕਰੋ ਅਤੇ ਖਰਚਾ ਜੋੜੋ', shareThisTrip: 'ਇਹ ਯਾਤਰਾ ਸਾਂਝੀ ਕਰੋ', dashboard: 'ਡੈਸ਼ਬੋਰਡ', settle: 'ਨਿਪਟਾਰਾ', howToSplitAddExpense: 'ਖਰਚਾ ਕਿਵੇਂ ਵੰਡਣਾ ਅਤੇ ਜੋੜਨਾ ਹੈ', addMember: 'ਮੈਂਬਰ ਜੋੜੋ', noMembers: 'ਹਾਲੇ ਕੋਈ ਮੈਂਬਰ ਨਹੀਂ', paid: 'ਭੁਗਤਾਨ ਕੀਤਾ', owes: 'ਦੇਣਾ ਹੈ', edit: 'ਸੋਧੋ', delete: 'ਮਿਟਾਓ', createNewTrip: 'ਨਵੀਂ ਯਾਤਰਾ ਬਣਾਓ', startPlanning: 'ਅਗਲੇ ਸਾਹਸ ਦੀ ਯੋਜਨਾ ਬਣਾਓ', tripName: 'ਯਾਤਰਾ ਦਾ ਨਾਮ', description: 'ਵੇਰਵਾ', startDate: 'ਸ਼ੁਰੂਆਤੀ ਮਿਤੀ', endDate: 'ਅੰਤਿਮ ਮਿਤੀ', cancel: 'ਰੱਦ ਕਰੋ', copyLink: 'ਲਿੰਕ ਕਾਪੀ ਕਰੋ', viewOnly: 'ਸਿਰਫ਼ ਵੇਖਣ ਲਈ',
  },
  or: {
    language: 'ଭାଷା', splitExpenses: 'ଖର୍ଚ୍ଚ ବାଣ୍ଟନ୍ତୁ, ଯାତ୍ରା ସହଜ କରନ୍ତୁ', oneTrip: 'ଗୋଟିଏ ଯାତ୍ରା।', oneTap: 'ଗୋଟିଏ ଟ୍ୟାପ୍।', loadingTrips: 'ଯାତ୍ରା ଲୋଡ୍ ହେଉଛି...', noTrips: 'ଏପର୍ଯ୍ୟନ୍ତ ଯାତ୍ରା ନାହିଁ। ପ୍ରଥମ ଯାତ୍ରା ତିଆରି କରନ୍ତୁ!', createTrip: 'ଯାତ୍ରା ତିଆରି କରନ୍ତୁ', yourTrips: 'ଆପଣଙ୍କ ଯାତ୍ରା', newestFirst: 'ନୂଆ ପ୍ରଥମେ', oldestFirst: 'ପୁରୁଣା ପ୍ରଥମେ', nameAZ: 'ନାମ A-Z', nameZA: 'ନାମ Z-A', membersCount: '{{count}} ସଦସ୍ୟ', tripNotFound: 'ଯାତ୍ରା ମିଳିଲା ନାହିଁ', backToTrips: 'ଯାତ୍ରାକୁ ଫେରନ୍ତୁ', total: 'ମୋଟ', expenses: 'ଖର୍ଚ୍ଚ', members: 'ସଦସ୍ୟ', payAddExpenseAutomatically: 'ପେମେଣ୍ଟ କରି ଖର୍ଚ୍ଚ ଯୋଡନ୍ତୁ', shareThisTrip: 'ଏହି ଯାତ୍ରା ସେୟାର କରନ୍ତୁ', dashboard: 'ଡ୍ୟାସବୋର୍ଡ', settle: 'ସମାଧାନ', howToSplitAddExpense: 'କିପରି ବାଣ୍ଟି ଖର୍ଚ୍ଚ ଯୋଡିବେ', addMember: 'ସଦସ୍ୟ ଯୋଡନ୍ତୁ', noMembers: 'ଏପର୍ଯ୍ୟନ୍ତ ସଦସ୍ୟ ନାହାନ୍ତି', paid: 'ଦିଆଯାଇଛି', owes: 'ଦେବାକୁ ଅଛି', edit: 'ସମ୍ପାଦନା', delete: 'ବିଲୋପ', createNewTrip: 'ନୂଆ ଯାତ୍ରା ତିଆରି କରନ୍ତୁ', startPlanning: 'ପରବର୍ତ୍ତୀ ଯାତ୍ରା ଯୋଜନା କରନ୍ତୁ', tripName: 'ଯାତ୍ରାର ନାମ', description: 'ବିବରଣୀ', startDate: 'ଆରମ୍ଭ ତାରିଖ', endDate: 'ଶେଷ ତାରିଖ', cancel: 'ବାତିଲ', copyLink: 'ଲିଙ୍କ କପି କରନ୍ତୁ', viewOnly: 'କେବଳ ଦେଖିବା ପାଇଁ',
  },
  as: {
    language: 'ভাষা', splitExpenses: 'খৰচ ভাগ কৰক, ভ্ৰমণ সহজ কৰক', oneTrip: 'এটা ভ্ৰমণ।', oneTap: 'এটা টেপ।', loadingTrips: 'ভ্ৰমণ লোড হৈ আছে...', noTrips: 'এতিয়ালৈ কোনো ভ্ৰমণ নাই। প্ৰথম ভ্ৰমণ সৃষ্টি কৰক!', createTrip: 'ভ্ৰমণ সৃষ্টি কৰক', yourTrips: 'আপোনাৰ ভ্ৰমণ', newestFirst: 'নতুন প্ৰথমে', oldestFirst: 'পুৰণি প্ৰথমে', nameAZ: 'নাম A-Z', nameZA: 'নাম Z-A', membersCount: '{{count}} জন সদস্য', tripNotFound: 'ভ্ৰমণ পোৱা নগ’ল', backToTrips: 'ভ্ৰমণলৈ উভতি যাওক', total: 'মুঠ', expenses: 'খৰচ', members: 'সদস্য', payAddExpenseAutomatically: 'পেমেণ্ট কৰি খৰচ যোগ কৰক', shareThisTrip: 'এই ভ্ৰমণ শ্বেয়াৰ কৰক', dashboard: 'ডেশ্বব’ৰ্ড', settle: 'নিষ্পত্তি', howToSplitAddExpense: 'কেনেকৈ ভাগ কৰি খৰচ যোগ কৰিব', addMember: 'সদস্য যোগ কৰক', noMembers: 'এতিয়ালৈ কোনো সদস্য নাই', paid: 'দিয়া হৈছে', owes: 'দিবলগীয়া', edit: 'সম্পাদনা', delete: 'মচি পেলাওক', createNewTrip: 'নতুন ভ্ৰমণ সৃষ্টি কৰক', startPlanning: 'পৰৱৰ্তী অভিযানৰ পৰিকল্পনা কৰক', tripName: 'ভ্ৰমণৰ নাম', description: 'বিৱৰণ', startDate: 'আৰম্ভণিৰ তাৰিখ', endDate: 'শেষ তাৰিখ', cancel: 'বাতিল', copyLink: 'লিংক কপি কৰক', viewOnly: 'কেৱল চোৱাৰ বাবে',
  },
};

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languages: typeof SUPPORTED_LANGUAGES;
  t: (key: TranslationKey, variables?: Variables) => string;
}

const STORAGE_KEY = 'kharcha-language';
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function translate(language: LanguageCode, key: TranslationKey, variables?: Variables): string {
  const explicit = translations[language][key] ?? languageExtras[language]?.[key];
  const source = auditEnglishSources[key] ?? english[key] ?? key;
  const template = explicit ?? source;
  const knownSourceKey = key in auditEnglishSources || key in english;
  const localized = !explicit || (knownSourceKey && explicit === source) ? localizeFallback(language, template) : template;
  return Object.entries(variables ?? {}).reduce(
    (result, [name, replacement]) => result.replaceAll(`{{${name}}}`, String(replacement)),
    localized,
  );
}

function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  return SUPPORTED_LANGUAGES.some(item => item.code === saved) ? saved! : 'en';
}

export function LanguageProvider({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: LanguageCode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => initialLanguage ?? getInitialLanguage());

  const setLanguage = (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
    t: (key, variables) => translate(language, key, variables),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
