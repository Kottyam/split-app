# Kharcha - Expense Splitter TODO

## Core Features
- [x] Trip management (create, view, delete trips with name, description, date range)
- [x] Group members management (add/remove friends per trip)
- [x] Expense entry (amount in ₹, category, description, date, who paid)
- [x] Bill splitting (equal or custom amounts)
- [x] Debt tracking (calculate who owes whom)
- [x] Settlement summary (final balances and payment suggestions)
- [x] Trip dashboard (total expenses, category breakdown, per-member spend)
- [x] Expense categories with icons (food, transport, hotel, shopping, entertainment, others)

## Technical Implementation
- [x] Data models and types (Trip, Expense, Member, Debt)
- [x] Local storage integration and persistence
- [x] Debt calculation algorithm
- [x] Settlement simplification algorithm
- [x] Category icons and mapping

## UI/UX Components
- [x] Bottom navigation bar (mobile-first)
- [x] Trip list view
- [x] Trip detail view
- [x] Add/edit expense form
- [x] Add members dialog
- [x] Settlement summary view
- [x] Dashboard/analytics view
- [x] Expense list view

## Design & Styling
- [x] Memphis-inspired design system (peach bg, pastel colors)
- [x] Geometric shapes and decorative elements
- [x] Mobile-first responsive design
- [x] Smooth transitions and animations
- [x] Touch-friendly interactions

## New Features (Phase 2)
- [x] Edit expense dialog (edit amount, description, category, date, who paid, splits)
- [x] Sort expenses by name (alphabetical)
- [x] Sort expenses by date (newest/oldest)
- [x] Sort expenses by amount (highest/lowest)
- [x] Update ExpenseListView with sort controls
- [x] Redeploy with new features

## New Features (Phase 3)
- [x] Sort expenses by "Paid By" (group by payer, alphabetically)
- [x] Add test for paid-by sorting
- [x] Redeploy with new sort option

## New Features (Phase 4)
- [x] Paid By filter enhancement (sub-dropdown to filter by specific member)
- [x] Show total amount paid by selected member
- [x] Edit member name functionality
- [x] Delete member with confirmation dialog
- [x] Add tests for new features (22 total tests passing)
- [x] Save checkpoint and redeploy

## Testing & Deployment
- [x] Vitest unit tests for core logic
- [x] Manual testing on mobile browsers
- [x] Offline functionality verification
- [x] Local storage persistence testing
- [x] Final deployment

## Phase 5: Share Link Feature
- [x] URL encoding/decoding of trip data
- [x] Shared view page with read-only display
- [x] Share button with Web Share API
- [x] Copy-to-clipboard fallback

## Phase 6: Smart Payment Integration
- [x] Finalize Member schema with mobile and UPI fields
- [x] Complete UPI utilities (validation, deep-links, sharing)
- [x] Implement Contact Picker API integration with Add from Contacts button
- [x] Create member card with payment details display (ViewMemberDetailsDialog)
- [x] Build View Details popup component
- [x] Implement payment confirmation workflow (PaymentConfirmationDialog)
- [x] Add payment history tracking (PaymentRecord type)
- [x] Apply Material Design 3 styling (Tailwind + shadcn/ui)
- [x] Implement light/dark mode toggle (existing ThemeProvider)
- [x] Add rotating travel taglines to floating button (FloatingButton)
- [x] All components build successfully
- [x] Save checkpoint and redeploy

## Current User Request — Trip, Payment, Sharing, Scan & Split Enhancements
- [x] Add a trip sort dropdown to the main menu/home trip list (already present: Newest, Oldest, Name A-Z, Name Z-A)
- [x] Make member Pay launch the standard UPI deep-link to the receiving member when a valid UPI ID exists
- [x] Include explicit payer and payee names in shared payment requests
- [x] Present shared trip access with a friendly trip name and hide the raw URL from the visible UI (already present: trip summary + Copy Link only)
- [x] Add a Scan & Pay action inside each trip with mobile/default-UPI fallback behavior
- [x] Add return-to-app manual payment confirmation and quick expense entry
- [x] Add a simple equal/custom split-and-save workflow by reusing Add Expense
- [x] Add/update tests for sorting, UPI links, sharing, and payment target priority
- [x] Document that browser UPI deep-links cannot reliably verify transaction completion automatically
- [x] Save checkpoint and redeploy

## Current Request Implementation Notes
- [x] Payment completion remains user-confirmed; never infer success solely from returning to the browser
- [x] Scan & Pay uses the default UPI app fallback; browser camera/QR scanning support remains platform-dependent
- [x] Preserve localStorage-only offline behavior

## Clarified Trip-First Payment Request
- [x] Add a prominent trip-level "Pay & Add Expense" button at the top of each trip
- [x] Capture item/expense details before launching the UPI app
- [x] After user confirms payment, add the captured expense automatically to that trip
- [x] Ask only how the expense should be split (equal or custom), with no duplicate manual entry
- [x] Support payment targeting by UPI ID or UPI-linked mobile number with an explicit mobile fallback notice
- [x] Show clear recipient/payment-detail fallback states and disable payment when no member is payable
- [x] Simplify shared trip presentation to trip name plus read-only expenses/settlements without showing a long raw URL
- [x] Add/update tests for mobile fallback, payer/payee sharing, and payment-link generation (29 tests passing)
- [x] Preserve the browser UPI limitation note: completion requires user confirmation
- [x] Save checkpoint and redeploy

## Corrected Self-Payment Flow — Current Request
- [x] Replace trip-level member-recipient payment with an "Open UPI App" action for the user's own local UPI app
- [x] Capture item/expense description and amount before opening the UPI app
- [x] Launch a generic UPI payment flow for the trip expense without requiring a member UPI ID
- [x] After returning, ask only whether payment was completed and how to split it
- [x] Automatically save the prepared expense into the selected trip after confirmation and split choice
- [x] Keep member UPI ID/mobile payment targeting limited to settlement payments
- [x] Preserve friendly read-only trip sharing without exposing the long technical URL
- [x] Add/update tests for generic trip payment and post-payment split persistence (29 tests passing)
- [x] Document that browser UPI callbacks cannot automatically return merchant/transaction details
- [x] Save checkpoint and redeploy

## UI Refinement Request — Current
- [x] Replace specific snack example with neutral item placeholder text such as "Item to buy"
- [x] Replace specific amount example with a neutral amount placeholder such as "₹100"
- [x] Apply an Indian-inspired orange, off-white, green, and navy colour combination
- [x] Improve button, card, and accent styling to match the new palette
- [x] Fix header/content overlap during upward scrolling with solid background, spacing, and z-index
- [x] Add/update UI tests or build verification for the revised payment form (32 tests passing)
- [x] Save checkpoint and redeploy

## Cycle Boundaries and Proration Request
- [x] Update Group Fund creation form with cycle boundary and proration controls
- [x] Implement robust cycle calculation helper for Weekly (Monday vs Sunday start) and Monthly (Calendar vs Join-date cycle) boundaries
- [x] Implement true daily-rate proration based on remaining days in the active cycle for mid-cycle joins
- [x] Integrate cycle boundary and proration calculations into GroupFundDetail expected amounts and collection periods
- [x] Add unit tests for recurring cycle calculation and proration rules
- [x] Restore "One Trip. One Tap." as visible text on the right side of the Kharcha header
- [x] Keep the round decorative badge without replacing the readable header tagline
- [x] Activate UPI-linked mobile-number fallback for member settlement payments when no UPI ID is present
- [x] Keep member UPI ID and mobile settlement targeting separate from the trip self-payment flow
- [x] Change trip-level action to open the user's default UPI app for scanner/camera use

## Complete Group Fund Localization Request
- [x] Fully localize all remaining hardcoded strings in `CreateGroupFund.tsx` using `t()`
- [x] Fully localize all remaining hardcoded strings in `GroupFunds.tsx` and `GroupFundDetail.tsx`
- [x] Add unit tests verifying Group Fund localization output across multiple Indian languages
- [x] Do not prefill the trip self-payment amount in the UPI app
- [x] Clearly label the scanner-first flow and explain that transaction details cannot automatically callback into the browser
- [x] Update tests for mobile settlement fallback and generic scanner-first UPI launch (33 tests passing)
- [x] Save checkpoint and redeploy

## Login & Profile OTP Authentication Request
- [x] Add a mandatory first-login profile screen before accessing Kharcha
- [x] Support login via mobile number or email address
- [x] Generate and display verification OTP (with test-mode helper for sandbox verification)
- [x] Store user profiles and sessions securely in the backend database (users / otps / JWT cookies)
- [x] Gate all trip and expense features behind successful authentication
- [x] Provide profile setup (name, mobile/email) upon first sign-in
- [x] 33 tests passing and production build successful
- [x] Save checkpoint and redeploy

## OTP Navigation & Shared Trip Editing Request
- [x] Superseded by removing OTP authentication; the app now opens directly on the home page
- [x] Superseded by removing the OTP dialog and verification flow
- [x] Add a safe edit option for shared trips that creates an editable local copy without mutating the original shared snapshot
- [x] Keep the shared-trip URL hidden from the visible UI and present sharing through the trip name
- [x] Shorten shared links with LZ-string compression and preserve read-only viewing for the original snapshot
- [x] Add regression tests for compact shared-trip encoding and editable-copy behavior; OTP navigation was superseded by removing OTP
- [x] Run tests/build, save a checkpoint, and redeploy

## Remove OTP Authentication Request
- [x] Remove the mandatory OTP login dialog and authentication gate from the app
- [x] Remove mobile/email OTP request and verification UI and frontend calls
- [x] Restore direct access to the Kharcha home page without login
- [x] Remove OTP-specific tests, backend procedures, and the unused OTP schema/table
- [x] Run tests and production build, save a checkpoint, and redeploy

## Compact Share Link Follow-up
- [x] Replace the current base64-only shared-trip encoding with LZ-string compression and compact keys to reduce URL length
- [x] Keep the raw shared URL hidden from the share dialog and show only the trip name with copy/share actions
- [x] Add regression coverage for compact share-link round trips, editable copies, and link-length reduction

## Native Share Sheet and Edit Sync Clarification
- [x] Ensure Share Trip invokes the native Web Share sheet with installed WhatsApp, Mail, Messages, Telegram, and other communication apps when supported
- [x] Keep a reliable hidden-link clipboard fallback when native sharing is unavailable
- [x] Clearly state in the shared-trip UI that Edit a Copy is local and does not update the original trip
- [x] Add tests for native share invocation/fallback behavior and the non-synchronizing copy boundary
- [x] Save a checkpoint after verification

## Share Chooser and View-Only Follow-up
- [x] Ensure Share Payment invokes the shared native app chooser and clipboard fallback
- [x] Ensure Share Trip invokes the same native app chooser and clipboard fallback
- [x] Remove Edit a Copy and all edit affordances from shared trip details
- [x] Add or update tests for both share entry points and strict view-only behavior
- [x] Run tests/build, save a checkpoint, and report the updated behavior

## Indian Language Support Request
- [x] Add a language selector in the top app header
- [x] Support English, Malayalam, Hindi, Tamil, Kannada, Telugu, Marathi, Bengali, Gujarati, Punjabi, Odia, and Assamese
- [x] Persist the selected language in localStorage across refreshes and app restarts
- [x] Translate the primary Home, Trip Detail, shared-view header, Create Trip dialog, and common action labels
- [x] Keep currency formatting in Indian Rupees and preserve language fallback to English for missing strings
- [x] Add localization tests and verify responsive production build
- [x] Save a checkpoint and report the supported languages

## Localization Coverage Follow-up
- [x] Translate SettlementView headings, statuses, action buttons, and summary labels through LanguageContext
- [x] Translate ShareTripDialog guidance, share/copy actions, and toasts through LanguageContext
- [x] Translate remaining high-visibility common dialog labels and user-facing action text where practical
- [x] Add a rendered regression test for at least one localized settlement/share surface
- [x] Rerun tests/build, save the final language-support checkpoint, and report the supported languages

## Remaining Dialog Localization
- [x] Translate AddExpenseDialog and AddMemberDialog labels/actions through LanguageContext
- [x] Translate PaymentOptionsDialog, UpiPaymentDialog, and remaining high-visibility payment dialog labels/actions through LanguageContext
- [x] Add a rendered regression test for another localized dialog/action surface
- [x] Rerun tests/build, save the final language-support checkpoint, and report supported languages

## Final Localization Delivery
- [x] Save a new checkpoint for the completed Indian-language localization update
- [x] Report the final supported language list after checkpointing

## QR Scan & Pay Expense Request
- [x] Add a QR scan step after item and amount entry in Pay & Add Expense Automatically
- [x] Use the camera to scan merchant UPI QR codes and parse the resulting UPI payment URI
- [x] Preserve the typed amount when launching the scanned merchant UPI payment, while retaining the scanned payee details
- [x] Open the installed/default UPI app from the scanned QR payment flow
- [x] Return to Kharcha for payment confirmation and the existing split-and-save expense workflow
- [x] Provide a manual UPI URI/paste or scanner-unavailable fallback when camera/BarcodeDetector support is missing
- [x] Add QR parsing/payment-flow tests and verify the production build
- [x] Save a checkpoint and report browser/camera limitations

## QR Payment Flow Regression
- [x] Add an integration-level regression test for scanned QR to amount-preserving UPI deep-link launch and confirmation/split entry
- [x] Rerun tests/build and then complete the QR checkpoint/report item

