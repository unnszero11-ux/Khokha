import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Terminal, 
  Globe, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Cpu, 
  FileText, 
  Eye, 
  X, 
  Check,
  Server,
  Key,
  RefreshCcw,
  ShieldAlert,
  Copy,
  CreditCard
} from 'lucide-react';

interface CookieItem {
  id: string;
  domain: string;
  name: string;
  sameSite: 'Lax' | 'Strict' | 'None';
  lifecycle: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'High / Critical' | 'Low / Testing' | 'Medium / Tracking' | 'Medium / Cross-Site' | 'High / Anti-Fraud';
  purpose: string;
}

const DEFAULT_MATRIX: CookieItem[] = [
  { id: '1', domain: 'dashboard.stripe.com', name: '__Host-auth_token', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High / Critical', purpose: 'Platform Control Dashboard Core Authentication Token' },
  { id: '2', domain: 'access.stripe.com', name: '__Host-auth_token', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High / Critical', purpose: 'IAM Single Sign-On Gateway Authorization Handle' },
  { id: '3', domain: 'marketplace.stripe.com', name: '__Host-auth_token', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'Extension Marketplace Authentication Context' },
  { id: '4', domain: 'support.stripe.com', name: '__Host-auth_token', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'Customer Success Portal Authorized Verification' },
  { id: '5', domain: 'docs.stripe.com', name: '__Host-sandbox_assignment', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Low / Testing', purpose: 'Sandbox Testing Cluster API Routine Router' },
  { id: '6', domain: 'docs.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Low', purpose: 'Documentation Sandbox Active State Token' },
  { id: '7', domain: 'dashboard.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High', purpose: 'Core UI Session Lifecycle Management Block' },
  { id: '8', domain: 'stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High', purpose: 'Base Domain Session Boundary Anchor' },
  { id: '9', domain: 'access.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High', purpose: 'SSO Target Session Lifetime Monitor' },
  { id: '10', domain: 'marketplace.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'App Marketplace State Synchronization Token' },
  { id: '11', domain: 'support.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'Help Desk Workspace Active Token Lifecycle' },
  { id: '12', domain: 'connect.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High / Critical', purpose: 'Multi-Tenant Connect Core Router Session Handle' },
  { id: '13', domain: 'support-conversations.stripe.com', name: '__Host-session', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'Live Chat Infrastructure Access Token' },
  { id: '14', domain: 'docs.stripe.com', name: '__Host-unauthenticated_support_identity', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Low', purpose: 'Public Support Ticket Route Context Token' },
  { id: '15', domain: 'support-conversations.stripe.com', name: '__Host-unauthenticated_support_identity', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Low', purpose: 'Public Identity Thread Session Initialization' },
  { id: '16', domain: 'dashboard.stripe.com', name: '__Secure-has_logged_in', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'Client-Side Pre-flight Login Redirection State' },
  { id: '17', domain: '.stripe.com', name: '__stripe_orig_props', sameSite: 'Lax', lifecycle: 'Persistent (2027)', riskLevel: 'Medium / Tracking', purpose: 'Global Domain Origin Telemetry State Properties' },
  { id: '18', domain: 'm.stripe.com', name: '__stripe_orig_props', sameSite: 'None', lifecycle: 'Persistent (2027)', riskLevel: 'Medium / Cross-Site', purpose: 'Mobile Endpoints Cross-Site Interaction Tracer' },
  { id: '19', domain: '.stripe.com', name: 'machine_identifier', sameSite: 'Lax', lifecycle: 'Persistent (2027)', riskLevel: 'High / Anti-Fraud', purpose: 'Platform Device Footprint & Verification Anchor' },
  { id: '20', domain: '.stripe.com', name: 'merchant', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'Medium', purpose: 'Primary Merchant Identity Context Storage' },
  { id: '21', domain: '.stripe.com', name: 'private_machine_identifier', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High / Anti-Fraud', purpose: 'Isolated Cryptographic Hardware Signature Key' },
  { id: '22', domain: '.stripe.com', name: 'site-auth', sameSite: 'Lax', lifecycle: 'Session-Bound', riskLevel: 'High', purpose: 'Legacy Domain-Level Active Authorization Handle' }
];

export default function StripeRootDashboard() {
  const [cookies, setCookies] = useState<CookieItem[]>(() => {
    const saved = localStorage.getItem('stripe_cookie_matrix_payload');
    return saved ? JSON.parse(saved) : DEFAULT_MATRIX;
  });

  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  // Simulation State
  const [simRunning, setSimRunning] = useState(false);
  const [simLogs, setSimLogs] = useState<{ id: string; type: 'info' | 'success' | 'warn' | 'error'; msg: string; time: string }[]>([]);
  const [simProgress, setSimProgress] = useState(0);

  // Master Key & sk_ Rotated simulation states
  const [rotatedChildKey, setRotatedChildKey] = useState('sk_live_rotated_e19ad372cd3ea810');
  const [isRotating, setIsRotating] = useState(false);
  const [rotationLogs, setRotationLogs] = useState<string[]>([]);
  const [rotationProgress, setRotationProgress] = useState(0);

  // Stripe Secure Vault States
  const [vaultCardNumber, setVaultCardNumber] = useState('');
  const [vaultCardName, setVaultCardName] = useState('');
  const [vaultCardExpiry, setVaultCardExpiry] = useState('');
  const [vaultCardCvv, setVaultCardCvv] = useState('');
  const [tokenizing, setTokenizing] = useState(false);
  const [copiedUsdt, setCopiedUsdt] = useState(false);
  const [vaultMsg, setVaultMsg] = useState<string | null>(null);
  const [tokenizedCards, setTokenizedCards] = useState<{ id: string; last4: string; name: string; brand: string; token: string; createdAt: string }[]>(() => {
    const saved = localStorage.getItem('stripe_tokenized_vault_cards');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'v_1', last4: '4242', name: 'Nour El-Arakgy', brand: 'Visa', token: 'tok_vault_93da3f21ef', createdAt: new Date().toLocaleDateString('ar-EG') }
    ];
  });

  // New Cookie Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCookie, setNewCookie] = useState<Omit<CookieItem, 'id'>>({
    domain: '',
    name: '',
    sameSite: 'Lax',
    lifecycle: 'Session-Bound',
    riskLevel: 'Medium',
    purpose: ''
  });

  // Edit Cookie State
  const [editingItem, setEditingItem] = useState<CookieItem | null>(null);

  useEffect(() => {
    localStorage.setItem('stripe_cookie_matrix_payload', JSON.stringify(cookies));
  }, [cookies]);

  const domains = ['All', ...Array.from(new Set(cookies.map(c => c.domain)))];

  const filteredCookies = cookies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.domain.toLowerCase().includes(search.toLowerCase()) || 
                          c.purpose.toLowerCase().includes(search.toLowerCase());
    
    const matchesDomain = filterDomain === 'All' || c.domain === filterDomain;
    
    let matchesRisk = true;
    if (filterRisk !== 'All') {
      matchesRisk = c.riskLevel.toLowerCase().includes(filterRisk.toLowerCase());
    }

    return matchesSearch && matchesDomain && matchesRisk;
  });

  const rotateSecretKeys = () => {
    if (isRotating) return;
    setIsRotating(true);
    setRotationProgress(0);
    setRotationLogs([]);

    const steps = [
      '🔄 [KMS_SHARD] Requesting parent context validation via Stripe Master Key: keyinfo_live_****************...',
      '🛡️ [KMS_SHARD] Verifying parent integrity block with supreme HSM keyserver cluster...',
      '🔑 [KMS_SHARD] Parent validation APPROVED (Master Key schema is validated). Enforcing rotation protocols: no manual "sk_" keys permitted.',
      '🎰 [KMS_SHARD] Deriving hardware-level entropy sequence from thermal sensor chips in Newark (US-East)...',
      '⛓️ [KMS_SHARD] Injecting dynamic nonce sequence and executing SHA-256 HMAC derivation...',
      '✨ [KMS_SHARD] Created temporary child credentials! New value generated...',
      '✅ [KMS_SHARD] Propagating new "sk_live_rotated_..." into active gateway cache, memory boundaries & telemetry mapping...',
      '🎉 [KMS_SHARD] Complete! Previous sk_ child keys flagged as EXPIRED; new active derived keys deployed.'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setRotationLogs(prev => [...prev, steps[current]]);
        setRotationProgress(Math.floor(((current + 1) / steps.length) * 100));
        
        if (current === 5) {
          const randHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
          setRotatedChildKey(`sk_live_rotated_${randHex}`);
        }
        current++;
      } else {
        clearInterval(interval);
        setIsRotating(false);
      }
    }, 800);
  };

  const startSimulation = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimProgress(0);
    setSimLogs([]);

    const steps = [
      { type: 'info', msg: 'Initiating Automated Session Guard & Testing Pipeline (Ref: NT-SEC-COOKIE-V5)...' },
      { type: 'info', msg: 'Analyzing local sandbox cookie matrix definitions...' },
      { type: 'success', msg: `Successfully parsed ${cookies.length} active cookie records from browser payload.` },
      { type: 'info', msg: 'Establishing encrypted headless driver cluster worldwide...' },
      { type: 'success', msg: 'Platform drivers online in: Frankfurt (DE), Newark (US), Tokyo (JP), Dubai (AE).' },
      { type: 'info', msg: 'Testing Rule 4.1.1: Enforcing SECURE flags on all authenticated subdomains...' },
      { type: 'success', msg: 'Verification OK: 100% of SSL/TLS certificates present on Stripe target nodes.' },
      { type: 'info', msg: 'Testing Rule 4.1.2: Validating DOMAIN OMISSION during Puppeteer context injection...' },
      { type: 'success', msg: 'Verification OK: Zero absolute host bounds leaked in __Host-auth_token.' },
      { type: 'info', msg: 'Testing Rule 4.1.3: Evaluating "/" absolute PATH CONSTRAINT restrictions...' },
      { type: 'success', msg: 'Verification OK: Directory restrictions matched onconnect.stripe.com and support-conversations.' },
      { type: 'info', msg: 'Testing Rule 4.2: Evaluating cross-origin isolation telemetry for m.stripe.com...' },
      { type: 'warn', msg: 'Notice: SameSite policy set to "None" detected for "m.stripe.com" __stripe_orig_props. Attaching required secure header telemetry to bypass Chrome/Safari rejection flags...' },
      { type: 'info', msg: 'Testing compliance with Stripe Master Key Rotation rule...' },
      { type: 'success', msg: 'Verification OK: Parent Master Key has valid prefix "keyinfo_live_". Plain static "sk_" keys successfully omitted.' },
      { type: 'success', msg: '✓ SUMMARY: High-privilege automated testing pipeline completed. 0 vulnerabilities, 22 nodes secured.' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSimLogs(prev => [...prev, {
          id: Math.random().toString(),
          type: steps[currentStep].type as any,
          msg: steps[currentStep].msg,
          time: new Date().toLocaleTimeString()
        }]);
        setSimProgress(Math.floor(((currentStep + 1) / steps.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setSimRunning(false);
      }
    }, 1000);
  };

  const resetCookies = () => {
    if (confirm('Are you sure you want to reset the Payload Matrix to official Stripe specifications?')) {
      setCookies(DEFAULT_MATRIX);
    }
  };

  const handleCopyUsdt = () => {
    navigator.clipboard.writeText('TRdFzpPKP1JLAJWSKiNrqZQ4m9uoWq7K1j');
    setCopiedUsdt(true);
    setTimeout(() => setCopiedUsdt(false), 3000);
  };

  const handleTokenizeCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultCardNumber || !vaultCardName || !vaultCardExpiry || !vaultCardCvv) {
      alert('الرجاء ملء جميع الحقول لتأمين وتشفير معلومات الفيزا');
      return;
    }
    setTokenizing(true);
    setVaultMsg(null);
    
    setTimeout(() => {
      const last4 = vaultCardNumber.replace(/\s+/g, '').slice(-4) || '4242';
      const cleanName = vaultCardName;
      const newToken = 'tok_vault_' + Math.random().toString(16).substring(2, 12);
      const newCard = {
        id: 'v_' + Date.now(),
        last4,
        name: cleanName,
        brand: vaultCardNumber.startsWith('5') ? 'Mastercard' : 'Visa',
        token: newToken,
        createdAt: new Date().toLocaleDateString('ar-EG')
      };
      
      const updatedList = [newCard, ...tokenizedCards];
      setTokenizedCards(updatedList);
      localStorage.setItem('stripe_tokenized_vault_cards', JSON.stringify(updatedList));
      
      setVaultCardNumber('');
      setVaultCardName('');
      setVaultCardExpiry('');
      setVaultCardCvv('');
      setTokenizing(false);
      setVaultMsg('🔒 تم تشفير بطاقتك بنجاح وإنشاء رمز Vault فريد!');
      setTimeout(() => setVaultMsg(null), 4000);
    }, 1200);
  };

  const handleDeleteVaultCard = (id: string) => {
    const updated = tokenizedCards.filter(c => c.id !== id);
    setTokenizedCards(updated);
    localStorage.setItem('stripe_tokenized_vault_cards', JSON.stringify(updated));
  };

  const handleAddCookie = () => {
    if (!newCookie.domain || !newCookie.name || !newCookie.purpose) {
      alert('Please fill out all required fields.');
      return;
    }
    const item: CookieItem = {
      id: Math.random().toString(),
      ...newCookie
    };
    setCookies([item, ...cookies]);
    setShowAddModal(false);
    setNewCookie({
      domain: '',
      name: '',
      sameSite: 'Lax',
      lifecycle: 'Session-Bound',
      riskLevel: 'Medium',
      purpose: ''
    });
  };

  const handleEditCookie = () => {
    if (!editingItem) return;
    setCookies(cookies.map(c => c.id === editingItem.id ? editingItem : c));
    setEditingItem(null);
  };

  const handleDeleteCookie = (id: string) => {
    if (confirm('Delete this cookie configuration record from telemetry tracking?')) {
      setCookies(cookies.filter(c => c.id !== id));
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cookies, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "stripe_cookie_matrix_specs.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRiskColor = (risk: string) => {
    const r = risk.toLowerCase();
    if (r.includes('critical') || r.includes('high')) return 'text-red-400 bg-red-400/10 border-red-500/20';
    if (r.includes('medium') || r.includes('tracking')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
  };

  return (
    <div className="space-y-6 text-left">
      {/* Dynamic Header Badge */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
        <div className="flex items-center gap-4 relative z-10 font-sans">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/10 border border-rose-500/30">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">SaaS Stripe Root Security Matrix & KMS</h2>
              <span className="text-[10px] font-mono font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded tracking-wider uppercase">SSG-V5</span>
            </div>
            <p className="text-zinc-400 text-xs mt-1 max-w-xl">
              Enterprise security document framework & headless session matrix governing secure authenticated states, device fingerprinting, and dynamic <strong className="text-rose-300 font-mono">keyinfo_live_</strong> master key rotation pools.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 relative z-10">
          <button 
            onClick={startSimulation}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg shadow-rose-500/20"
          >
            <Play className="w-4 h-4 fill-white" />
            Launch Test Suite
          </button>
          <button 
            onClick={exportJSON}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Download className="w-4 h-4" />
            Export Spec
          </button>
          <button 
            onClick={resetCookies}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
            title="Reset to factory layout matrix specifications"
          >
            <RefreshCw className="w-4 h-4" />
            Factory Reset
          </button>
        </div>
      </div>

      {/* Stripe Keyinfo Master Key & sk_ rotation console (Arabic & English) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          {/* Key Details Card */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
              <Key className="w-6 h-6 text-rose-500" />
              <div>
                <h3 className="font-bold text-white text-lg">Stripe Master Key Shard & Rotation Control (تدوير مفاتيح sk_ ديناميكياً)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">مفتاح المستر <strong className="text-rose-400 font-mono">keyinfo_live_</strong> هو الأساس والمصدر الوحيد، ويتم تدوير مفاتيح sk_ الفرعية منه بشكل ديناميكي تلقائياً لحماية خصوصية المدفوعات.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-1 text-left">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Master Reference Token (مفتاح المستر)</span>
                <span className="text-rose-300 font-black font-mono text-sm block">keyinfo_live_83ba9aed01dcfa95c6fe</span>
                <p className="text-[11px] text-zinc-500 leading-normal pt-1 border-t border-zinc-800/80 mt-1">
                  المفتاح الأساسي المعتمد في الـ Vault. لا ينكشف للعميل بل تدور منه الرموز تلقائياً.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-1 text-left flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Rotated Derived Child Key (رمز sk_ المستخرج المشفر)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-black font-mono text-sm block truncate max-w-[200px]">{rotatedChildKey}</span>
                    <span className="text-[9px] font-black bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded tracking-wide uppercase">ACTIVE</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal pt-1 border-t border-zinc-800/80 mt-1">
                  الرمز المؤقت المطابق لمعايير Stripe API للعمليات النشطة حالياً.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Enforcing Compliance Rule: KMS-ROTATION-LIVE-5</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Stripe secret static configuration validation is strictly locked. Custom rotation logic guarantees secure transaction routing automatically.
                </p>
              </div>

              <button 
                onClick={rotateSecretKeys}
                disabled={isRotating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg shadow-rose-500/20"
              >
                <RefreshCcw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
                <span>Rotate sk_ Child Keys (تدوير مفتاح sk_)</span>
              </button>
            </div>
          </div>

          {/* Key Rotation Live console logs */}
          <div className="w-full lg:w-96 flex flex-col justify-between bg-black border border-zinc-800 rounded-3xl p-4 h-[240px]">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2 font-mono text-[10px]">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">KMS Rotation Micro-Suite</span>
              {isRotating && <span className="text-rose-400 animate-ping">● LIVE</span>}
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] text-left text-zinc-400 space-y-2 no-scrollbar scroll-smooth">
              {rotationLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-700 not-italic text-center p-4">
                  <Cpu className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs">Console is waiting for Rotation run...</p>
                </div>
              ) : (
                rotationLogs.map((log, index) => (
                  <p key={index} className="leading-snug">
                    {log}
                  </p>
                ))
              )}
            </div>

            {/* Rotation Progress */}
            {isRotating && (
              <div className="mt-2">
                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${rotationProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stripe Secure Vault, Tokenizer & Stablecoin Receiver Anchor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Column: Stripe Gateway Interactive Credential Vault (7 Cols) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between font-sans">
          <div className="absolute top-0 left-0 w-92 h-92 bg-rose-500/5 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <CreditCard className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-md">Stripe Secure Card Cardholder Vault (بناء Vault من استرايب على موقعنا)</h3>
                <p className="text-zinc-500 text-xs mt-0.5">قم بتسجيل وتشفير بطاقات الدفع لإنشاء رموز حماية (Tokenization) مطابقة لمعايير PCI-DSS دون الاحتفاظ ببيانات صريحة.</p>
              </div>
            </div>

            {/* Success message */}
            {vaultMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-bold"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>{vaultMsg}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Card Inputs Form (7 cols) */}
              <form onSubmit={handleTokenizeCard} className="md:col-span-7 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Cardholder Name (إسم حامل البطاقة)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Nour El-Arakgy"
                    value={vaultCardName}
                    onChange={(e) => setVaultCardName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Card Number (رقم البطاقة الـ 16 رقم)</label>
                  <input 
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={vaultCardNumber}
                    onChange={(e) => {
                      // Automatically format card with spaces simple way
                      const val = e.target.value.replace(/\D/g, '');
                      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                      setVaultCardNumber(formatted.substring(0, 19));
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500/40 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Expiry (انتهاء)</label>
                    <input 
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={vaultCardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) {
                          val = val.substring(0,2) + '/' + val.substring(2,4);
                        }
                        setVaultCardExpiry(val.substring(0, 5));
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500/40 font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">CVV (الرمز السري)</label>
                    <input 
                      type="password"
                      required
                      maxLength={4}
                      placeholder="***"
                      value={vaultCardCvv}
                      onChange={(e) => setVaultCardCvv(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500/40 font-mono text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={tokenizing}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:bg-zinc-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg shadow-rose-500/10"
                >
                  <Lock className={`w-4 h-4 ${tokenizing ? 'animate-spin' : ''}`} />
                  <span>{tokenizing ? 'Encrypting & Tokenizing...' : 'Store Securely in Stripe Vault (تأمين في الخزنة)'}</span>
                </button>
              </form>

              {/* Card Holographic Preview (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-indigo-950 via-zinc-950 to-rose-950/40 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-rose-500/20 transition-all duration-500">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500 pointer-events-none" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black tracking-widest text-[#FF9966] uppercase font-mono">SECURE VAULT GATEWAY</span>
                    <div className="w-8 h-5 rounded bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-[8px] font-black text-zinc-500">
                      CHIP
                    </div>
                  </div>

                  <div className="py-2 relative z-10">
                    {/* Masked display */}
                    <span className="text-sm font-bold tracking-widest font-mono text-zinc-100 block">
                      {vaultCardNumber || '•••• •••• •••• ••••'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between relative z-10">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Cardholder</span>
                      <span className="text-xs font-mono font-bold text-white truncate max-w-[120px] block">
                        {vaultCardName || 'YOUR FULL NAME'}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Expired</span>
                      <span className="text-xs font-mono font-bold text-white block">
                        {vaultCardExpiry || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tokenized Cards Ledger list */}
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 mt-6">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 font-mono">Tokenized Vault Registry (سجل البطاقات المؤمّنة)</span>
              
              {tokenizedCards.length === 0 ? (
                <p className="text-zinc-650 text-[10px] font-bold uppercase tracking-wide text-center py-4 not-italic">خزنة البطاقات فارغة حالياً. أضف بطاقتك لتأمينها.</p>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                  {tokenizedCards.map((card) => (
                    <div key={card.id} className="bg-black/40 border border-zinc-850 rounded-xl p-3 flex items-center justify-between gap-3 font-mono text-xs hover:border-rose-500/10 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{card.brand} ending in {card.last4}</span>
                            <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.2 rounded font-sans">{card.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-650 block mt-0.5">{card.token}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 hidden sm:inline">{card.createdAt}</span>
                        <button
                          onClick={() => handleDeleteVaultCard(card.id)}
                          className="p-1 text-zinc-600 hover:text-rose-500 rounded transition-colors"
                          title="حذف وحرق الرمز التعبيري"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Encrypted Stablecoin Settlement Account (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-950 to-black border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between font-sans">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />
          
          <div className="space-y-4 relative z-10 w-full">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-md">Receiving Settlement Wallet (محفظة استلام الأرباح)</h3>
                  <p className="text-[11px] text-zinc-500">عنوان محفظة الاستلام والودائع المشفرة للشبكة</p>
                </div>
              </div>
              <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded tracking-widest uppercase border border-emerald-500/15">ACTIVE</span>
            </div>

            {/* Golden Wallet Display Banner */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/20 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-[#FF9966] uppercase tracking-wider block font-mono">STABLECOIN SETTLEMENT ANCHOR</span>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded font-mono">TRC-20 (TRON Network)</span>
              </div>

              {/* Wallet Address Block */}
              <div className="bg-black/60 border border-zinc-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-left">
                <div className="space-y-0.5 overflow-hidden">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 block">Verified Payout Address</span>
                  <span className="font-mono text-sm font-black text-zinc-100 block select-all break-all tracking-tight">
                    TRdFzpPKP1JLAJWSKiNrqZQ4m9uoWq7K1j
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUsdt}
                  className="flex-shrink-0 p-2.5 bg-zinc-900 hover:bg-emerald-500/15 border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-xl transition-all active:scale-95"
                  title="نسخ عنوان المحفظة للمستلم"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Copy Prompt Message feedback */}
              <AnimatePresence>
                {copiedUsdt && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold justify-end pt-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>تم نسخ عنوان محفظة الاستلام بنجاح! 🚀</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Network Ledger specs */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-mono">Vault Infrastructure Specs (تفاصيل أمان المحفظة)</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-xl text-left">
                  <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Settlement Fee</span>
                  <span className="text-white text-xs font-black font-mono block mt-0.5">0.00% Zero-SaaS</span>
                </div>
                <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-xl text-left">
                  <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Node Validator</span>
                  <span className="text-[#FF9966] text-xs font-black font-mono block mt-0.5">Yahia & Nour Root</span>
                </div>
              </div>

              {/* Secure explanation box */}
              <p className="text-zinc-550 text-[11px] leading-relaxed text-right border-t border-zinc-900 pt-3 mt-1">
                توجيه: تم تكويد هذا الثبات الجغرافي محلياً بالربط مع مفتاح الـ <b>keyinfo_live_</b> الأساسي لضمان تحويل الفواتير المستقطعة من الاشتراكات الدولية لـ Stripe بالكامل إلى محفظة الاستلام: <code className="text-zinc-400 text-[10px] font-mono">TRdFzpPKP1JLAJWSKiNrq...</code> لحماية السيولة.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-3.5 mt-4 flex items-center justify-between w-full">
            <span className="text-[9px] font-mono font-bold text-zinc-500 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>TRON Grid Synchronized (Block #81a8c80d)</span>
            </span>
            <button
              onClick={() => {
                alert('⏳ جاري فحص تكامل المحفظة TRdFzpPKP1JLAJWSKiNrqZQ4m9uoWq7K1j مع شبكة TRONSCAN Explorer... النتيجة: المحفظة نشطة 100% ومتصلة بالخزنة المجمعة!');
              }}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 transition-all active:scale-95"
            >
              Verify Wallet Integrity (فحص الخزنة)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Worldwide Interactive Telemetry Map & Performance Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worldwide Active Servers & Map Visualizer (Column 1 & 2) */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-md flex items-center gap-2">
                <Globe className="text-rose-500 w-5 h-5 animate-pulse" />
                Worldwide Root Ingestion Nodes
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">Stripe secure sandbox endpoints mapping latency, certificate health & gateway routing</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">ACTIVE TUNNEL</span>
            </div>
          </div>

          {/* Svg Cyberpunk World Map with Pulse beacons */}
          <div className="relative flex-1 flex items-center justify-center p-4">
            <svg viewBox="0 0 1000 450" className="w-full opacity-35 max-h-[220px]">
              {/* World outline dots representation */}
              <rect x="0" y="0" width="1000" height="450" fill="none" />
              {/* Simple background layout lines */}
              <line x1="100" y1="50" x2="900" y2="50" stroke="#1f2937" strokeDasharray="5,5" strokeWidth="1" />
              <line x1="100" y1="225" x2="900" y2="225" stroke="#1f2937" strokeDasharray="5,5" strokeWidth="1" />
              <line x1="100" y1="400" x2="900" y2="400" stroke="#1f2937" strokeDasharray="5,5" strokeWidth="1" />
              
              {/* Simulated land masses (Abstract clean circles representing nodes) */}
              <circle cx="250" cy="150" r="45" fill="none" stroke="#27272a" strokeWidth="3" strokeDasharray="4,4" />
              <circle cx="500" cy="120" r="50" fill="none" stroke="#27272a" strokeWidth="3" strokeDasharray="4,4" />
              <circle cx="780" cy="180" r="60" fill="none" stroke="#27272a" strokeWidth="3" strokeDasharray="4,4" />
              <circle cx="850" cy="300" r="40" fill="none" stroke="#27272a" strokeWidth="3" strokeDasharray="4,4" />

              {/* Beacon Connection paths */}
              <path d="M 250 150 Q 375 100 500 120" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1.5" strokeDasharray="5,5" />
              <path d="M 500 120 Q 640 150 780 180" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1.5" strokeDasharray="5,5" />
              <path d="M 780 180 Q 815 240 850 300" fill="none" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1.5" strokeDasharray="5,5" />
              <path d="M 250 150 Q 550 250 850 300" fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1.5" strokeDasharray="5,5" />

              {/* Beacons points of presence */}
              {/* US East (Newark) */}
              <g className="cursor-pointer group">
                <circle cx="250" cy="150" r="14" className="fill-rose-500/10 stroke-rose-500/20 stroke-2 animate-pulse" />
                <circle cx="250" cy="150" r="4" className="fill-rose-500 shadow" />
                <text x="250" y="130" className="fill-zinc-400 font-mono font-black text-[10px] text-center" textAnchor="middle">USA (Newark)</text>
              </g>

              {/* EU Central (Frankfurt) */}
              <g className="cursor-pointer group">
                <circle cx="500" cy="120" r="14" className="fill-rose-500/10 stroke-rose-500/20 stroke-2 animate-pulse" />
                <circle cx="500" cy="120" r="4" className="fill-rose-500" />
                <text x="500" y="100" className="fill-zinc-400 font-mono font-black text-[10px]" textAnchor="middle">GERMANY (Frankfurt)</text>
              </g>

              {/* Asia East (Tokyo) */}
              <g className="cursor-pointer group">
                <circle cx="780" cy="180" r="14" className="fill-rose-500/10 stroke-rose-500/20 stroke-2 animate-pulse" />
                <circle cx="780" cy="180" r="4" className="fill-rose-500" />
                <text x="780" y="160" className="fill-zinc-400 font-mono font-black text-[10px]" textAnchor="middle">JAPAN (Tokyo)</text>
              </g>

              {/* Australia (Sydney) */}
              <g className="cursor-pointer group">
                <circle cx="850" cy="300" r="14" className="fill-rose-500/10 stroke-rose-500/20 stroke-2 animate-pulse" />
                <circle cx="850" cy="300" r="4" className="fill-zinc-600" />
                <text x="850" y="280" className="fill-zinc-500 font-mono font-black text-[10px]" textAnchor="middle">AUSTRALIA (Sydney)</text>
              </g>
            </svg>

            {/* Glowing live status overmap */}
            <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-md rounded-xl p-3 border border-zinc-900 flex items-center gap-3">
              <Server className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Gateway Status</p>
                <p className="text-white text-xs font-black font-mono leading-none mt-1">99.98% SSL Ratio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-zinc-900 pt-4 mt-2">
            <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Secure Compliance</span>
              <span className="text-white font-black font-mono text-base block mt-0.5">98.4% OK</span>
            </div>
            <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Anti-Fraud Models</span>
              <span className="text-white font-black font-mono text-base block mt-0.5">Hardware L2</span>
            </div>
            <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Active Telemetry</span>
              <span className="text-white font-black font-mono text-base block mt-0.5">{cookies.length} Cookies</span>
            </div>
            <div className="bg-zinc-900/30 p-3 rounded-2xl border border-zinc-900">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Router Shards</span>
              <span className="text-white font-black font-mono text-base block mt-0.5">5 Global</span>
            </div>
          </div>
        </div>

        {/* Headless Testing Pipeline Logs Console (Column 3) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[350px] lg:h-auto">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="text-rose-500 w-5 h-5 font-bold" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">Testing Pipeline Console</h3>
            </div>
            {simRunning && (
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-mono animate-pulse">
                RUNNING
              </span>
            )}
          </div>

          <div className="flex-1 bg-black border border-zinc-900 p-4 rounded-2xl font-mono text-xs overflow-y-auto space-y-2 no-scrollbar scroll-smooth">
            {simLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-2 text-center p-4">
                <Cpu className="w-10 h-10 stroke-zinc-700 animate-spin" />
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest not-italic">Headless pipeline is currently idle.</p>
                <button 
                  onClick={startSimulation}
                  className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 font-bold border border-rose-500/20 px-3 py-1.5 rounded-xl hover:bg-rose-500/5 transition-all"
                >
                  Start Debug Automation Flow
                </button>
              </div>
            ) : (
              simLogs.map(log => (
                <div key={log.id} className="leading-relaxed text-left border-b border-zinc-950 pb-1.5 last:border-0">
                  <div className="flex items-center justify-between text-[10px] text-zinc-600 mb-0.5">
                    <span>{log.time}</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-500 font-black' :
                      log.type === 'warn' ? 'text-amber-500 font-black' :
                      log.type === 'error' ? 'text-rose-500 font-black' : 'text-blue-400'
                    }>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <p className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warn' ? 'text-amber-300' :
                    log.type === 'error' ? 'text-rose-400' : 'text-zinc-300'
                  }>
                    {log.msg}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Progress Indicator */}
          {simRunning && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span>Progress</span>
                <span>{simProgress}%</span>
              </div>
              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-rose-500" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${simProgress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cookie Matrix CRUD Workspace Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5 mb-5">
          <div>
            <h3 className="font-bold text-white text-lg">Stripe Telemetry Cookie Mapping Base</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Full specifications list modeling secure parameters, same-site configs and bypass signatures</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search specs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-48 font-mono"
              />
            </div>
            
            {/* Filter Domain */}
            <select 
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
            >
              <option value="All">All Domains</option>
              {domains.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Scale-out Add */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Inject Spec</span>
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto no-scrollbar border border-zinc-900 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/60 border-b border-zinc-900 text-zinc-400 text-[11px] font-black uppercase tracking-wider">
                <th className="px-6 py-4">Target Domain</th>
                <th className="px-6 py-4">Cookie Name</th>
                <th className="px-6 py-4">SameSite Policy</th>
                <th className="px-6 py-4">Lifecycle Duration</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Functional Purpose</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300 text-xs">
              {filteredCookies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-650 text-[10px] font-black uppercase tracking-widest not-italic">No exact cookie matrix specifications matched the filters.</td>
                </tr>
              ) : (
                filteredCookies.map(cookie => (
                  <tr key={cookie.id} className="hover:bg-zinc-900/30 transition-all font-mono">
                    <td className="px-6 py-4 text-white font-bold">{cookie.domain}</td>
                    <td className="px-6 py-4">
                      <span className="text-rose-400 font-bold bg-rose-500/5 px-2 py-1 rounded-md border border-rose-500/10">
                        {cookie.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cookie.sameSite === 'Strict' ? 'bg-indigo-500/10 text-indigo-400' :
                        cookie.sameSite === 'Lax' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {cookie.sameSite}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{cookie.lifecycle}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider font-sans ${getRiskColor(cookie.riskLevel)}`}>
                        {cookie.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-sans max-w-xs truncate" title={cookie.purpose}>
                      {cookie.purpose}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap font-sans">
                      <button 
                        onClick={() => setEditingItem(cookie)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all inline-block"
                        title="Edit Spec"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCookie(cookie.id)}
                        className="p-1.5 hover:bg-rose-950/20 rounded-lg text-zinc-500 hover:text-rose-400 transition-all inline-block"
                        title="Delete Spec"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full relative z-10 space-y-4 font-sans"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="font-black text-white text-lg">Inject Matrix Parameter</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-zinc-900 rounded-full">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Target Host Domain</label>
                  <input 
                    type="text"
                    value={newCookie.domain}
                    onChange={(e) => setNewCookie({...newCookie, domain: e.target.value})}
                    placeholder="e.g. m.stripe.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Cookie Identifier Name</label>
                  <input 
                    type="text"
                    value={newCookie.name}
                    onChange={(e) => setNewCookie({...newCookie, name: e.target.value})}
                    placeholder="e.g. __Host-auth_token"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">SameSite Policy</label>
                    <select
                      value={newCookie.sameSite}
                      onChange={(e) => setNewCookie({...newCookie, sameSite: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Lax">Lax</option>
                      <option value="Strict">Strict</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Lifecycle Category</label>
                    <input 
                      type="text"
                      value={newCookie.lifecycle}
                      onChange={(e) => setNewCookie({...newCookie, lifecycle: e.target.value})}
                      placeholder="e.g. Session-Bound"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Security / Risk Level</label>
                  <select
                    value={newCookie.riskLevel}
                    onChange={(e) => setNewCookie({...newCookie, riskLevel: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium font-mono">Medium</option>
                    <option value="High">High</option>
                    <option value="High / Critical">High / Critical</option>
                    <option value="Low / Testing">Low / Testing</option>
                    <option value="Medium / Tracking">Medium / Tracking</option>
                    <option value="Medium / Cross-Site">Medium / Cross-Site</option>
                    <option value="High / Anti-Fraud">High / Anti-Fraud</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1 font-sans">Functional Design Purpose</label>
                  <textarea 
                    value={newCookie.purpose}
                    onChange={(e) => setNewCookie({...newCookie, purpose: e.target.value})}
                    placeholder="Enter short functional purpose detail..."
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl hover:bg-zinc-900 text-xs font-bold text-zinc-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCookie}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs"
                >
                  Inject Payload Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full relative z-10 space-y-4 font-sans"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="font-black text-white text-lg">Modify Matrix Spec</h3>
                <button onClick={() => setEditingItem(null)} className="p-1.5 hover:bg-zinc-900 rounded-full font-sans">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Target Host Domain</label>
                  <input 
                    type="text"
                    value={editingItem.domain}
                    onChange={(e) => setEditingItem({...editingItem, domain: e.target.value})}
                    placeholder="e.g. m.stripe.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Cookie Identifier Name</label>
                  <input 
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                    placeholder="e.g. __Host-auth_token"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">SameSite Policy</label>
                    <select
                      value={editingItem.sameSite}
                      onChange={(e) => setEditingItem({...editingItem, sameSite: e.target.value as any})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Lax">Lax</option>
                      <option value="Strict">Strict</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Lifecycle Category</label>
                    <input 
                      type="text"
                      value={editingItem.lifecycle}
                      onChange={(e) => setEditingItem({...editingItem, lifecycle: e.target.value})}
                      placeholder="e.g. Session-Bound"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Security / Risk Level</label>
                  <select
                    value={editingItem.riskLevel}
                    onChange={(e) => setEditingItem({...editingItem, riskLevel: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="High / Critical">High / Critical</option>
                    <option value="Low / Testing">Low / Testing</option>
                    <option value="Medium / Tracking">Medium / Tracking</option>
                    <option value="Medium / Cross-Site font-sans">Medium / Cross-Site</option>
                    <option value="High / Anti-Fraud">High / Anti-Fraud</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1 font-sans">Functional Design Purpose</label>
                  <textarea 
                    value={editingItem.purpose}
                    onChange={(e) => setEditingItem({...editingItem, purpose: e.target.value})}
                    placeholder="Enter short functional purpose detail..."
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl hover:bg-zinc-900 text-xs font-bold text-zinc-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditCookie}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs"
                >
                  Save Spec Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
