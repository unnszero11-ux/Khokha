
import React, { useState, useEffect } from 'react';
import { Lock, Plus, Trash2, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function VaultDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/vault', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Lock className="text-purple-500" /> Vault Manager</h2>
        <button className="bg-purple-700 text-white px-4 py-2 rounded-lg font-bold">Add Item</button>
      </div>
      <div className="grid gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
            <div className='flex items-center gap-3'>
              <Database className='text-zinc-600'/>
              <div>
                <p className="font-bold">{item.name || 'Secret Item'}</p>
                <p className="text-xs text-zinc-500">{item.id}</p>
              </div>
            </div>
            <button className="text-rose-500"><Trash2 className="w-5 h-5"/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