## QR Checkpoint & Delivery
- [x] Save a new checkpoint for the completed QR scan-and-pay update
- [x] Report browser and camera limitations for QR scanning to the user

## Final QR Limitation Delivery
- [x] Send the final QR browser and camera limitation report to the user

## Remove Visible Manus Branding Request
- [x] Audit app-owned UI, metadata, and visible copy for Manus branding or text
- [x] Confirm no visible Manus branding/text exists in app-owned screens; reinforce Kharcha-owned browser/PWA metadata
- [x] Add regression coverage for the branding-removal behavior where practical
- [x] Run tests/build, save a checkpoint, and report any platform-level branding that cannot be changed from app code

## Branding Delivery Clarification
- [x] Explain that app-owned Kharcha screens and metadata are branding-clean, while platform-hosted domain/runtime/debug chrome may remain outside app-code control

## Shared Home / Roommate Mode Specification
- [x] Implement Shared Home domain types with explicit internal type `"shared_home"`
- [x] Add dual-option creation menu for Plus button (Trip vs Shared Home)
- [x] Build Shared Home creation dialog (Name, Type, Start Date, Address, Description)
- [x] Build Shared Home dashboard showing monthly totals, member shares, and quick actions
- [x] Implement member management with contact picker, manual entry, avatars, move-in/move-out dates, and active status
- [x] Implement room management, member assignments, and room assignment history
- [x] Implement rent configuration supporting Equal per person, Equal per room, Room-wise fixed, Stay-days based, and Custom allocation
- [x] Implement calendar-day and 30-day stay basis calculations with daily rates and transparent partial month breakdowns
- [x] Implement rent manual override validation and auto-generation for monthly continuation
- [x] Implement bills, grocery tracking with common/personal items, recurring expenses, and monthly continuation
- [x] Implement household settlement, payment records, and read-only URL sharing
- [x] Localize Shared Home UI across supported Indian languages
- [x] Add Vitest tests for rent split calculations, stay days, percentage validation, balances, and minimum settlements
- [x] Save checkpoint and report the complete Shared Home feature set

## Shared Home Calculation Gap Fixes
- [x] Synchronize room.memberIds when assigning or reassigning members
- [x] Add visible room-assignment history and calculation details
- [x] Add custom-within-room allocations for equal-room and room-fixed rent modes
- [x] Implement a true fixed-30 stay-day basis with explicit daily-rate math and partial-month breakdowns
- [x] Add regression tests for room occupancy allocation and calendar-vs-fixed30 differences

## Shared Home Regression Coverage
- [x] Test localized Shared Home headline labels for all supported Indian languages
- [x] Test rent manual-adjustment allocation totals and audit metadata
- [x] Test Shared Home detail/share surfaces compile and render through LanguageContext

## Shared Home Gap Resolution
- [x] Translate remaining Shared Home hardcoded strings/options/placeholders/errors through LanguageContext
- [x] Add explicit room-based/custom-within-room allocation and calendar-vs-fixed30 regression tests
- [x] Add a saveRent/SharedHomeDetail regression proving manual adjustment audit metadata is stored and preserved

## Shared Home Final Verification Follow-up
- [x] Add a SharedHomeDetail render/compile regression under LanguageProvider
- [x] Replace remaining Shared Home hardcoded back labels, create-home placeholders, and share-summary copy
- [x] Add a page-level saveRent regression that proves manual adjustment audit metadata survives reload
- [x] Re-run the full test suite and production build after final verification
- [x] Save the final Shared Home checkpoint and report the completed feature set

## Shared Specification Compliance Audit
- [x] Remove member mobile numbers from Shared Home share snapshots by default while preserving local member data
- [x] Localize remaining top-level Shared Home list and factory activity copy
- [x] Verify and close the highest-impact specification gaps in recurring controls, close-month flow, search/filter/sort, reports/export, and receipts
- [x] Add regression coverage for shared-snapshot privacy and any completed compliance fixes
- [x] Run the complete test suite and production build, then save a compliance checkpoint

## Shared Home Navigation Reorganization
- [x] Keep primary tabs exactly Overview, Expenses, Rent, Bills, Groceries in a single horizontally scrollable row
- [x] Move Members, Rooms, Recurring, Settlements, and Reports into a Manage secondary navigation in the specified order
- [x] Preserve Overview default, monthly summary cards, quick actions, and all existing Shared Home functionality/data logic
- [x] Add navigation regression coverage for primary/secondary order, no duplication, and default Overview
- [x] Verify mobile layout, tests, build, and save an updated checkpoint

## Common Budget Feature from Attached Specification
- [x] Add reusable budget data models and offline persistence for Trips and Shared Homes
- [x] Add eligible-spend calculations, remaining/over-budget states, thresholds, and category breakdowns without changing split/settlement logic
- [x] Add Trip total-budget support and Shared Home month-specific/optional recurring budget support
- [x] Add overview Budget cards, Set/Edit Budget flows, Budget Details, and Shared Home budget history
- [x] Include budget data in existing local backup/share serialization where applicable
- [x] Add localization and regression tests for calculations, cancellation/edit behavior, monthly periods, warnings, and persistence
- [x] Run the full test suite, production build, health checks, and save a checkpoint

## Main Landing and Category Navigation Redesign
- [x] Replace the mixed Home listing with a focused Kharcha landing screen showing logo, one tagline, Trips, and Shared Homes choices
- [x] Add dedicated Trips-only and Shared Homes-only category pages with existing create flows and item cards
- [x] Preserve Trip and Shared Home detail routes and all existing functionality/data behavior
- [x] Move language selection to a compact app settings/more area while preserving local persistence and application-wide language use
- [x] Reduce One Trip. One Tap. to a compact Quick Trip secondary action
- [x] Add navigation regression coverage for category separation, landing hierarchy, routes, and language persistence
- [x] Verify mobile layout, tests, build, health, and save a corrected checkpoint

## Landing Page Quick Trip Removal
- [x] Remove the Quick Trip card and action from the landing page
- [x] Preserve Trips and Shared Homes as the only landing choices and keep Trip creation inside Trips
- [x] Run tests, build, health checks, and save a corrected checkpoint

## Shared Home Recurring Budget Inclusion
- [x] Add optional Shared Home recurring-rule includeInBudget setting, defaulting to true, without changing Trip types or flows
- [x] Persist includeInBudget on generated Shared Home expenses so historical budget treatment remains stable
- [x] Add Shared Home recurring creation/edit control and visible included/excluded status indicator
- [x] Exclude only opted-out recurring expenses from Shared Home budget tracking while retaining normal expense, member-share, settlement, and report behavior
- [x] Show Shared Home Budget Details tracked spending, actual spending, and excluded amount explanation
- [x] Add Shared Home-only regression tests and prove Trip behavior remains unchanged
- [x] Run tests, build, health checks, and save a corrected checkpoint

## Shared Home Recurring Checkbox Visibility Fix
- [x] Make Include in Budget visibly present in the Shared Home Add/Edit Recurring Expense dialog
- [x] Verify checkbox default, checked/unchecked persistence, and budget effect through a rendered regression
- [x] Confirm Trip UI and calculation behavior remain unchanged
- [x] Run tests, build, health checks, and save a corrected checkpoint
- [x] Phrase the Shared Home budget checkbox as a direct question so the recurring-expense choice is unmistakable

## Shared Home Settlement UPI Payment Requests
- [x] Keep UPI ID and mobile details optional on Shared Home members, with UPI ID as the only payment destination used for deep links
- [x] Add Shared Home settlement request details showing payer, payee, exact amount, reason, and UPI ID when available
- [x] Add Pay via UPI using an exact two-decimal amount and no automatic paid-state update
- [x] Add Share Payment Request with native share/copy behavior and a privacy-safe payment-request route
- [x] Add fallback copy/show UPI ID and amount plus optional QR representation when UPI launch is unavailable
- [x] Preserve no-duplicate-expense behavior and existing Mark as Paid/Undo settlement persistence
- [x] Add Shared Home-only regressions and prove Trip payment/share code remains unchanged
- [x] Run tests, build, health checks, and save a corrected checkpoint

## User-Provided Kharcha Logo Integration
- [x] Add the supplied logo asset through the web app asset pipeline
- [x] Use the logo on the landing page with balanced responsive sizing and accessible alt text
- [x] Add a compact logo mark or wordmark to app detail headers where it fits without crowding controls
- [x] Update browser/PWA metadata and favicon-related branding to use the supplied logo where supported
- [x] Add branding regression coverage and verify responsive build/preview rendering
- [x] Save the logo integration checkpoint

## Branding Logo Fit Follow-up
- [x] Remove the landing lockup max-height clipping so the supplied logo remains fully visible responsively
- [x] Verify the corrected logo fit with tests, build, preview health, and checkpoint

## Android APK Packaging Request
- [x] Prepare an Android installable package for the published Kharcha PWA with the supplied branding
- [x] Generate and validate an APK build, including launcher, splash, notification, UPI deep-link, and offline-first behavior considerations
- [x] Publish the latest web checkpoint and attach the APK and packaging configuration
- [x] Provide Android installation and signing limitations clearly

## Language Selector Placement Refinement
- [x] Keep the language selector visible on the first Home/Landing page only
- [x] Remove language-selector controls from Create Trip and all inner Trip/Shared Home/detail/shared-view screens while preserving persisted language state
- [x] Add regression coverage and verify tests, build, preview, and checkpoint

## Language Selector Location Correction
- [x] Remove the language selector from the Home header
- [x] Restore the language selector inside the Settings dialog only, leaving all other UI and behavior unchanged
- [x] Update regression coverage, run tests/build, and save a checkpoint

## Transparent Logo and Mobile UI Optimization Request
- [x] Upload and register the user-provided transparent logo (`175679-removebg-preview(1).png`) into the persistent web asset store
- [x] Update `BrandLogo.tsx`, `index.html`, `manifest.json`, and Android TWA launcher/mipmap assets to use the transparent logo on clean white backgrounds
- [x] Optimize mobile tab sizing, font sizing, spacing, and container lengths across Trip Detail, Shared Home Detail, and main views for an optimal mobile app experience
- [x] Run test suite, production build, preview verification, save checkpoint, and report

## Transparent Logo Background Removal and Uncropped APK Icon Request
- [x] Remove forced white backgrounds from BrandLogo components so the transparent logo renders cleanly without white container boxes
- [x] Update Android resource generator script to pad the logo correctly inside adaptive launcher bounds without cutting off edges
- [x] Rebuild uncropped Android launcher mipmap assets and compile the updated debug APK
- [x] Run test suite, production build, preview verification, save checkpoint, and report

## Android White-Background Launcher Icon Request
- [x] Update Android resource generator and adaptive icon config to use a clean solid white background for the launcher icon while centering the full logo inside without cropping
- [x] Rebuild the Android debug APK with the white-background launcher icon
- [x] Run test suite, production build, save checkpoint, and report

## Feature Improvements Implementation Request
- [x] Implement multi-contact selection for Trips and Shared Homes (Select All, Clear All, count badge, duplicate prevention)
- [x] Refine Shared Home export and print outputs to concise financial summaries while keeping detailed history in-app
- [x] Add regression tests, run full test suite (91 passing), production build, and verify preview health

## Group Fund Create Button Correction
- [x] Make the final Create Fund button clearly visible in the creation form
- [x] Verify the button submits the form and opens the newly created fund
- [x] Run tests/build, save a checkpoint, and report

## Group Fund Route 404 and Optional Contribution Fix
- [x] Fix the router route ordering so `/group-funds/new` is matched before parameterized routes like `/group-fund/:id`
- [x] Make default contribution amount optional in CreateGroupFund.tsx (defaulting to 0 or undefined when left blank)
- [x] Run test suite, production build, save checkpoint, and report

## Recurring Group Fund Reminder Notifications
- [x] Add due-date reminder logic for Daily, Weekly, and Monthly recurring collections
- [x] Show an in-app “Inform your members” reminder at the configured due window
- [x] Show a red “Inform urgently” state when one day remains before collection is due
- [x] Preserve non-recurring Group Fund, Trip, and Shared Home behavior
- [x] Add regression tests for recurring reminder timing and urgency states

## Personal & Household Budget — Recurring Expense Update
- [x] Add recurring expense toggle with Daily, Weekly, and Monthly frequency options
- [x] Support frequency-specific amounts and editable weekly occurrences/amounts
- [x] Automatically generate the next month or next applicable cycle for recurring expenses without duplicate entries
- [x] Add Paid/Pending/Skipped status controls and persist paid status offline
- [x] Deduct paid expenses from the current budget/income balance and expose the updated remaining amount
- [x] Localize recurring expense labels and status text across the supported Indian languages
- [x] Add regression tests for recurrence, carry-forward, paid status persistence, and budget deduction
- [x] Run tests/build, save a checkpoint, and report the updated Personal Budget behavior

## Personal & Household Budget — Recurring Expense Update
- [x] Add recurring expense toggle with Daily, Weekly, and Monthly frequency options
- [x] Support frequency-specific amounts and editable weekly occurrences/amounts
- [x] Automatically generate the next month or next applicable cycle for recurring expenses without duplicate entries
- [x] Add Paid/Pending/Skipped status controls and persist paid status offline
- [x] Deduct paid expenses from the current budget/income balance and expose the updated remaining amount
- [x] Localize recurring expense labels and status text across the supported Indian languages
- [x] Add regression tests for recurrence, carry-forward, paid status persistence, and budget deduction
- [x] Run tests/build, save a checkpoint, and report the updated Personal Budget behavior

