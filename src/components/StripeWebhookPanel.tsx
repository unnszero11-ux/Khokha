import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RefreshCw, 
  Webhook, 
  CheckCircle, 
  HelpCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  User, 
  Mail, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

interface StripeWebhookPanelProps {
  user: any;
  refreshList: () => void;
  webhookData: any[];
}

export default function StripeWebhookPanel({ user, refreshList, webhookData }: StripeWebhookPanelProps) {
  const [simulating, setSimulating] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <span className="px-2 py-1 text-xs font-bold font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">processed</span>;
      case 'simulated':
        return <span className="px-2 py-1 text-xs font-bold font-mono rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">simulated</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold font-mono rounded bg-zinc-800 text-zinc-400">{status}</span>;
    }
  };

  const getSourceIcon = (source: string) => {
    if (source === 'admin_dashboard') {
      return <span className="px-2 py-0.5 text-[10px] uppercase font-bold font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">dashboard</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] uppercase font-bold font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-sans">stripe API</span>;
  };

  const triggerSimulation = async (type: string, amount: number, email: string) => {
    setSimulating(true);
    setSuccessMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/webhooks/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, amount, email })
      });
      if (res.ok) {
        setSuccessMsg(`تم إرسال الحدث المحاكي نجاحاً! نوعه: ${type}`);
        refreshList();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title block */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Webhook className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Stripe Secure Webhook Log Console (لوحة مراقبة الـ Webhooks)
            </h2>
          </div>
          <p className="text-zinc-400 text-sm max-w-2xl">
            هنا يتم تسجيل كافة إشعارات الدفع والخطط القادمة من بوابات Stripe بشكل آمن مع التحقق الدقيق والفرز. يمكنك محاكاة واختبار أي حدث للتأكد من ربط الحسابات وتحديث رصيد المستخدمين فورياً.
          </p>
        </div>
        <button
          onClick={refreshList}
          className="flex items-center gap-2 self-start md:self-center bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-2.5 px-4 rounded-xl border border-zinc-800 transition-all font-mono text-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث السجل</span>
        </button>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400 text-sm"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span className="font-bold">{successMsg}</span>
        </motion.div>
      )}

      {/* Simulator Block */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <Play className="w-5 h-5 text-[#FF9966]" />
          <span>Interactive SaaS Stripe Webhook Simulator (محاكي الأحداث الفوري)</span>
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed">
          انقر فوق أي زر محاكاة في الأسفل من أجل إطلاق طلب Webhook اصطناعي مشفر داخلياً يغذي السيرفر وقاعدة البيانات بفواتير افتراضية، للتأكد من نظام السابسكريبشن والمحاسبة:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <button
            disabled={simulating}
            onClick={() => triggerSimulation('payment_intent.succeeded', 49.99, 'user_premium@sales.com')}
            className="flex flex-col items-start p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-xl transition-all text-left active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">payment_intent.succeeded</span>
              <span className="text-xs font-bold text-white">$49.99</span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">دفع ناجح - باقة ذهبية</h4>
            <p className="text-xs text-zinc-500 mt-1">يضيف رصيد فوري للمستخدم ويفعل الباقات.</p>
          </button>

          <button
            disabled={simulating}
            onClick={() => triggerSimulation('charge.refunded', 15.00, 'customer_care@refund.com')}
            className="flex flex-col items-start p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition-all text-left active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">charge.refunded</span>
              <span className="text-xs font-bold text-white">$15.00</span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">عملية استرجاع الأموال</h4>
            <p className="text-xs text-zinc-500 mt-1">يعكس حالة الدفع في قاعدة بيانات المعاملات.</p>
          </button>

          <button
            disabled={simulating}
            onClick={() => triggerSimulation('customer.subscription.deleted', 0, 'expired_sub@pro.com')}
            className="flex flex-col items-start p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 rounded-xl transition-all text-left active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-mono">subscription.deleted</span>
              <span className="text-xs font-bold text-white">Expired</span>
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">إلغاء الاشتراك الدوري</h4>
            <p className="text-xs text-zinc-500 mt-1">يوقف امتيازات البرو للعميل تلقائياً لحمايتنا.</p>
          </button>
        </div>
      </div>

      {/* Webhooks Table List */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-400" />
            <span>Webhook Logs Event Stream ({webhookData.length} events logged)</span>
          </h3>
          <span className="text-xs bg-zinc-900 text-zinc-500 px-3 py-1 rounded-full font-mono font-bold">LIVE FEED</span>
        </div>

        {webhookData.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 space-y-2">
            <HelpCircle className="w-12 h-12 mx-auto opacity-30 animate-pulse" />
            <p className="text-sm font-bold">لا توجد سجلات Webhooks حالية بعد في قاعدة البيانات الكبيرة.</p>
            <p className="text-xs text-zinc-600">اضغط على أحد أزرار المحاكاة في الأعلى لتوليد حدث جديد فوراً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-[10px] font-black tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="px-6 py-4">Status & Source</th>
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Event ID / Identifier</th>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Logged Amount</th>
                  <th className="px-6 py-4">Logged Time</th>
                  <th className="px-6 py-4 text-right">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {webhookData.map((evt) => {
                  const isExpanded = selectedEventId === evt.id;
                  const dateStr = evt.createdAt?.seconds 
                    ? new Date(evt.createdAt.seconds * 1000).toLocaleString('ar-EG')
                    : 'جديد الآن';
                  return (
                    <React.Fragment key={evt.id}>
                      <tr className="hover:bg-zinc-900/20 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(evt.status)}
                            {getSourceIcon(evt.source)}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-white font-mono text-xs">
                          {evt.type}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-500 text-xs">
                          {evt.id}
                        </td>
                        <td className="px-6 py-4 text-zinc-300 font-sans text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{evt.customerEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {evt.amount > 0 ? (
                            <span className="font-bold text-emerald-400 font-mono text-xs flex items-center gap-0.5">
                              <DollarSign className="w-3 h-3" />
                              {evt.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-mono text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-600" />
                            <span>{dateStr}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedEventId(isExpanded ? null : evt.id)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs py-1.5 px-3 rounded-lg border border-zinc-800 transition-all font-mono inline-flex items-center gap-1"
                          >
                            <span>Payload</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-zinc-950/80 border-t border-b border-zinc-900">
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Raw Stripe Event JSON</p>
                              <pre className="p-4 bg-black/60 rounded-xl text-xs text-zinc-300 leading-relaxed font-mono overflow-x-auto max-w-4xl max-h-[250px] custom-scrollbar border border-zinc-800">
                                {JSON.stringify(evt.payload || evt, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
