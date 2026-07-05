import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, Key, Box, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';

export default function JwtManagement() {
  const [dataToTokenize, setDataToTokenize] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [tokenResult, setTokenResult] = useState({ token: '', address: '', balance: '' });

  const handleGenerateToken = async () => {
    console.log('Generating token for:', dataToTokenize);
    setTokenResult({ ...tokenResult, token: 'mock-jwt-token-based-on-compliance-policy' });
  };

  const handleCompressAndBind = async () => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      
      // Connect to a public RPC endpoint (Mainnet)
      const provider = new ethers.JsonRpcProvider('https://cloudflare-eth.com');
      const signer = wallet.connect(provider);
      
      // Sign data
      const signature = await signer.signMessage(dataToTokenize || "No data provided");
      
      // Get balance
      const balance = await provider.getBalance(wallet.address);
      
      setTokenResult({
        token: `Signature: ${signature.substring(0, 32)}...`,
        address: `Address: ${wallet.address}`,
        balance: `Balance: ${ethers.formatEther(balance)} ETH`
      });
    } catch (error) {
      console.error('Blockchain interaction error:', error);
      alert('Error: Likely invalid private key or connection issue.');
    }
  };

  return (
    <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl w-full">
      <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
        <Lock className="w-6 h-6 text-indigo-400" />
        JWT Data Organization & Security
      </h2>
      
      <div className="flex flex-col gap-6">
        <textarea
          className="w-full bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 h-40"
          placeholder="Enter JSON file content..."
          value={dataToTokenize}
          onChange={(e) => setDataToTokenize(e.target.value)}
        />
        
        <button
          onClick={handleGenerateToken}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-5 h-5" />
          Generate Secure Compliant Token
        </button>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            Wallet Key Binding
          </h3>
          <div className="bg-amber-950/30 border border-amber-900/50 p-3 rounded-lg text-amber-500 text-xs mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Sensitive: Raw private keys are processed locally in memory. Use with caution.</span>
          </div>
          <input
            type="password"
            className="w-full bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800 mb-4"
            placeholder="Enter digital wallet private key..."
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
          />
          <button
            onClick={handleCompressAndBind}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 w-full"
          >
            <Box className="w-5 h-5" />
            Compress JSON & Bind to Wallet Key
          </button>
        </div>

        {tokenResult.token && (
          <div className="bg-zinc-900 border border-emerald-900/50 p-4 rounded-xl mt-4">
            <h3 className="text-emerald-400 font-bold mb-2">Binding Result:</h3>
            <p className="font-mono text-emerald-200 text-sm break-all">{tokenResult.token}</p>
            <p className="font-mono text-emerald-200 text-sm mt-1">{tokenResult.address}</p>
            <p className="font-mono text-emerald-200 text-sm mt-1">{tokenResult.balance}</p>
          </div>
        )}
      </div>
    </div>
  );
}
