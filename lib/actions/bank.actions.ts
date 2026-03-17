"use server";

import {
  ACHClass,
  CountryCode,
  TransferAuthorizationCreateRequest,
  TransferCreateRequest,
  TransferNetwork,
  TransferType,
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

const isPlaidItemLoginRequiredError = (error: unknown) => {
  return (
    !!error &&
    typeof error === "object" &&
    "response" in error &&
    !!error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    !!error.response.data &&
    typeof error.response.data === "object" &&
    "error_code" in error.response.data &&
    error.response.data.error_code === "ITEM_LOGIN_REQUIRED"
  );
};

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });

    const accounts = await Promise.all(
      (banks ?? []).map(async (bank: Bank) => {
        try {
          // get each account info from plaid
          const accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });
          const accountData = accountsResponse.data.accounts[0];

          // get institution info from plaid
          const institution = await getInstitution({
            institutionId: accountsResponse.data.item.institution_id!,
          });

          const account = {
            id: accountData.account_id,
            availableBalance: accountData.balances.available!,
            currentBalance: accountData.balances.current!,
            institutionId: institution.institution_id,
            name: accountData.name,
            officialName: accountData.official_name,
            mask: accountData.mask!,
            type: accountData.type as string,
            subtype: accountData.subtype! as string,
            appwriteItemId: bank.$id,
            shareableId: bank.shareableId,
            sharaebleId: bank.shareableId,
            status: "active",
            statusMessage: "",
            isStale: false,
          };

          return account;
        } catch (error) {
          if (isPlaidItemLoginRequiredError(error)) {
            console.warn(
              `Skipping stale Plaid item for bank document ${bank.$id}; re-link is required.`
            );

            return {
              id: bank.accountId,
              availableBalance: 0,
              currentBalance: 0,
              institutionId: "",
              name: "Linked bank",
              officialName: "Reconnect required",
              mask: bank.accountId.slice(-4),
              type: "depository",
              subtype: "stale connection",
              appwriteItemId: bank.$id,
              shareableId: bank.shareableId,
              sharaebleId: bank.shareableId,
              status: "reconnect_required",
              statusMessage:
                "This bank connection expired in Plaid and needs to be linked again.",
              isStale: true,
            } satisfies Account;
          }

          throw error;
        }
      })
    );

    const validAccounts = (accounts ?? []).filter(Boolean) as Account[];

    const totalBanks = validAccounts.length;
    const totalCurrentBalance = validAccounts.reduce((total, account) => {
      return total + (account.isStale ? 0 : account.currentBalance);
    }, 0);

    return parseStringify({
      data: validAccounts,
      totalBanks,
      totalCurrentBalance,
    });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return parseStringify({ data: [], totalBanks: 0, totalCurrentBalance: 0 });
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    if (!appwriteItemId) {
      return parseStringify({ data: null, transactions: [] });
    }

    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });

    if (!bank) {
      return parseStringify({ data: null, transactions: [] });
    }

    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });
    const accountData = accountsResponse.data.accounts[0];

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferTransactions = transferTransactionsData.documents.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? "debit" : "credit",
      })
    );

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const transactions = await getTransactions({
      accessToken: bank?.accessToken,
    });

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
    };

    // sort transactions by date such that the most recent transaction is first
      const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    if (isPlaidItemLoginRequiredError(error)) {
      return parseStringify({ data: null, transactions: [] });
    }

    console.error("An error occurred while getting the account:", error);
    return parseStringify({ data: null, transactions: [] });
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return [];
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let transactions: any = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      transactions = response.data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : "",
        date: transaction.date,
        image: transaction.logo_url,
      }));

      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};
