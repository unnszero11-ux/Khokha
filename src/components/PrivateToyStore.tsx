import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  X, 
  Eye, 
  ShoppingCart, 
  Check, 
  Truck, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  Globe, 
  Coins, 
  Star, 
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Product {
  id: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  specs: { en: string; ar: string };
  care: { en: string; ar: string };
  price: number; // in Coins
  category: 'vibrators' | 'massagers' | 'accessories' | 'all';
  badge: { en: string; ar: string };
  rating: number;
  emoji: string;
  images: string[];
}

const STATIC_PRODUCTS: Product[] = [
  {
    id: "toy-1",
    title: { en: "Silky Rechargeable Vibrator", ar: "الهزاز الناعم القابل لإعادة الشحن" },
    description: { 
      en: "Premium medical silicone massager with 10 powerful frequency modes and whisper-quiet operation. 100% waterproof design with USB-C premium charging.",
      ar: "مدلك سيليكون طبي فاخر مع 10 أنماط اهتزاز قوية وبصوت فائق الهدوء. تصميم مقاوم للماء بنسبة 100% مع شحن سريع بمنفذ USB-C."
    },
    specs: {
      en: "Body-safe medical silicone, 10 deep patterns, ultra-quiet (<39dB), fully waterproof, magnetic USB-C charging.",
      ar: "سيليكون طبي آمن بالكامل للجسم، 10 أنماط تشغيل، فائق الهدوء (<39 ديسيبل)، مقاوم للماء تماماً، شحن مغناطيسي USB-C."
    },
    care: {
      en: "Wash gently with lukewarm water and antibacterial mild soap. Lay flat to dry. Store inside our neutral travel pouch.",
      ar: "اغسله بلطف بماء فاتر وصابون خفيف مضاد للبكتيريا. اتركه يجف طبيعياً. يحفظ داخل الحقيبة الخاصة المحايدة."
    },
    price: 150,
    category: "vibrators",
    badge: { en: "Top Pick", ar: "الأكثر مبيعاً" },
    rating: 4.8,
    emoji: "🔮",
    images: ["🔮", "💜", "✨"]
  },
  {
    id: "toy-2",
    title: { en: "Compact Massage Wand", ar: "جهاز تدليك ومساج الجسم المدمج" },
    description: {
      en: "Ergonomically contoured wand massager designed for deep relaxation and pinpoint relief. Cordless format makes it perfect for travel.",
      ar: "جهاز مساج مدمج للعضلات والمناطق الحساسة مصمم لمنح راحة عميقة وتخفيف التوتر. حجم مثالي وعمر بطارية مذهل للسفر والترحال."
    },
    specs: {
      en: "Flex head silicone neck, multi-speed selector, dual-motor pulsing technology, 3-hour continuous run battery.",
      ar: "عنق سيليكون مرن، تحكم كامل بالسرعات، تقنية نبض ثنائية المحرك، بطارية تدوم حتى 3 ساعات متواصلة."
    },
    care: {
      en: "Splashes resistant. Wipe clean with a damp sanitizing cloth. Ensure to keep charger dry.",
      ar: "مقاوم للرذاذ. امسحه بقطعة قماش مبللة معقمة. احرص على بقاء منفذ الشحن جافاً بالكامل."
    },
    price: 120,
    category: "massagers",
    badge: { en: "New", ar: "جديدنا" },
    rating: 4.7,
    emoji: "🔥",
    images: ["🔥", "⚡", "💆‍♀️"]
  },
  {
    id: "toy-3",
    title: { en: "Smell-Proof Charcoal Utility Bag", ar: "حقيبة حفظ سرية ومقاومة للروائح" },
    description: {
      en: "Fully neutral and lockable storage organizer pouch lined with activated carbon layers. Zero exterior tags or words for 100% absolute privacy.",
      ar: "حقيبة تخزين وتنظيم مبطنة بالكامل بطبقات من ألياف الكربون النشط ومزودة بقفل رقمي. خالية تماماً من أي علامات خارجية لخصوصية مطلقة لرحلاتك."
    },
    specs: {
      en: "Dual combination zipper lock, smell-proof tech, neutral colorways, lightweight build, customizable compartments.",
      ar: "قفل سحاب مزدوج برقم سري، تكنولوجيا عزل الروائح، تصميم خارجي غامض ومحايد، وزن خفيف، أقسام قابلة للتعديل داخلياً."
    },
    care: {
      en: "Spot clean outer fabric with soap and dry cloth. Do not submerge to protect active carbon layer.",
      ar: "نظف البقع الخارجية بقطعة قماش مبللة وصابون. لا تغمرها بالماء لحفظ ألياف الكربون النشطة فعالة."
    },
    price: 80,
    category: "accessories",
    badge: { en: "Secure", ar: "أمان تام" },
    rating: 4.6,
    emoji: "👜",
    images: ["👜", "🔒", "💼"]
  },
  {
    id: "toy-4",
    title: { en: "Waterproof Whisper Bullet Set", ar: "طقم رصاصة التدليك الدائرية الصامتة" },
    description: {
      en: "A duo of graduated vibrating bullets enclosed in a velvet pouch. Satin-soft finishes deliver deep tactile micro-pulses instantly.",
      ar: "كبسولتا رصاصة اهتزاز متدرجة الحجم في حقيبة مخملية فاخرة. ملمس ناعم كالحرير يقدم نبضات عميقة تحفز الرفاهية والاسترخاء الفوري."
    },
    specs: {
      en: "Satin ABS, 7 speed presets, water-tight seals, includes button batteries & extras.",
      ar: "طلاء ملمس الساتين، 7 برامج ذبذبة، عازل حراري ومائي ممتاز، مزود ببطاريات مدمجة وبطاريات احتياطية."
    },
    care: {
      en: "Remove internal power battery completely when storing. Clean bullet shell before and after.",
      ar: "أزل البطاريات بالكامل عند التخزين لفترات طويلة. نظف الهيكل الخارجي جيداً قبل وبعد التشغيل."
    },
    price: 95,
    category: "vibrators",
    badge: { en: "Sleek", ar: "تصميم متميز" },
    rating: 4.5,
    emoji: "🍬",
    images: ["🍬", "🌸", "💍"]
  },
  {
    id: "toy-5",
    title: { en: "Ergonomic Performance Ring Set", ar: "مجموعة الحلقات المرنة والداعمة للجسم" },
    description: {
      en: "Flexible premium silicone core rings designed to provide incredible support, optimal comfort, and physical endurance reinforcement.",
      ar: "أطقم حلقات لينة مصنوعة من السيليكون الطبي المرن لتقديم دعم رائع، ومستويات راحة مثالية، مع تعزيز التحمل والصلابة البدنية."
    },
    specs: {
      en: "Fully elastic stretchy design, medical elastomer silicone, includes three size variations (S/M/L) in neutral dark gray.",
      ar: "تصميم مرن فائق التمدد، سيليكون مرن طبي الجسم، يشمل 3 مقاسات متدرجة (صغير/وسط/كبير) بلون رمادي غامض."
    },
    care: {
      en: "Rinse with lukewarm running water. Gently towel-dry and apply organic dust cover.",
      ar: "اشطفه بماء فاتر جارٍ. جففه بالمنشفة برفق ثم ضعه في الغطاء القماشي الحامي."
    },
    price: 50,
    category: "accessories",
    badge: { en: "Best Value", ar: "الأفضل قيمة" },
    rating: 4.4,
    emoji: "💍",
    images: ["💍", "🩶", "✨"]
  }
];