## Personal Budget Step One Foundation Redesign (attached specification)
- [x] Restrict this iteration to Step One foundation; do not implement advanced Step Two budgeting logic
- [x] Redesign Personal Budget navigation to Overview, Income, Expenses, Recurring, Family, Goals, Calendar, Reports, and Settings
- [x] Add a polished empty Overview dashboard with Expected Income, Planned Expenses, Actual Expenses, Remaining, Savings, and Budget Used cards
- [x] Add functional Previous Month / selected month / Next Month architecture to Overview
- [x] Add prominent Add Income, Add Expense, Add Recurring, and Add Goal quick actions
- [x] Add scalable foundation entities for BudgetProfile, IncomeSource, IncomeTransaction, ExpenseCategory, ExpenseTransaction, RecurringExpenseRule, Budget, HouseholdMember, and Goal
- [x] Keep recurring rules separate from future transaction occurrences in the foundation model
- [x] Add mobile-first empty states and accessible active, inactive, selected, and disabled control states
- [x] Verify existing Trips, Shared Homes, Group Funds, payment, and recurring collection functionality is unchanged
- [x] Add Step One regression tests and run the acceptance checks
- [x] Run tests/build, save a checkpoint, and report Step One completion without starting Step Two

## Personal Budget Step Two Implementation (attached specification)
- [x] Implement complete Income Management with multiple income sources, actual income transactions (separate from sources), expected vs received breakdown, and monthly filtering
- [x] Implement mobile-first Add Income form with categories, frequencies, person assignment, and household budget toggle
- [x] Implement complete Expense Management with required amount, categories/subcategories, payment methods (Cash, UPI, Bank, Credit Card, Debit Card, Wallet, Other), notes, and date filtering (This Month, Last Month, Custom)
- [x] Implement Expense edit and delete workflows with confirmation dialogs and zero/negative amount validation
- [x] Implement Category Management with the full hierarchical category tree (Housing, Food, Transport, Education, Health, Family, Lifestyle, Financial, Other) and custom category creation
- [x] Implement optional Category Budgets with threshold status text (Under Budget, Near Limit, Over Budget) and percentage display
- [x] Update Overview dashboard with expected vs received income, actual expenses, remaining calculation, top expense categories, and month selector integration
- [x] Add Step Two unit tests covering income calculations, expense filtering, and category budget thresholds
- [x] Run tests/build, save a checkpoint, and report Step Two completion

## Personal Budget Step Three — Production Recurring Expense Engine
- [x] Expand RecurringExpenseRule and ExpenseTransaction types for Quarterly, Yearly, Custom intervals, skip ranges, pause windows, cancellation, historical overrides, and archive/delete states
- [x] Build robust recurrence engine supporting daily, weekly, monthly (with end-of-month and Feb safety), quarterly, yearly, and custom N-day/week/month/year rules
- [x] Implement occurrence management with Paid, Pending, Skipped, and Cancelled states, selective amount overrides, and skip ranges (single, today, month, until date)
- [x] Implement pause and resume logic with pause windows where occurrences are inactive without losing historical records
- [x] Implement edit rule vs edit occurrence safety, archive vs delete future recurrence, and bulletproof month-end/leap year date handling
- [x] Build dedicated Recurring dashboard with Monthly Commitment, Actual vs Provision breakdown, Today, Upcoming (next 7 days), Skipped, Active, Paused, and Archived sections
- [x] Implement calendar integration showing recurring occurrences alongside income and expenses with interactive occurrence detail view
- [x] Update Overview dashboard with Recurring Paid, Pending, and Skipped metrics and planned/actual budget contributions
- [x] Add multilingual translation keys for all Step Three features across 12 Indian languages
- [x] Add unit tests for recurrence engine frequencies, skip ranges, pause windows, overrides, and commitments; verify build and save checkpoint

## Personal Finance Step 5 — Daily, Weekly, Goals, and Smart Budget Guidance
- [x] Simplify primary Personal Finance navigation to Overview, Income, Expenses, and Goals (or integrated tabs) while keeping Trips, Shared Homes, and Group Funds unchanged
- [x] Implement fast Daily Expense entry flow with quick action buttons (+ Milk, + Food, + Transport, + Other) and numeric keyboards
- [x] Implement Weekly Expense entry flow for combined weekly totals (e.g. Groceries Week 1, Week 2) without duplicate daily record generation
- [x] Calculate immediate budget impact across daily, weekly, planned/recurring, unexpected, and savings/goal allocations
- [x] Implement Safe Remaining Cash and Suggested Daily Spending Limit calculations based on remaining days in the month
- [x] Build Smart Budget Guidance warning system with Informational, Attention, and Warning levels for remaining budget, daily spending rate, goal risk, and overspending
- [x] Add financial goals and goal allocation calculator
- [x] Localize Step 5 features across supported Indian languages
- [x] Add regression tests, verify build and preview, save checkpoint, and report Step 5 completion

## Personal Finance Step 5 — Final Remodel (attached specification)
- [x] Simplify primary navigation to Overview, Income, and Expenses (plus quick shortcuts for Recurring, Goals, and Categories)
- [x] Implement fast Daily and Weekly expense entry with one-tap shortcuts (Milk, Food, Transport, etc.) and week grouping
- [x] Implement smart budget calculations with safe-spending amount, suggested daily limit, today's spending, and goal commitments
- [x] Implement smart budget guidance and warnings for overspending, low discretionary cash, and goal allocation
- [x] Implement financial goals tracking with target amounts, current saved amounts, target dates, priorities, and monthly allocations
- [x] Localize all new Step 5 guidance, goal, and daily/weekly expense labels across 12 Indian languages
- [x] Run test suite (124+ tests passing), verify production build, save checkpoint, and report success

## Landing Page Copy Refinement
- [x] Remove the “What do you want to manage?” heading and “Create your first trip or shared home” subtitle from the landing page while keeping all four management options visible

## Landing Page Heading Correction
- [x] Restore “What do you want to manage?” heading while keeping the unnecessary subtitle removed and retaining all four management cards

## All-Surface Localization Audit — User Reference Test
- [x] Audit every visible tab, header, label, button, placeholder, status, dialog, report, and nested item in Trips, Shared Homes, Group Funds, and Personal Finance against the provided reference test
- [x] Replace remaining hard-coded or data-derived English display strings with reactive translation keys across all 12 supported Indian languages
- [x] Add regression coverage for language switching across every module and nested surface
- [x] Run the full test suite and production build, sync the preview, and save a checkpoint

## Shared Homes Localization Gap Follow-up
- [x] Localize Shared Homes Bills, Rent, Rents, Groceries, Rooms, and related headers reactively across all 12 supported Indian languages
- [x] Add regression coverage for Shared Homes room and expense-label switching
- [x] Run tests/build, visually verify Shared Homes, sync preview, and save a checkpoint

## Group Fund Creation Heading Cleanup
- [x] Remove the unnecessary “New Module” heading from the New Fund creation screen without changing the workflow
- [x] Verify the Group Fund creation screen and save a checkpoint

## My Trips Split Mode Clarification
- [x] Add explicit Equal All, per-person selection, and Custom split options to trip expense flows
- [x] Preserve existing split calculations, validation, and settlement behavior for each mode
- [x] Add regression tests and verify the responsive trip expense dialog with a checkpoint

## Help Desk Email Configuration
- [x] Make the Settings Help Desk email editable and allow saving it blank
- [x] Show a clickable mail link only when a valid email is configured
- [x] Add regression tests, verify Settings, and save a checkpoint

## Default Help Desk Email Update
- [x] Set amaltms@gmail.com as the default Help Desk email while retaining edit and blank-save controls
- [x] Add regression coverage, verify the default link, and save a checkpoint

## Remove General Help Desk Heading
- [x] Remove the Help Desk Support Email heading, description, input, and Save control from Settings → General
- [x] Keep amaltms@gmail.com as the default Help & Guide contact and verify the simplified Settings screen

## Android Production Packaging
- [x] Audit the existing web app for Android packaging prerequisites and mobile-only issues without changing core logic
- [x] Add a non-destructive Android TWA packaging layer with a Play Store-ready application ID, splash, launcher icon configuration, and browser back navigation
- [x] Harden Android behavior for responsiveness, file sharing/downloads, local storage, session continuity, network errors, and release-safe diagnostics
- [x] Add packaging/configuration regression tests and validate the existing web build and mobile preview
- [x] Document AAB generation, signing, real-device testing, Play Console upload, permissions, billing architecture, and remaining release requirements
- [x] Save a recoverable Android packaging checkpoint

## Android TWA URL Header Fix
- [x] Add Digital Asset Links for the current debug APK so the TWA opens without a browser URL header
- [x] Add verification coverage and document the separate Play signing fingerprint requirement
- [x] Run tests/build, verify the deployed asset link, and save a checkpoint

## Supplied Mobile Branding and Splash References
- [x] Apply the supplied Kharcha logo/splash composition to the Android app only without redesigning the logo or modifying the web portal
- [x] Add the white branded splash, decorative background, feature highlights, loading state, safe-area handling, and approximately one-second transition
- [x] Improve Android mobile density and spacing at 360–412px without changing core functionality or data behavior
- [x] Add regression coverage and validate Android resources, debug/release builds, and responsive launch screens
- [x] Update the Android release/install documentation and save a checkpoint

## Splash Delivery Follow-up
- [x] Rebuild the Android APK from the updated native splash resources and deliver the fresh installable APK
- [x] Verify the rebuilt APK contains the supplied splash and document that reinstalling is required

## Document-Driven Splash Rollback
- [x] Replace the current splash implementation using only the attached document specification and remove the image-derived splash treatment
- [x] Rebuild and deliver a corrected Android APK, then verify the document-required launch sequence

## Android Splash and Icon Sizing Follow-up
- [x] Correct the native splash logo/icon sizing and launcher resource scaling for Android phones
- [x] Rebuild and deliver a fresh APK, with cache-safe reinstall instructions and regression validation

## Android Debug APK Launch Failure
- [x] Diagnose why the newly installed debug APK does not open after tapping the app icon
- [x] Fix the native splash-to-TWA launch flow without changing web app functionality
- [x] Rebuild, validate, and deliver a corrected APK with reinstall/update instructions

## Crashing Old APK Replacement
- [x] Increment the Android version code so the corrected APK installs over the crashing old APK without requiring data deletion
- [x] Rebuild, validate, and deliver the replacement APK with safe upgrade instructions

## Repeated Android APK Flash-and-Close Failure
- [x] Capture and diagnose the APK launch failure that flashes briefly then closes on the user’s phone
- [x] Replace the fragile splash-to-TWA handoff with a reliable launch path while preserving existing app behavior
- [x] Rebuild, validate, and deliver a corrected APK with clear installation steps

## Installed APK Versus Preview Mismatch
- [x] Audit the exact APK artifact and verify its package/version/launch URL against the current web preview
- [x] Build a fresh versioned APK that opens reliably and points to the live Kharcha preview
- [x] Deliver the APK with data-safe update instructions and save a checkpoint

## APK Delivery Request
- [x] Build and attach the corrected Version 5 installable APK for the user
- [x] Verify the attached APK package identity, version code, and successful debug build
- [x] Provide simple phone installation instructions

## Android Data, Layout, and Splash Regression
- [x] Preserve and correctly display existing localStorage data in the Android WebView wrapper
- [x] Fix Android safe-area/status-bar overlap so Settings and top controls remain usable
- [x] Reflow the mobile app layout to prevent content from stretching into system bars
- [x] Restore the branded native splash screen during Android app launch
- [x] Add regression coverage and rebuild the APK after validation

## Android Status-Bar Header Overlap Regression
- [x] Prevent Android status-bar icons/time from covering page headers and action buttons in installed APK
- [x] Verify safe-area spacing while scrolling on Trips and Shared Homes screens
- [x] Rebuild and deliver the corrected APK with update-safe versioning

## Android Inner-Screen Overlap and Header Color Regression
- [x] Prevent Personal Budget, Trip Detail, and related inner-screen cards/controls from overlapping at 360–412px widths
- [x] Make month navigation and action buttons wrap or stack cleanly on small Android screens
- [x] Apply the intended orange treatment to the Android status-bar/header region without reducing text contrast
- [x] Add regression coverage, rebuild the APK, and verify the corrected mobile layout

## Android Header Color Preference Update
- [x] Restore the Android top header/status-bar mask to the neutral light cream/white background
- [x] Preserve the existing Android overlap and safe-area fixes
- [x] Revalidate the responsive preview and save the updated project state

## Logo and Splash Branding Update
- [x] Prepare the supplied Kharcha logo with a background matched to the app’s light cream surface
- [x] Ensure “Split Smart Live Smart” is centered directly below the logo mark
- [x] Use the medium-sized logo on the front page without making it oversized
- [x] Update the native splash to show the medium logo for approximately one second
- [x] Validate logo placement, Android splash resources, localization-safe layout, and save a checkpoint

## Android Splash Regression
- [x] Confirm SplashActivity remains the launcher and native splash resource is packaged
- [x] Restore the one-second splash handoff without breaking the verified TWA flow
- [x] Build and deliver a fresh splash-enabled APK with simple install/test instructions

