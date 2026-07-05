import React, { useState } from 'react';
import StripeRootDashboard from './StripeRootDashboard';
import StripeWebhookPanel from './StripeWebhookPanel';

interface StripeAdminPanelProps {
  user: any;
  refreshList: (tab: string) => void;
  data: any[];
}

export default function StripeAdminPanel({ user, refreshList, data }: StripeAdminPanelProps) {
  const [stripeTab, setStripeTab] = useState<'matrix' | 'webhooks'>('matrix');

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex gap-2 p-1 bg-zinc-900/50 border border-zinc-800 rounded-lg w-fit">
        <button
          onClick={() => setStripeTab('matrix')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ${stripeTab === 'matrix' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Root Matrix
        </button>
        <button
          onClick={() => setStripeTab('webhooks')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ${stripeTab === 'webhooks' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Webhooks
        </button>
      </div>

      <div className="flex-grow">
        {stripeTab === 'matrix' && <StripeRootDashboard />}
        {stripeTab === 'webhooks' && <StripeWebhookPanel user={user} refreshList={() => refreshList('stripe-webhooks')} webhookData={data} />}
      </div>
    </div>
  );
}
