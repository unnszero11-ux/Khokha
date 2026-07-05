import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  Video, 
  ShieldAlert, 
  ShoppingBag, 
  Lock, 
  Search, 
  Check, 
  X, 
  Ban, 
  Trash2, 
  Plus, 
  ExternalLink,
  Coins,
  TrendingUp,
  Eye,
  EyeOff,
  Globe,
  Webhook,
  Sparkles,
  MessageSquare,
  Volume2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Smartphone,
  BarChart2,
  ShieldCheck,
  Github,
  Key,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, LiveRoom, Report, StoreItem, Section } from '../types';
import StripeAdminPanel from './StripeAdminPanel';
import { KhokhaVoice } from './KhokhaVoice';
import StreamAnalytics from './StreamAnalytics';
import JwtManagement from './JwtManagement';
import AdminSecurityTab from './AdminSecurityTab';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const SecretInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  className = "w-full focus:border-rose-500",
  dir = "ltr" 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
  className?: string;
  dir?: "ltr" | "rtl";
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1 text-right" dir="rtl">
      <label className="block text-[11px] font-black text-zinc-400 mb-1 uppercase tracking-widest">{label}</label>
      <div className="relative flex items-center">
        <input 
          type={visible ? "text" : "password"} 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={dir}
          className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-12 pr-4 py-2 focus:outline-none transition-colors text-white font-mono text-sm leading-normal ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute left-3 text-zinc-500 hover:text-zinc-350 focus:outline-none cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const SettingsPanel = ({ user }: { user: any }) => {
  const [settings, setSettings] = useState<any>({
    agoraAppId: '',
    agoraAppCertificate: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    kmsToken: '',
    kmsSignature: '',
    // Web3, rotating keyring & JWT beast master
    API_BEAST_MASTER: '',
    STRIPE_SK_KEYINFO: '',
    STRIPE_WH_KEYINFO: '',
    STRIPE_SK_SANDBOX: '',
    STRIPE_WH_SANDBOX: '',
    STRIPE_SK_SUPPORT1: '',
    STRIPE_WH_SUPPORT1: '',
    STRIPE_SK_SUPPORT2: '',
    STRIPE_WH_SUPPORT2: '',
    RPC_NODE_URL: '',
    PRIVATE_KEY: '',
    CONTRACT_ADDRESS: '',
    // Added Gemini API Key & GitHub
    geminiApiKey: '',
    githubClientId: '',
    githubClientSecret: '',
    githubToken: '',
    githubRepo: '',
    githubOwner: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings({
            agoraAppId: data.agoraAppId || '',
            agoraAppCertificate: data.agoraAppCertificate || '',
            stripePublishableKey: data.stripePublishableKey || '',
            stripeSecretKey: data.stripeSecretKey || '',
            kmsToken: data.kmsToken || '',
            kmsSignature: data.kmsSignature || '',
            // Rotating & Web3
            API_BEAST_MASTER: data.API_BEAST_MASTER || '',
            STRIPE_SK_KEYINFO: data.STRIPE_SK_KEYINFO || '',
            STRIPE_WH_KEYINFO: data.STRIPE_WH_KEYINFO || '',
            STRIPE_SK_SANDBOX: data.STRIPE_SK_SANDBOX || '',
            STRIPE_WH_SANDBOX: data.STRIPE_WH_SANDBOX || '',
            STRIPE_SK_SUPPORT1: data.STRIPE_SK_SUPPORT1 || '',
            STRIPE_WH_SUPPORT1: data.STRIPE_WH_SUPPORT1 || '',
            STRIPE_SK_SUPPORT2: data.STRIPE_SK_SUPPORT2 || '',
            STRIPE_WH_SUPPORT2: data.STRIPE_WH_SUPPORT2 || '',
            RPC_NODE_URL: data.RPC_NODE_URL || '',
            PRIVATE_KEY: data.PRIVATE_KEY || '',
            CONTRACT_ADDRESS: data.CONTRACT_ADDRESS || '',
            // Added Gemini API Key & GitHub
            geminiApiKey: data.geminiApiKey || '',
            githubClientId: data.githubClientId || '',
            githubClientSecret: data.githubClientSecret || '',
            githubToken: data.githubToken || '',
            githubRepo: data.githubRepo || '',
            githubOwner: data.githubOwner || ''
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 font-bold">جاري تحميل إعدادات لوحة التحكم...</div>;

  return (
    <div className="p-8 max-w-4xl space-y-8 text-right" dir="rtl">
      <div className="border-b border-zinc-800 pb-4 text-right">
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-white font-sans">لوحة إدارة المفاتيح وصلاحيات البيئة (System Credentials Control)</h2>
        <p className="text-zinc-400 text-sm">
          تعديل مفاتيح الربط ومزود الخدمة والشبكات اللامركزية. جميع الحقول تتميز بطبقة حماية مشفرة مع زر العين للإظهار/الإخفاء ويتم حفظها مباشرة في قاعدة البيانات والبيئة السحابية للرأس والمساعد الذكي.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Gemini AI Core Configuration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-lg text-white">إعدادات الذكاء الاصطناعي (Gemini Core Engine)</h3>
            </div>
            <span className="text-xs font-mono text-rose-450 uppercase">Gemini AI SDK</span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            مفتاح API الخاص بـ Google Gemini لتشغيل المساعدين الصوتيين والنصيين والترجمة الفورية. يتم حفظه بأمان في قاعدة البيانات السحابية وتحديث البيئة النشطة بشكل فوري.
          </p>
          <div className="grid grid-cols-1 gap-4 pt-2">
            <SecretInput 
              label="مفتاح واجهة برمجة التطبيقات (Gemini API Key)"
              value={settings.geminiApiKey}
              onChange={(val) => setSettings({...settings, geminiApiKey: val})}
              placeholder="AIzaSy..."
            />
          </div>
        </div>

        {/* GitHub Integration Platform */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-lg text-white">منصة ربط مستودعات GitHub (GitHub Repository Vault)</h3>
            </div>
            <span className="text-xs font-mono text-blue-450 uppercase">GitHub Integration</span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            التحكم في معلمات الاتصال بمستودع GitHub من أجل التحديثات التلقائية والنسخ الاحتياطية وإدارة الأكواد البرمجية مباشرة من لوحة التحكم.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1 text-right">اسم مالك المستودع / المنظمة (GitHub Owner / Org)</label>
              <input 
                type="text" 
                value={settings.githubOwner}
                onChange={(e) => setSettings({...settings, githubOwner: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-left transition-colors text-white font-mono text-sm"
                placeholder="e.g. Octocat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1 text-right">اسم المستودع (GitHub Repository Name)</label>
              <input 
                type="text" 
                value={settings.githubRepo}
                onChange={(e) => setSettings({...settings, githubRepo: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-left transition-colors text-white font-mono text-sm"
                placeholder="e.g. my-awesome-project"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecretInput 
              label="معرّف تطبيق GitHub (GitHub Client ID)"
              value={settings.githubClientId}
              onChange={(val) => setSettings({...settings, githubClientId: val})}
              placeholder="e.g. Iv1.abcdef1234567890"
            />
            <SecretInput 
              label="المفتاح السري لتطبيق GitHub (GitHub Client Secret)"
              value={settings.githubClientSecret}
              onChange={(val) => setSettings({...settings, githubClientSecret: val})}
              placeholder="e.g. Client Secret Hex..."
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <SecretInput 
              label="رمز الوصول الشخصي / التوكن (GitHub Personal Access Token)"
              value={settings.githubToken}
              onChange={(val) => setSettings({...settings, githubToken: val})}
              placeholder="ghp_..."
            />
          </div>
        </div>

        {/* Agora Live Streaming */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-lg text-white">إعدادات البث الحي (Agora Streaming)</h3>
            </div>
            <span className="text-xs font-mono text-zinc-500 uppercase">Agora SDK Context</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">معرّف التطبيق (App ID)</label>
              <input 
                type="text" 
                value={settings.agoraAppId}
                onChange={(e) => setSettings({...settings, agoraAppId: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 text-left transition-colors text-white font-mono text-sm"
                placeholder="e.g. 1234567890abcdef..."
              />
            </div>
            <SecretInput 
              label="شهادة البث الأمنية (App Certificate)"
              value={settings.agoraAppCertificate}
              onChange={(val) => setSettings({...settings, agoraAppCertificate: val})}
              placeholder="App Certificate String"
            />
          </div>
        </div>

        {/* Stripe Standard SDK Config */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg text-white">البوابة الرئيسية للمدفوعات (Stripe Payments Config)</h3>
            </div>
            <span className="text-xs font-mono text-zinc-550 uppercase">Base Gateway</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">مفتاح النشر العام (Publishable Key)</label>
              <input 
                type="text" 
                value={settings.stripePublishableKey}
                onChange={(e) => setSettings({...settings, stripePublishableKey: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-left transition-colors text-white font-mono text-sm"
                placeholder="pk_live_..."
              />
            </div>
            <SecretInput 
              label="مفتاح السيرفر العام المبدئي (Stripe Secret Key)"
              value={settings.stripeSecretKey}
              onChange={(val) => setSettings({...settings, stripeSecretKey: val})}
              placeholder="sk_live_..."
            />
          </div>
        </div>

        {/* Dynamic Stripe Keyring Rotation System */}
        <div className="bg-zinc-900/90 border border-rose-500/10 rounded-xl p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/2 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-lg text-white">حلقة مفاتيح التدوير الديناميكية (Stripe Active Keyring Matrix)</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 animate-pulse">Active Rotating Daemon</span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            تأمين العمليات والتحقق من التوقيع الرقمي للويب هوكس (Stripe Webhook Verification) عبر حلقة المفاتيح الدوارة الأربعة. يدعم النظام الاسترجاع والتشفير التلقائي. ومحمي بزر العين التلقائي.
          </p>

          <div className="space-y-6 pt-2">
            {/* Key 1: Keyinfo_live_ */}
            <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-lg space-y-4">
              <h4 className="text-sm font-black text-rose-400 border-b border-zinc-900 pb-2 flex items-center gap-2">
                <span>🔑 الهوية الأولى:</span>
                <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-white font-mono">Keyinfo_live_ (المجموعة المبدئية)</code>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SecretInput 
                  label="Stripe Secret Key (SK)"
                  value={settings.STRIPE_SK_KEYINFO}
                  onChange={(val) => setSettings({...settings, STRIPE_SK_KEYINFO: val})}
                  placeholder="sk_live_..."
                />
                <SecretInput 
                  label="Webhook Secret (WH)"
                  value={settings.STRIPE_WH_KEYINFO}
                  onChange={(val) => setSettings({...settings, STRIPE_WH_KEYINFO: val})}
                  placeholder="whsec_..."
                />
              </div>
            </div>

            {/* Key 2: Sandbox_live_rest */}
            <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-lg space-y-4">
              <h4 className="text-sm font-black text-blue-400 border-b border-zinc-900 pb-2 flex items-center gap-2">
                <span>🔑 الهوية الثانية:</span>
                <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-white font-mono">Sandbox_live_rest (بوابة التجربة الحية)</code>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SecretInput 
                  label="Stripe Secret Key (SK)"
                  value={settings.STRIPE_SK_SANDBOX}
                  onChange={(val) => setSettings({...settings, STRIPE_SK_SANDBOX: val})}
                  placeholder="sk_live_..."
                />
                <SecretInput 
                  label="Webhook Secret (WH)"
                  value={settings.STRIPE_WH_SANDBOX}
                  onChange={(val) => setSettings({...settings, STRIPE_WH_SANDBOX: val})}
                  placeholder="whsec_..."
                />
              </div>
            </div>

            {/* Key 3: Support_key_1 */}
            <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-lg space-y-4">
              <h4 className="text-sm font-black text-amber-400 border-b border-zinc-900 pb-2 flex items-center gap-2">
                <span>🔑 الهوية الثالثة:</span>
                <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-white font-mono">Support_key_1 (مفتاح الدعم الاحتياطي الأول)</code>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SecretInput 
                  label="Stripe Secret Key (SK)"
                  value={settings.STRIPE_SK_SUPPORT1}
                  onChange={(val) => setSettings({...settings, STRIPE_SK_SUPPORT1: val})}
                  placeholder="sk_live_..."
                />
                <SecretInput 
                  label="Webhook Secret (WH)"
                  value={settings.STRIPE_WH_SUPPORT1}
                  onChange={(val) => setSettings({...settings, STRIPE_WH_SUPPORT1: val})}
                  placeholder="whsec_..."
                />
              </div>
            </div>

            {/* Key 4: Support_key_2 */}
            <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-lg space-y-4">
              <h4 className="text-sm font-black text-emerald-400 border-b border-zinc-900 pb-2 flex items-center gap-2">
                <span>🔑 الهوية الرابعة:</span>
                <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-white font-mono">Support_key_2 (مفتاح الدعم الاحتياطي الثاني)</code>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SecretInput 
                  label="Stripe Secret Key (SK)"
                  value={settings.STRIPE_SK_SUPPORT2}
                  onChange={(val) => setSettings({...settings, STRIPE_SK_SUPPORT2: val})}
                  placeholder="sk_live_..."
                />
                <SecretInput 
                  label="Webhook Secret (WH)"
                  value={settings.STRIPE_WH_SUPPORT2}
                  onChange={(val) => setSettings({...settings, STRIPE_WH_SUPPORT2: val})}
                  placeholder="whsec_..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Web3 / Decentralized Contract Integration & JWT Token Signature */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg text-white">الربط اللامركزي وتوقيع الهوية المشفرة (Web3 & JWT Vault)</h3>
            </div>
            <span className="text-xs font-mono text-zinc-550 uppercase">Blockchain / Auth Token</span>
          </div>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SecretInput 
                label="مفتاح توقيع JWT السري للاتصال الآمن (API_BEAST_MASTER)"
                value={settings.API_BEAST_MASTER}
                onChange={(val) => setSettings({...settings, API_BEAST_MASTER: val})}
                placeholder="Root JWT JWT_BEAST_SECRET..."
              />
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-zinc-400 mb-1 uppercase tracking-widest text-right">رابط شبكة البلوكشين (RPC Node Provider Url)</label>
                <input 
                  type="text" 
                  value={settings.RPC_NODE_URL}
                  onChange={(e) => setSettings({...settings, RPC_NODE_URL: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-left transition-colors text-white font-mono text-sm"
                  placeholder="e.g. https://cloudflare-eth.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SecretInput 
                label="المفتاح الخاص للمحفظة الموقعة بالويب 3 (Signer Wallet Private Key)"
                value={settings.PRIVATE_KEY}
                onChange={(val) => setSettings({...settings, PRIVATE_KEY: val})}
                placeholder="0x..."
              />
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-zinc-400 mb-1 uppercase tracking-widest text-right">عنوان عقد الدفع الذكي (StripeRegistry Address)</label>
                <input 
                  type="text" 
                  value={settings.CONTRACT_ADDRESS}
                  onChange={(e) => setSettings({...settings, CONTRACT_ADDRESS: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-left transition-colors text-white font-mono text-sm"
                  placeholder="e.g. 0xabcdef..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Vault (KMS) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-850 pb-4">
            <Lock className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-lg text-white">نظام التشفير السحابي والأمان الإضافي (KMS Vault)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <SecretInput 
              label="Master Live Token (LIVE_KMS_TOKEN_184)"
              value={settings.kmsToken}
              onChange={(val) => setSettings({...settings, kmsToken: val})}
              placeholder="AW8GRrU53..."
            />
            <SecretInput 
              label="Master Core Signature (LIVE_KMS_SIGNATURE_184)"
              value={settings.kmsSignature}
              onChange={(val) => setSettings({...settings, kmsSignature: val})}
              placeholder="ARV-wf3RR..."
            />
          </div>
        </div>

        {/* Save button */}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-black py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm font-sans"
        >
          {saving ? 'جاري حفظ الإعدادات...' : '✓ حفظ وتأكيد كافة المفاتيح مباشرة في البيئة السحابية'}
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'lives' | 'reports' | 'store' | 'sections' | 'toys' | 'orders' | 'transactions' | 'model-applications' | 'settings' | 'admin-roles' | 'stripe' | 'analytics' | 'jwt' | 'admin-security'>('users');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    users_sec: true,
    live_acts: true,
    store_comm: true,
    stripe_int: true
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddToy, setShowAddToy] = useState(false);

  // Khokha AI state variables
  const [showKhokhaChat, setShowKhokhaChat] = useState(false);
  const [khokhaPrompt, setKhokhaPrompt] = useState('');
  const [khokhaLoading, setKhokhaLoading] = useState(false);
  const [khokhaMessages, setKhokhaMessages] = useState<{ sender: 'user' | 'khokha'; text: string }[]>([
    { sender: 'khokha', text: 'يا هلا وغلا يا طويل العمر! نوّرت لوحة الإدارة العليا والتحكم بالصلاحيات والمفاتيح الكريبتوجرافية الحساسة. أنا خوخة مساعدتك الذكية.. اؤمرني وتدلل، وكل شي تبيه تلاقيه جاهز في ثواني!' }
  ]);
  const [showKhokhaVoice, setShowKhokhaVoice] = useState(false);

  // Admin roles tab state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminRolesError, setAdminRolesError] = useState('');
  const [adminRolesSuccess, setAdminRolesSuccess] = useState('');

  const handleSendKhokhaMessage = async (text: string) => {
    if (!text.trim() || khokhaLoading) return;
    const userText = text.trim();
    setKhokhaPrompt('');
    setKhokhaMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setKhokhaLoading(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/khokha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userText })
      });
      if (res.ok) {
        const json = await res.json();
        setKhokhaMessages(prev => [...prev, { sender: 'khokha', text: json.response }]);
      } else {
        setKhokhaMessages(prev => [...prev, { sender: 'khokha', text: 'يا ويلي يا طويل العمر! السيرفر معلّق أو فيه شي خربان.. جرب مرة ثانية تكفى!' }]);
      }
    } catch (err: any) {
      setKhokhaMessages(prev => [...prev, { sender: 'khokha', text: `يا طويل العمر، صار عطل بالشبكة: ${err.message}` }]);
    } finally {
      setKhokhaLoading(false);
    }
  };

  const fetchAdminData = async (tab: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      let targetTab = tab;
      if (tab === 'admin-roles') {
        targetTab = 'users';
      } else if (tab === 'stripe-webhooks') {
        targetTab = 'webhooks';
      }
      const res = await fetch(`/api/admin/${targetTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tab}`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(activeTab);
  }, [activeTab]);

  const handleUserUpdate = async (userId: string, updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/user/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, ...updates })
      });
      if (res.ok) {
        fetchAdminData('users');
      }
    } catch (err) {
      console.error("User update failed", err);
    }
  };

  const handleTerminateLive = async (liveId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/live/terminate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ liveId })
      });
      if (res.ok) {
        fetchAdminData('lives');
      }
    } catch (err) {
      console.error("Live termination failed", err);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/report/resolve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reportId, status })
      });
      if (res.ok) {
        fetchAdminData('reports');
      }
    } catch (err) {
      console.error("Report resolution failed", err);
    }
  };

  const handleDeleteStoreItem = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/store/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchAdminData('store');
    } catch (err) {
      console.error("Delete store item failed", err);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this section?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/section/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchAdminData('sections');
    } catch (err) {
      console.error("Delete section failed", err);
    }
  };

  const handleDeleteToy = async (id: string) => {
    if (!user || !confirm("Are you sure you want to delete this toy?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/toys/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) fetchAdminData('toys');
    } catch (err) {
      console.error("Delete toy failed", err);
    }
  };

  const handleOrderUpdate = async (id: string, status: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/order/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) fetchAdminData('orders');
    } catch (err) {
      console.error("Order update failed", err);
    }
  };

  const handleApproveModel = async (applicationId: string, userId: string) => {
    if (!user || !confirm("Are you sure you want to approve this model application?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/model-applications/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId, userId })
      });
      if (res.ok) fetchAdminData('model-applications');
    } catch (err) {
      console.error("Approve model failed", err);
    }
  };

  const handleRejectModel = async (applicationId: string) => {
    if (!user || !confirm("Are you sure you want to reject this model application?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/model-applications/reject', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId })
      });
      if (res.ok) fetchAdminData('model-applications');
    } catch (err) {
      console.error("Reject model failed", err);
    }
  };

  const filteredData = (activeTab === 'settings' || activeTab === 'stripe') ? [] : data.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (activeTab === 'users' || activeTab === 'admin-roles') return item.displayName?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);
    if (activeTab === 'lives') return item.title?.toLowerCase().includes(q) || item.modelName?.toLowerCase().includes(q);
    if (activeTab === 'store') return item.name?.toLowerCase().includes(q);
    if (activeTab === 'sections') return item.name?.toLowerCase().includes(q);
    if (activeTab === 'toys') return item.name?.toLowerCase().includes(q);
    if (activeTab === 'orders') return item.userId?.toLowerCase().includes(q) || item.itemId?.toLowerCase().includes(q);
    return true;
  });

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col pt-10 sm:pt-0">
      {/* Header */}
      <header className="h-16 sm:h-20 border-b border-zinc-800 px-4 sm:px-8 flex items-center justify-between bg-zinc-950/50">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldAlert className="text-white w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">System Admin</h1>
            <p className="text-zinc-500 flex text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] hidden sm:block">Control Panel</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 sm:p-3 hover:bg-zinc-800 rounded-full transition-all active:scale-90"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Navigation Sidebar / Navbar */}
        <aside className="w-[64px] sm:w-64 border-r border-zinc-800 bg-zinc-950/30 p-2 sm:p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar flex-shrink-0">
          
          {/* Category 1: Users & Security */}
          <div className="flex flex-col w-full">
            <button 
              onClick={() => setOpenCategories(prev => ({ ...prev, users_sec: !prev.users_sec }))}
              className="hidden sm:flex items-center justify-between w-full px-2 py-1.5 text-left text-zinc-500 hover:text-zinc-300 font-bold text-[10px] uppercase tracking-wider mb-1 font-sans"
            >
              <span>المستخدمين والأمن</span>
              {openCategories.users_sec ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <span className="sm:hidden text-[9px] text-zinc-650 font-black text-center block mb-1 font-sans uppercase">أمن</span>
            <div className={cn("flex flex-col gap-1.5", openCategories.users_sec ? "flex" : "hidden sm:hidden")}>
              <SidebarItem 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')} 
                icon={<Users className="w-4 h-4" />} 
                label="Users" 
              />
              <SidebarItem 
                active={activeTab === 'model-applications'} 
                onClick={() => setActiveTab('model-applications')} 
                icon={<Check className="w-4 h-4" />} 
                label="Model Applications" 
              />
              <SidebarItem 
                active={activeTab === 'admin-roles'} 
                onClick={() => setActiveTab('admin-roles')} 
                icon={<ShieldAlert className="w-4 h-4 text-rose-500" />} 
                label="Admin Roles" 
              />
              <SidebarItem 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')} 
                icon={<ShieldAlert className="w-4 h-4 text-amber-500" />} 
                label="Reports" 
              />
            </div>
          </div>

          {/* Category 2: Live Content */}
          <div className="flex flex-col w-full">
            <button 
              onClick={() => setOpenCategories(prev => ({ ...prev, live_acts: !prev.live_acts }))}
              className="hidden sm:flex items-center justify-between w-full px-2 py-1.5 text-left text-zinc-500 hover:text-zinc-300 font-bold text-[10px] uppercase tracking-wider mb-1 font-sans"
            >
              <span>البث والنشاط</span>
              {openCategories.live_acts ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <span className="sm:hidden text-[9px] text-zinc-650 font-black text-center block mb-1 font-sans uppercase">بث</span>
            <div className={cn("flex flex-col gap-1.5", openCategories.live_acts ? "flex" : "hidden sm:hidden")}>
              <SidebarItem 
                active={activeTab === 'lives'} 
                onClick={() => setActiveTab('lives')} 
                icon={<Video className="w-4 h-4 text-blue-400" />} 
                label="Live Streams" 
              />
              <SidebarItem 
                active={activeTab === 'analytics'} 
                onClick={() => setActiveTab('analytics')} 
                icon={<BarChart2 className="w-4 h-4 text-emerald-400" />} 
                label="Analytics" 
              />
              <SidebarItem 
                active={activeTab === 'jwt'} 
                onClick={() => setActiveTab('jwt')} 
                icon={<Lock className="w-4 h-4 text-indigo-400" />} 
                label="JWT Management" 
              />
              <SidebarItem 
                active={activeTab === 'admin-security'} 
                onClick={() => setActiveTab('admin-security')} 
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} 
                label="Admin Security" 
              />
            </div>
          </div>

          {/* Category 3: Store & Commerce */}
          <div className="flex flex-col w-full">
            <button 
              onClick={() => setOpenCategories(prev => ({ ...prev, store_comm: !prev.store_comm }))}
              className="hidden sm:flex items-center justify-between w-full px-2 py-1.5 text-left text-zinc-500 hover:text-zinc-300 font-bold text-[10px] uppercase tracking-wider mb-1 font-sans"
            >
              <span>المتجر والمعاملات</span>
              {openCategories.store_comm ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <span className="sm:hidden text-[9px] text-zinc-650 font-black text-center block mb-1 font-sans uppercase">متجر</span>
            <div className={cn("flex flex-col gap-1.5", openCategories.store_comm ? "flex" : "hidden sm:hidden")}>
              <SidebarItem 
                active={activeTab === 'store'} 
                onClick={() => setActiveTab('store')} 
                icon={<ShoppingBag className="w-4 h-4" />} 
                label="Store Items" 
              />
              <SidebarItem 
                active={activeTab === 'sections'} 
                onClick={() => setActiveTab('sections')} 
                icon={<Lock className="w-4 h-4" />} 
                label="Sections" 
              />
              <SidebarItem 
                active={activeTab === 'toys'} 
                onClick={() => setActiveTab('toys')} 
                icon={<ShoppingBag className="w-4 h-4 text-[#FF9966]" />} 
                label="Adult Toys" 
              />
              <SidebarItem 
                active={activeTab === 'orders'} 
                onClick={() => setActiveTab('orders')} 
                icon={<TrendingUp className="w-4 h-4" />} 
                label="Orders" 
              />
              <SidebarItem 
                active={activeTab === 'transactions'} 
                onClick={() => setActiveTab('transactions')} 
                icon={<Coins className="w-4 h-4 text-emerald-400" />} 
                label="Transactions" 
              />
            </div>
          </div>


          {/* Category 4: Stripe & Settings */}
          <div className="flex flex-col w-full space-y-1">
            <button 
              onClick={() => setOpenCategories(prev => ({ ...prev, stripe_int: !prev.stripe_int }))}
              className="flex items-center justify-between w-full px-4 py-3 text-left text-muted font-bold text-[11px] uppercase tracking-wider hover:bg-card rounded-md font-sans transition"
            >
              <span>بوابات الدفع</span>
              {openCategories.stripe_int ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className={cn("flex flex-col gap-1 px-2", openCategories.stripe_int ? "flex" : "hidden")}>
              <SidebarItem 
                active={activeTab === 'stripe'} 
                onClick={() => setActiveTab('stripe')} 
                icon={<Globe className="w-5 h-5 text-primary" />} 
                label="Stripe Management" 
              />
              <SidebarItem 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
                icon={<Lock className="w-5 h-5" />} 
                label="Settings & Keys" 
              />
            </div>
          </div>

          {/* Category 5: Design & Tools */}
          <div className="flex flex-col w-full">
            <button 
              onClick={() => setOpenCategories(prev => ({ ...prev, des_tools: !prev.des_tools }))}
              className="hidden sm:flex items-center justify-between w-full px-2 py-1.5 text-left text-zinc-500 hover:text-zinc-300 font-bold text-[10px] uppercase tracking-wider mb-1 font-sans"
            >
              <span>Design & Tools</span>
              {openCategories.des_tools ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <div className={cn("flex flex-col gap-1.5", openCategories.des_tools ? "flex" : "hidden sm:hidden")}>
              <SidebarItem 
                active={activeTab === 'vault'} 
                onClick={() => setActiveTab('vault')} 
                icon={<Lock className="w-4 h-4 text-purple-400" />} 
                label="Vault" 
              />
              <SidebarItem 
                active={activeTab === 'mobile-template'} 
                onClick={() => setActiveTab('mobile-template')} 
                icon={<Smartphone className="w-4 h-4 text-emerald-400" />} 
                label="Mobile Template" 
              />
            </div>
          </div>

        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-zinc-900/20 overflow-hidden">
          {/* Toolbar */}
          {activeTab !== 'settings' && activeTab !== 'stripe' && (
            <div className="p-4 md:p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-12 pr-4 text-[10px] uppercase font-bold tracking-wider text-white focus:border-primary outline-none transition-all placeholder:text-zinc-650 placeholder:uppercase"
                />
              </div>
              <div className="flex gap-2">
                {activeTab === 'store' && (
                  <button 
                    onClick={() => setShowAddItem(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                )}
                {activeTab === 'toys' && (
                  <button 
                    onClick={() => setShowAddToy(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold/80 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Toy</span>
                  </button>
                )}
                {activeTab === 'sections' && (
                  <button 
                    onClick={() => setShowAddSection(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Sect</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table/Grid */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading {activeTab}...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'users' && (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredData.map((u: UserProfile & { id: string }) => (
                      <div key={u.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-4">
                          <img 
                            src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                            className="w-12 h-12 rounded-xl border border-zinc-800 flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h3 className="text-white text-[11px] font-bold uppercase tracking-tight truncate">{u.displayName}</h3>
                            <p className="text-zinc-500 text-[10px] truncate">{u.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap",
                                u.role === 'admin' ? "bg-primary/10 text-primary" : 
                                u.role === 'model' ? "bg-emerald-500/10 text-emerald-500" : 
                                u.role === 'client' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-400"
                              )}>
                                {u.role}
                              </span>
                              {u.isBanned && (
                                <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                                  BANNED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/50">
                          <div className="text-left md:text-right mr-4">
                            <p className="text-white font-bold flex items-center gap-1 justify-start md:justify-end">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {u.balance || 0}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Balance</p>
                          </div>
                          <button 
                            onClick={() => handleUserUpdate(u.id, { isBanned: !u.isBanned })}
                            className={cn(
                              "p-3 rounded-xl transition-all active:scale-90 flex-shrink-0",
                              u.isBanned ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            )}
                            title={u.isBanned ? "Unban User" : "Ban User"}
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-right">Change Role</p>
                            <select 
                              value={u.role}
                              onChange={(e) => {
                                const newRole = e.target.value as any;
                                if (newRole === 'admin' && !confirm("Are you sure you want to make this user an ADMIN? They will have full control over the platform.")) {
                                  return;
                                }
                                handleUserUpdate(u.id, { role: newRole });
                              }}
                              className="bg-zinc-900 border border-zinc-800 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-all hover:border-zinc-700"
                            >
                              <option value="user">User</option>
                              <option value="model">Model</option>
                              <option value="client">Client</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'model-applications' && (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredData.length === 0 ? (
                      <div className="text-center py-20 text-zinc-500">No pending applications</div>
                    ) : (
                      filteredData.map((app: any) => (
                        <div key={app.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white font-bold text-lg">{app.fullName} <span className="text-zinc-500 text-sm font-normal">({app.age} years old)</span></h3>
                              <p className="text-zinc-400 text-sm mt-1">User: {app.userDisplayName} ({app.userEmail})</p>
                            </div>
                            <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                              Pending
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800/50">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Social Links</p>
                              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{app.socialLinks}</p>
                            </div>
                            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800/50">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Content Description</p>
                              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{app.contentDescription}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800 justify-end">
                            <button 
                              onClick={() => handleRejectModel(app.id)}
                              className="px-6 py-2 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-xl font-bold transition-all"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleApproveModel(app.id, app.userId)}
                              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20"
                            >
                              Approve & Make Model
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'lives' && (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredData.map((l: LiveRoom) => (
                      <div key={l.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="relative w-full sm:w-32 md:w-20 aspect-video rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0">
                            <img src={l.thumbnailUrl || "https://picsum.photos/seed/live/200/112"} className="w-full h-full object-cover" />
                            {l.status === 'active' && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-[8px] font-black text-white rounded uppercase animate-pulse">
                                LIVE
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{l.title}</h3>
                            <p className="text-zinc-500 text-xs mt-1">Model: <span className="text-emerald-500 font-bold">{l.modelName}</span></p>
                            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mt-1">
                              {l.startedAt && new Date((l.startedAt as any)._seconds * 1000).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800/50">
                          <div className="text-left md:text-center">
                            <p className="text-white font-bold">{l.viewerCount || 0}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Viewers</p>
                          </div>
                          <div className="text-left md:text-center">
                            <p className="text-emerald-500 font-bold">{l.earnings || 0}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Earned</p>
                          </div>
                          {l.status === 'active' && (
                            <button 
                              onClick={() => handleTerminateLive(l.id!)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 whitespace-nowrap"
                            >
                              TERMINATE
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredData.map((r: Report) => (
                      <div key={r.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                              <ShieldAlert className="text-red-500 w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white font-bold">Report: <span className="text-red-500">{r.reason}</span></p>
                              <p className="text-zinc-500 text-xs">By: {r.reporterId} • On: {r.targetType} ({r.targetId})</p>
                            </div>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            r.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                            r.status === 'resolved' ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                          )}>
                            {r.status}
                          </div>
                        </div>
                        <p className="text-zinc-400 text-xs bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 not-italic">
                          "{r.description || 'No description provided'}"
                        </p>
                        {r.status === 'pending' && (
                          <div className="flex items-center gap-2 justify-end">
                            <button 
                              onClick={() => handleResolveReport(r.id!, 'dismissed')}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all"
                            >
                              Dismiss
                            </button>
                            <button 
                              onClick={() => handleResolveReport(r.id!, 'resolved')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'store' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((item: StoreItem) => (
                      <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-2xl">
                            {item.icon || '🎁'}
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{item.name}</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{item.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-white font-bold">{item.price}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDeleteStoreItem(item.id)}
                              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'sections' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredData.map((s: Section) => (
                      <div key={s.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                              <Lock className="text-yellow-500 w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold">{s.name}</h3>
                              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{s.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold flex items-center gap-1 justify-end">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {s.price}
                            </p>
                          </div>
                        </div>
                        <p className="text-zinc-500 text-xs line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-2 justify-end mt-2">
                          <button 
                            onClick={() => handleDeleteSection(s.id)}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'toys' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((toy: any) => (
                      <div key={toy.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-2xl">
                            {toy.image || '🎁'}
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{toy.name}</h3>
                            <p className="text-gold text-[10px] font-bold uppercase tracking-widest">Stock: {toy.stock}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1">
                            <span className="text-white font-bold">${toy.price}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDeleteToy(toy.id)}
                              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-1.5 bg-zinc-805 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden font-sans">
                    <table className="w-full text-left text-[10px] font-sans">
                      <thead className="bg-zinc-900 text-zinc-500 uppercase font-black tracking-widest border-b border-zinc-800">
                        <tr>
                          <th className="px-6 py-4">Order ID / Item ID</th>
                          <th className="px-6 py-4 font-normal">Customer Details</th>
                          <th className="px-6 py-4">Fulfillment Type</th>
                          <th className="px-6 py-4 text-emerald-400">Total Price</th>
                          <th className="px-6 py-4">Order Flow Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-300">
                        {filteredData.map((order: any) => (
                          <tr key={order.id} className="hover:bg-zinc-900/30 transition-all">
                            <td className="px-6 py-4 font-bold text-zinc-200 font-mono tracking-tight">{order.itemId}</td>
                            <td className="px-6 py-4 text-zinc-400">{order.userId}</td>
                            <td className="px-6 py-4 font-mono uppercase tracking-wider text-zinc-500">{order.type}</td>
                            <td className="px-6 py-4 font-black text-rose-400 font-mono">${order.amount}</td>
                            <td className="px-6 py-4">
                              <select 
                                value={order.status}
                                onChange={(e) => handleOrderUpdate(order.id, e.target.value)}
                                className={cn(
                                  "bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-black tracking-widest rounded-lg px-2 py-1 outline-none",
                                  order.status === 'pending' ? "text-yellow-500" : "text-emerald-500"
                                )}
                              >
                                <option value="pending">Pending</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'transactions' && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden font-sans">
                    <table className="w-full text-left text-[10px] font-sans">
                      <thead className="bg-zinc-900 text-zinc-500 uppercase font-black tracking-widest border-b border-zinc-800">
                        <tr>
                          <th className="px-6 py-4 font-normal">User Identifier</th>
                          <th className="px-6 py-4">Transaction Type</th>
                          <th className="px-6 py-4">Volume Amount</th>
                          <th className="px-6 py-4">Realtime Timezone Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-zinc-350">
                        {filteredData.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-zinc-900/30 transition-all">
                            <td className="px-6 py-4 font-mono font-bold text-zinc-350">{tx.userId}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[9px] font-black uppercase tracking-widest not-italic">
                                {tx.type}
                              </span>
                            </td>
                            <td className={cn(
                              "px-6 py-4 font-bold font-mono",
                              tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 font-mono">
                              {tx.createdAt && new Date((tx.createdAt as any)._seconds * 1000).toLocaleString('ar-EG')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel user={user} />
                )}

                {activeTab === 'admin-roles' && (
                  <div className="space-y-6 text-left">
                    {/* Cryptographic Guardian Banner */}
                    <div className="bg-gradient-to-r from-red-950/30 via-zinc-950 to-amber-950/10 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <ShieldAlert className="w-40 h-40 text-red-500" />
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-3xl">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black tracking-widest text-red-400 bg-red-500/10 border border-red-500/25 rounded-full uppercase font-mono">
                            CRYPTO SHIELD ACTIVE (بروتوكول حماية الروت)
                          </span>
                          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span>Admin Roles & Immutable Root Matrix</span>
                          </h2>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            لتحقيق أقصى درجات الأمان بموجب توجيهات المطور <strong className="text-rose-400">البروفيسور يحيى حسين</strong> والريس <strong className="text-rose-400">نور العرقجي</strong>: حسابات الروت المتمثلة في <strong className="text-rose-400">cardsnour6@gmail.com</strong> و <strong className="text-rose-400">khokha@admin.com</strong> محصنة كلياً ولا يمكن تعديل صلاحياتها برمجياً.
                          </p>
                        </div>
                        <div className="bg-zinc-900/80 border border-zinc-850 p-4 rounded-xl flex items-center gap-3">
                          <Lock className="w-8 h-8 text-amber-400 flex-shrink-0" />
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Master Key Protection</span>
                            <p className="text-xs font-mono font-bold text-white mt-0.5">keyinfo_live_********</p>
                            <p className="text-[9px] text-zinc-400 leading-tight mt-1 max-w-[200px]">
                              مفيش حاجة اسمها sk_ مباشر.. مفتاح المستر يقوم بتدوير وحماية السيرفر تلقائياً!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 md:col-span-1">
                        <h3 className="font-bold text-white text-lg border-b border-zinc-800 pb-2">Add New Operator</h3>
                        <div className="space-y-4">
                          <p className="text-zinc-500 text-xs">
                            Enter the registered user email address below to promote them instantly to system administrator.
                          </p>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">User Email Address</label>
                            <input 
                              type="email"
                              value={newAdminEmail}
                              onChange={(e) => {
                                setNewAdminEmail(e.target.value);
                                setAdminRolesError('');
                                setAdminRolesSuccess('');
                              }}
                              placeholder="e.g. khokha@admin.com"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          {adminRolesError && <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{adminRolesError}</p>}
                          {adminRolesSuccess && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded">{adminRolesSuccess}</p>}

                          <button
                            onClick={async () => {
                              if (!newAdminEmail) {
                                setAdminRolesError('Please enter a valid email.');
                                return;
                              }
                              const targetUser = data.find((u: any) => u.email?.toLowerCase() === newAdminEmail.toLowerCase());
                              if (!targetUser) {
                                setAdminRolesError('User account not found. To set an admin role, the user must first sign up once.');
                                return;
                              }
                              try {
                                await handleUserUpdate(targetUser.id, { role: 'admin' });
                                setNewAdminEmail('');
                                setAdminRolesSuccess(`Successfully assigned '${targetUser.displayName}' as Administrator!`);
                                fetchAdminData('admin-roles');
                              } catch (err) {
                                setAdminRolesError('An error occurred. User status could not be changed.');
                              }
                            }}
                            className="w-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold py-2 px-4 rounded-xl transition-all"
                          >
                            Grant Admin Status
                          </button>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 md:col-span-2">
                        <h3 className="font-bold text-white text-lg border-b border-zinc-800 pb-2 flex items-center justify-between">
                          <span>Active System Operators</span>
                          <span className="text-xs text-zinc-500 font-normal">Showing {data.filter((u: any) => u.role === 'admin').length} Operators</span>
                        </h3>

                        <div className="divide-y divide-zinc-900 space-y-4 pt-2">
                          {data.filter((u: any) => u.role === 'admin').length === 0 ? (
                            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest not-italic">No administrators found.</p>
                          ) : (
                            data.filter((u: any) => u.role === 'admin').map((adminUser: any) => {
                              const isRoot = adminUser.email === 'cardsnour6@gmail.com' || adminUser.email === 'khokha@admin.com';
                              return (
                                <div key={adminUser.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-zinc-900 last:border-0">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={adminUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.id}`} 
                                      className="w-10 h-10 rounded-lg border border-zinc-800"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-white font-bold text-sm">{adminUser.displayName || 'Administrator'}</h4>
                                        {isRoot ? (
                                          <span className="bg-rose-500 text-[9px] font-black tracking-widest text-white uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 text-center font-mono">
                                            ROOT SUPER ADMIN
                                          </span>
                                        ) : (
                                          <span className="bg-zinc-800 text-[9px] font-bold text-zinc-400 uppercase px-2 py-0.5 rounded-full">
                                            DELEGATED OPERATOR
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-zinc-500 font-mono">{adminUser.email}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-white text-xs font-bold leading-tight font-mono">Tokens: {adminUser.balance || 0}</p>
                                      <p className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider">Balance</p>
                                    </div>

                                    {isRoot ? (
                                      <div className="bg-zinc-900/60 text-zinc-500 border border-zinc-800 text-[10px] uppercase font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-mono">
                                        <span>SYSTEM PROTECTED</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          if (!confirm(`Are you sure you want to revoke admin credentials from '${adminUser.displayName}'?`)) return;
                                          try {
                                            await handleUserUpdate(adminUser.id, { role: 'user' });
                                            setAdminRolesSuccess(`Admin credentials revoked for '${adminUser.displayName}'.`);
                                            fetchAdminData('admin-roles');
                                          } catch (err) {
                                            setAdminRolesError('Failed to revoke role.');
                                          }
                                        }}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold py-1.5 px-3 rounded-xl transition-all"
                                      >
                                        Revoke Admin
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'stripe' && (
                  <StripeAdminPanel user={user} refreshList={fetchAdminData} data={data} />
                )}

                {activeTab === 'analytics' && (
                  <StreamAnalytics data={data} />
                )}

                {activeTab === 'jwt' && (
                  <JwtManagement />
                )}

                {activeTab === 'admin-security' && (
                  <AdminSecurityTab />
                )}

                {!loading && filteredData.length === 0 && activeTab !== 'settings' && activeTab !== 'admin-roles' && activeTab !== 'stripe' && (
                  <div className="flex flex-col items-center justify-center py-40 text-zinc-600 gap-4">
                    <Search className="w-12 h-12 opacity-20" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest not-italic">No {activeTab} found matching your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showAddItem && (
          <AddItemModal 
            onClose={() => setShowAddItem(false)} 
            onSuccess={() => {
              setShowAddItem(false);
              fetchAdminData('store');
            }} 
          />
        )}
        {showAddToy && (
          <AddToyModal 
            onClose={() => setShowAddToy(false)} 
            onSuccess={() => {
              setShowAddToy(false);
              fetchAdminData('toys');
            }} 
          />
        )}
        {showAddSection && (
          <AddSectionModal 
            onClose={() => setShowAddSection(false)} 
            onSuccess={() => {
              setShowAddSection(false);
              fetchAdminData('sections');
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKhokhaVoice && (
          <KhokhaVoice onClose={() => setShowKhokhaVoice(false)} />
        )}
      </AnimatePresence>

      {/* Floating Khokha AI Admin Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-[250] flex flex-col items-end gap-3 font-sans">
        <AnimatePresence>
          {showKhokhaChat && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-80 md:w-96 h-[500px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col border-rose-500/20"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-rose-900/40 to-amber-900/40 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 overflow-hidden relative flex-shrink-0">
                    <img 
                      src="https://picsum.photos/seed/khokha/200/200" 
                      alt="Khokha" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-950" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1">
                      <span>خوخة الذكية</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </h4>
                    <p className="text-[10px] text-zinc-400">عمدة الإدارة والمساعد الذاتي</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowKhokhaVoice(true)}
                    className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-400 transition-colors"
                    title="اتصال صوتي فوري"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowKhokhaChat(false)}
                    className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 custom-scrollbar text-right self-stretch" style={{ direction: 'rtl' }}>
                {khokhaMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed text-left ${
                        msg.sender === 'user' 
                          ? 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-br-none' 
                          : 'bg-gradient-to-br from-rose-950/40 to-zinc-900 text-rose-200 border border-rose-500/10 rounded-bl-none'
                      }`}
                      style={{ direction: 'ltr' }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {khokhaLoading && (
                  <div className="flex justify-end">
                    <div className="bg-zinc-900/60 text-zinc-500 rounded-2xl p-3 text-xs font-mono border border-zinc-800 animate-pulse">
                      خوخة بتكتب... 🍑
                    </div>
                  </div>
                )}
              </div>

              {/* Fast Tags */}
              <div className="px-3 py-2 border-t border-zinc-800 bg-black/40 flex flex-wrap gap-1.5 justify-end">
                <button
                  onClick={() => handleSendKhokhaMessage("منهو روت السيرفر؟")}
                  className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-full border border-zinc-800 transition-all font-sans"
                >
                  صلاحيات الروت 👑
                </button>
                <button
                  onClick={() => handleSendKhokhaMessage("قولي لي نكتة إدارية يا خوخة")}
                  className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-full border border-zinc-800 transition-all font-sans"
                >
                  نكتة إدارية 🤭
                </button>
                <button
                  onClick={() => handleSendKhokhaMessage("افحصي لي مفتاح keyinfo_live_ طال عمرك")}
                  className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-full border border-zinc-800 transition-all font-sans"
                >
                  فحص المفتاح 🔑
                </button>
              </div>

              {/* Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendKhokhaMessage(khokhaPrompt);
                }}
                className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex gap-2"
              >
                <input
                  type="text"
                  value={khokhaPrompt}
                  onChange={(e) => setKhokhaPrompt(e.target.value)}
                  placeholder="اسأل خوخة عن أي شي بالإدارة طال عمرك..."
                  className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500/40 text-right"
                  style={{ direction: 'rtl' }}
                />
                <button
                  type="submit"
                  disabled={khokhaLoading || !khokhaPrompt.trim()}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all active:scale-95"
                >
                  إرسال
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular floating Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowKhokhaChat(!showKhokhaChat)}
          className="bg-gradient-to-tr from-[#FF5E62] to-[#FF9966] p-4 rounded-full shadow-xl shadow-[#FF5E62]/20 text-white flex items-center justify-center gap-2 relative group border border-white/10"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="font-bold text-xs pr-1">اسأل خوخة</span>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF5E62] to-[#FF9966] blur-md opacity-35 group-hover:opacity-60 transition-opacity -z-10" />
        </motion.button>
      </div>
    </div>
  );
}

function AddItemModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'gift' as 'gift' | 'coins' | 'vip',
    price: 0,
    icon: '🎁',
    bonus: 0,
    adultFlag: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/store/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) onSuccess();
    } catch (err) {
      console.error("Add item failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">Add Store Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Item Name</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
              >
                <option value="gift">Gift</option>
                <option value="coins">Coins</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Price (Coins/$)</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Icon (Emoji)</label>
              <input 
                type="text"
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Bonus Coins</label>
              <input 
                type="number"
                value={formData.bonus}
                onChange={e => setFormData({ ...formData, bonus: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <input 
              type="checkbox"
              id="adultFlag"
              checked={formData.adultFlag}
              onChange={e => setFormData({ ...formData, adultFlag: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-rose-500 focus:ring-rose-500"
            />
            <label htmlFor="adultFlag" className="text-sm font-bold text-white">Adult Content (18+)</label>
          </div>
          <button 
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-black rounded-2xl transition-all active:scale-95 mt-4"
          >
            {loading ? "ADDING..." : "ADD ITEM"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddToyModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    image: '🎁'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/toys/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) onSuccess();
    } catch (err) {
      console.error("Add toy failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">Add Adult Toy</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Toy Name</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Price ($)</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Stock</label>
              <input 
                required
                type="number"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Description</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-gold resize-none"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full py-4 bg-gold hover:bg-gold/80 disabled:opacity-50 text-black font-black rounded-2xl transition-all active:scale-95 mt-4"
          >
            {loading ? "ADDING..." : "ADD TOY"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddSectionModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'public' as 'public' | 'vip' | 'secret',
    price: 0,
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/section/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) onSuccess();
    } catch (err) {
      console.error("Add section failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-white">Add Section</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Section Name</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
              >
                <option value="public">Public</option>
                <option value="vip">VIP</option>
                <option value="secret">Secret</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Unlock Price (Coins)</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Description</label>
            <textarea 
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 resize-none"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-black font-black rounded-2xl transition-all active:scale-95 mt-4"
          >
            {loading ? "ADDING..." : "ADD SECTION"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all whitespace-nowrap w-full not-italic",
        active 
          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
      )}
      title={label}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}