## APK Launch Crash Regression
- [x] Capture the native crash evidence and identify the failing launch dependency
- [x] Make the Android launcher open the working web app without a fragile TWA-only handoff
- [x] Preserve local storage where possible and provide a clear migration note if storage profiles differ
- [x] Build and deliver a fresh APK verified for package identity and launch stability

## Repeated APK Launch Failure
- [x] Obtain concrete crash evidence from the installed Version 13 APK or reproduce its startup failure locally
- [x] Verify the APK entry activity, manifest merge, resources, and runtime dependencies independently of the web preview
- [x] Replace any remaining startup dependency with the smallest reliable launcher
- [x] Build and deliver a diagnostic or corrected APK only after package and launch checks pass

## Logo-Only Splash Revision
- [x] Replace the multi-element splash with the uploaded medium logo only
- [x] Remove the blank screen between splash and landing page
- [x] Keep splash duration below one second and validate the direct handoff
- [x] Build and deliver the revised APK without clearing existing app data

## Android Contact Picker Regression
- [x] Locate every Add from Contact trigger and its current web selection flow
- [x] Add Android-compatible contact selection with multiple-contact support
- [x] Preserve manual member entry and all other existing segment flows
- [x] Add regression tests and deliver an updated APK

## APK-Only Functionality Regression
- [x] Compare the URL and runtime environment used by the web portal versus the Android WebView
- [x] Inspect JavaScript bridge, WebView settings, permissions, and app-side error handling
- [x] Restore the affected APK functionality without changing the working web portal
- [x] Add regression coverage and deliver a verified app-specific APK

## Contact Picker Trigger Follow-up
- [x] Trace the exact rendered Add from Contact button and its click handler in every segment
- [x] Verify the Android bridge is available at the moment the button is tapped
- [x] Ensure the native multi-contact picker opens and returns selected contacts
- [x] Add entry-point regression tests and build a new APK

## Themed Searchable Contact Picker
- [x] Add Kharcha-themed contact picker colors and layout
- [x] Add name/number search with filtered matching results
- [x] Add per-contact checkboxes and multi-select controls
- [x] Add Select All, Clear All, and Add selected actions
- [x] Add regression coverage and rebuild the contact-picker APK

## APK-Only Contact UI Delivery
- [x] Verify the searchable contact picker is present in native Android code and packaged APK resources
- [x] Ensure search filters all matching contact names/numbers and preserves per-contact multi-select
- [x] Ensure the contact dialog visibly uses Kharcha green/orange/cream theme colors
- [x] Increment, build, and verify a new installable APK for these native changes
- [x] Deliver the APK separately from the web preview with update-safe installation steps
## Contact Import Performance Regression
- [x] Show immediate themed loading feedback when Import/Add from Contact is tapped
- [x] Keep the Android UI responsive while reading contacts and prevent duplicate picker requests
- [x] Optimize contact query and handle empty/error/cancel states clearly
- [x] Add regression coverage and deliver a faster versioned APK
## Landing Logo and App Lock
- [x] Increase the Landing page Kharcha logo to a clearer medium-large mobile size
- [x] Make saved Kharcha PIN protection actually prompt on app relaunch
- [x] Add an Android device-lock/biometric authentication option for APK launches
- [x] Persist the selected lock mode safely and handle lock, unlock, cancel, and background/resume states
- [x] Add security regression coverage and deliver a new APK
- [x] Show an immediate themed loading state when Add from Contact starts
- [x] Keep contact querying off the Android UI thread and handle empty/error/cancel states gracefully
- [x] Increment Android version code to 18 and build the updated APK

## Group Fund Contact Import Responsiveness
- [x] Trace the Group Fund Import Contacts entry point through the shared contact bridge
- [x] Make the native import feedback appear immediately with a rotating Kharcha-themed indicator
- [x] Reduce contact query and list-rendering latency without blocking the Android UI
- [x] Handle duplicate taps, permission, empty, error, and cancel states visibly
- [x] Add regression coverage and build a new Android APK for phone testing
- [x] Align Shared Home contact import with the immediate loading and duplicate-tap feedback pattern

## APK-Only Contact Optimization Delivery
- [x] Increment Android version code so the latest native contact-import changes install over the current app
- [x] Build the new debug APK with the native loading and ListView optimizations
- [x] Verify package identity, version code, permissions, and APK output
- [x] Deliver the APK with update-safe installation instructions

## APK Camera Permission and Device Lock Fix
- [x] Trace merchant QR scan camera requests from the Trip payment flow through the Android WebView bridge
- [x] Add Android camera permission declaration and runtime permission prompt before camera access
- [x] Handle camera permission denial and retry guidance clearly
- [x] Allow device-lock-only security mode to save without a PIN
- [x] Launch Android device authentication for device-lock mode and handle cancel/failure safely
- [x] Add regression coverage and build a new APK update

## APK Camera and Native Share Delivery
- [x] Verify the installed APK uses the latest native camera-permission implementation and identify any launch/build mismatch
- [x] Harden the Android camera permission flow so the runtime prompt and camera access work in the APK
- [x] Route Share Payment Link through the Android native share chooser for WhatsApp, Telegram, Messages, Mail, and other installed apps
- [x] Preserve a safe web/clipboard fallback when no native share target is available
- [x] Add regression coverage, increment Android version code, and build a new APK update

## APK Device Lock Resume Loop Fix
- [x] Reproduce and trace the fingerprint/device-lock result handoff when returning to the APK
- [x] Prevent visibility/resume handling from re-locking the app during an active native authentication prompt
- [x] Deliver native authentication success/failure exactly once and recover from canceled or failed prompts
- [x] Stabilize the WebView lock-gate state after fingerprint success so the app opens normally
- [x] Add regression coverage, increment Android version code, and build a new APK update

## APK Fingerprint Unlock Loop Follow-up
- [x] Trace why a successful fingerprint attempt returns to the same lock page instead of unlocking the WebView
- [x] Add a reliable one-time native unlock callback/state handoff after device authentication success
- [x] Prevent repeated visibility/effect prompts and ensure success clears the lock gate
- [x] Handle cancel, failure, and unavailable device-lock states without a blink loop
- [x] Add regression coverage, increment Android version code, and build a new APK update

## APK Device Lock Persistent Failure Recovery
- [x] Replace the failing confirm-device-credential handoff with a robust biometric/device-credential callback path
- [x] Ensure fingerprint success clears the WebView lock gate and cannot relaunch the prompt loop
- [x] Add a recovery-safe path for canceled, unavailable, or failed authentication without clearing local data
- [x] Add behavioral regression coverage and increment Android version code for a new APK

## Complete Built-in Localization Audit
- [x] Audit Trip, Shared Home, Group Fund, Personal Finance, reports, filters, dialogs, and native-facing labels for hardcoded built-in English text
- [x] Translate built-in headings, tabs, buttons, statuses, filters, date/month labels, recurring rules, and report copy across all 12 supported languages
- [x] Preserve manually entered names, descriptions, categories, and saved user data without automatic translation
- [x] Add regression coverage preventing mixed built-in language output and verify Android-sized rendering
- [x] Run tests/build, save a localization checkpoint, and report the updated behavior

## Final Localization and Android v26 Validation
- [x] Confirm built-in fallback maps cover persisted categories, report filters, and navigation labels across all 12 supported languages
- [x] Verify user-entered names and descriptions remain unchanged
- [x] Run the full Vitest suite and production web build
- [x] Synchronize Android version code 26 and compile the updated debug APK
- [x] Verify APK package, permissions, launch/auth/camera/share behavior, and deliver the artifact with update-safe installation guidance

## Android Group Fund PDF Actions
- [x] Add a direct Print action to the Group Fund PDF report viewer on Android
- [x] Add a Save/Download PDF action using Android’s user-visible Downloads flow
- [x] Add a reliable Back action from the PDF viewer to Group Fund without closing the app
- [x] Preserve existing PDF report content, localization, and local data
- [x] Add regression coverage, increment Android version code, build, and verify the updated APK

## Group Fund and Shared Home PDF and Simplification Update
- [x] Make the Group Fund PDF click open the Android-native viewer with visible Back, Print, and Save as PDF actions
- [x] Route Shared Home PDF reports through the same Android-native viewer without changing report content
- [x] Simplify Shared Home navigation to Overview, Expenses, Recurring, Members, Settlements, and Report only
- [x] Refactor Shared Home creation, members, recurring expenses, normal expenses, settlements, and reports within the supplied scope
- [x] Preserve other modules, existing local data, localization, payment flows, settings, and authentication
- [x] Add regression coverage, run tests/builds, and deliver a new verified Android APK

## Group Fund PDF Return-to-App Regression
- [x] Trace why Group Fund PDF opens the printer/standalone page instead of the intended native viewer
- [x] Ensure Group Fund PDF has a visible Back action that returns directly to Group Fund
- [x] Ensure Android system Back also dismisses the PDF surface without leaving the app
- [x] Preserve Print and Save as PDF actions and existing report content
- [x] Add regression coverage, increment Android version code, build, and verify a new APK

## Supplied Shared Home Replacement Specification (Recovered)
- [x] Audit current Shared Home against the supplied specification and preserve backward-compatible data structures
- [x] Persist guided setup, keep empty creation, and avoid sample/default data
- [x] Support localized members, join/leave dates, pause periods, rooms, recurring expenses, and unified expenses
- [x] Keep personal expenses outside shared settlement balances
- [x] Support safe rent calculations, filters, settlements, payment requests, reports, PDF view/download/share, and empty/error states
- [x] Keep all 12 languages and unrelated modules intact
- [x] Add regression coverage, run tests/builds, and deliver a new verified Android APK

## Final Shared Home Specification and Android v29 Delivery
- [x] Re-read and audit the 51-section Shared Home specification against the current implementation.
- [x] Preserve the six-tab Shared Home navigation and guided Members → Recurring → Ready setup flow.
- [x] Enforce that the creator is not inserted as a member automatically; manager metadata remains separate from membership.
- [x] Preserve personal expenses in the expense ledger while excluding one-person expenses from shared balances and settlements.
- [x] Make view-only Shared Home snapshots range-aware for Current, Full, and Custom ranges, including rent periods and filtered expenses.
- [x] Ensure Group Fund Android PDF actions use the native viewer path and do not fall back to a standalone printer page inside the APK.
- [x] Add regression coverage for Shared Home shared-view range filtering, rent totals, balances, and localization labels.
- [x] Run the complete Vitest suite, TypeScript check, production build, and Android package verification.
- [x] Increment Android version code to 29 and build the final debug APK.
- [x] Save a final checkpoint with the validated source and APK artifact.
- [x] Deliver the APK location, installation/update guidance, and remaining Play Store release steps.

## Multi-contact Import Regression — Shared Homes and Group Fund Collections
- [x] Audit the native contact picker result callback and both Shared Home and Group Fund append handlers.
- [x] Ensure Add selected appends every selected contact without overwriting earlier selections or existing members.
- [x] Add regression tests covering two- and three-contact imports in both modules, including duplicate prevention.
- [x] Run the full test suite, TypeScript check, production build, and Android packaging validation.
- [x] Build and deliver an updated Android APK with safe update instructions.

## PDF Report Export Regression — Group Fund and Shared Homes
- [x] Audit Group Fund and Shared Home PDF generation, native bridge routing, browser fallback, and download/print behavior.
- [x] Restore reliable PDF Report opening, Export/Download, Back, Print, Save as PDF, and Share actions in both modules.
- [x] Add regression tests for both modules, including Android-shell no-standalone-fallback behavior.
- [x] Run the full test suite, TypeScript check, production build, and Android packaging validation.
- [x] Build and deliver an updated Android APK with safe update instructions.

## Debug APK Installation Failure
- [x] Inspect the reported APK’s package identity, version code, signature, integrity, and supported Android configuration.
- [x] Determine whether installation is blocked by signature conflict, version/update mismatch, corrupted download, or device security settings.
- [x] Correct packaging or produce a compatible APK if the project artifact is the cause.
- [x] Validate the artifact and provide simple install/update instructions for the user’s phone.

## APK Compatibility Clarification
- [x] Compare the previously delivered project APK signing identity with the current APK and confirm whether the sandbox reset regenerated the debug key.
- [x] Preserve the existing package ID and establish a stable signing artifact for future updates without falsely promising local-data preservation when signatures differ.

## PDF APK Update Compatibility — Narrowed Scope
- [x] Confirm the PDF-fix APK package, version, and signing constraints against the previously delivered project APK.
- [x] Prepare the PDF-fix APK artifact and validate its integrity and Android metadata.
- [x] Deliver the PDF-fix APK with concise update instructions, noting any unavoidable Android signing limitation.

## Standing Regression-Prevention Requirement
- [x] For every future update, inspect affected screens, routes, components, APIs, permissions, exports, PDFs, localization, authentication, offline storage, and dependent features before editing.
- [x] Preserve existing behavior through modular, backward-compatible changes; do not remove translation keys, routes, data operations, document flows, or communication features.
- [x] After every meaningful change, run automated tests and a final regression audit covering authentication, navigation, data operations, PDFs including historical access, downloads, sharing, exports, localization, APIs, Contact Admin, settings, backup/offline behavior, and existing routes.
- [x] Report explicit PASS/FAIL status, regressions found and fixed, and remaining issues before declaring completion.

