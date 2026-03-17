import HeaderBox from '@/components/HeaderBox'
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })

  if(!accounts) return;
  
  const accountsData = accounts?.data;
  const hasAccounts = accountsData.length > 0;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  const account = hasAccounts ? await getAccount({ appwriteItemId }) : null;

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="Welcome"
            user={loggedIn?.firstName || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox 
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>

        {hasAccounts ? (
          <RecentTransactions 
            user={loggedIn}
            accounts={accountsData}
            transactions={account?.transactions}
            appwriteItemId={appwriteItemId}
            page={currentPage}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
            No active bank accounts are available right now. If one of your Plaid items expired, reconnect it from the bank linking flow.
          </div>
        )}
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={account?.transactions ?? []}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  )
}

export default Home