export const PrivateToyStoreModal = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Cart state
  const [cart, setCart] = useState<{ product: Product; qty: number; selectedOption: string }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [discreetEnabled, setDiscreetEnabled] = useState(true);

  // Selected product for Detailed modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState('Standard Option / الخيار القياسي');
  const [qty, setQty] = useState(1);
  const [activeThumbIdx, setActiveThumbIdx] = useState(0);

  // Animation / alert
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const t = {
    title: lang === 'ar' ? 'متجر خوخة للخصوصية والصحة' : 'Khokha Discrete Wellness Store',
    tagline: lang === 'ar' ? 'تسوق أرقى منتجات الرفاهية والمدلكات بخصوصية تامة، شحن سريع وعبوة كرتونية محايدة 100%' : 'Explore high-end physical wellness with zero labels. Packed & shipped in fully anonymous container boxes.',
    searchPlaceholder: lang === 'ar' ? 'ابحث عن اسم المدلك، الفئة، أو مادة الصنع...' : 'Search clinical models, wellness options...',
    cartTitle: lang === 'ar' ? 'سلة المشتريات والطلبات' : 'Discreet Direct Cart',
    cartEmpty: lang === 'ar' ? 'سلتك فارغة حالياً' : 'Your anonymous cart is empty',
    addToCart: lang === 'ar' ? 'أضف للسلة' : 'Add to Cart',
    buyNow: lang === 'ar' ? 'اشترِ الآن' : 'Buy Now',
    checkout: lang === 'ar' ? 'اتمام الدفع الآمن للطلب' : 'Place Secure Checkout Order',
    coinsBalance: lang === 'ar' ? 'رصيد كوينز الحالي' : 'Current Gold Coins Balance',
    total: lang === 'ar' ? 'المجموع الإجمالي للطلب' : 'Total Order Sum',
    discreetShipLabel: lang === 'ar' ? 'تفعيل التغليف السري والحيادي (نشط)' : 'Full Neutral Shipping Wrapping Enabled',
    discreetDesc: lang === 'ar' ? 'سيتم طباعة بوليصة شحن عادية، باسم محايد بالكامل (Khokha Warehousing) وصندوق كرتوني بني سادة خالٍ من أي كتابة أو تلميح.' : 'Packages travel with plain white labels sender (Khokha Logistics LLC) in blind double-corrugated envelopes.',
    discreetBilling: lang === 'ar' ? 'فوترة مشفرة غير مسجلة' : 'Confidential Payment Statement secure',
    quickView: lang === 'ar' ? 'تفاصيل سريعة' : 'Quick View',
    verified18: lang === 'ar' ? 'محتوى مخصص للبالغين 18+' : 'Verified Adult Content 18+',
    optionsLabel: lang === 'ar' ? 'اختر اللون الحجم:' : 'Select color / parameters:',
    qtyLabel: lang === 'ar' ? 'الكمية المطلوبة:' : 'Quantity to purchase:',
    materialRef: lang === 'ar' ? 'إرشادات الاستخدام والنظافة:' : 'Wellness care & cleaning tips:',
    stars: lang === 'ar' ? 'تقييم العملاء الموثق' : 'Verified customer feedback',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
    freeDiscreetShip: lang === 'ar' ? 'شحن فدرالي سري مجاني' : 'Free federal ground transit included',
    addedToCartAlert: lang === 'ar' ? 'تم إضافة المنتج إلى سلتك بنجاح!' : 'Item successfully staged in checkout cart',
    purchasedSuccess: lang === 'ar' ? 'تم الشراء وخصم الرصيد بنجاح! يسعدنا توصيل طلبك السري للغاية.' : 'Order filed successfully! The warehouse team is prepping your parcel right now.',
    insufficientCoins: lang === 'ar' ? 'عذراً، رصيدك من الكوينز غير كافٍ لشراء هذه المنتجات!' : 'Insufficient wallet coins! Go to wallet panel to recharge.',
    favoritesText: lang === 'ar' ? 'المفضلة الخاصة بك' : 'Your saved items'
  };

  const handleFavoriteToggle = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fId => fId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  // Filter products
  const filteredProducts = STATIC_PRODUCTS.filter(p => {
    const titleMatch = lang === 'ar' 
      ? p.title.ar.toLowerCase().includes(searchQuery.toLowerCase()) 
      : p.title.en.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatch = p.description.en.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       p.description.ar.toLowerCase().includes(searchQuery.toLowerCase());
    
    const categoryMatch = activeCategory === 'all' || p.category === activeCategory;
    return (titleMatch || queryMatch) && categoryMatch;
  });

  const addToCartAction = (product: Product, quantity = 1, optionString = 'Deep Midnight Gray / رمادي الليل العميق') => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id && item.selectedOption === optionString);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += quantity;
      setCart(updated);
    } else {
      setCart([...cart, { product, qty: quantity, selectedOption: optionString }]);
    }
    showToast(`${lang === 'ar' ? 'أضيف للسلة:' : 'Staged in checkout:'} ${lang === 'ar' ? product.title.ar : product.title.en}`);
  };

  const removeFromCart = (pId: string, opt: string) => {
    setCart(cart.filter(item => !(item.product.id === pId && item.selectedOption === opt)));
  };

  const updateCartQty = (pId: string, opt: string, delta: number) => {
    const idx = cart.findIndex(item => item.product.id === pId && item.selectedOption === opt);
    if (idx === -1) return;
    const updated = [...cart];
    updated[idx].qty += delta;
    if (updated[idx].qty <= 0) {
      updated.splice(idx, 1);
    }
    setCart(updated);
  };

  const totalCartCost = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  // checkout trigger
  const handleCheckout = async () => {
    if (!user) {
      showToast(lang === 'ar' ? 'الرجاء تسجيل الدخول أولاً!' : 'Please sign in to order!', 'error');
      return;
    }
    if (cart.length === 0) return;
    if ((profile?.balance || 0) < totalCartCost) {
      showToast(t.insufficientCoins, 'error');
      return;
    }

    setCheckingOut(true);
    try {
      // Mock calling the toys API for each item inside secure transaction loop
      for (const cartItem of cart) {
        await fetch('/api/toys/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, toyId: cartItem.product.id })
        });
      }
      
      // Clear cart
      setCart([]);
      setCartOpen(false);
      showToast(t.purchasedSuccess, 'success');
      
      // Dispatch custom event to trigger coin balance reload in App.tsx
      window.dispatchEvent(new CustomEvent('update-user-profile'));
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'فشلت عملية الدفع!' : 'Payment transaction failed!', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setQty(1);
    setSelectedOption(lang === 'ar' ? 'اللون الوردي المرجاني الفاخر / Soft Coral' : 'Soft Coral Elegant Glow / وردي مرجاني');
    setActiveThumbIdx(0);
  };

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md overflow-x-hidden overflow-y-auto"
      style={{ fontFamily: lang === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif', direction: lang === 'ar' ? 'rtl' : 'ltr' }}
    >
      <div className="relative w-full max-w-6xl min-h-screen md:min-h-0 bg-gradient-to-b from-zinc-950 to-zinc-90 w-full md:rounded-[2.5rem] border-0 md:border border-zinc-800/80 shadow-2xl flex flex-col overflow-hidden">
        
        {/* TOP GLOW gradient */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#6A1B9A]/15 via-transparent to-transparent pointer-events-none" />

        {/* Global Toast Alert */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 16, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 max-w-md w-11/12 text-center text-sm font-bold border ${
                alertMsg.type === 'error' 
                  ? 'bg-rose-950/90 text-rose-200 border-rose-500/30' 
                  : 'bg-indigo-950/90 text-emerald-200 border-emerald-500/30'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="flex-1">{alertMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header toolbar */}
        <div className="p-6 md:p-8 border-b border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#6A1B9A]/20 border border-[#6A1B9A]/40 rounded-2xl flex items-center justify-center shadow-lg shadow-[#6A1B9A]/5">
              <ShoppingBag className="text-[#FF6F61] w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-purple-100 to-[#FF6F61] tracking-tight">{t.title}</h2>
                <span className="text-[9px] bg-sky-950 text-sky-400 font-extrabold px-1.5 py-0.5 rounded border border-sky-800">
                  {t.verified18}
                </span>
              </div>
              <p className="text-zinc-500 text-xs md:text-sm mt-0.5 leading-relaxed font-semibold">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {/* Lang Toggle */}
            <button 
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-xl transition-all font-black text-xs text-zinc-300 uppercase tracking-wider cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#FF6F61]" />
              <span>{lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
            </button>

            {/* Floating Coins representation */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-xl">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-400 font-black text-xs md:text-sm">{profile?.balance || 0} 🪙</span>
            </div>

            {/* Shopping Cart button with total */}
            <button 
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 hover:bg-[#6A1B9A]/10 text-white rounded-xl transition-all cursor-pointer group"
            >
              <ShoppingCart className="w-5 h-5 text-zinc-300 group-hover:text-violet-400" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#FF6F61] to-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950 animate-bounce">
                  {cart.reduce((s, it) => s + it.qty, 0)}
                </span>
              )}
            </button>

            {/* CLOSE CORE MODAL */}
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Body grid & filter bars */}
        <div className="flex-1 overflow-y-auto max-h-[75vh] md:max-h-[68vh] p-6 md:p-8 space-y-6 custom-scrollbar">
          
          {/* Top Banner details about discretion */}
          <div className="relative bg-gradient-to-r from-[#6A1B9A]/10 via-zinc-900/50 to-[#FF6F61]/5 border border-zinc-800/60 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6F61]/5 rounded-full blur-3xl" />
            <div className="flex items-start gap-3.5 max-w-2xl leading-relaxed z-10">
              <div className="w-10 h-10 rounded-full bg-[#FF6F61]/10 border border-[#FF6F61]/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-[#FF6F61]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold flex items-center gap-2">
                  <span>{lang === 'ar' ? 'سياسة الشحن الحيادي والتغليف المغلق' : 'Neutral Outer Corrugated Wrapping Policy'}</span>
                </p>
                <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">{t.discreetDesc}</p>
              </div>
            </div>

            <button 
              onClick={() => setDiscreetEnabled(!discreetEnabled)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 border transition-all cursor-pointer ${
                discreetEnabled 
                  ? 'bg-[#FF6F61]/10 hover:bg-[#FF6F61]/20 border-[#FF6F61]/35 text-[#FF6F61]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{t.discreetShipLabel}</span>
            </button>
          </div>

          {/* Search bar & Categories filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search engine input */}
            <div className="relative w-full md:max-w-md">
              <Search className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500`} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl ${lang === 'ar' ? 'pr-10' : 'pl-10'} py-3 text-sm text-zinc-100 outline-none focus:border-[#6A1B9A] focus:ring-1 focus:ring-[#6A1B9A] transition-all`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white`}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter chips from User HTML Design */}
            <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: { en: 'All Items', ar: 'كل المنتجات' } },
                { id: 'vibrators', label: { en: 'Vibrators', ar: 'ألعاب هزازة' } },
                { id: 'massagers', label: { en: 'Massagers', ar: 'أجهزة مساج' } },
                { id: 'accessories', label: { en: 'Accessories', ar: 'حقائب وملحقات' } }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-heavy transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.id 
                    ? 'bg-gradient-to-r from-[#6A1B9A] to-[#8E24AA] text-white border border-[#6A1B9A]/50 shadow-md shadow-[#6A1B9A]/10' 
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {lang === 'ar' ? cat.label.ar : cat.label.en}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/30 border border-dashed border-zinc-800/80 rounded-[2rem]">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">🔮</div>
              <p className="text-zinc-400 font-bold text-sm">{lang === 'ar' ? 'عفواً، لا توجد نتائج مطابقة لبحثك في الخصوصية.' : 'No items matched your privacy filter criteria.'}</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="mt-4 text-xs text-[#FF6F61] underline font-bold hover:text-rose-400">
                {lang === 'ar' ? 'عرض كافة منتجات المتجر' : 'Show all wellness items'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => {
                const isFav = favorites.includes(p.id);
                return (
                  <motion.div 
                    key={p.id} 
                    className="relative bg-zinc-900/50 border border-zinc-800/80 rounded-[2rem] overflow-hidden flex flex-col group hover:border-[#6A1B9A]/60 hover:shadow-xl hover:shadow-[#6A1B9A]/5 transition-all duration-300"
                    layout
                  >
                    {/* Media Top Container */}
                    <div className="relative aspect-[4/3] bg-zinc-950/80 flex items-center justify-center overflow-hidden border-b border-zinc-900 select-none">
                      {/* Interactive glow inside card */}
                      <div className="absolute inset-0 bg-radial-gradient from-[#6A1B9A]/5 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Product Massive visual expression instead of raw placeholders */}
                      <span className="text-6xl filter drop-shadow-xl transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">
                        {p.emoji || "🎁"}
                      </span>

                      {/* Floating Badges */}
                      <span className="absolute top-4 left-4 bg-gradient-to-r from-[#6A1B9A] to-[#FF6F61] text-white font-heavy text-[10px] px-2.5 py-1 rounded-xl shadow-lg border border-white/5 uppercase tracking-wide">
                        {lang === 'ar' ? p.badge.ar : p.badge.en}
                      </span>

                      {/* Love item bookmark */}
                      <button 
                        onClick={() => handleFavoriteToggle(p.id)}
                        className={`absolute top-4 right-4 p-2.5 rounded-full border transition-all cursor-pointer ${
                          isFav 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-heavy text-base group-hover:text-[#FF6F61] transition-colors">
                          {lang === 'ar' ? p.title.ar : p.title.en}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 px-1.5 py-0.5 rounded-lg">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          <span>{p.rating}</span>
                        </div>
                      </div>

                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                        {lang === 'ar' ? p.description.ar : p.description.en}
                      </p>

                      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span>{lang === 'ar' ? 'جاهز للتغليف السري في طرد غامض' : 'Wrapped inside sterile box envelope'}</span>
                      </div>

                      {/* Action trigger box */}
                      <div className="flex items-center justify-between gap-4 mt-auto pt-4 border-t border-zinc-900/60 font-semibold select-none">
                        <div className="flex flex-col">
                          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{lang === 'ar' ? 'السعر كوينز' : 'Price / Coins'}</span>
                          <span className="text-yellow-400 font-extrabold text-base md:text-lg flex items-center gap-1">
                            <span>{p.price}</span>
                            <span className="text-xs">🪙</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openQuickView(p)}
                            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title={t.quickView}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => addToCartAction(p, 1)}
                            className="px-4 py-2.5 bg-gradient-to-r from-[#6A1B9A] to-[#8E24AA] hover:from-[#8E24AA] hover:to-[#6A1B9A] text-white text-xs font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#6A1B9A]/5 cursor-pointer"
                          >
                            {t.addToCart}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

        {/* Floating Custom Drawer Cart */}
        <AnimatePresence>
          {cartOpen && (
            <div className="absolute inset-0 z-50 flex justify-end" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
              {/* Back backdrop wrapper */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCartOpen(false)}
                className="absolute inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
              />
              {/* Cart Drawer Panel */}
              <motion.div 
                initial={{ x: lang === 'ar' ? -350 : 350, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: lang === 'ar' ? -350 : 350, opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 200 }}
                className="relative w-full max-w-sm h-full bg-zinc-950 border-r md:border-l border-zinc-800 shadow-2xl flex flex-col z-10"
              >
                {/* Drawer header */}
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heavy text-white text-base">{t.cartTitle}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{cart.length} {lang === 'ar' ? 'منتج فريد' : 'unique items staged'}</p>
                    </div>
                  </div>
                  <button onClick={() => setCartOpen(false)} className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cart list content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-2/3 text-center space-y-3">
                      <div className="w-12 h-12 bg-zinc-900 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 text-lg">🧳</div>
                      <p className="text-zinc-500 text-xs font-bold">{t.cartEmpty}</p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={`${item.product.id}-${index}`} className="p-4 bg-zinc-900/60 border border-zinc-900 rounded-2xl flex gap-3 group relative">
                        <div className="w-12 h-12 bg-black rounded-xl border border-zinc-800 flex items-center justify-center text-2xl shrink-0">
                          {item.product.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-heavy text-xs truncate">
                            {lang === 'ar' ? item.product.title.ar : item.product.title.en}
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-bold truncate mt-1">
                            {item.selectedOption}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-yellow-400 font-extrabold text-xs">
                              {item.product.price * item.qty} 🪙
                            </span>
                            
                            {/* Quantity buttons */}
                            <div className="flex items-center gap-1.5 bg-black/40 border border-zinc-800 rounded-lg p-0.5 select-none font-heavy">
                              <button 
                                onClick={() => updateCartQty(item.product.id, item.selectedOption, -1)}
                                className="w-5 h-5 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[11px] text-zinc-200 px-1">{item.qty}</span>
                              <button 
                                onClick={() => updateCartQty(item.product.id, item.selectedOption, 1)}
                                className="w-5 h-5 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove item trigger */}
                        <button 
                          onClick={() => removeFromCart(item.product.id, item.selectedOption)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Drawer footer details */}
                {cart.length > 0 && (
                  <div className="p-6 border-t border-zinc-900 bg-zinc-950/90 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                        <span>{lang === 'ar' ? 'رسوم الشحن والخدمات' : 'Service & Discrete Courier Charge'}</span>
                        <span className="text-emerald-500 uppercase">{lang === 'ar' ? 'مجاني 100%' : '100% Free'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-heavy text-white">{t.total}</span>
                        <span className="text-yellow-400 font-black text-lg flex items-center gap-1">
                          <span>{totalCartCost}</span>
                          <span className="text-xs">🪙</span>
                        </span>
                      </div>
                      
                      {/* Check balance warning wrapper */}
                      {(profile?.balance || 0) < totalCartCost && (
                        <div className="bg-rose-500/5 text-rose-400 border border-rose-500/10 p-3 rounded-xl flex gap-2 items-start text-[11px] font-bold">
                          <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <span>
                            {lang === 'ar' 
                              ? `رصيدك غير كافٍ. تحتاج إلى ${totalCartCost - (profile?.balance || 0)} كوينز إضافية لإتمام العملية.`
                              : `Insufficient funds. You need an additional ${totalCartCost - (profile?.balance || 0)} coins to checkout.`}
                          </span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={checkingOut || (profile?.balance || 0) < totalCartCost}
                      className="w-full bg-[#FF6F61] hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-[#FF6F61] disabled:scale-100 text-white py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-rose-500/5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {checkingOut ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{t.checkout}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Core Product Quick-view Modal details */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs overflow-y-auto" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="absolute inset-0 cursor-pointer"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-[#0f0f12] border border-zinc-800 rounded-[2.5rem] shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                {/* Gallery Left Component */}
                <div className="space-y-4">
                  <div className="aspect-[4/3] bg-zinc-950 border border-zinc-900 rounded-[2rem] flex items-center justify-center text-8xl shadow-inner relative overflow-hidden select-none">
                    <div className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur text-zinc-400 font-bold px-2 py-1 rounded text-xs select-none">
                      {lang === 'ar' ? `لقطة ${activeThumbIdx + 1}` : `View ${activeThumbIdx + 1}`}
                    </div>
                    {selectedProduct.images[activeThumbIdx] || "🔮"}
                  </div>

                  {/* Thumbs list */}
                  <div className="flex gap-2">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveThumbIdx(idx)}
                        className={`w-14 h-14 rounded-xl border flex items-center justify-center text-xl cursor-pointer transition-all ${
                          activeThumbIdx === idx 
                            ? 'border-[#FF6F61] bg-[#FF6F61]/5 scale-105' 
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                      >
                        {img}
                      </button>
                    ))}
                  </div>

                  {/* Certified safe items badge details */}
                  <div className="p-4 bg-violet-950/20 border border-violet-500/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-zinc-400 font-semibold shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-white font-heavy">{lang === 'ar' ? 'فحص جودة ومعايير الرفاهية المعتمدة' : 'Verified Body-Safe Clinical Standards'}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">{lang === 'ar' ? 'مختبر سريرياً ومعتمد كسيليكون فائق النعومة لا يحتوي على الفثالات.' : 'Clinically validated non-porous core medical grade silicone. Hypoallergenic.'}</p>
                    </div>
                  </div>
                </div>

                {/* Details Section Right */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/50 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {lang === 'ar' ? selectedProduct.badge.ar : selectedProduct.badge.en}
                      </span>
                      <h3 className="text-xl md:text-2xl font-black text-white mt-2.5 tracking-tight">
                        {lang === 'ar' ? selectedProduct.title.ar : selectedProduct.title.en}
                      </h3>
                    </div>

                    <button 
                      onClick={() => setSelectedProduct(null)} 
                      className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-500 select-none">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-zinc-200 mt-0.5">{selectedProduct.rating}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="mt-0.5">{t.stars}</span>
                  </div>

                  <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-semibold">
                    {lang === 'ar' ? selectedProduct.description.ar : selectedProduct.description.en}
                  </p>

                  <div className="border-t border-b border-zinc-900 py-3.5 my-1 text-xs space-y-2.5 font-semibold select-all">
                    <p className="text-zinc-400"><strong className="text-zinc-200">{lang === 'ar' ? 'المواصفات الفنية:' : 'Tech Specifications:'}</strong> {lang === 'ar' ? selectedProduct.specs.ar : selectedProduct.specs.en}</p>
                    <p className="text-zinc-400"><strong className="text-zinc-200">{t.materialRef}</strong> {lang === 'ar' ? selectedProduct.care.ar : selectedProduct.care.en}</p>
                  </div>

                  {/* Core Options selection */}
                  <div>
                    <label className="block text-zinc-400 text-xs uppercase font-extrabold tracking-wider mb-2">{t.optionsLabel}</label>
                    <select 
                      value={selectedOption}
                      onChange={e => setSelectedOption(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs md:text-sm text-zinc-200 focus:border-[#6A1B9A] outline-none cursor-pointer"
                    >
                      <option value="Lavender Purple / بنفسجي اللافندر">{lang === 'ar' ? 'بنفسجي اللافندر الفاخر / Deep Lavender' : 'Lavender Purple Premium'}</option>
                      <option value="Coral Pink / روز مرجاني متوهج">{lang === 'ar' ? 'روز مرجاني متوهج / Satin Coral' : 'Satin Glowing Coral'}</option>
                      <option value="Midnight Charcoal / رمادي الليل الغامض">{lang === 'ar' ? 'رمادي الليل الغامض / Obsidian Dark' : 'Obsidian Mystic Charcoal'}</option>
                    </select>
                  </div>

                  {/* Qty count */}
                  <div>
                    <label className="block text-zinc-400 text-xs uppercase font-extrabold tracking-wider mb-2">{t.qtyLabel}</label>
                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 w-max select-none font-heavy">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-zinc-400 hover:text-white cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-[#text] text-sm font-black px-2">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="text-zinc-400 hover:text-white cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Checkout prompt / prices */}
                  <div className="mt-auto pt-6 flex items-center justify-between gap-4 select-none">
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{t.total}</span>
                      <span className="text-yellow-400 font-extrabold text-lg md:text-2xl flex items-center gap-1.5 mt-0.5">
                        <span>{selectedProduct.price * qty}</span>
                        <span className="text-sm">🪙</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          addToCartAction(selectedProduct, qty, selectedOption);
                          setSelectedProduct(null);
                        }}
                        className="py-3 px-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs md:text-sm font-heavy rounded-2xl transition-all cursor-pointer flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#FF6F61]" />
                        <span>{t.addToCart}</span>
                      </button>

                      <button 
                        onClick={() => {
                          addToCartAction(selectedProduct, qty, selectedOption);
                          setCartOpen(true);
                          setSelectedProduct(null);
                        }}
                        className="py-3 px-6 bg-gradient-to-r from-[#6A1B9A] to-[#FF6F61] text-white text-xs md:text-sm font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                      >
                        {t.buyNow}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer info banner */}
        <div className="p-5 border-t border-zinc-950 bg-black/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] md:text-xs text-zinc-500 mt-auto shrink-0 z-10 select-none">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6F61]" />
            <span className="font-semibold">© {new Date().getFullYear()} <strong>{t.title}</strong> - {lang === 'ar' ? 'جميع المراسلات آمنة تماماً ومسجلة تحت بنود التشفير الفدرالي' : 'Confidential and heavily audited checkout protocols.'}</span>
          </div>

          <div className="flex gap-5 font-bold">
            <span className="hover:text-zinc-400 cursor-help transition-colors">{lang === 'ar' ? 'معايير النقل الحيادي' : 'Parcel Guidelines'}</span>
            <span className="hover:text-zinc-400 cursor-help transition-colors">{lang === 'ar' ? 'التحقق السري للمدفوعات' : 'Zero Statement Trail'}</span>
            <span className="hover:text-zinc-400 cursor-help transition-colors">{lang === 'ar' ? 'الدعم والطوارئ' : 'Emergency Operations'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
