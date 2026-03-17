import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankTabItem } from './BankTabItem'
import BankInfo from './BankInfo'
import TransactionsTable from './TransactionsTable'
import { Pagination } from './Pagination'
import ReconnectBankButton from './ReconnectBankButton'

const RecentTransactions = ({
  user,
  accounts,
  transactions = [],
  appwriteItemId,
  page = 1,
}: RecentTransactionsProps) => {
  const selectedAccount =
    accounts.find((account) => account.appwriteItemId === appwriteItemId) ??
    accounts[0];
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const indexOfLastTransaction = page * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = transactions.slice(
    indexOfFirstTransaction, indexOfLastTransaction
  )

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent transactions</h2>
        <Link
          href={`/transaction-history/?id=${appwriteItemId}`}
          className="view-all-btn"
        >
          View all
        </Link>
      </header>

      <Tabs defaultValue={appwriteItemId} className="w-full">
      <TabsList className="recent-transactions-tablist">
          {accounts.map((account: Account) => (
            <TabsTrigger key={account.id} value={account.appwriteItemId}>
              <BankTabItem
                key={account.id}
                account={account}
                appwriteItemId={appwriteItemId}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account: Account) => (
          <TabsContent
            value={account.appwriteItemId}
            key={account.id}
            className="space-y-4"
          >
            <BankInfo 
              account={account}
              appwriteItemId={appwriteItemId}
              type="full"
            />

            {selectedAccount?.isStale ? (
              <div className="space-y-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
                <p>
                  This bank record is still saved in the app, but its Plaid connection has expired. Reconnect it to load balances and transaction history again.
                </p>
                <ReconnectBankButton
                  user={user}
                  bankDocumentId={selectedAccount.appwriteItemId}
                  className="h-10"
                />
              </div>
            ) : (
              <TransactionsTable transactions={currentTransactions} />
            )}
            

            {!selectedAccount?.isStale && totalPages > 1 && (
              <div className="my-4 w-full">
                <Pagination totalPages={totalPages} page={page} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

export default RecentTransactions
