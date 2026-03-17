import HeaderBox from '@/components/HeaderBox'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import ReconnectBankButton from '@/components/ReconnectBankButton';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import React from 'react'

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect('/sign-in');
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })

  if(!accounts) return;
  
  const accountsData = accounts?.data;
  const activeAccounts = accountsData.filter((account: Account) => !account.isStale);
  const staleAccounts = accountsData.filter((account: Account) => account.isStale);

  return (
    <section className="payment-transfer">
      <HeaderBox 
        title="Payment Transfer"
        subtext="Please provide any specific details or notes related to the payment transfer"
      />

      <section className="size-full pt-5">
        {staleAccounts.length > 0 && (
          <div className="mb-6 space-y-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <p>
              {staleAccounts.length} linked bank {staleAccounts.length === 1 ? "requires" : "require"} reconnection before it can be used for transfers.
            </p>
            <div className="flex flex-wrap gap-3">
              {staleAccounts.map((account: Account) => (
                <ReconnectBankButton
                  key={account.appwriteItemId}
                  user={loggedIn}
                  bankDocumentId={account.appwriteItemId}
                  label={`Reconnect ${account.name}`}
                  className="h-10"
                />
              ))}
            </div>
          </div>
        )}

        {activeAccounts.length > 0 ? (
          <PaymentTransferForm accounts={activeAccounts} />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
            No active bank accounts are available for transfers right now. Reconnect one of your stale bank links and try again.
          </div>
        )}
      </section>
    </section>
  )
}

export default Transfer