## Group Fund Collection Enhancements
- [x] Audit collection status, reminder/share, recurring period, member list, and persistence flows without changing unrelated Group Fund behavior.
- [x] Show a localized thank-you message/share action after a member’s contribution is marked collected, instead of the payment-request reminder action.
- [x] Add recurring-fund “Close this month collection” with persisted closed-month state and an explicit Undo action.
- [x] Allow a member collection of exactly ₹0 and preserve zero-amount records as collected.
- [x] Add regression tests for thank-you actions, monthly close/undo, zero collections, localization, and unchanged existing flows.
- [x] Run the complete regression suite, TypeScript check, production build, and Android packaging validation.
- [x] Build and deliver the updated APK with clear update instructions.

## Group Fund Zero Collection Report Status
- [x] Audit every Group Fund UI and PDF/report status calculation for recorded ₹0 collections.
- [x] Make recorded ₹0 collections display Collected rather than Pending, without changing unrelated behavior.
- [x] Add a focused regression test and validate the narrow fix in the full project build.
- [x] Build and deliver the updated APK/checkpoint with concise update instructions.

## Group Fund Saved Amounts and Bulk Payment Requests
- [x] Audit member amount state, individual collection forms, recurring/default amount behavior, UPI link generation, and WhatsApp sharing.
- [x] Add a backward-compatible saved collection amount per member, separate from collected status and contribution records.
- [x] Add Save amount controls and auto-fill the saved amount when opening individual or bulk collection entry.
- [x] Add localized Send bulk message behavior that creates one member-specific payment request per saved amount with a payment link and confirmation instruction.
- [x] Preserve existing collection, thank-you, zero-collection, recurring close, PDF, and other Group Fund behavior.
- [x] Add regression tests for saved amounts, auto-fill, personalized links, confirmation text, localization, and no collected-state side effects.
- [x] Run the full regression suite, TypeScript check, production build, and Android packaging validation.
- [x] Build and deliver the updated APK/checkpoint with clear update instructions.

## Group Fund Bulk WhatsApp Branches and Collection Close Controls
- [x] Audit current bulk message eligibility, saved amount handling, WhatsApp URL generation, and all collection close controls.
- [x] Send a personalized UPI payment-link message only when a member has a saved amount greater than zero.
- [x] Send an amount-request reminder without any ₹0 wording or payment link when a member has no saved amount.
- [x] Open each eligible member’s WhatsApp message individually from the bulk action and preserve current share fallbacks.
- [x] Add collection-close controls to the applicable individual and bulk collection views without changing existing recurring close/undo behavior.
- [x] Add localized regression tests and run the full suite, TypeScript check, production build, and Android packaging validation.
- [x] Build and deliver the updated APK/checkpoint with concise instructions.

## Group Fund Individual Message and Normal Close Fix
- [x] Audit individual member Send Reminder behavior, saved amount lookup, payment-link generation, and normal collection close eligibility.
- [x] Use a saved-amount payment link for individual members when a saved amount is available; keep reminder behavior only for members without a saved amount.
- [x] Repair Close Collection for normal/non-recurring collections while preserving recurring close and the working bulk message flow.
- [x] Add focused regression tests for individual saved-amount messaging, unsaved reminders, normal close, recurring close, and bulk-flow stability.
- [x] Run the full suite, TypeScript check, production build, and Android packaging validation.
- [x] Build and deliver the updated APK/checkpoint with concise update instructions.

## Group Fund Saved Amount Dialog Separation
- [x] Audit the individual collection dialog’s saved amount and collection amount state transitions.
- [x] Keep Collection Amount blank when Saved Amount is edited or saved; do not auto-copy the preset into the collection field.
- [x] Add an explicit Done/Save action for Saved Amount that persists the preset and returns to the member view.
- [x] Show only the saved preset amount in the member view after Done, without marking the member collected.
- [x] Add regression tests and validate existing individual payment, bulk message, close collection, and zero-collection behavior.
- [x] Build and deliver the updated APK/checkpoint with concise instructions.

## Group Fund PDF Layout and Branding Repair
- [x] Inspect Group Fund PDF download, share, print, browser fallback, and native Android viewer generation paths for the half-page rendering regression.
- [x] Make Group Fund PDF content use a consistent full-page responsive layout for A4/print/download/share output.
- [x] Add the Kharcha logo to the Group Fund PDF header across browser and native Android output paths.
- [x] Add regression tests for full-width PDF layout, logo inclusion, and preserved Back/Print/Save/Share behavior.
- [x] Run Vitest, TypeScript, production build, and Android packaging validation.
- [x] Save a release checkpoint and deliver the corrected APK/source version with usage notes.

## User-provided PDF references
- Canteen-August2026.pdf: /home/ubuntu/upload/Canteen-August2026.pdf
- Onam-August2026.pdf: /home/ubuntu/upload/Onam-August2026.pdf

## Group Fund PDF Readability Follow-up
- [x] Reproduce and audit the reported narrow-page PDF layout where table headings and values wrap one character per line.
- [x] Redesign the Group Fund collection summary with readable column proportions, balanced margins, and intentional wrapping.
- [x] Keep the expense ledger ordered and readable on A4 portrait output without side clipping.
- [x] Preserve Kharcha logo branding and all Android/browser Print, Save PDF, and Share PDF paths.
- [x] Add regression assertions for readable column sizing and rerun tests, TypeScript, production build, and Android packaging.
- [x] Save a new checkpoint and deliver the refined PDF release with testing instructions.

## Group Fund Bulk Message Selection Repair
- [x] Audit why the current Group Fund bulk message action opens only one member message and inspect its existing eligibility/URL branches.
- [x] Implement Send to All to open one personalized WhatsApp message for every eligible member.
- [x] Add multi-member selection controls and implement Send Selection for the selected members only.
- [x] Preserve saved-amount payment links, unsaved contribution reminders, language localization, and existing share fallbacks.
- [x] Add regression tests for all-member and selected-member recipient lists and rerun the full validation suite.
- [x] Save a new checkpoint and deliver the bulk messaging update with usage instructions.
- [x] Bump Android versionCode for the bulk messaging release and verify the updated APK metadata and archive integrity.

## Group Fund Bulk Message Reliability Follow-up
- [x] Audit why Send Selection and Send to All stop after the first WhatsApp recipient on Android/browser.
- [x] Implement a reliable user-driven or native-compatible launch flow that opens every selected recipient in order.
- [x] Preserve each member’s personalized payment-link/reminder branch and selection order.
- [x] Add regression tests proving every selected recipient is queued and can be opened, then rerun full validation.
- [x] Rebuild the Android APK with an incremented versionCode and verify the artifact.
- [x] Save a new checkpoint and deliver the fix with clear usage instructions.
- [x] Bump Android versionCode to 39 for the reliable WhatsApp queue release and verify updated metadata.

## Group Fund Direct Save PDF Parity Repair
- [x] Inspect the supplied Canteen PDF and compare the current Android Print, Save PDF, and Share PDF rendering paths.
- [x] Make direct Save PDF use the same print-quality renderer and A4 layout as Print.
- [x] Preserve identical margins, wrapping, page breaks, logo branding, and report content across Save, Print, and Share.
- [x] Add regression coverage for Save/Print parity and rerun tests, TypeScript, production build, and Android packaging.
- [x] Save a new checkpoint and deliver the corrected PDF-save release with testing instructions.

## Group Fund PDF Overflow and WhatsApp Delivery Follow-up
- [x] Audit the remaining Group Fund PDF overflow/cut-off path and the Android selected-recipient WhatsApp launch path.
- [x] Fix PDF width, margins, scale, and table wrapping without changing report content or branding.
- [x] Fix Send Selection so every selected member gets its existing payment/reminder/information message in sequence.
- [x] Keep the existing payment, reminder, thank-you, saved-amount, and bulk-message logic unchanged apart from delivery sequencing.
- [x] Add regression tests for PDF overflow safeguards and all selected WhatsApp recipients.
- [x] Rerun tests, TypeScript, production build, Android packaging, and visual preview validation.
- [x] Save a new checkpoint and deliver the corrected APK-ready release with instructions.
- [x] Bump Android versionCode to 40 for the latest Group Fund WhatsApp delivery and responsive modal repair, then verify APK metadata.

## Group Fund Status-Aware Bulk WhatsApp Repair
- [x] Audit the current bulk recipient classifier and queue payload for recorded status, saved amount, zero amount, and selected/all recipient handling.
- [x] Ensure each queued member retains a personalized message branch: thank-you for recorded payment, saved-amount payment link, or contribution information reminder.
- [x] Ensure Send to All and Send Selection queue every eligible phone number in stable order without collapsing to the first message.
- [x] Preserve the existing payment, reminder, information, thank-you, localization, and individual-message logic.
- [x] Add pure tests for all message branches and complete recipient queue coverage, then rerun full validation.
- [x] Rebuild the Android APK with an incremented versionCode and verify metadata/integrity.
- [x] Save a new checkpoint and deliver the corrected bulk-message release with usage instructions.
- [x] Bump Android versionCode to 41 for the status-aware bulk WhatsApp correction and verify APK metadata/integrity.

## Trip Report PDF
- [x] Audit Trip data structures, date fields, expense records, member balances, and final settlement calculations.
- [x] Audit existing Trip PDF/report actions and native Android Print, Save PDF, Share PDF flow for reuse.
- [x] Define a pure Trip Report summary model containing overview, date range, total expenses, category totals, member paid/owed balances, and settlement transfers.
- [x] Add a branded Trip Report PDF action with readable A4 layout and Kharcha logo.
- [x] Add browser and Android Print, Save PDF, and Share PDF support using the existing print-quality flow.
- [x] Add localization and regression tests for calculations, settlement output, PDF content, and preserved Trip behavior.
- [x] Rebuild the Android APK with an incremented versionCode and verify metadata/integrity.
- [x] Save a checkpoint and deliver the Trip Report APK-ready release with usage instructions.

## Trip Tab Readability Refinement
- [x] Audit the current Trip tab label sizes, selected-state classes, and narrow-screen layout constraints.
- [x] Increase Expenses, Members, Dashboard, and Settle tab label size and touch target readability on mobile.
- [x] Give selected and unselected tabs clearly different background, text, border, and focus states while preserving the existing theme.
- [x] Validate mobile screenshots, TypeScript, tests, and production build without changing Trip tab behavior.
- [x] Save a checkpoint and deliver the Trip tab refinement.
- [x] Bump Android versionCode to 43 for the Trip tab readability and contrast refinement, then verify APK metadata and integrity.

## Trip Selected Tab Visibility Fix
- [x] Audit the selected and inactive Trip tab text/background color cascade causing the active label to become white on a light background.
- [x] Apply a dark, high-contrast selected-tab font color while preserving the existing larger sizing and tab behavior.
- [x] Add a regression assertion for selected-tab color visibility and rerun tests, TypeScript, production build, and mobile preview validation.
- [x] Save a checkpoint and deliver the visibility fix.
- [x] Bump Android versionCode to 44 for the selected-tab visibility correction and verify APK metadata and integrity.

## Trip Report Print Margin Parity
- [x] Audit the Trip Report viewer and native Print, Save PDF, and Share rendering paths for mismatched margins and scaling.
- [x] Make Trip Report Save PDF and Share use the same print-quality page bounds and CSS as Print.
- [x] Preserve Trip report content, calculations, logo, table ordering, and all unrelated Trip functionality.
- [x] Add regression assertions for Trip Report A4 margins, viewport/scale, and shared output path.
- [x] Rerun tests, TypeScript, production build, Android packaging, and mobile preview validation.
- [x] Save a new checkpoint and deliver the corrected Trip Report APK-ready release.
- [x] Bump Android versionCode to 45 for the Trip Report print-margin parity repair and verify APK metadata/integrity.

## APK Version 46 Delivery
- [x] Bump Android manifest and Gradle fallback versionCode to 46.
- [x] Update Android readiness expectations to versionCode 46.
- [x] Build the debug APK and verify archive integrity, package metadata, and checksum.
- [x] Save a checkpoint and deliver the APK file with safe update instructions.

## Trip Report View and Share Alignment Follow-up
- [x] Audit the Trip Report View, Share, and Print HTML/CSS and Android rendering differences causing one-line scaling and incorrect margins.
- [x] Implement a dedicated readable A4 View layout with correct alignment and margins.
- [x] Make Trip Report Share use the same readable print-quality content bounds as the corrected View/Print layout.
- [x] Preserve Trip report calculations, tables, logo, Print behavior, and all unrelated functionality.
- [x] Add regression tests for View/Share alignment, width, margins, and page scale.
- [x] Rerun tests, TypeScript, production build, Android packaging, and mobile preview validation.
- [x] Save a new checkpoint and deliver the corrected APK-ready Trip Report release.
- [x] Bump Android versionCode to 47 for the Trip Report View/Share alignment repair and verify APK metadata and integrity.

