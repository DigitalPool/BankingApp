# 🏦 Fintech Banking App

A comprehensive banking platform built with **Next.js**, **TypeScript**, **TailwindCSS**, and **Appwrite**. This app allows users to manage finances by connecting multiple bank accounts, transferring funds, and tracking transactions seamlessly.

This README keeps the original project overview and expands it with a much more detailed explanation of the app's architecture, the Appwrite database design, the data flow between services, and how the main features work end to end.

---

## 📸 Screenshots

### Dashboard
![Dashboard](https://github.com/DigitalPool/BankingApp/blob/main/screenshots/Dashboard.jpg)

### Transactions
![Transactions Screenshot](https://github.com/DigitalPool/BankingApp/blob/main/screenshots/Transaction%20History.jpg)

### Banks
![Banks Screenshot](https://github.com/DigitalPool/BankingApp/blob/main/screenshots/My%20Banks.jpg)

---

## 🚀 Features

- **Secure Authentication** with validations and user roles.
- **Bank Integration**: Connect multiple accounts with real-time balance updates.
- **Transaction Management**: Filter, sort, and paginate transaction histories.
- **Funds Transfer**: Send money between accounts with ease.
- **Financial Insights**: Visualize spending across categories and time periods.
- **Responsive Design**: Optimized for desktop, tablet, and mobile.

---

## TestLogin

These appear to be sandbox/demo credentials kept from the original README:

```text
gp1-8
First_Platypus Bank
user_gd
pss_gd

az1-8
dp1-8
```

If you use these, treat them as development-only credentials and never reuse them in production or in a public environment.

---

## ⚙️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [TailwindCSS](https://tailwindcss.com/), [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Appwrite](https://appwrite.io/), [Dwolla](https://www.dwolla.com/), [Plaid](https://plaid.com/)
- **Data Validation**: [Zod](https://zod.dev/), React Hook Form
- **Charts**: [Chart.js](https://www.chartjs.org/)

### Main libraries used in this codebase

- `next@14` for the application shell and server actions
- `node-appwrite` for Appwrite auth and database operations
- `plaid` for bank account linking and transaction sync
- `dwolla-v2` for customer creation, funding sources, and transfers
- `react-plaid-link` for the Plaid Link flow in the client
- `react-hook-form` + `zod` for form handling and validation
- `react-chartjs-2` + `chart.js` for balance and category visualizations

---

## 🧭 What This Project Actually Stores

This app does **not** store a full banking ledger locally. Instead, it combines:

- **Appwrite** as the app's main persistent database
- **Plaid** as the source of linked bank account details and transaction feeds
- **Dwolla** as the money movement layer for transfers between funding sources

In practice:

- **Users** are stored in Appwrite and mirrored to an Appwrite auth account
- **Linked bank connections** are stored in Appwrite
- **Manual transfer records** are stored in Appwrite
- **Bank balances and synced Plaid transactions** are fetched live from Plaid when pages load

That means Appwrite acts as the app-owned database, while Plaid and Dwolla provide external financial infrastructure.

---

## 🗂️ Appwrite Database Overview

The backend expects one Appwrite database with **three collections**:

1. `users`
2. `banks`
3. `transactions`

The collection IDs are configurable through environment variables:

```env
APPWRITE_DATABASE_ID=
APPWRITE_USER_COLLECTION_ID=
APPWRITE_BANK_COLLECTION_ID=
APPWRITE_TRANSACTION_COLLECTION_ID=
```

### 1. Users collection

This collection stores the application profile associated with an Appwrite Auth user and Dwolla customer.

Expected fields inferred from the code:

- `userId`: Appwrite Auth user id
- `email`
- `firstName`
- `lastName`
- `address1`
- `city`
- `state`
- `postalCode`
- `dateOfBirth`
- `ssn`
- `dwollaCustomerId`
- `dwollaCustomerUrl`

What it is used for:

- Sign-in and session lookup
- Displaying the logged-in user's profile data
- Creating Dwolla customers during sign-up
- Looking up all connected banks belonging to a user

Relevant code:

- `lib/actions/user.actions.ts`
- `lib/appwrite.ts`

### 2. Banks collection

This collection stores each linked bank account after Plaid Link succeeds and Dwolla funding source creation completes.

Expected fields inferred from the code:

- `userId`: reference to the Appwrite user document
- `bankId`: Plaid item id
- `accountId`: Plaid account id
- `accessToken`: Plaid access token
- `fundingSourceUrl`: Dwolla funding source URL
- `shareableId`: base64-encoded account id used for recipient transfers

What it is used for:

- Fetching account balances from Plaid
- Fetching institution metadata from Plaid
- Locating a funding source for Dwolla transfers
- Resolving incoming transfer recipients by shared id

Important note:

The app stores `accessToken` directly in the `banks` collection. That is convenient for the current implementation, but it is sensitive data and should be handled with strict Appwrite permissions in any real deployment.

### 3. Transactions collection

This collection stores **app-created transfer records**, not all card/bank transactions from Plaid.

Expected fields inferred from the code:

- `name`
- `amount`
- `senderId`
- `senderBankId`
- `receiverId`
- `receiverBankId`
- `email`
- `channel` with default value `online`
- `category` with default value `Transfer`

What it is used for:

- Showing transfer history alongside Plaid-synced account transactions
- Determining whether a transfer should render as a debit or credit for a selected account
- Preserving transfer metadata even though the money movement itself happens through Dwolla

---

## 🧱 Suggested Appwrite Schema Setup

This repository does not include an automated Appwrite schema migration. You will need to create the database and collections manually in Appwrite.

A practical setup is:

### Users collection

Create string attributes for:

- `userId`
- `email`
- `firstName`
- `lastName`
- `address1`
- `city`
- `state`
- `postalCode`
- `dateOfBirth`
- `ssn`
- `dwollaCustomerId`
- `dwollaCustomerUrl`

Recommended indexes:

- `userId` unique index
- `email` index

### Banks collection

Create string attributes for:

- `userId`
- `bankId`
- `accountId`
- `accessToken`
- `fundingSourceUrl`
- `shareableId`

Recommended indexes:

- `userId` index
- `accountId` unique index
- `shareableId` index

### Transactions collection

Create attributes for:

- `name` as string
- `amount` as string or numeric field, depending on your Appwrite preference
- `senderId` as string
- `senderBankId` as string
- `receiverId` as string
- `receiverBankId` as string
- `email` as string
- `channel` as string
- `category` as string

Recommended indexes:

- `senderBankId` index
- `receiverBankId` index
- `senderId` index
- `receiverId` index

If you want stronger data integrity, make `amount` numeric instead of string and update the TypeScript types/actions accordingly.

---

## 🔐 Authentication And Session Flow

Authentication is handled with Appwrite Auth, while the app keeps extra profile data in the `users` collection.

### Sign up flow

When a user signs up:

1. An Appwrite Auth account is created.
2. A Dwolla customer is created using the provided identity data.
3. A user profile document is created in the Appwrite `users` collection.
4. An Appwrite session is created.
5. The session secret is stored in the `appwrite-session` cookie.

This logic lives in:

- `lib/actions/user.actions.ts` -> `signUp`

### Sign in flow

When a user signs in:

1. The app creates an Appwrite email/password session.
2. The session secret is stored in the `appwrite-session` cookie.
3. The user document is fetched from Appwrite using `userId`.

This logic lives in:

- `lib/actions/user.actions.ts` -> `signIn`

### Logged-in user resolution

Protected pages call `getLoggedInUser()`, which:

1. Reads the session cookie
2. Resolves the Appwrite account
3. Fetches the matching user profile document

This logic lives in:

- `lib/appwrite.ts`
- `lib/actions/user.actions.ts`

---

## 🏦 Bank Linking Flow

The app uses Plaid Link to connect a bank account, then stores the resulting connection in Appwrite and registers a funding source in Dwolla.

### End-to-end flow

1. The app creates a Plaid link token for the logged-in user.
2. The user completes Plaid Link in the browser.
3. The app exchanges the Plaid `public_token` for an `access_token`.
4. The app fetches the first Plaid account from the linked item.
5. The app creates a Plaid processor token for Dwolla.
6. The app creates a Dwolla funding source for that bank account.
7. The app stores the bank record in Appwrite.

### Data saved to Appwrite for each linked account

- Plaid item id
- Plaid account id
- Plaid access token
- Dwolla funding source URL
- Encoded shareable recipient id

Relevant code:

- `lib/actions/user.actions.ts` -> `createLinkToken`, `exchangePublicToken`, `createBankAccount`
- `lib/actions/dwolla.actions.ts`

---

## 💸 Transfer Flow

Transfers are initiated from the payment transfer form and involve both Dwolla and Appwrite.

### What happens when a user sends money

1. The sender chooses one of their linked bank accounts.
2. The sender enters the receiver's shareable id.
3. The app decodes that id back into a Plaid account id.
4. The app finds the recipient bank record in Appwrite.
5. The app fetches sender and receiver funding source URLs.
6. The app creates a Dwolla transfer.
7. If successful, the app writes a transfer record to the Appwrite `transactions` collection.

Relevant code:

- `components/PaymentTransferForm.tsx`
- `lib/actions/dwolla.actions.ts` -> `createTransfer`
- `lib/actions/transaction.actions.ts` -> `createTransaction`

### Important distinction

Dwolla performs the actual transfer request, but the app's own transfer history is stored separately in Appwrite. The transaction page then merges:

- live Plaid transaction data
- Appwrite transfer records

---

## 📊 How Transactions Are Built For The UI

The UI does not read from only one source.

### Plaid transactions

For linked accounts, the app calls `transactionsSync` and maps Plaid transactions into a simplified UI shape:

- id
- name
- payment channel
- amount
- pending status
- category
- date
- logo/image

### Appwrite transfer transactions

Transfers created inside the app are pulled from Appwrite and mapped into the same general display shape.

### Final transaction list

For an account detail view, the app:

1. Fetches Plaid transactions
2. Fetches Appwrite transfer documents for that bank
3. Converts transfer direction into `debit` or `credit`
4. Merges both arrays
5. Sorts everything by date descending

This logic lives in:

- `lib/actions/bank.actions.ts` -> `getAccount`, `getTransactions`
- `lib/actions/transaction.actions.ts` -> `getTransactionsByBankId`

---

## 🧠 How Each Major Page Works

### Dashboard

File:

- `app/(root)/page.tsx`

Responsibilities:

- resolves the logged-in user
- fetches all linked accounts
- picks the selected account from the query string
- loads combined transaction history for that account
- renders balance summaries, recent transactions, and sidebar widgets

### My Banks

File:

- `app/(root)/my-banks/page.tsx`

Responsibilities:

- fetches all linked accounts for the current user
- renders account cards for each connected bank

### Transaction History

File:

- `app/(root)/transaction-history/page.tsx`

Responsibilities:

- fetches the selected account
- builds merged transaction history
- paginates transaction rows on the server side

### Payment Transfer

File:

- `app/(root)/payment-transfer/page.tsx`
- `components/PaymentTransferForm.tsx`

Responsibilities:

- loads the sender's available accounts
- accepts recipient email, recipient shareable id, note, and amount
- creates a Dwolla transfer
- persists the transfer metadata in Appwrite

---

## 🗃️ Server Action Summary

### `lib/actions/user.actions.ts`

- `signUp`: creates Appwrite auth user, Dwolla customer, and profile document
- `signIn`: creates session and resolves the matching user profile
- `getLoggedInUser`: resolves the current session user
- `logoutAccount`: deletes the current session
- `createLinkToken`: creates a Plaid Link token
- `exchangePublicToken`: finalizes Plaid linking and saves the bank record
- `getBanks`: returns all bank records for one user
- `getBank`: fetches one bank document by Appwrite document id
- `getBankByAccountId`: finds a bank by Plaid account id

### `lib/actions/bank.actions.ts`

- `getAccounts`: gets all linked accounts and enriches them with Plaid data
- `getAccount`: gets one selected account plus merged transaction history
- `getInstitution`: resolves institution data from Plaid
- `getTransactions`: fetches synced Plaid transactions

### `lib/actions/transaction.actions.ts`

- `createTransaction`: writes a transfer record to Appwrite
- `getTransactionsByBankId`: fetches inbound and outbound transfers for one bank

### `lib/actions/dwolla.actions.ts`

- `createDwollaCustomer`: creates the Dwolla customer during sign-up
- `createOnDemandAuthorization`: creates transfer authorization metadata
- `createFundingSource`: creates a funding source from a Plaid processor token
- `addFundingSource`: wraps funding source creation
- `createTransfer`: creates a Dwolla transfer

---

## 🔧 Environment Variables

The current repository expects at least the following values in `.env`:

```env
# NEXT
NEXT_PUBLIC_SITE_URL=

# SENTRY
NEXT_PUBLIC_SENTRY_DSN=

# APPWRITE
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=
APPWRITE_DATABASE_ID=
APPWRITE_USER_COLLECTION_ID=
APPWRITE_BANK_COLLECTION_ID=
APPWRITE_TRANSACTION_COLLECTION_ID=
NEXT_APPWRITE_KEY=

# PLAID
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=
PLAID_PRODUCTS=
PLAID_COUNTRY_CODES=

# DWOLLA
DWOLLA_KEY=
DWOLLA_SECRET=
DWOLLA_BASE_URL=https://api-sandbox.dwolla.com
DWOLLA_ENV=sandbox
```

### What each group does

#### Appwrite

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Appwrite API endpoint
- `NEXT_PUBLIC_APPWRITE_PROJECT`: Appwrite project id
- `APPWRITE_DATABASE_ID`: database containing the app collections
- `APPWRITE_USER_COLLECTION_ID`: profile collection
- `APPWRITE_BANK_COLLECTION_ID`: linked bank collection
- `APPWRITE_TRANSACTION_COLLECTION_ID`: transfer history collection
- `NEXT_APPWRITE_KEY`: server-side API key used by admin actions

#### Plaid

- `PLAID_CLIENT_ID`: Plaid app client id
- `PLAID_SECRET`: Plaid secret
- `PLAID_ENV`: intended environment setting
- `PLAID_PRODUCTS`: product list, typically `auth,transactions`
- `PLAID_COUNTRY_CODES`: typically `US`

Note:

The current `lib/plaid.ts` is hardcoded to `PlaidEnvironments.sandbox`, so `PLAID_ENV` is not yet actually wired into the runtime configuration.

to connect a bank account in development use: username: user_good password: pass_good

#### Dwolla

- `DWOLLA_KEY`: Dwolla application key
- `DWOLLA_SECRET`: Dwolla application secret
- `DWOLLA_BASE_URL`: sandbox base url in development
- `DWOLLA_ENV`: `sandbox` or `production`

---

## 🛠️ Quick Start

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- An [Appwrite](https://appwrite.io/) project
- A [Plaid](https://plaid.com/) sandbox app
- A [Dwolla](https://www.dwolla.com/) sandbox app

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/DigitalPool/BankingApp.git
   cd BankingApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in a `.env` file:
   ```env
   # APPWRITE
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT=
   APPWRITE_DATABASE_ID=
   APPWRITE_USER_COLLECTION_ID=
   APPWRITE_BANK_COLLECTION_ID=
   APPWRITE_TRANSACTION_COLLECTION_ID=
   NEXT_APPWRITE_KEY=

   # PLAID
   PLAID_CLIENT_ID=
   PLAID_SECRET=
   PLAID_ENV=
   PLAID_PRODUCTS=
   PLAID_COUNTRY_CODES=

   # DWOLLA
   DWOLLA_KEY=
   DWOLLA_SECRET=
   DWOLLA_BASE_URL=https://api-sandbox.dwolla.com
   DWOLLA_ENV=sandbox
   ```

   Replace the placeholders with your actual credentials.

4. In Appwrite, create:
   - one database
   - a user collection
   - a bank collection
   - a transaction collection

5. Configure the collection IDs in `.env`.

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🧪 Development Notes

- The app uses **server actions** heavily, so most data mutations happen on the server.
- Session state is stored in an `httpOnly` cookie named `appwrite-session`.
- Bank balances and some transaction data are fetched live from Plaid instead of being copied fully into Appwrite.
- Transfer records are stored in Appwrite after Dwolla transfer creation succeeds.

---

## ⚠️ Known Limitations And Observations

While reviewing the codebase, these implementation details stood out:

- `lib/plaid.ts` is currently hardcoded to the Plaid sandbox environment.
- The app stores Plaid `accessToken` values in the Appwrite `banks` collection.
- The transfer form uses the field name `sharableId`, while the stored bank field is `shareableId`; the feature still works because the submitted value is just a string, but the naming is inconsistent.
- `getTransactions()` currently remaps `transactionsSync()` results but does not pass a cursor for multi-page incremental sync.
- The Appwrite schema is inferred from the code; there is no migration or seed script in this repository to create it automatically.

These are not necessarily blockers for local development, but they are worth knowing if you extend the app.

---

## 📁 High-Level Project Structure

```text
app/                    Next.js app router pages and layouts
components/             UI and feature components
lib/actions/            Server actions for auth, banks, transfers, and transactions
lib/appwrite.ts         Appwrite client helpers
lib/plaid.ts            Plaid client configuration
lib/utils.ts            Shared formatters, helpers, and validation schema
public/                 Static icons and assets
screenshots/            README screenshots
types/                  Shared TypeScript declarations
```

---

## 🤝 Contributing

We welcome contributions! If you'd like to help improve the app:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push to your fork and submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Let me know if there’s anything else you’d like to add!
