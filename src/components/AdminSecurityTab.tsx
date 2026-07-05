import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AdminSecurityTab() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const validateSecurity = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/security/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        alert("Validation request failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error validating security");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateSecurity();
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500">Validating security...</div>;

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-xl font-black text-white flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-emerald-400" />
        Admin Security Dashboard
      </h2>

      {status && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-400">System Integrity Status:</span>
            <span className={cn("px-3 py-1 rounded-full text-xs font-black", status.status === "VALID" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
              {status.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
               <p className="text-xs text-zinc-500">MASTER_KMS_TOKEN_184</p>
               <p className="text-white font-mono">{status.masterToken}</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
               <p className="text-xs text-zinc-500">LIVE_KMS_SIGNATURE_184</p>
               <p className="text-white font-mono">{status.masterSignature}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-mono">Expiration: {status.expiration}</p>
          <button onClick={validateSecurity} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg transition-all">Re-validate</button>
        </div>
      )}
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