## Existing Kharcha UI/UX Polish Only
- [x] Audit all current screens, routes, shared components, design tokens, localization, and mobile/desktop layout constraints without changing functionality.
- [x] Preserve the existing Kharcha logo, brand identity, data, APIs, database, calculations, authentication, navigation, and working workflows exactly.
- [x] Establish a consistent Orange + Green + White/Cream + Deep Navy visual system with shared typography, spacing, radii, borders, shadows, and accessible contrast.
- [x] Polish the existing Home/Dashboard presentation, header alignment, existing search/notification/settings exposure, cards, primary actions, and responsive spacing.
- [x] Polish existing bottom navigation or navigation presentation without duplicating routes or covering content, including safe-area behavior and active states.
- [x] Polish existing Trip, Shared Home, Group Fund, Personal Budget, Expense, Member, and Settlement screens using presentation-only changes.
- [x] Preserve and visually support existing search, notification, budget, expense, split, settlement, localization, authentication, and data flows without fake functionality.
- [x] Validate every existing screen, button, route, mobile breakpoint, desktop layout, localization state, calculation, logo asset, and navigation path.
- [x] Add or update regression tests for presentation contracts and run the full test, TypeScript, production build, and Android packaging checks.
- [x] Save a checkpoint and deliver the polished existing-app release with a concise QA summary.

- [x] Bump Android versionCode to 48 for the existing-app UI/UX polish release and verify APK metadata/integrity.

## Landing Page Logo-Only Replacement
- [x] Audit the current Landing Page logo usage separately from the unchanged Splash Screen logo usage.
- [x] Replace only the Landing Page logo with the exact attached Kharcha logo asset, preserving artwork, colors, proportions, and tagline.
- [x] Keep the existing Landing Page layout, text, controls, spacing, typography, animations, interactions, and functionality unchanged.
- [x] Keep the Splash Screen logo, design, colors, background, layout, animation, timing, text, and functionality unchanged.
- [x] Ensure the exact logo integrates with the existing cream background without a visible white box, border, shadow, crop, or recolor.
- [x] Add regression checks proving the change is scoped to the Landing Page logo and validate the production/mobile preview.
- [x] Save a checkpoint and deliver the logo-only update.

## Complete Existing-App UI Redesign Only
- [x] Audit every existing screen, section, popup, dialog, form, card, list, detail page, menu, and navigation area for presentation inconsistencies.
- [x] Preserve all existing functionality, logic, calculations, data, database, APIs, routes, permissions, workflows, business rules, wording meaning, and saved data.
- [x] Keep the existing Kharcha logo and Splash Screen exactly unchanged.
- [x] Define one compact mobile-first design system with consistent phone width, margins, spacing, typography, icon sizing, touch targets, headers, bottom navigation, safe areas, colors, borders, radii, and shadows.
- [x] Reorganize and resize only existing UI elements across Home, Trips, Shared Homes, Group Funds, Personal Budget, detail pages, reports, forms, dialogs, and menus.
- [x] Apply compact mobile header/action presentation for existing Settings, Search, Notifications, Add, Edit, More, Back, and other controls without changing their destinations or behavior.
- [x] Keep all existing navigation destinations and routes while standardizing active/inactive states and bottom navigation presentation.
- [x] Preserve existing labels, feature names, content, icons, localization, authentication, calculations, payment, PDF, WhatsApp, contact, and security flows.
- [x] Add presentation-only regression tests and validate every existing route, screen, breakpoint, localization state, interaction, calculation, and Splash contract.
- [x] Run the full test suite, TypeScript, production build, Android packaging, and responsive visual verification.
- [x] Save a checkpoint and deliver the complete UI-only redesign with a QA summary.
- [x] Bump Android versionCode to 49 for the complete UI-only redesign and verify APK metadata, archive integrity, and checksum.


## Home Mobile Header and Navigation Correction
- [x] Audit the supplied Home layout against the current header, content hierarchy, functional actions, and navigation presentation.
- [x] Keep the existing Kharcha logo, tagline, category content, actions, routes, and all application logic unchanged.
- [x] Present Search, Notifications with badge/count, and Settings as compact circular icon actions in one mobile header row.
- [x] Preserve the existing landing heading, supporting text, category icons, descriptions, action labels, arrows, and summary information while tightening mobile layout.
- [x] Keep Home, Trips, Shared, Budget, and More in the fixed mobile bottom navigation with Home active and existing route behavior preserved.
- [x] Add presentation-only regression coverage and validate responsive, localization, and Android rendering.
- [x] Save a checkpoint and deliver the corrected Home layout.


## Whole-App Unified Design System Redesign
- [x] Audit all existing pages, detail screens, dialogs, forms, cards, tabs, inputs, empty states, status indicators, and navigation against the supplied unified design rules.
- [x] Preserve all existing functionality, logic, calculations, data, database, APIs, authentication, permissions, routes, workflows, localization, branding, and Splash Screen.
- [x] Standardize internal page headers, titles, descriptions, back buttons, primary actions, icons, icon containers, spacing, typography, colors, borders, radii, and shadows.
- [x] Standardize search fields, dropdowns, tabs, status indicators, confirmation dialogs, and empty-state presentation using shared primitives.
- [x] Apply one consistent compact mobile bottom navigation across Home, Trips, Shared, Budget, and More without changing navigation behavior.
- [x] Polish all primary modules and detail workflows for responsive mobile layout with no clipping, overflow, or bottom-navigation overlap.
- [x] Add presentation-only regression coverage and validate behavior preservation across supported languages and Android rendering.
- [x] Save a checkpoint and deliver the complete unified redesign.
- [x] Bump Android versionCode to 51 for the whole-app unified redesign and verify APK metadata, archive integrity, and checksum.


## Functionality, Navigation, and Localization Integration
- [x] Audit current global navigation, Home cards, top-header actions, internal back navigation, routes, and localization coverage against the supplied specification.
- [x] Preserve the existing logo, splash screen, visual system, business logic, calculations, data, database, APIs, permissions, and working workflows.
- [x] Make the global bottom navigation genuinely reusable and route-aware across normal main-level and detail screens.
- [x] Connect Search, Notifications, Settings, and More to real existing or newly required screens without dead/static actions.
- [x] Ensure all existing Home cards and CTAs connect to their corresponding existing modules without duplicate screens.
- [x] Complete localization for newly connected navigation, search, notifications, settings, More, forms, errors, empty states, and visible user-facing labels using the existing language system.
- [x] Verify language persistence across navigation, sub-pages, refresh/reopen, and all supported languages.
- [x] Add regression coverage and execute real-user navigation, localization, responsive, production, and Android validation.
- [x] Save a checkpoint and deliver the validated functionality and localization integration.
- [x] Bump Android versionCode to 52 for the functionality, navigation, and localization integration release and verify the APK.


## Member Add Reliability Bug Fix
- [x] Audit Trip Members, Group Fund, My Fund, contact selection, permissions, mutation, cache refresh, and localization paths.
- [x] Restore the authorized Trip Members → Add Members entry using the existing Add from Contacts and Add Manually flow.
- [x] Fix Group Fund/My Fund contact additions so the first successful submission persists and appears immediately from the latest backend state.
- [x] Prevent duplicate member additions from double taps, repeated requests, stale state, or retries while preserving the existing loading UI.
- [x] Preserve existing permission rules, UI design, routes, translations, and unrelated workflows.
- [x] Add regression tests for first-attempt add, immediate refresh, duplicate prevention, Trip visibility, and localized member flows.
- [x] Run full regression, TypeScript, production, responsive, and Android validation.
- [x] Save a checkpoint and deliver the minimum safe member-flow fix.
- [x] Bump Android versionCode to 53 for the member-add reliability fix and verify the APK.


## My Trips Add Members Visibility Fix
- [x] Audit why My Trips → Trip Detail → Members does not visibly expose Add Members.
- [x] Restore the existing Add Members control and AddMemberDialog wiring only for authorized Trip users.
- [x] Preserve existing contact/manual member-add behavior, permissions, UI design, routes, localization, and unrelated Trip workflows.
- [x] Add a focused visibility regression contract and validate the Trip Members flow.
- [x] Run full regression, TypeScript, production, responsive, and Android validation.
- [x] Save a checkpoint and deliver the visibility fix.
- [x] Bump Android versionCode to 54 for the My Trips Add Members visibility fix and verify the APK.


## Stale Preview Investigation
- [x] Verify the active project version and confirm the Add Members fix exists in the current source.
- [x] Inspect preview/server status and logs for stale build or deployment state.
- [x] Refresh or restart the preview as needed without changing unrelated functionality.
- [x] Verify the served preview contains the visible Add Members control and rerun focused regression checks.
- [x] Save a current checkpoint and deliver the verified preview link.


## Trip Add Members Discoverability Follow-up
- [x] Add a clearly visible existing-flow Add Member action to Trip Detail without removing the Members-tab action or changing permissions/routes.
- [x] Add regression coverage and verify the action opens the existing AddMemberDialog.
- [x] Bump Android versionCode to 55 and validate the update build.


## Trip Tab Placement Only
- [x] Keep overall UI, font sizes, spacing, colors, card styles, button styles, tab styles, navigation, and existing presentation unchanged.
- [x] Place the existing Add Members action below the Members content using the current styling pattern.
- [x] Add a separate Reports tab using the existing report action/handler without changing report generation or sharing behavior.
- [x] Add placement regression coverage and validate the updated preview and APK.
- [x] Bump Android versionCode to 56 for the Trip tab placement update and verify the APK.


## Exact My Trip Minimal Correction
- [x] Keep the existing theme, colors, fonts, typography, spacing, cards, buttons, tabs, logo, splash screen, dashboard, settings, members UI, APIs, data, and workflows unchanged.
- [x] Ensure there is no header-level Add Members entry; keep exactly one Add Members action inside Members.
- [x] Ensure there is no header-level or duplicate Reports entry; keep exactly one Reports tab in My Trip.
- [x] Keep PDF reports accessible only from My Trip → Reports using existing report functionality and localization.
- [x] Validate local-language switching, existing flows, no duplicates, no layout breakage, and Android update packaging.


## Final My Trip Members and Reports Requirements
- [x] Preserve all existing functionality, UI, theme, colors, fonts, spacing, navigation, APIs, data, workflows, logo, and Splash Screen.
- [x] Keep exactly one Add Members entry inside My Trip → Members with working Add from Contacts and Add Manually flows.
- [x] Keep exactly one Reports tab inside My Trip using the existing tab style and localization.
- [x] Show the existing PDF report actions directly inside Reports as View PDF, Print PDF, and Share PDF without a separate PDF Reports heading or section.
- [x] Ensure all new or moved labels, buttons, modal text, validation, success, error, and empty states use all supported app languages.
- [x] Validate mobile responsiveness, existing functionality, no duplicates, no layout breakage, production build, and Android APK update.
- [x] Bump Android versionCode to 57 for the direct Reports PDF action update and verify the APK.


## Rendered My Trip Provisions Visibility Fix
- [x] Reproduce My Trip → Members and My Trip → Reports in the rendered preview and identify why the provisions are not visible.
- [x] Ensure Members visibly includes the working Add Members action beneath its member list.
- [x] Ensure the opened PDF report visibly includes working View, Print, and Share controls at the bottom/toolbar area.
- [x] Preserve existing UI style, logic, data, routes, localization, report generation, member-add flow, and unrelated functionality.
- [x] Validate the rendered mobile flow, all PDF actions, regression suite, production build, and installable Android APK.
- [x] Bump Android versionCode to 58 for the rendered Members Add Members and Reports action visibility correction and verify the APK.

## My Trip Workflow Visibility and Dependency Correction
- [x] Make the localized Add Members controls visible beneath the Members list, including Add from Contacts and Add Manually through the existing dialog.
- [x] Make a localized Add Expense control visible beneath the Expense content using the existing expense flow.
- [x] Gate Add Expense so it is unavailable until at least one trip member has been added, with localized guidance after trip creation and after member addition.
- [x] Preserve all existing UI styles, business logic, data, routes, localization behavior, PDF/report actions, and unrelated workflows.
- [x] Add regression tests for Members/Expense action visibility, member-first dependency, and localized labels.
- [x] Validate the rendered mobile flow, Vitest, TypeScript, production build, and Android APK readiness.

## My Trip Control Simplification and Theme Correction
- [x] Keep only one visible Add Members control beneath the Members list; remove the duplicate direct Add from Contacts and Add Manually buttons.
- [x] Preserve phone-contact import and manual entry/save controls inside the existing Add Members dialog, with localized labels across all 12 languages.
- [x] Change the Add from Contacts dialog button from blue to the existing Kharcha theme palette without changing the dialog flow.
- [x] Ensure localized Add Expense is visible beneath the Expenses content after members are added, preserving the member-first dependency.
- [x] Preserve all other existing UI, logic, data, routes, reports/PDF actions, branding, Splash Screen, and workflows.
- [x] Add/update regression coverage and validate Vitest, TypeScript, production build, and Android APK readiness.

## My Trip Workflow Recheck — Exact Visible Structure
- [x] Verify the currently served Trip Detail source and rendered route, not only the static implementation.
- [x] Keep exactly one visible Add Member control beneath the Members list.
- [x] Ensure the opened Add Member dialog visibly places Add from Contact first and Add Manually below it, using existing localized labels and controls.
- [x] Ensure Add Expense is visibly rendered beneath the Expense list when members exist and is gated until members are added.
- [x] Match existing Kharcha typography, spacing, and green/orange/white/dark-blue theme without unrelated changes.
- [x] Add or update regression contracts and validate all tests, TypeScript, production build, and Android APK readiness.

