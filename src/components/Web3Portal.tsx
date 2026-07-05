import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet as WalletIcon, 
  Coins, 
  TrendingUp, 
  Layers, 
  Lock, 
  ShieldCheck, 
  Award, 
  Network, 
  Cpu, 
  History, 
  Sparkles, 
  Download, 
  Upload, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle,
  ArrowRightLeft,
  Flame,
  UserCheck,
  Package,
  Clock,
  ChevronRight,
  TrendingDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ethers } from 'ethers';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  balance: number;
}

interface Web3PortalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onUpdateBalance?: (newBalance: number) => void;
}

// Simulated Creator Token Data
const CREATOR_TOKENS = [
  { id: 'khokha', symbol: '$KHOKHA', name: 'Khokha Official Token', price: 1.25, trend: 12.4, color: '#f43f5e', creator: 'Platform' },
  { id: 'nour', symbol: '$NOUR', name: 'Nour Star Coin', price: 0.85, trend: 8.2, color: '#eab308', creator: 'Nour' },
  { id: 'yasmine', symbol: '$YASMIN', name: 'Yasmine Cute Token', price: 2.10, trend: -3.5, color: '#a855f7', creator: 'Yasmine' },
  { id: 'agency', symbol: '$AGENCY', name: 'Golden Agency Token', price: 5.40, trend: 22.1, color: '#06b6d4', creator: 'Elite Agency' }
];

// Historical price flow generators for Recharts
const generateChartData = (basePrice: number, change: number) => {
  const data = [];
  let currentPrice = basePrice;
  const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  for (let i = 0; i < 7; i++) {
    const factor = 1 + (Math.random() * 0.15 - 0.07);
    currentPrice = Math.max(0.1, currentPrice * factor);
    data.push({
      name: days[i],
      price: parseFloat(currentPrice.toFixed(3)),
    });
  }
  return data;
};

