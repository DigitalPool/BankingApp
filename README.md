# 🏦 Fintech Banking App

A comprehensive banking platform built with **Next.js**, **TypeScript**, **TailwindCSS**, and **Appwrite**. This app allows users to manage finances by connecting multiple bank accounts, transferring funds, and tracking transactions seamlessly.

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

## ⚙️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [TailwindCSS](https://tailwindcss.com/), [TypeScript](https://www.typescriptlang.org/)
- **Backend**: [Appwrite](https://appwrite.io/), [Dwolla](https://www.dwolla.com/), [Plaid](https://plaid.com/)
- **Data Validation**: [Zod](https://zod.dev/), React Hook Form
- **Charts**: [Chart.js](https://www.chartjs.org/)

---

## 🛠️ Quick Start

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

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

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

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