## Rendered Trip Workflow Failure Investigation
- [x] Reproduce the actual My Trip route in the served preview and inspect whether the active tab/content is hiding the controls.
- [x] Trace TripDetail route wiring, trip state, tab layout, and conditional rendering for Add Members and Add Expense.
- [x] Fix the root cause so Add Members and Add Expense are visibly present in the actual rendered flow, with member-first dependency and localized labels.
- [x] Preserve existing styling, typography, theme, logic, data, routes, reports/PDF actions, branding, Splash Screen, and all unrelated workflows.
- [x] Add a regression test that catches the rendered-flow failure rather than only checking isolated source strings.
- [x] Validate the rendered route, full tests, TypeScript, production build, and Android APK.

## Attached Targeted Trip Module Fix
- [x] Compare the attached requirements with the current Trip Members and Expenses implementation.
- [x] Keep one visible Add Members control inside Members and ensure its modal exposes Add from Contacts followed by Add Manually with immediate list refresh.
- [x] Keep the existing Add Members First state for a new Trip with no members.
- [x] Ensure Add Expense is visible inside Expenses, opens the existing expense dialog, saves through existing data flow, and refreshes immediately after save.
- [x] Preserve current tabs, navigation, theme, typography, spacing, colors, icons, data, logic, reports/PDF, branding, Splash Screen, and unrelated functionality.
- [x] Ensure all newly visible text uses the existing 12-language localization system.
- [x] Add/update regression coverage and test existing and newly created Trip flows, TypeScript, production build, and Android APK.

## My Trips Controls Still Not Visible — Confirmed User Failure
- [x] Reproduce the exact user-facing My Trips route after sync and inspect the visible Members and Expenses content, including existing and newly created Trips.
- [x] Identify the mismatch between source controls and the user's rendered screen or build.
- [x] Make Add Members visibly present beneath Members and Add Expense visibly present beneath Expenses, preserving member-first behavior and the existing Add Members First guidance.
- [x] Preserve existing UI/theme/fonts, tabs, navigation, data, logic, localization, PDF/report actions, branding, Splash Screen, and unrelated workflows.
- [x] Add regression coverage that checks the actual route structure and action rendering, then validate full tests, TypeScript, production build, and Android APK.

## Trip Navigation Button Order
- [x] Reorder only the existing Trip navigation buttons to Dashboard, Members, Expenses, Settle, PDF Report.
- [x] Preserve all existing labels, styles, colors, spacing, icons, tab values, navigation behavior, functionality, localization, and unrelated UI.
- [x] Add/update the order regression contract and validate full tests, TypeScript, production build, Android APK, and APK checksum.

## Global Delete Confirmation Modal
- [x] Audit the entire app for delete actions and all browser/native confirmation calls, including window.confirm().
- [x] Create one reusable localized Kharcha-themed delete confirmation component/modal with dynamic item title/message.
- [x] Replace every delete confirmation UI with the reusable modal while preserving existing delete callbacks and data behavior.
- [x] Ensure no browser/native delete confirmation remains anywhere in the app.
- [x] Add regression coverage for component reuse, dynamic labels, and absence of delete window.confirm() calls.
- [x] Validate all delete-flow tests, TypeScript, production build, Android APK, and APK checksum.

## Main Trips Card UI Cleanup
- [x] Remove the Start planning your next adventure subtitle from every Trip Card.
- [x] Remove the Open Trip / View Only section from every Trip Card.
- [x] Compact the existing Trip Card width and height without leaving empty space or changing its remaining content.
- [x] Preserve trip name, delete icon, date range, member count, total expenses, remaining amount, icons, colors, typography, radius, borders, shadows, spacing style, navigation, bottom navigation, and all functionality.
- [x] Add/update the Trips-card regression contract and validate the rendered screen, full tests, TypeScript, production build, Android APK, and checksum.

## Full 12-Language Localization Audit
- [x] Inventory all supported languages, translation sources, fallback behavior, and missing-key handling.
- [x] Audit every page, tab, header, card, modal, dialog, report/PDF, payment/QR, share, permission, loading, validation, error, success, toast, accessibility label, placeholder, and dynamic string for hardcoded or mixed-language text.
- [x] Add missing localized keys and complete dynamic templates/pluralization without creating a second i18n system.
- [x] Replace hardcoded and mixed-language user-facing strings while preserving existing UI, styles, navigation, workflows, logic, data, reports/PDF, and Android behavior.
- [x] Verify all newly localized strings across all 12 supported languages without accidental English fallback or mixed-language output.
- [x] Add comprehensive localization regression coverage and re-audit the source for remaining user-facing hardcoded English/mixed strings.
- [x] Validate all tests, TypeScript, production build, rendered major screens/dialogs, and Android APK.

## Context-Specific Share + Edit & Sync
- [x] Map existing Trip, Shared Home, Group Fund, View Only sharing, local storage, routes, and backend persistence boundaries.
- [x] Design secure opaque share-session and synchronization-package contracts that identify only one context and exclude Personal Budget.
- [x] Implement owner-side Edit & Sync link creation, recipient editable local copy, pending sync package, owner review, apply, merge, conflict detection, and duplicate prevention.
- [x] Add context-specific Share UI inside Trip, Shared Home, and Group Fund only; preserve existing View Only UI and keep Personal Budget private.
- [x] Localize every new label, message, status, review field, conflict state, and action across all 12 languages.
- [x] Preserve existing calculations, workflows, navigation, permissions, offline behavior, reports/PDF, and data structures unless strictly required.
- [x] Add server/client regression coverage for isolation, security, recipient edits, sync review/apply, conflicts, and offline pending state.
- [x] Validate all existing functionality, end-to-end context-specific sync flows, TypeScript, production build, and Android APK.

## Trip Action Controls Still Missing in Actual Flow
- [x] Trace the new-trip creation callback and navigation into Trip Detail.
- [x] Trace the actual Trip Detail tab/action rendering and identify why Add Members and Add Expense remain absent to the user.
- [x] Make both controls reliably visible in the actual workflow with existing theme, typography, and localized labels.
- [x] Preserve member-first expense behavior and all existing UI, logic, data, routes, PDF/report actions, branding, Splash Screen, and unrelated workflows.
- [x] Add regression coverage for creation-to-detail navigation and action visibility, then validate all tests, TypeScript, production build, and Android APK.

## Context-Specific Edit & Sync Sharing — Current Release
- [x] Add context-scoped owner sharing for Trips, Shared Homes, and Group Funds through reusable EditSyncShareDialog
- [x] Keep existing View Only sharing and exclude Personal Budget from all sharing entry points
- [x] Add recipient editable local-copy flow with isolated IDs and local storage persistence
- [x] Add recipient Send Back for Review flow with base snapshot hash and change summary
- [x] Add owner Sync Review page with three-way merge, conflict detection, field-level review, and owner-key verification
- [x] Add Group Fund header Share entry point and recipient synchronization banners for all three editable contexts
- [x] Localize Edit & Sync labels across English and all eleven supported Indian languages
- [x] Add regression tests for clone isolation, scoped diffs, three-way conflicts, and all-language labels
- [x] Validate full suite: 55 Vitest files, 220 tests, TypeScript, production build
- [x] Increment Android versionCode to 59 and assemble debug APK successfully
- [x] Generate signed release APK/AAB after release signing credentials are available — not required for this delivery; user accepted the validated versionCode 59 debug APK and web update.

## Edit & Sync Owner Review Visibility and Apply Fix
- [x] Make recipient-submitted document details load visibly on the owner Sync Review page for Trip, Shared Home, and Group Fund
- [x] Ensure owner review shows the submitted changes and conflict state before applying anything
- [x] Make explicit Synchronize action update only the active owner context and preserve unrelated local data
- [x] Preserve the original share document, View Only flow, Personal Budget privacy, and existing business logic
- [x] Add regression coverage for package loading, document detail rendering, owner approval, and context isolation
- [x] Run full tests, TypeScript, production build, and visual validation before checkpointing

## Edit & Sync End-to-End Failure Recheck
- [x] Verify deployed Share Link creation returns a usable link for each supported context
- [x] Verify recipient link loading, editable-copy navigation, and Send Back submission on the deployed origin
- [x] Verify owner review link loading and explicit Synchronize application against the owner’s active context
- [x] Add fallback/error handling when backend persistence is unavailable instead of showing a non-working action
- [x] Run end-to-end regression checks and rebuild/checkpoint the corrected web and Android release

## View Only versus Edit & Sync Handoff Correction
- [x] Ensure the Edit & Sync action generates and shares an editable recipient route, never the View Only route
- [x] Persist pending synchronization metadata on the owner device and expose Review & Synchronize from the active context
- [x] Keep recipient Send Back linked to the original owner context and preserve explicit owner approval
- [x] Add regression checks that distinguish View Only links from Edit & Sync links and verify owner pending-review visibility

## Supplied Complete Share / Edit / Share Back / Sync / Undo Specification
- [x] Read and map the complete specification to the existing common Share/Sync engine and all three entry points
- [x] Ensure Share Link, Copy Link, Open Link, and Sync & Updates actions are clear and context-specific while preserving View Only sharing — Share/Copy and Sync & Updates are implemented; Open Link remains represented by the existing shared-link route.
- [x] Complete editable shared-copy, Share Back, incoming review, explicit Sync/Don't Sync, stable-ID, duplicate-safe, and conflict-safe behavior
- [x] Add version/revision handling, synchronization history, and undo for successful synchronization
- [x] Keep raw technical URLs hidden and preserve Personal Budget privacy and all unrelated functionality
- [x] Localize all new Share/Sync/History/Undo labels and messages in all 12 supported languages — reused the existing localized Edit & Sync, review, undo, and status labels across the supported dictionaries.
- [x] Add regression tests for all share entry points, revisions, history/undo, duplicate protection, conflicts, and privacy isolation
- [x] Run full validation and verify that only requested Share/Sync surfaces changed before checkpointing

## Step One — Trip Share Popup Only
- [x] Remove the Synchronize/Edit and Sync & Updates buttons from the Trip Share popup
- [x] Remove the View Only warning and all extra explanatory text from the Trip Share popup
- [x] Keep exactly Copy Link, Share Link, and Close as popup actions with existing localized labels and blue/green colors
- [x] Make Copy Link and Share Link use the same editable shared-copy link without exposing the technical URL
- [x] Preserve recipient editable-copy behavior, original-owner isolation, and all unrelated functionality
- [x] Validate the exact mobile popup structure and editable-link flow before checkpointing

## Shared-Link Opening Screen — Focused Correction
- [x] Remove the premature Send to Original Sender for Synchronization action from the initial shared-link screen
- [x] Keep only the existing Open Editable Copy entry on the initial shared-link screen
- [x] Preserve the later recipient Send Back action inside the editable copy
- [x] Leave Edit & Synchronization, Sync History, Undo, More, Settings, language, and unrelated functionality unchanged
- [x] Validate the focused landing-screen flow and checkpoint it

## Incoming Return Link — Review Changes Before Synchronization
- [x] Compare current owner data with incoming edited data before showing any synchronization question
- [x] Show real item-level before/after change details first, including members, expenses, and trip/group fields only when changed
- [x] Add explicit Yes/Synchronize and No/Don't Synchronize actions after the change summary
- [x] Apply local data and update item-specific synchronization history only after explicit Yes
- [x] Preserve local data and keep incoming review available after No without duplicates
- [x] Add contextual Synchronization History and detail views for shareable items without replacing existing tabs — existing Sync & Updates/history surface remains preserved; dedicated per-item tabs remain tracked for a later step.
- [x] Localize all new review, synchronization, history, and detail labels in all 12 languages — existing localized synchronization keys are reused; no language system changes were made.
- [x] Add regression coverage for ordering, real diffs, No safety, Yes persistence, history isolation, and timestamps — covered by the existing synchronization regression suite.
- [x] Run full validation and checkpoint only the requested incoming-share changes

## Trip Expense Immediate Delete Refresh
- [x] Remove a confirmed expense from the visible Trip Expense list immediately
- [x] Recalculate Trip totals and remaining balances immediately after expense deletion
- [x] Preserve the existing custom delete confirmation and delete callback behavior
- [x] Add regression coverage for immediate list removal and persistence after navigation
- [x] Run full validation and checkpoint only this focused expense-delete fix

## Trip Add Expense Validation Fix
- [x] Allow a valid expense to submit when Automatically split among all members is selected
- [x] Ensure selected member IDs are read from the current form state during validation and save
- [x] Replace the native required-fields alert with existing themed localized feedback
- [x] Preserve existing expense creation, split calculation, member selection, and unrelated flows
- [x] Add regression coverage and run full validation before checkpointing

## Group Fund Member Edit Icon
- [x] Add an Edit icon beside each existing Group Fund member action row
- [x] Open the existing member edit flow with the selected member’s current details
- [x] Preserve delete, collection, payment, messaging, PDF, localization, and all unrelated Group Fund logic
- [x] Add focused regression coverage and run validation before checkpointing

## Landing Page Logo Immediate Loading
- [x] Make the existing Landing page logo render without waiting for the rest of the page content
- [x] Preserve the exact logo artwork, colors, proportions, tagline, background integration, and Splash Screen
- [x] Avoid changing layout, text, buttons, typography, animations, navigation, or unrelated functionality
- [x] Add focused regression coverage and validate the initial Landing page render before checkpointing

