# Kharcha: Comprehensive Application Architecture & Module Brief

**Prepared for:** Technical Review & AI-Assisted Development (Claude)  
**Application Name:** Kharcha (Split, Track, Settle)  
**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui components, LocalStorage persistence engine, Vite, Node.js/Express backend stubs.  
**Supported Languages:** English, Malayalam, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese (12 Indian languages via centralized localization registry).

---

## 1. Executive Summary & Core Philosophy

**Kharcha** is a mobile-first, privacy-focused expense management and bill-splitting application tailored specifically for Indian users. It combines a vibrant design system (Indian flag-inspired accents of saffron, white, and green) with offline-first local storage persistence. 

Unlike traditional cloud-tethered applications, Kharcha operates primarily on a **local-first** model: all user financial records, trips, shared home expenses, group funds, and personal budgets reside securely within the browser or device storage (`localStorage`). This ensures complete user privacy, instantaneous responsiveness, and full offline usability while offering lightweight read-only sharing mechanisms for collaboration.

---

## 2. Architecture & Data Persistence Model

### 2.1 Storage Layer
- **Client-Side Persistence:** The app relies on `localStorage` partitioned by specific storage keys for each functional module (e.g., `kharcha_trips`, `kharcha_shared_homes`, `kharcha_group_funds`, `kharcha_personal_budget`).
- **Isolation:** Each module maintains its own robust JSON schema parser with error boundaries and automatic default seeding.
- **Offline Reliability:** Because data is stored locally, users can record expenses, manage funds, and calculate settlements without an active internet connection.

### 2.2 Sharing & Collaboration Model
- **Read-Only Snapshot Sharing:** Kharcha does not utilize a centralized live database for collaborative editing. Instead, it generates compressed, read-only URL state snapshots or clean trip summaries.
- **WhatsApp & Native Web Share Integration:** Users can instantly dispatch payment requests, collection reminders with UPI links, and view-only trip summaries directly through native platform share sheets (WhatsApp, SMS, Email, etc.).

### 2.3 APK & Mobile Deployment Behavior
- **PWA (Progressive Web App) Foundation:** The app includes a web manifest (`manifest.json`) and responsive mobile viewport styling, allowing it to be wrapped into an Android APK (via Trusted Web Activities or PWABuilder).
- **Execution Context:** When installed as an APK, the app runs inside a native web view container. All data created within the APK is stored in the device's local application storage. Uninstalling the app, clearing app data, or switching devices will not automatically transfer local records unless an explicit export/backup mechanism is used.

---

## 3. Detailed Module Breakdown & Workflows

### 3.1 Module 1: Trips & Expense Splitting
- **Purpose:** Designed for travelers and friend groups splitting shared trip costs.
- **Key Features:**
  - Create trips with custom titles, dates, and member lists.
  - Add expenses categorized by Food, Transport, Hotel, Shopping, etc., specifying who paid and how the bill is split (equally or custom amounts).
  - Built-in settlement summary showing who owes whom.
  - **UPI Integration:** One-tap launch of default UPI apps (`upi://pay`) for direct settlements, accompanied by QR code scanning options and post-payment status updates.
  - Sorting (Newest First, Name, Amount, Payer) and read-only trip sharing.

### 3.2 Module 2: Shared Homes (Roommate Expenses)
- **Purpose:** For flatmates, couples, or shared apartments managing recurring rent, utilities, and grocery bills.
- **Key Features:**
  - Household member management and rent distribution.
  - Tracking shared utility bills and common household expenses.
  - Transparent settlement tracking across monthly cycles.

### 3.3 Module 3: Group Funds & Collections
- **Purpose:** For recurring collections, kitty parties, office clubs, or community fund drives.
- **Key Features:**
  - **Flexible Frequencies:** Daily, Weekly, or Monthly collections with customizable cycle boundaries (e.g., Calendar Month vs. Join-Date cycle).
  - **Recurring & Proration Logic:** Supports default amounts or variable amounts, with precise daily proration for mid-cycle joiners (retaining exact two-decimal paise values without rounding loss).
  - **Collection Tracking:** Pending/Paid status badges, undo collection actions for mistake correction, and one-click WhatsApp payment reminders with embedded UPI deep links.
  - **Fund Expense Ledger:** Tracking expenses incurred against the collected fund alongside net balance summaries.

### 3.4 Module 4: Personal & Household Finance (Budgeting)
- **Purpose:** A comprehensive personal finance tracker designed for individual and family budgeting.
- **Key Features:**
  - **Mobile Navigation:** Multi-tab layout (Overview, Income, Expenses, Recurring, Goals, etc.).
  - **Income Tracking:** Separate management of income sources and actual received transactions.
  - **Smart Expenses & Quick Entry:** One-tap quick entry shortcuts (Milk, Food, Transport, Other), category budgets with limit thresholds, and payment method tracking.
  - **Recurring Expense Engine:** Daily, Weekly, and Monthly recurrence rules with idempotent monthly cycle materialization, Proration, and Paid/Pending status management.
  - **Financial Goals:** Savings and investment goal tracking with progress bars, contribution allocations, and safe deletion flows.

---

## 4. Localization Architecture

- **12 Indian Languages:** English, Malayalam, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese.
- **Unified Registry:** Managed centrally via `LanguageContext` and Supplemental Dictionaries (`languageExtras.ts`).
- **Global & Local Scope:** Language selector is accessible from the initial one-time Welcome popup and the persistent Settings menu, instantly translating UI labels, card headers, form fields, and informational notes across all modules.

---

## 5. Current Limitations & Recommended Next Enhancements

1. **JSON Backup & Restore:** Because data resides in `localStorage`, adding a dedicated Backup (Export JSON) and Restore (Import JSON) feature in Settings is the highest priority to prevent accidental data loss upon device clearing or browser cache resets.
2. **App Lock / PIN Protection:** Adding a 4-digit PIN code or biometric gate for personal finance and shared expense logs.
3. **Global Search:** Fast searching across trips, group funds, and expense transactions.
4. **Cloud Sync Option:** Optional backend database synchronization for users who want multi-device cloud backup.

---
*End of Technical Brief. This document can be copied and provided directly to Claude or any engineering assistant to establish complete context regarding Kharcha's architecture, workflows, and data models.*