export default function Web3Portal({ profile, onClose, onUpdateBalance }: Web3PortalProps) {
  const [activeTab, setActiveTab] = useState<'wallet' | 'staking' | 'tokens' | 'nfts' | 'stripeWebhook'>('wallet');
  
  // Real MetaMask Web3 connection states
  const [metaMaskConnected, setMetaMaskConnected] = useState(false);
  const [metaMaskAddress, setMetaMaskAddress] = useState('');
  const [metaMaskBalance, setMetaMaskBalance] = useState('0.0000 ETH');
  const [currentNetworkChainId, setCurrentNetworkChainId] = useState('1');

  // Multi-Chain Transfer Form states
  const [transferChainId, setTransferChainId] = useState('1');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Stripe monitoring states
  const [stripeWebhookLogs, setStripeWebhookLogs] = useState<any[]>([]);
  const [stripeSimulatorWallet, setStripeSimulatorWallet] = useState('');
  const [stripeSimulatorAmount, setStripeSimulatorAmount] = useState('5000'); // in cents ($50)
  const [simulatingStripeWebhook, setSimulatingStripeWebhook] = useState(false);

  // Supported MetaMask target chains
  const metamaskChainConfigs: Record<string, { name: string; symbol: string; hexId: string }> = {
    "1": { name: "Ethereum Mainnet", symbol: "ETH", hexId: "0x1" },
    "137": { name: "Polygon Mainnet", symbol: "POL", hexId: "0x89" },
    "56": { name: "BNB Smart Chain", symbol: "BNB", hexId: "0x38" },
    "42161": { name: "Arbitrum One", symbol: "ETH", hexId: "0xa4b1" },
    "10": { name: "Optimism", symbol: "ETH", hexId: "0xa" },
    "8453": { name: "Base Network", symbol: "ETH", hexId: "0x2105" }
  };

  // Wallet states
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [network, setNetwork] = useState<'ethereum' | 'solana' | 'bsc'>('ethereum');
  const [chainBalance, setChainBalance] = useState({ eth: 2.5, sol: 45.0, bnb: 12.2 });
  const [gasPrice, setGasPrice] = useState(18); // Gwei
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapType, setSwapType] = useState<'crypto_to_coins' | 'coins_to_crypto'>('crypto_to_coins');
  const [isSwapping, setIsSwapping] = useState(false);

  // Staking states
  const [stakedBalance, setStakedBalance] = useState(0);
  const [stakeInput, setStakeInput] = useState('');
  const [accruedYield, setAccruedYield] = useState(0);
  const [stakingHistory, setStakingHistory] = useState<any[]>([]);
  const [stakingAPY] = useState(24.5); // 24.5% annual yield
  
  // Tokens States
  const [selectedToken, setSelectedToken] = useState(CREATOR_TOKENS[0]);
  const [tokenChartData, setTokenChartData] = useState<any[]>([]);
  const [buyTokenQty, setBuyTokenQty] = useState('10');
  const [userTokenBalances, setUserTokenBalances] = useState<Record<string, number>>({
    khokha: 15,
    nour: 0,
    yasmine: 5
  });

  // NFT States
  const [nfts, setNfts] = useState<any[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [mintTitle, setMintTitle] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Web3 MetaMask Wallet Connection and Sync
  const connectMetaMask = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      showNotification('error', 'يرجى تثبيت محفظة MetaMask لاستخدام هذه الميزة. / Please install MetaMask browser extension!');
      return;
    }
    try {
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const address = accounts[0];

      setMetaMaskAddress(address);
      setMetaMaskConnected(true);
      setStripeSimulatorWallet(address);

      // Sync the user's real balance
      await syncMetaMaskBalanceAndChain(browserProvider, address);
      showNotification('success', 'تم ربط محفظة MetaMask بنجاح! / MetaMask connected successfully!');
    } catch (err: any) {
      console.error(err);
      showNotification('error', `فشل الربط: ${err.message || err}`);
    }
  };

  const syncMetaMaskBalanceAndChain = async (providerObj: ethers.BrowserProvider, addressStr: string) => {
    try {
      const networkObj = await providerObj.getNetwork();
      const chainIdStr = networkObj.chainId.toString();
      setCurrentNetworkChainId(chainIdStr);

      const balanceRaw = await providerObj.getBalance(addressStr);
      const balanceFormatted = ethers.formatEther(balanceRaw);
      
      const configObj = metamaskChainConfigs[chainIdStr] || { symbol: "ETH" };
      setMetaMaskBalance(`${parseFloat(balanceFormatted).toFixed(4)} ${configObj.symbol}`);
    } catch (err) {
      console.error("Failed to sync balance:", err);
    }
  };

  // Switch MetaMask Active network
  const switchMetaMaskNetwork = async (targetChainId: string) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    const config = metamaskChainConfigs[targetChainId];
    if (!config) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.hexId }]
      });
      // Re-initialize provider and recalculate
      const browserProvider = new ethers.BrowserProvider(ethereum);
      if (metaMaskAddress) {
        await syncMetaMaskBalanceAndChain(browserProvider, metaMaskAddress);
      }
      showNotification('success', `تم تبديل الشبكة إلى / Switched network to ${config.name}`);
    } catch (error: any) {
      console.error("Network switch failed", error);
      showNotification('error', 'فشل تبديل الشبكة. يرجى تأكيد العملية في ميتاماسك.');
    }
  };

  // Execute multi-chain transfer using connected signer
  const executeMetaMaskTransfer = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !metaMaskConnected) {
      showNotification('error', 'يرجى ربط محفظة MetaMask أولاً. / Connect MetaMask first!');
      return;
    }

    if (!ethers.isAddress(transferRecipient)) {
      showNotification('error', 'عنوان محفظة المستلم غير صالح. / Invalid recipient address.');
      return;
    }

    const valueNum = parseFloat(transferAmount);
    if (!transferAmount || isNaN(valueNum) || valueNum <= 0) {
      showNotification('error', 'يرجى إدخال قيمة تحويل صحيحة. / Invalid transfer amount.');
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const userSigner = await browserProvider.getSigner();

      // Initiate sendTransaction transaction
      const txResponse = await userSigner.sendTransaction({
        to: transferRecipient,
        value: ethers.parseEther(transferAmount)
      });

      showNotification('success', `تم إرسال المعاملة بنجاح! رقم المعرف:\n${txResponse.hash.substring(0, 16)}...`);
      await txResponse.wait();
      
      await syncMetaMaskBalanceAndChain(browserProvider, metaMaskAddress);
      setTransferAmount('');
    } catch (err: any) {
      console.error(err);
      showNotification('error', `فشلت المعاملة: ${err.message || err}`);
    }
  };

  // Load and fetch Stripe payments processed webhook data
  const loadStripeWebhookData = async () => {
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setStripeWebhookLogs(data);
      }
    } catch (err) {
      console.error("Failed to load payments webhook", err);
    }
  };

  // Simulating/Triggering Stripe webhook to payments.json
  const simulatePaymentWebhook = async () => {
    if (!stripeSimulatorWallet || !ethers.isAddress(stripeSimulatorWallet)) {
      showNotification('error', 'يرجى إدخال عنوان محفظة مستفيدة صالح للمحاكاة.');
      return;
    }
    setSimulatingStripeWebhook(true);
    try {
      const res = await fetch('/api/stripe-webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: stripeSimulatorWallet,
          amountInCents: stripeSimulatorAmount
        })
      });
      if (res.ok) {
        showNotification('success', 'تم محاكاة إشعار Stripe Webhook بنجاح وإنشاء JWT!');
        await loadStripeWebhookData();
      } else {
        showNotification('error', 'فشلت عملية المحاكاة.');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'خطأ أثناء محاكاة الدفع.');
    } finally {
      setSimulatingStripeWebhook(false);
    }
  };

  // Initialize webhook loaders and set interval updates
  useEffect(() => {
    loadStripeWebhookData();
    const intervalObj = setInterval(loadStripeWebhookData, 5000);
    return () => clearInterval(intervalObj);
  }, []);

  // Listen for MetaMask events
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setMetaMaskAddress(accounts[0]);
          setMetaMaskConnected(true);
          const browserProvider = new ethers.BrowserProvider(ethereum);
          syncMetaMaskBalanceAndChain(browserProvider, accounts[0]);
        } else {
          setMetaMaskConnected(false);
          setMetaMaskAddress('');
        }
      };
      
      const handleChain = () => {
        window.location.reload();
      };

      ethereum.on('accountsChanged', handleAccounts);
      ethereum.on('chainChanged', handleChain);
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccounts);
          ethereum.removeListener('chainChanged', handleChain);
        }
      };
    }
  }, [metaMaskAddress]);

  // Generate chart data when token changes
  useEffect(() => {
    setTokenChartData(generateChartData(selectedToken.price, selectedToken.trend));
  }, [selectedToken]);

  // Network random gas update simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setGasPrice(Math.max(8, Math.floor(15 + Math.random() * 12)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch / Sync existing user wallet and staking details from Firestore
  useEffect(() => {
    if (!profile) return;

    // A/ Sync web3 wallet from Firestore if exists
    const syncWallet = async () => {
      const walletRef = doc(db, 'web3_wallets', profile.uid);
      const docSnap = await getDoc(walletRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWalletAddress(data.address);
        setSeedPhrase(data.seedPhrase || '');
        setWalletConnected(true);
        if (data.network) setNetwork(data.network);
        if (data.chainBalance) setChainBalance(data.chainBalance);
      }
    };

    // B/ Sync Staking details
    const syncStaking = async () => {
      const stakingRef = doc(db, 'web3_staking', profile.uid);
      const docSnap = await getDoc(stakingRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStakedBalance(data.amount || 0);
        // Calculate accrued yield since last updated timestamp
        if (data.amount > 0 && data.lastHarvestedAt) {
          const lastTime = data.lastHarvestedAt.toDate().getTime();
          const lapsedSeconds = (Date.now() - lastTime) / 1000;
          const accrued = data.amount * (stakingAPY / 100) * (lapsedSeconds / (365 * 24 * 3600));
          setAccruedYield(accrued + (data.accruedYieldBalance || 0));
        }
      } else {
        setStakedBalance(0);
        setAccruedYield(0);
      }
    };

    // C/ Sync user NFT listings
    const nftRef = collection(db, 'web3_nfts');
    const q = query(nftRef, where('ownerId', '==', profile.uid));
    const unsubscribeNfts = onSnapshot(q, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setNfts(fetched);
    });

    syncWallet();
    syncStaking();
    return () => {
      unsubscribeNfts();
    };
  }, [profile, stakingAPY]);

  // Ticking yield engine (updates yield counter in real time every 1.5 seconds)
  useEffect(() => {
    if (stakedBalance <= 0) return;
    const interval = setInterval(() => {
      // Annual rate = stakingAPY %
      // Yield per second = (StakedBalance * APY_rate) / SecondsInYear
      const yieldPerSec = (stakedBalance * (stakingAPY / 100)) / (365 * 24 * 3600);
      setAccruedYield(prev => prev + (yieldPerSec * 1.5));
    }, 1500);

    return () => clearInterval(interval);
  }, [stakedBalance, stakingAPY]);

  // Generate clean Web3 Local Wallet
  const generateNewWallet = async () => {
    if (!profile) return;
    
    // Simulate seed generation
    const wordList = ['galaxy', 'matrix', 'crystal', 'anchor', 'ocean', 'cyber', 'phoenix', 'pulse', 'token', 'stellar', 'sonic', 'aurora'];
    const shuffled = [...wordList].sort(() => 0.5 - Math.random());
    const generatedSeed = shuffled.join(' ');

    let address = '';
    if (network === 'ethereum' || network === 'bsc') {
      const hex = '0123456789abcdef';
      let randomHex = '';
      for (let i = 0; i < 40; i++) {
        randomHex += hex[Math.floor(Math.random() * 16)];
      }
      address = '0x' + randomHex;
    } else {
      // Solana Address
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let randomBase58 = '';
      for (let i = 0; i < 44; i++) {
        randomBase58 += chars[Math.floor(Math.random() * chars.length)];
      }
      address = randomBase58;
    }

    const defaultBalances = { eth: 3.2, sol: 54.5, bnb: 15.8 };

    try {
      await setDoc(doc(db, 'web3_wallets', profile.uid), {
        userId: profile.uid,
        address,
        seedPhrase: generatedSeed,
        network,
        chainBalance: defaultBalances,
        createdAt: serverTimestamp()
      });

      setWalletAddress(address);
      setSeedPhrase(generatedSeed);
      setChainBalance(defaultBalances);
      setWalletConnected(true);
      showNotification('success', 'تم إنشاء محفظتك الرقمية اللامركزية بنجاح! / Crypto wallet generated gracefully!');
    } catch (err) {
      console.error(err);
      showNotification('error', 'فشل إنشاء المحفظة. يرجى المحاولة لاحقاً / Failed to generate wallet.');
    }
  };

  // Switch network
  const handleNetworkChange = async (newNet: 'ethereum' | 'solana' | 'bsc') => {
    setNetwork(newNet);
    if (walletConnected && profile) {
      const walletRef = doc(db, 'web3_wallets', profile.uid);
      await updateDoc(walletRef, { network: newNet });
      showNotification('success', `تم تغيير الشبكة إلى / Changed network to ${newNet.toUpperCase()}`);
    }
  };

  // Swapping / Bridge logic
  const handleSwap = async () => {
    if (!profile || !swapAmount || isNaN(Number(swapAmount)) || Number(swapAmount) <= 0) {
      showNotification('error', 'أدخل قيمة صحيحة للتحويل / Please input continuous swap quantity.');
      return;
    }

    const value = parseFloat(swapAmount);
    setIsSwapping(true);

    try {
      const userDoc = doc(db, 'users', profile.uid);
      
      if (swapType === 'crypto_to_coins') {
        // Crypto -> Coins (e.g. 1 ETH = 3000 Coins / 1 SOL = 100 Coins / 1 BNB = 600 Coins)
        let rate = 3000;
        let chainKey: 'eth' | 'sol' | 'bnb' = 'eth';

        if (network === 'solana') {
          rate = 120;
          chainKey = 'sol';
        } else if (network === 'bsc') {
          rate = 600;
          chainKey = 'bnb';
        }

        if (chainBalance[chainKey] < value) {
          showNotification('error', 'رصيد المحفظة On-Chain غير كافٍ! / Insufficient on-chain crypto balance.');
          setIsSwapping(false);
          return;
        }

        const coinGained = Math.floor(value * rate);
        const updatedChainBal = {
          ...chainBalance,
          [chainKey]: parseFloat((chainBalance[chainKey] - value).toFixed(4))
        };

        // Server action or persistent update
        await updateDoc(userDoc, {
          balance: increment(coinGained)
        });

        await updateDoc(doc(db, 'web3_wallets', profile.uid), {
          chainBalance: updatedChainBal
        });

        // Add to standard transactions
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          amount: coinGained,
          type: 'deposit',
          relatedId: `web3_swap_${network}`,
          createdAt: serverTimestamp()
        });

        setChainBalance(updatedChainBal);
        if (onUpdateBalance) onUpdateBalance((profile.balance || 0) + coinGained);
        showNotification('success', `تجاوز التحويل بنجاح! +${coinGained} قطعة ذهبية / Bridge swapped successfully! +${coinGained} Gold coins.`);
      } else {
        // Coins -> Crypto swap
        // 1000 Coins = 0.3 ETH / 50 SOL / depends on rate
        let rate = 3000;
        let chainKey: 'eth' | 'sol' | 'bnb' = 'eth';

        if (network === 'solana') {
          rate = 120;
          chainKey = 'sol';
        } else if (network === 'bsc') {
          rate = 600;
          chainKey = 'bnb';
        }

        const requiredCoins = Math.floor(value * rate);
        if ((profile.balance || 0) < requiredCoins) {
          showNotification('error', `ذهب غير كافٍ! تحتاج ${requiredCoins} ذهبة / Insufficient gold coins. You need ${requiredCoins}.`);
          setIsSwapping(false);
          return;
        }

        const updatedChainBal = {
          ...chainBalance,
          [chainKey]: parseFloat((chainBalance[chainKey] + value).toFixed(4))
        };

        await updateDoc(userDoc, {
          balance: increment(-requiredCoins)
        });

        await updateDoc(doc(db, 'web3_wallets', profile.uid), {
          chainBalance: updatedChainBal
        });

        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          amount: requiredCoins,
          type: 'purchase',
          relatedId: `web3_withdraw_${network}`,
          createdAt: serverTimestamp()
        });

        setChainBalance(updatedChainBal);
        if (onUpdateBalance) onUpdateBalance((profile.balance || 0) - requiredCoins);
        showNotification('success', `تم تحويل الذهب لعملات رقمية بنجاح! / Swapped Coins to Crypto! +${value} on-chain.`);
      }

      setSwapAmount('');
    } catch (e) {
      console.error(e);
      showNotification('error', 'حدث خطأ في معالجة الإرسال / Error occurred executing bridge Swap.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Staking Execute
  const handleStaking = async (action: 'stake' | 'unstake') => {
    if (!profile) return;
    const value = parseInt(stakeInput);
    if (!stakeInput || isNaN(value) || value <= 0) {
      showNotification('error', 'الرجاء إدخال كمية ذهب صالحة للتخزين / Please input continuous gold coins amount.');
      return;
    }

    try {
      const userDoc = doc(db, 'users', profile.uid);
      const stakeDoc = doc(db, 'web3_staking', profile.uid);

      if (action === 'stake') {
        if ((profile.balance || 0) < value) {
          showNotification('error', 'رصيد ذهبك غير كافٍ للتخزين! / Insufficient gold balance to stake.');
          return;
        }

        // Deduct gold & Update staking record
        await updateDoc(userDoc, { balance: increment(-value) });
        
        await setDoc(stakeDoc, {
          userId: profile.uid,
          amount: stakedBalance + value,
          accruedYieldBalance: accruedYield,
          lastHarvestedAt: serverTimestamp()
        }, { merge: true });

        setStakedBalance(prev => prev + value);
        if (onUpdateBalance) onUpdateBalance((profile.balance || 0) - value);
        showNotification('success', `تم تخزين ${value} ذهبة في العقد الذكي بـ 24% APY! / Staked successfully!`);
      } else {
        if (stakedBalance < value) {
          showNotification('error', 'كمية غير صالحة لإلغاء التخزين / Staked amount to release surpasses current deposits.');
          return;
        }

        // Return staked amount + accrued yield directly to gold wallet
        const finalPayout = value + Math.floor(accruedYield);
        await updateDoc(userDoc, { balance: increment(finalPayout) });

        await setDoc(stakeDoc, {
          userId: profile.uid,
          amount: stakedBalance - value,
          accruedYieldBalance: 0,
          lastHarvestedAt: serverTimestamp()
        }, { merge: true });

        setStakedBalance(prev => prev - value);
        setAccruedYield(0);
        if (onUpdateBalance) onUpdateBalance((profile.balance || 0) + finalPayout);
        showNotification('success', `تم إلغاء التخزين وصرف الأرباح: +${finalPayout} ذهبة بمحفظتكم! / Unstaked with yield payout!`);
      }
      setStakeInput('');
    } catch (e) {
      console.error(e);
      showNotification('error', 'خطأ في عقد الاستثمار / Error interacting with Smart Staking contract.');
    }
  };

  // Harvest accrued staking yield only
  const handleHarvestYield = async () => {
    if (!profile || accruedYield < 1) {
      showNotification('error', 'لا يوجد أرباح كافية للحصاد (الحد الأدنى 1 ذهبة) / Minimum accrued payout is 1 coin.');
      return;
    }

    try {
      const payout = Math.floor(accruedYield);
      const userDoc = doc(db, 'users', profile.uid);
      const stakeDoc = doc(db, 'web3_staking', profile.uid);

      await updateDoc(userDoc, { balance: increment(payout) });
      await setDoc(stakeDoc, {
        accruedYieldBalance: 0,
        lastHarvestedAt: serverTimestamp()
      }, { merge: true });

      setAccruedYield(0);
      if (onUpdateBalance) onUpdateBalance((profile.balance || 0) + payout);
      showNotification('success', `تم حصاد أرباح التخزين: +${payout} ذهبة! / Harvested yield directly to wallet.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Buy Creator Tokens
  const handleBuyCreatorToken = (token: typeof CREATOR_TOKENS[0]) => {
    if (!profile) return;
    const qty = parseInt(buyTokenQty);
    if (!buyTokenQty || isNaN(qty) || qty <= 0) {
      showNotification('error', 'الكمية غير صالحة / Invalid quantity count.');
      return;
    }

    const totalCostCoins = Math.ceil(qty * token.price * 10); // 1 Token = price * 10 Coins
    if (profile.balance < totalCostCoins) {
      showNotification('error', 'رصيد ذهب غير كافٍ لشراء هذا الرمز الفني / Insufficient coins to purchase fans token.');
      return;
    }

    // Process Token Balance Increment & User Gold Decrement
    try {
      const userDoc = doc(db, 'users', profile.uid);
      updateDoc(userDoc, { balance: increment(-totalCostCoins) });

      setUserTokenBalances(prev => ({
        ...prev,
        [token.id]: (prev[token.id] || 0) + qty
      }));

      if (onUpdateBalance) onUpdateBalance(profile.balance - totalCostCoins);
      showNotification('success', `تم شراء ${qty} من رمز ${token.symbol} بنجاح! / Purchased fan tokens supporting ${token.creator}!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Mint Rare NFT
  const handleMintNFT = async () => {
    if (!profile || !mintTitle) {
      showNotification('error', 'يرجى إدخال عنوان الـ NFT اللامنهجي / Please provide description title.');
      return;
    }

    const mintCostCoins = 250; // Mint cost is 250 coins
    if (profile.balance < mintCostCoins) {
      showNotification('error', 'تكلفة ضرب الـ NFT هي 250 ذهبة / Mint tier requires 250 platform coins.');
      return;
    }

    setIsMinting(true);

    try {
      // Deduct coins
      const userDoc = doc(db, 'users', profile.uid);
      await updateDoc(userDoc, { balance: increment(-mintCostCoins) });

      // Generate simulated IPFS Hash & clean on-chain Token ID
      const tokenId = Math.floor(1000 + Math.random() * 9000);
      const hex = 'abcdef0123456789';
      let ipfsHash = 'Qm';
      for (let i = 0; i < 44; i++) ipfsHash += hex[Math.floor(Math.random() * 16)];

      const rawNft = {
        title: mintTitle,
        tokenId,
        ownerId: profile.uid,
        ownerName: profile.displayName,
        image: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80`, // Visual artistic layout
        ipfsHash,
        network: 'Polygon Mainnet',
        contract: '0xKhokhaVerifiedSmartNFT77',
        mintedAt: new Date()
      };

      await addDoc(collection(db, 'web3_nfts'), rawNft);

      if (onUpdateBalance) onUpdateBalance(profile.balance - mintCostCoins);
      setMintTitle('');
      showNotification('success', `تهانينا! تم صك الرمز الفريد بنجاح على Polygon كـ NFT معتمد! / Minted rare moments NFT securely! Token ID: #${tokenId}`);
    } catch (e) {
      console.error(e);
      showNotification('error', 'فشل معالجة صك الأصول الرقمية / Failed web3 NFT genesis mint.');
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string, isSeed = false) => {
    navigator.clipboard.writeText(text);
    if (isSeed) {
      setCopiedSeed(true);
      setTimeout(() => setCopiedSeed(false), 2000);
    } else {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div id="web3-portal-container" className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden flex flex-col shadow-3xl text-zinc-300 font-sans"
      >
        {/* Header Block */}
        <div className="p-4 md:p-6 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase">بوابة الويب 3 الذكية</h2>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] md:text-sm text-zinc-500 uppercase font-bold tracking-tight">
                Decentralized Web3 Portal & Creator Crypto Services
              </p>
            </div>
          </div>
          
          <button 
            id="close-web3-portal-btn"
            onClick={onClose} 
            className="p-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded-full transition-all text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`p-3 text-center text-xs font-black uppercase tracking-wider ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-b border-rose-500/20 text-rose-400'
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Outer Dashboard Layer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Subpage Selection Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/40 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar">
            
            <button 
              id="web3-tab-wallet-btn"
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs uppercase font-black tracking-widest transition-all whitespace-nowrap md:w-full ${
                activeTab === 'wallet' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <WalletIcon className="w-4 h-4 flex-shrink-0" />
              <span>محفظة التشفير / Wallet</span>
            </button>

            <button 
              id="web3-tab-staking-btn"
              onClick={() => setActiveTab('staking')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs uppercase font-black tracking-widest transition-all whitespace-nowrap md:w-full ${
                activeTab === 'staking' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>تخزين الذهب / Staking</span>
            </button>

            <button 
              id="web3-tab-tokens-btn"
              onClick={() => setActiveTab('tokens')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs uppercase font-black tracking-widest transition-all whitespace-nowrap md:w-full ${
                activeTab === 'tokens' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span>عملات المشاهير / Tokens</span>
            </button>

            <button 
              id="web3-tab-nfts-btn"
              onClick={() => setActiveTab('nfts')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs uppercase font-black tracking-widest transition-all whitespace-nowrap md:w-full ${
                activeTab === 'nfts' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 flex-shrink-0" />
              <span>سوق الـ NFTs</span>
            </button>

            <button 
              id="web3-tab-stripe-webhook-btn"
              onClick={() => setActiveTab('stripeWebhook')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs uppercase font-black tracking-widest transition-all whitespace-nowrap md:w-full ${
                activeTab === 'stripeWebhook' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin-slow" />
              <span>ربط المعاملات (Stripe & Web3)</span>
            </button>

            <div className="hidden md:block mt-auto border-t border-zinc-900/80 pt-4">
              <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">حساب الذهب المالي</p>
                  <p id="web3-gold-ref-bal" className="text-xs font-black text-white">{profile?.balance || 0} ذهبة / Coins</p>
                </div>
              </div>
            </div>

          </div>

          {/* Active View Container */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar bg-zinc-950">
            <AnimatePresence mode="wait">
              
              {/* WALLET & MULTI-CHAIN BRIDGE SUBPAGE */}
              {activeTab === 'wallet' && (
                <motion.div 
                  key="wallet-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Wallet Generation & Profile Column */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                          <WalletIcon className="w-40 h-40" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <div>
                            <h3 className="text-white font-black text-md uppercase tracking-wide">عقد محفظة الويب 3 اللامركزية</h3>
                            <p className="text-zinc-500 text-xs mt-0.5">Unbreakable Crypto Safe & Non-Custodial Gateway</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 self-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">
                              Gas: {gasPrice} Gwei
                            </span>
                          </div>
                        </div>

                        {!walletConnected ? (
                          <div className="py-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                              <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div className="max-w-md">
                              <h4 className="text-zinc-200 font-bold text-sm">أنت لا تملك محفظة رقمية نشطة حالياً</h4>
                              <p className="text-zinc-500 text-xs mt-1">
                                بنقرة واحدة، قم بتوليد محفظة آمنة تماماً على خوارزمية التشفير الأساسية لنقل الهدايا والأرصدة إلى حسابات التشفير الخاصة بك.
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                <Network className="w-4 h-4 text-zinc-500" />
                                <select 
                                  value={network}
                                  onChange={(e: any) => handleNetworkChange(e.target.value)}
                                  className="bg-transparent text-xs text-zinc-300 outline-none font-bold cursor-pointer"
                                >
                                  <option value="ethereum">Ethereum (ERC-20)</option>
                                  <option value="solana">Solana Network</option>
                                  <option value="bsc">Binance Smart Chain</option>
                                </select>
                              </div>

                              <button 
                                onClick={generateNewWallet}
                                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-[10px] rounded-xl flex items-center gap-2 transition-all"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>توليد محفظة فورية / Generate Wallet</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4">
                              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block mb-1">عقد المحفظة العام / Public Address</span>
                              
                              <div className="flex items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-900 rounded-xl px-3 py-2">
                                <code id="web3-public-addr-field" className="text-xs text-rose-400 font-mono select-all break-all">{walletAddress}</code>
                                <button 
                                  onClick={() => copyToClipboard(walletAddress)}
                                  className="p-1.5 hover:bg-zinc-850 rounded bg-zinc-900 text-zinc-400 hover:text-white transition-all flex-shrink-0"
                                >
                                  {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Multi Chain Seed Phrases Safety (Collapse default) */}
                            <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-yellow-500">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">عبارة الاسترداد السريّة (12 كلمة) / Recovery Key</span>
                                </div>
                                <button 
                                  onClick={() => copyToClipboard(seedPhrase, true)}
                                  className="text-[9px] font-black tracking-widest bg-zinc-900 hover:bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 hover:text-white flex items-center gap-1.5"
                                >
                                  {copiedSeed ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                  <span>انسخ المفتاح / Copy phrase</span>
                                </button>
                              </div>
                              <p className="text-[10px] text-zinc-650 mt-1 uppercase font-bold tracking-tight">احتفظ بها في مكان آمن للغاية. لا تشاركها مع أي شخص / Keep secure, don't show to other users.</p>
                              
                              <div className="grid grid-cols-4 gap-2 mt-3">
                                {seedPhrase.split(' ').map((word, idx) => (
                                  <div key={idx} className="bg-zinc-900 border border-zinc-850 p-1.5 rounded-lg text-center font-mono text-[10px] text-zinc-300">
                                    <span className="text-zinc-600 block text-[8px] font-bold">{idx + 1}</span>
                                    {word}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Portfolio overview blocks */}
                            <div className="grid grid-cols-3 gap-3 pt-2">
                              <div className="bg-zinc-900/50 border border-zinc-850 p-3 rounded-xl">
                                <p className="text-[9px] font-black text-zinc-555 uppercase tracking-widest">Ethereum Bal</p>
                                <p className="font-mono text-zinc-100 font-bold text-sm mt-0.5">{chainBalance.eth} ETH</p>
                              </div>
                              <div className="bg-zinc-900/50 border border-zinc-850 p-3 rounded-xl">
                                <p className="text-[9px] font-black text-zinc-555 uppercase tracking-widest">Solana Bal</p>
                                <p className="font-mono text-zinc-100 font-bold text-sm mt-0.5">{chainBalance.sol} SOL</p>
                              </div>
                              <div className="bg-zinc-900/50 border border-zinc-850 p-3 rounded-xl">
                                <p className="text-[9px] font-black text-zinc-555 uppercase tracking-widest">BNB Chain Bal</p>
                                <p className="font-mono text-zinc-100 font-bold text-sm mt-0.5">{chainBalance.bnb} BNB</p>
                              </div>
                            </div>

                          </div>
                        )}

                      </div>

                      {/* Bridge Swapping Interface */}
                      <div className="bg-zinc-900/20 border border-zinc-900 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-wider">جسر المعاملات الذكي Swap / Bridge</h4>
                            <p className="text-zinc-500 text-[10px] mt-0.5 font-bold uppercase">Consolidated bridge turning crypto to gold and vice versa</p>
                          </div>
                          
                          <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                            <button 
                              onClick={() => setSwapType('crypto_to_coins')}
                              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                swapType === 'crypto_to_coins' ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-500'
                              }`}
                            >
                              إيداع الذهب
                            </button>
                            <button 
                              onClick={() => setSwapType('coins_to_crypto')}
                              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                swapType === 'coins_to_crypto' ? 'bg-yellow-500/10 text-yellow-400' : 'text-zinc-500'
                              }`}
                            >
                              سحب للتشفير
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl space-y-1">
                            <label className="text-[8px] font-black text-zinc-555 uppercase tracking-widest block">
                              {swapType === 'crypto_to_coins' ? 'ستدفع من عملات التشفير' : 'ستدفع من ذهب المنصة'}
                            </label>
                            <div className="flex items-center justify-between gap-2">
                              <input 
                                type="text"
                                placeholder="0.0"
                                value={swapAmount}
                                onChange={(e) => setSwapAmount(e.target.value)}
                                className="bg-transparent font-mono text-xl font-bold text-white outline-none w-full placeholder:text-zinc-800"
                              />
                              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono">
                                {swapType === 'crypto_to_coins' ? network.toUpperCase() : 'COINS'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl relative flex flex-col justify-center">
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 bg-zinc-950">
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </div>

                            <label className="text-[8px] font-black text-zinc-555 uppercase tracking-widest block">
                              {swapType === 'crypto_to_coins' ? 'ستحصل على ذهب المنصة' : 'ستتلقى بالمحفظة العامة'}
                            </label>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xl font-bold text-zinc-500">
                                {swapAmount && !isNaN(Number(swapAmount)) ? (
                                  swapType === 'crypto_to_coins' ? (
                                    Math.floor(parseFloat(swapAmount || '0') * (network === 'ethereum' ? 3000 : (network === 'solana' ? 120 : 600)))
                                  ) : (
                                    parseFloat((parseFloat(swapAmount || '0') / (network === 'ethereum' ? 3000 : (network === 'solana' ? 120 : 600))).toFixed(4))
                                  )
                                ) : '0.00'}
                              </span>
                              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest font-mono">
                                {swapType === 'crypto_to_coins' ? 'COINS' : network.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleSwap}
                          disabled={isSwapping || !walletConnected}
                          className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-40 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/10 active:scale-98 flex items-center justify-center gap-2"
                        >
                          {isSwapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          <span>تنفيذ التحويل الفوري / Synchronize & Execute Swap</span>
                        </button>
                      </div>

                    </div>

                    {/* Network stats column */}
                    <div className="space-y-6">
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <h4 className="text-white font-black text-xs uppercase tracking-wider">نظرة عامة على شبكات التشفير</h4>
                        
                        <div className="space-y-3">
                          
                          <div onClick={() => handleNetworkChange('ethereum')} className={`p-3 rounded-xl border transition-all cursor-pointer ${network === 'ethereum' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-transparent border-zinc-900 hover:border-zinc-800'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <h5 className="font-mono text-xs font-bold text-white">Ethereum Node</h5>
                              </div>
                              <span className="text-[9px] uppercase font-bold text-zinc-550">ERC-20</span>
                            </div>
                            <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500">
                              <span>RPC Latency: 22ms</span>
                              <span className="font-mono text-indigo-400">1 ETH = 3,000 Coins</span>
                            </div>
                          </div>

                          <div onClick={() => handleNetworkChange('solana')} className={`p-3 rounded-xl border transition-all cursor-pointer ${network === 'solana' ? 'bg-purple-500/5 border-purple-500/20' : 'bg-transparent border-zinc-900 hover:border-zinc-800'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                <h5 className="font-mono text-xs font-bold text-white">Solana Mainnet</h5>
                              </div>
                              <span className="text-[9px] uppercase font-bold text-zinc-550">SPL</span>
                            </div>
                            <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500">
                              <span>RPC Latency: 4ms</span>
                              <span className="font-mono text-purple-400">1 SOL = 120 Coins</span>
                            </div>
                          </div>

                          <div onClick={() => handleNetworkChange('bsc')} className={`p-3 rounded-xl border transition-all cursor-pointer ${network === 'bsc' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-transparent border-zinc-900 hover:border-zinc-800'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                <h5 className="font-mono text-xs font-bold text-white">Binance Chain</h5>
                              </div>
                              <span className="text-[9px] uppercase font-bold text-zinc-550">BEP-20</span>
                            </div>
                            <div className="flex justify-between items-center mt-2.5 text-[10px] text-zinc-500">
                              <span>RPC Latency: 12ms</span>
                              <span className="font-mono text-yellow-400">1 BNB = 600 Coins</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="bg-zinc-900/10 border border-zinc-900/80 p-5 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2 text-rose-500">
                          <Cpu className="w-4 h-4" />
                          <h4 className="font-black text-[11px] uppercase tracking-wider text-rose-500">ميزة Web3 Non-Custodial</h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          نظام التخزين والتشفير تم تصميمه بالكامل باستخدام عقود ذكية متكاملة تحكم عمليات موازنة الذهب وحيازة المشاهير لرموز المعاملات المفرزة.
                        </p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* SMARTS CONTRACTS STAKING ENGINE */}
              {activeTab === 'staking' && (
                <motion.div 
                  key="staking-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Active Contract metrics */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-6 relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                          <Lock className="w-40 h-40" />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-white font-black text-md uppercase tracking-wide">عقد تخزين الذهب الذكي / Gold Yield Engine</h3>
                            <p className="text-zinc-500 text-xs mt-0.5">Earn high-interest returns backed by platform staking loops</p>
                          </div>
                          
                          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-[10px] font-black tracking-widest font-mono uppercase">
                            APY: {stakingAPY}% Fixed
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                            <div>
                              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block">جملة الذهب المخزن / Total Staked Gold</span>
                              <div className="flex items-center gap-2 mt-2">
                                <Lock className="w-6 h-6 text-rose-500" />
                                <span className="text-3xl font-black text-white">{stakedBalance}</span>
                                <span className="text-zinc-600 text-xs font-black tracking-widest">COINS</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-bold block">مؤمن بالكامل عبر بروتوكول التشفير الآمن / Insured in-contract.</span>
                          </div>

                          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                            <div>
                              <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest block">الأرباح التراكمية / Accrued Earnings (Real-time clock)</span>
                              <div className="flex items-center gap-2 mt-2">
                                <Flame className="w-6 h-6 text-yellow-500 animate-pulse" />
                                <span className="text-3xl font-black text-yellow-500 font-mono">
                                  {accruedYield.toFixed(5)}
                                </span>
                                <span className="text-zinc-600 text-xs font-black tracking-widest">YIELD</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={handleHarvestYield}
                              disabled={accruedYield < 1}
                              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-black font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>حصاد الأرباح الفورية / Harvest Earnings</span>
                            </button>
                          </div>

                        </div>

                        {/* Interactive Stake UI */}
                        <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-2xl space-y-3">
                          <label className="text-[9px] font-black text-zinc-555 uppercase tracking-widest block">التحكم في الذهب المخزّن / Manage Stake</label>
                          
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              placeholder="أدخل عدد الذهب..."
                              value={stakeInput}
                              onChange={(e) => setStakeInput(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-white focus:border-rose-500 outline-none w-full font-bold placeholder:text-zinc-700"
                            />

                            <button 
                              onClick={() => handleStaking('stake')}
                              className="px-6 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl whitespace-nowrap transition-all"
                            >
                              تخزين / Stake
                            </button>

                            <button 
                              onClick={() => handleStaking('unstake')}
                              className="px-6 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-xl whitespace-nowrap transition-all"
                            >
                              إلغاء تخزين / Release
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Left contract breakdown */}
                    <div className="space-y-6">
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <Award className="w-5 h-5" />
                          <h4 className="text-white font-black text-xs uppercase tracking-wider">سجل استثمار الويب 3</h4>
                        </div>
                        
                        <div className="space-y-3 text-[11px] text-zinc-500">
                          <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span>الحد الأدنى لفك التخزين</span>
                            <span className="font-mono text-zinc-300">لا يوجد (0 قيود)</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span>صمام أمان التبييض</span>
                            <span className="font-mono text-zinc-300">مفعل وتراكمي</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span>إجمالي تخزين المنصة</span>
                            <span className="font-mono text-zinc-300">2.4M $GOLD</span>
                          </div>
                          <div className="flex justify-between pb-1">
                            <span>تحديث الفائدة التراكمية</span>
                            <span className="font-mono text-zinc-300">كل ثانية / Per Sec</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-gradient-to-br from-yellow-500/5 to-rose-500/5 border border-zinc-900 rounded-3xl space-y-2">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">نصيحة العقد للتخزين</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-bold">
                          استفد من تخزين عملات الذهب الزائدة لديك لتكسب تدفقاً ثابتاً من الأرباح التشاركية التي يمكنك سحبها في أي وقت كذهب أو تحويلها وضربها كعملات رقمية!
                        </p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* CREATOR FAN TOKENS HUB */}
              {activeTab === 'tokens' && (
                <motion.div 
                  key="tokens-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Recharts chart and stats column */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-4">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg" style={{ backgroundColor: `${selectedToken.color}15`, color: selectedToken.color, border: `1px solid ${selectedToken.color}30` }}>
                              {selectedToken.symbol[1]}
                            </div>
                            <div>
                              <h3 className="text-white font-black text-md tracking-tight uppercase">{selectedToken.name} ({selectedToken.symbol})</h3>
                              <p className="text-zinc-500 text-xs">صاحب العملة: {selectedToken.creator} / Token Issuer</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black text-zinc-100 font-mono">${selectedToken.price.toFixed(2)}</span>
                            <div className={`flex items-center justify-end gap-1.5 text-xs font-black ${selectedToken.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {selectedToken.trend >= 0 ? '+' : ''}{selectedToken.trend}%
                              {selectedToken.trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>

                        {/* Live Recharts Graph */}
                        <div className="h-60 w-full pt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={tokenChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="tokenColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={selectedToken.color} stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor={selectedToken.color} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#18181b', borderRadius: '12px' }}
                                labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '10px' }}
                                itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'black' }}
                              />
                              <Area type="monotone" dataKey="price" stroke={selectedToken.color} strokeWidth={2.5} fillOpacity={1} fill="url(#tokenColor)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Interactive trading form */}
                        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3 w-full sm:max-w-xs">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">الكمية المطلوبة / Quantity</label>
                            <input 
                              type="number"
                              value={buyTokenQty}
                              onChange={(e) => setBuyTokenQty(e.target.value)}
                              className="bg-zinc-900/50 border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono font-black text-white outline-none w-full text-center"
                            />
                          </div>

                          <div className="text-[11px] font-black text-zinc-550 uppercase tracking-wider">
                            الذهب المطلوب: <span className="text-zinc-200 font-mono font-black">{Math.ceil(parseInt(buyTokenQty || '0') * selectedToken.price * 10)} GOLD</span>
                          </div>

                          <button 
                            onClick={() => handleBuyCreatorToken(selectedToken)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                          >
                            دعم النجم بالعملة الرقمية
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Tokens List selection column */}
                    <div className="space-y-6">
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <h4 className="text-white font-black text-xs uppercase tracking-wider">أبرز رموز النجوم النشطة</h4>
                        
                        <div className="space-y-2">
                          {CREATOR_TOKENS.map((token) => (
                            <div 
                              key={token.id}
                              onClick={() => setSelectedToken(token)}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                selectedToken.id === token.id 
                                  ? 'bg-zinc-900 border-rose-500/30 shadow-sm' 
                                  : 'bg-transparent border-zinc-900 hover:border-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${token.color}15`, color: token.color }}>
                                  {token.symbol[1]}
                                </div>
                                <div className="text-left">
                                  <h5 className="font-black text-xs text-zinc-100">{token.symbol}</h5>
                                  <p className="text-[9px] text-zinc-500 font-bold uppercase">{token.creator}</p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono text-xs font-black text-zinc-300 block">${token.price.toFixed(2)}</span>
                                <span className={`text-[9px] font-black ${token.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {token.trend >= 0 ? '+' : ''}{token.trend}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-3xl space-y-3">
                        <h4 className="text-white font-black text-xs uppercase tracking-wider">الرموز بحوزتي / Portfolio</h4>
                        <div className="space-y-2 text-xs font-bold font-mono">
                          <div className="flex justify-between text-zinc-500">
                            <span>$KHOKHA Token</span>
                            <span className="text-white">{userTokenBalances.khokha || 0}</span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>$NOUR Star Coin</span>
                            <span className="text-white">{userTokenBalances.nour || 0}</span>
                          </div>
                          <div className="flex justify-between text-zinc-500">
                            <span>$YASMIN Coin</span>
                            <span className="text-white">{userTokenBalances.yasmine || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* VERIFIED PREMIUM NFT MARKETPLACE & GALLERY */}
              {activeTab === 'nfts' && (
                <motion.div 
                  key="nfts-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* NFT Gallery Grid */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {nfts.length > 0 ? nfts.map((nft) => (
                          <div key={nft.id} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-3xl space-y-3 relative group overflow-hidden">
                            
                            <div className="aspect-square bg-zinc-950 rounded-2xl overflow-hidden relative border border-zinc-900">
                              <img 
                                src={nft.image} 
                                alt={nft.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                              />

                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-zinc-800 text-[8px] font-black text-rose-400 uppercase tracking-widest font-mono">
                                Token #{nft.tokenId}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-zinc-200 font-black text-sm uppercase tracking-tight">{nft.title}</h4>
                              <p className="text-zinc-550 text-[10px] mt-0.5 font-bold uppercase truncate">بواسطة: {nft.ownerName || 'Unknown Owner'}</p>
                            </div>

                            <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-900 space-y-1 text-[10px] font-mono">
                              <div className="flex justify-between text-zinc-650">
                                <span>Network</span>
                                <span className="text-zinc-400">{nft.network}</span>
                              </div>
                              <div className="flex justify-between text-zinc-650">
                                <span>Verify Contract</span>
                                <span className="text-rose-400 font-bold truncate w-24 text-right" title={nft.contract}>{nft.contract}</span>
                              </div>
                            </div>

                          </div>
                        )) : (
                          <div className="col-span-1 sm:col-span-2 py-16 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-600">
                              <Package className="w-8 h-8" />
                            </div>
                            <div>
                              <h4 className="text-zinc-400 font-bold text-sm">ليس لديك أي NFTs معصوكة حالياً</h4>
                              <p className="text-zinc-600 text-xs mt-1">ابدأ بضرب البثوث الخاصة بك أو الهدايا النادرة وتحويلها لأصل مميز / No minted NFTs found yet.</p>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* NFT Minting Panel / Controller */}
                    <div className="space-y-6">
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-rose-500">
                          <Sparkles className="w-5 h-5" />
                          <h4 className="text-white font-black text-xs uppercase tracking-wider">صك لحظة استثنائية (Mint NFT)</h4>
                        </div>
                        
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-bold uppercase">
                          التكلفة: <span className="text-yellow-500">250 ذهبة</span> لضرب العثور وحقن البيانات الوصفية بالبلوكشين.
                        </p>

                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-555 uppercase tracking-widest block">اسم الأصل الرقمي / NFT Title</label>
                            <input 
                              type="text"
                              placeholder="أدخل اسماً للـ NFT..."
                              value={mintTitle}
                              onChange={(e) => setMintTitle(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-bold"
                            />
                          </div>

                          <button 
                            onClick={handleMintNFT}
                            disabled={isMinting || !walletConnected}
                            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center"
                          >
                            {isMinting ? 'جاري الصك والتشفير...' : 'ابدأ ضرب الـ NFT الآن / Press to Mint'}
                          </button>
                        </div>
                      </div>

                      <div className="p-5 bg-zinc-900/10 border border-zinc-900 rounded-3xl space-y-2">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">مواصفات تكنولوجيا Polygon</h4>
                        <p className="text-[10px] text-zinc-550 leading-relaxed">
                          جميع اللحظات المميزة يتم صكها بأسلوب عقود ERC-721 الذكية لضمان التوافق التام مع أسواق التداول العالمية الكبرى مثل OpenSea.
                        </p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STRIPE ROTATING WEBHOOK & METAMASK MULTI-CHAIN SENDER PANEL */}
              {activeTab === 'stripeWebhook' && (
                <motion.div 
                  key="stripe-webhook-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-right"
                  dir="rtl"
                >
                  {/* Header Title Accent */}
                  <div className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
                        <span>منصة التحقق والتحويل متعدد الشبكات المتقدمة</span>
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-1 uppercase font-bold">
                        تكامل احترافي لشبكة الدفع Stripe Webhooks مع إمضاء العقود الذكية وسجلات الـ JWT السحابية اللامركزية.
                      </p>
                    </div>

                    {!metaMaskConnected ? (
                      <button
                        onClick={connectMetaMask}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-black font-black text-[11px] uppercase tracking-wider rounded-xl transition-all"
                      >
                        <WalletIcon className="w-4 h-4" />
                        <span>ربط ميتاماسك / Connect MetaMask</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800 font-mono text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500 font-semibold uppercase">محفظتك المتصلة</p>
                          <p className="text-white text-[11px] font-black">{metaMaskAddress.substring(0, 6)}...{metaMaskAddress.slice(-4)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT PANEL: Stripe Webhook Logs Tracker (8 columns) */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Webhook Stream Logs Card */}
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <h4 className="text-white font-black text-xs uppercase tracking-wider">مراقب مدفوعات استرايب الفعلي (JWT Verified Stream)</h4>
                          </div>
                          <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-black font-mono tracking-wider animate-pulse">Live Tracking</span>
                        </div>

                        {stripeWebhookLogs.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-650">
                              <History className="w-6 h-6" />
                            </div>
                            <p className="text-zinc-500 text-xs font-bold uppercase block w-full">لا يوجد أي مدفوعات مسجلة حالياً</p>
                            <p className="text-[10px] text-zinc-600 max-w-xs font-semibold leading-normal block w-full">
                              استخدم نموذج المحاكاة في الأسفل أو قم بإرسال دفعات Stripe Webhook فعلية لتظهر السجلات اللامركزية هنا تلقائياً.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-[11px] border-collapse" dir="rtl">
                              <thead>
                                <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider font-extrabold pb-2">
                                  <th className="pb-3 text-right">المستفيد (Recipient)</th>
                                  <th className="pb-3 text-center">المبلغ (Amount)</th>
                                  <th className="pb-3 text-center">بوابة المفتاح (Keychain)</th>
                                  <th className="pb-3 text-center">توقيع الـ JWT المتكامل</th>
                                  <th className="pb-3 text-center">الحالة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stripeWebhookLogs.slice().reverse().map((p, idx) => {
                                  const metadata = p.metadata || {};
                                  return (
                                    <tr key={idx} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition-colors">
                                      <td className="py-3 font-mono text-zinc-350 font-bold text-right">
                                        {metadata.wallet ? `${metadata.wallet.substring(0, 6)}...${metadata.wallet.slice(-4)}` : 'UNKNOWN'}
                                      </td>
                                      <td className="py-3 text-center font-mono font-extrabold text-amber-500">
                                        ${((metadata.amount || 0) / 100).toFixed(2)}
                                      </td>
                                      <td className="py-3 text-center font-mono">
                                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-tight">
                                          {metadata.verifiedKey || "Rotated_Key"}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center font-mono text-zinc-500">
                                        <span className="cursor-help" title={p.token}>
                                          {p.token ? `${p.token.substring(0, 15)}...` : 'n/a'}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest font-mono">
                                          VERIFIED
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* WEBHOOK SIMULATOR PANEL */}
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                          <Cpu className="w-4 h-4 text-rose-500" />
                          <h4 className="text-white font-black text-xs uppercase tracking-wider">مُحاكي بوابة اشتراكات استرايب والحدث الرقمي الفوري</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block text-right">محفظة المستلم الرقمية / target web3 address</label>
                            <input 
                              type="text"
                              value={stripeSimulatorWallet}
                              onChange={(e) => setStripeSimulatorWallet(e.target.value)}
                              placeholder="أدخل عنوان المحفظة 0x..."
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-bold text-right"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block text-right">قيمة الاشتراك بالدولار / cost in cents</label>
                            <select 
                              value={stripeSimulatorAmount}
                              onChange={(e) => setStripeSimulatorAmount(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-bold text-right"
                            >
                              <option value="5000">عضوية فضية - $50.00 (5000 Cents)</option>
                              <option value="9900">عضوية ذهبية - $99.00 (9900 Cents)</option>
                              <option value="25000">باقة كبار الشخصيات - $250.00 (25000 Cents)</option>
                            </select>
                          </div>

                        </div>

                        <button
                          onClick={simulatePaymentWebhook}
                          disabled={simulatingStripeWebhook}
                          className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 disabled:opacity-40 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center cursor-pointer"
                        >
                          {simulatingStripeWebhook ? 'جاري إرسال الحدث ومعالجة الـ JWT...' : 'إرسال الحدث التجريبي ومعالجة JWT الروتيني المحمي'}
                        </button>
                      </div>

                    </div>

                    {/* RIGHT PANEL: MetaMask Multichain Sender (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                          <div className="flex items-center gap-2">
                            <Network className="w-4 h-4 text-yellow-500" />
                            <h4 className="text-white font-black text-xs uppercase tracking-wider">تحويل متعدد السلسلة (MetaMask Core)</h4>
                          </div>
                        </div>

                        {/* Status Check block */}
                        {!metaMaskConnected ? (
                          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-12 h-12 bg-yellow-500/15 text-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                              <WalletIcon className="w-5 h-5" />
                            </div>
                            <div className="max-w-xs space-y-1">
                              <h5 className="text-zinc-350 text-xs font-black">المحفظة غير متصلة للبث المباشر</h5>
                              <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">
                                قم بربط محفظة MetaMask لتفجير صفقاتك وتعديل السلاسل في الوقت الفعلي والتحقق من عقود StripeRegistry.
                              </p>
                            </div>
                            <button
                              onClick={connectMetaMask}
                              className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                            >
                              ربط ميتاماسك / Connect Now
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 text-right">
                            
                            {/* Connected Stats info */}
                            <div className="bg-zinc-950 p-3.5 border border-zinc-850 rounded-2xl space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                                <span className="text-zinc-500">حالة الشبكة</span>
                                <span className="text-white uppercase font-black text-right text-[11px]">
                                  {metamaskChainConfigs[currentNetworkChainId]?.name || `Chain ID ${currentNetworkChainId}`}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold font-mono">
                                <span className="text-zinc-500">الرصيد المتاح</span>
                                <span className="text-yellow-500 font-black">{metaMaskBalance}</span>
                              </div>
                            </div>

                            {/* form controls */}
                            <div className="space-y-3">
                              
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block text-right">اختر السلسلة الهدف / Select Chain</label>
                                <select 
                                  value={transferChainId}
                                  onChange={(e) => {
                                    setTransferChainId(e.target.value);
                                    switchMetaMaskNetwork(e.target.value);
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-bold"
                                >
                                  <option value="1">Ethereum (Chain ID 1)</option>
                                  <option value="137">Polygon Mainnet (Chain ID 137)</option>
                                  <option value="56">BNB Smart Chain (Chain ID 56)</option>
                                  <option value="42161">Arbitrum One (Chain ID 42161)</option>
                                  <option value="10">Optimism Mainnet (Chain ID 10)</option>
                                  <option value="8453">Base Mainnet (Chain ID 8453)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block text-right">محفظة المستهدف / Recipient address</label>
                                <input 
                                  type="text"
                                  placeholder="0x9320...79A1"
                                  value={transferRecipient}
                                  onChange={(e) => setTransferRecipient(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-bold font-mono text-right"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block text-right">القيمة بالعملة الأصلية / Native amount</label>
                                <input 
                                  type="number"
                                  step="0.0001"
                                  placeholder="0.05"
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-bold font-mono text-right"
                                />
                              </div>

                              <button
                                onClick={executeMetaMaskTransfer}
                                className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-yellow-500/10 mt-2 cursor-pointer"
                              >
                                تأكيد وبث المعاملة للشبكة / Broadcast Transaction
                              </button>

                            </div>

                          </div>
                        )}
                      </div>

                      {/* Web3 educational info card */}
                      <div className="bg-zinc-900/15 border border-zinc-900/60 p-4 rounded-3xl space-y-2 text-right">
                        <div className="flex items-center gap-2 text-rose-500">
                          <ShieldCheck className="w-4 h-4" />
                          <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">مستويات الأمان الرياضي المشدد</h5>
                        </div>
                        <p className="text-[10px] text-zinc-550 leading-relaxed leading-normal">
                          تقوم بوابة الاستماع بفك التشفير الروتيني لـ JWT عبر تشفير AES-256-GCM للتحقق من أصل التوقيع الخارجي. عند اكتمال التحقق يتم التفاعل المباشر مع عقد <strong>StripeRegistry</strong> المحمي بلوكشينياً.
                        </p>
                      </div>

                    </div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