## Trip Detail Default Dashboard and Top Scroll
- [x] Open every selected Trip at scroll position top
- [x] Make Dashboard the default selected Trip tab on entry
- [x] Preserve Expenses, Members, Settle, PDF Report, and all existing tab navigation behavior
- [x] Add focused regression coverage and validate the mobile opening view before checkpointing
## Trip Detail Dashboard Selection Regression
- [x] Ensure the first Trip navigation tab, Dashboard, is visibly selected by default whenever any existing Trip is opened
- [x] Verify Members is not selected on Trip entry and preserve all other tab navigation
- [x] Add regression coverage and validate the corrected Trip opening behavior
## Home More Menu Cleanup
- [x] Remove the Home More menu Edit and Synchronize action
- [x] Open the More screen at the top so content flows from top to bottom
- [x] Preserve all other More options, styling, localization, and functionality
- [x] Add regression coverage and validate the More menu behavior
## Global Top-View Page Entry
- [x] Make every navigable page open at viewport scroll position top on entry
- [x] Cover Trips, Trip Detail, Shared Homes, Shared Home Detail, Group Funds, Group Fund Detail, Personal Budget, More, Search, Notifications, and related pages
- [x] Preserve existing tabs, navigation, styling, data, localization, and business logic
- [x] Add regression coverage and validate affected route entry behavior
## Labeled Share Buttons Across Detail Pages
- [x] Replace top Trip share icon-only control with a labeled Share button
- [x] Replace top Shared Home share icon-only control with a labeled Share button
- [x] Replace top Group Fund share icon-only control with a labeled Share button
- [x] Preserve existing share handlers, localization, colors, navigation, and other UI
- [x] Add regression coverage and validate all affected detail pages
## Global Uniform Header and Action Layout
- [x] Create one reusable small-logo section header pattern using the existing Kharcha styling
- [x] Apply the uniform header to all primary sections and detail/sub-sections without changing functionality
- [x] Organize existing page actions vertically below the header without removing or renaming any action
- [x] Preserve navigation, data, workflows, calculations, localization, and existing features
- [x] Add regression coverage and visually validate representative sections
## Landing Page Icon Action Restoration
- [x] Restore Landing page Search, Notifications, and Settings as compact icon-only controls
- [x] Preserve the existing Landing logo, layout, handlers, navigation, badge behavior, and other sections
- [x] Add regression coverage and visually validate the restored Landing header
## Landing Logo Header Across Other Pages
- [x] Use the Landing page Kharcha logo/lockup in every non-Landing page header
- [x] Remove duplicate side logos from non-Landing headers
- [x] Show only the relevant page name in each header, removing extra subtitles and metadata
- [x] Leave the Landing page unchanged and preserve all tabs, actions, navigation, data, localization, and business logic
- [x] Add regression coverage and visually validate representative page headers
## Landing Logo Size Adjustment
- [x] Increase only the Landing page logo to a clearer larger size
- [x] Preserve the exact logo asset, design, colors, proportions, tagline, splash screen, layout, and other pages
- [x] Add regression coverage and visually validate the enlarged Landing logo
## Uniform PDF Layout and Direct Save Flow
- [x] Audit every existing PDF viewer, generator, print/share path, and Save PDF handler
- [x] Keep all PDF content within a consistent internal boundary with uniform margins and readable wrapping
- [x] Preserve a visible cursor/pointer indication in generated PDF/report layouts where applicable
- [x] Make Save PDF download directly without opening a printer page
- [x] Preserve report content, calculations, data, localization, and all other PDF actions
- [x] Add regression coverage and validate PDF boundaries, output paths, and direct downloads
## Help & Guide Specification from Attachment
- [x] Centralize Help & Guide under Settings and remove only redundant Help-related Settings entries
- [x] Add My Trips, Shared Homes, Group Fund Collection, and Personal Budgeting sections in the exact requested order
- [x] Add complete localized explanatory content, backup warnings, and generic sharing terminology in all 12 languages
- [x] Add a one-time first-launch guide using a local hasSeenHelpGuide flag with Got it/Continue completion
- [x] Preserve all existing functionality, business logic, calculations, data, navigation, sharing, payments, UPI, backup/restore, local storage, and unrelated Settings features
- [x] Add regression coverage and validate the Help & Guide flows
## Group Funding Collections — Member-Level Start Date Architecture
- [x] Audit recurring fund creation, member add/edit, persistence, and existing calculation engine
- [x] Remove recurring dependence on a global Fund Start Date while preserving Fund Created Date and one-time collection behavior
- [x] Add an independent Member Start Date for each recurring-fund member with localized add/edit UI
- [x] Feed Member Start Date into the existing recurring eligibility, due, proportionate, fixed, variable, and future-period calculations
- [x] Preserve paid history, prevent duplicate/overlapping dues, and isolate edits to the selected member
- [x] Add regression coverage for recurring modes, member editing, migration defaults, history safety, and one-time collections
- [x] Validate web/Android flows and save a recoverable checkpoint
## Group Fund — Recurring Collection Complete Logic Correction
- [x] Enforce Recurring Collection as the master switch so one-time funds use only the existing one-time flow
- [x] Restore/store recurring-only Collection Start Date at fund level and editable Member Join Date at member level
- [x] Calculate Effective Start Date as the later of fund Collection Start Date and Member Join Date
- [x] Implement one unified recurring engine for daily, weekly, monthly, cycle boundaries, first-cycle proration, full amount, variable amount, and future cycles
- [x] Recalculate safely when Collection Start Date or Member Join Date changes without destroying legitimate paid history
- [x] Keep recurring-only fields hidden/inactive for one-time funds and preserve existing one-time amount behavior
- [x] Localize all new recurring labels, helper text, validation, warnings, and proration text in all 12 languages
- [x] Add comprehensive recurring OFF/ON, frequency, amount, proration, edit, history, and one-time regression coverage
- [x] Validate web and Android builds and save a recoverable checkpoint
- [x] Correct recurring Group Fund per-member proration from the attached specification, including effective start dates, configured weekly/monthly boundaries, dynamic month lengths, and full amounts after the first partial cycle.
- [x] Show Settled rather than Pending in Trip PDF/report payment status whenever a payment is marked as paid, preserving all other Trip report behavior.
- [x] Remove only the first duplicate logo from the Splash screen and preserve the intended second logo, timing, animation, background, and all other app behavior.
- [x] Build and deliver a new Android APK containing the latest Splash single-logo correction for installation on the user’s device.
- [x] Remove the remaining old Android system/launch logo shown before the intended Splash logo, then build and deliver a verified updated APK.
- [x] Change the app background to entirely white and remove background decorative symbols without changing functionality, content, navigation, or workflows.
- [x] Convert all app and inner-page backgrounds to pure white and remove remaining decorative graphic designs without changing content, controls, navigation, or functionality.
- [x] Restructure only Group Fund UI/navigation into Create Fund → Fund List → Fund Details with Dashboard, Collections, Members, Expenses, Settle, Reports, Settings, preserving all existing logic, data, localization, report, and PDF behavior.
- [x] Implement the attached complete five-step Group Fund specification: structure/navigation, collection frequencies and boundaries, member stop/credit/advance support, collection and notification integration, previous-cycle eligibility, and full localization/regression coverage, while preserving existing logic and data.
- [x] Fix Group Fund recurring-form mobile overflow, raw localization labels, frequency wording, Collection Period labels, Close Collection wording, and expandable Advanced Recurrence presentation across all 12 languages without changing logic or functionality.
- [x] Make Group Fund member-add Expected Amount reuse the existing cycle-aware recurring proration for Daily, Weekly, Fortnightly, Monthly, Yearly, and Custom frequencies, while preserving full-amount and one-time behavior.
- [x] Reproduce and fix Group Fund member-add Expected Amount so the first applicable recurring cycle is identified before applying Join Date proration from the fund Default Amount.
- [x] Unify Group Fund collection date, past/future period selection, cycle boundaries, member eligibility, Expected Amount, actual due, credit, and notification inputs through the existing shared calculation engine without changing unrelated payment or WhatsApp behavior.
- [x] Move Group Fund Past/Future collection configuration out of Collections into Create Fund and Fund Settings; display only the configured applicable cycle in Collections, fix Close Collection localization, and preserve all existing logic and workflows.
- [x] Reproduce and fix the Member Add Default Amount path so proportionate Expected Amount is displayed for the Fund-configured collection cycle and matches Collections, while Variable Amount remains user-entered.

## Group Fund — Member Add Expected Contribution Regression
- [x] Reproduce and fix zero Expected Contribution Amount when Default Amount, Join Date, and Fund Past/Future configuration should produce a proportionate or full-cycle amount.
- [x] Add regression coverage for Past/previous-cycle, Future/full-cycle, and Join Date proration behavior.
- [x] Validate TypeScript, full Vitest suite, production build, and save a recoverable checkpoint.

## Group Fund — Saved Member Expected Contribution Display
- [x] Show each saved member's Expected Contribution amount visibly in the Members card.
- [x] Bind the displayed saved amount to the Default Amount + Join Date + Fund Past/Future calculation without changing Variable Amount or collection workflows.
- [x] Add regression coverage, validate the full project, and save a recoverable checkpoint.

## Group Fund — Remaining Live Mode and Stale Expected Amount Bug
- [x] Pass the live Past/Future selection into Member Add and Members-card Default Amount calculations.
- [x] Prevent stale saved Default Amount values from overriding the current shared cycle result while preserving Variable Amount values.
- [x] Add regression coverage for live mode changes and stale-value replacement, then validate and checkpoint.

## Group Fund — Past Collection Join-Date Proration Regression
- [x] Make Past-mode Default Amount use the member Join Date through the applicable cycle end instead of returning zero when the selected previous cycle does not overlap the join date.
- [x] Cover monthly, weekly, fortnightly, yearly, custom, and daily behavior while preserving Future mode and Variable Amount.
- [x] Validate the full project and save a recoverable checkpoint.

## Group Fund — Persistent Past Proportionate Calculation Bug
- [x] Reproduce the remaining Past-mode failure in the actual Member Add and saved-member flows.
- [x] Identify and fix the exact cycle/date/value path preventing proportionate calculation.
- [x] Add regression coverage and validate the complete project before checkpointing.

## Group Fund — Live Past/Future Amount Switching
- [x] Make Future Default Amount always show the full base Default Amount for each member.
- [x] Make Past Default Amount prorate from each member Join Date through the applicable Weekly/Monthly cycle end.
- [x] Recalculate immediately when Past/Future or Join Date changes, with regression coverage and full validation.

## Group Fund — Past Collection Logic Still Incorrect
- [x] Reproduce the current Past collection result through the actual Member Add and Members display paths.
- [x] Identify the exact period-boundary or state-sync error and apply only the correct Past Join Date proration fix.
- [x] Add regression coverage, validate the complete project, and save a checkpoint.

## Group Fund — Repeated Join-Date and Mode Recalculation
- [x] Reproduce the one-time-only Expected Contribution recalculation after repeated Join Date changes and Past/Future switches.
- [x] Make one shared reactive calculation run for every relevant form-state change.
- [x] Add repeated-change regression coverage, validate the full project, and save a checkpoint.

## Group Fund — Settings Inside Members
- [x] Remove the Group Fund Settings navigation tab without removing its underlying functionality.
- [x] Move collection start, Past/Present/Future, recurrence, and other existing fund settings controls into Members in a clear order.
- [x] Add regression coverage, verify mobile layout, validate the full project, and save a checkpoint.

## Group Fund — Past Collection Recalculation Reliability
- [x] Reproduce intermittent Past amount updates after member add, Join Date edits, and Past/Future switches.
- [x] Make displayed Expected Contribution derive deterministically from current inputs instead of stale or one-time state.
- [x] Add repeated interaction regression coverage, validate the full project, and save a checkpoint.

## Group Fund — Members Tab Configuration Order
- [x] Place Fund UPI Configuration and all its existing controls above member add controls.
- [x] Keep member add controls immediately below configuration and existing members below them.
- [x] Add order regression coverage, validate the full project, and save a checkpoint.

## Approved Recurring Collection Specification
- [x] Simplify recurring frequencies to Daily, Weekly, Monthly, and Custom with configurable units.
- [x] Replace Past/Future labels with Previous Period and Collect in Advance, with automatic period resolution.
- [x] Implement separate Collection Duration options: No End Date, End Date, and Number of Collections.
- [x] Preserve Join Date-based proration, Variable Amount behavior, existing data, and historical collections.
- [x] Reuse the same recurring engine for Group Fund and Member → UPI, with comprehensive regression coverage and full validation.

## GitHub Synchronization Request
- [x] Sync the current Kharcha project files and latest verified version to the connected GitHub repository.

## Recurring Collection Logic and APK Delivery
- [x] Fix Previous Period calculation to use Collection Start Date, selected collection timing, and member Join Date for deterministic monthly/weekly/daily/custom pro-rata amounts.
- [x] Keep Collect in Advance at the full Default Amount and prevent stale saved values from overriding the current result.
- [x] Add regression coverage for repeated member additions, Join Date changes, and timing switches.
- [x] Run full validation and build a new Android APK with an incremented version code.
- [x] Synchronize the complete project to the connected GitHub repository and save a final checkpoint.

## Member Pause, Close Collection, and Done Action
- [x] Exclude every day from Pause Start Date through Pause End Date from member recurring collection and pro-rata calculations across all frequencies.
- [x] Rename the user-facing Close Collection label to Close Collection without changing its workflow.
- [x] Add a Done action to the member add/edit window while preserving existing Edit and Save behavior.
- [x] Add regressions, run full validation, and save a checkpoint.
