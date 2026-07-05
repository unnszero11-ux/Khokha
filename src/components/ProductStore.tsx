import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Lock, Eye, Search, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PRODUCTS = [
  { id: 1, title: "Silky Rechargeable Vibrator", price: 49.00, tag: "Top", img: "https://via.placeholder.com/800x600?text=Vibrator", specs: "Body-safe silicone; USB-C; 3 modes" },
  { id: 2, title: "Compact Massage Wand", price: 69.00, tag: "New", img: "https://via.placeholder.com/800x600?text=Wand", specs: "Quiet motor; ergonomic handle" },
  { id: 3, title: "Travel Storage Pouch", price: 19.00, tag: "Accessory", img: "https://via.placeholder.com/800x600?text=Pouch", specs: "Lockable; neutral color" },
  { id: 4, title: "Ergonomic Pleasure Ring", price: 29.00, tag: "Sale", img: "https://via.placeholder.com/800x600?text=Ring", specs: "Stretch fit; body-safe materials" },
  { id: 5, title: "Waterproof Mini Massager", price: 39.00, tag: "Top", img: "https://via.placeholder.com/800x600?text=Mini", specs: "Waterproof; travel-friendly" },
  { id: 6, title: "Silicone Bullet Set", price: 24.00, tag: "Bundle", img: "https://via.placeholder.com/800x600?text=Bullet", specs: "Three sizes; travel case" }
];

const FILTERS = ['All', 'Vibrators', 'Massagers', 'Accessories', 'New', 'Sale'];

export const ProductStore = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(!!user);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = activeFilter === 'All' || p.tag === activeFilter || p.title.toLowerCase().includes(activeFilter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[90vh] bg-gray-50 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        <header className="p-6 bg-white border-b flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-900 text-white flex items-center justify-center font-bold text-xl shadow-lg">WW</div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Women's Wellness</h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Members Collection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"><X className="w-6 h-6" /></button>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {!isMember && (
            <div className="mb-8 p-6 rounded-2xl bg-white flex items-center gap-6 border border-purple-100 shadow-sm">
              <div className="p-4 bg-purple-50 text-purple-700 rounded-xl"><Lock className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Member Exclusive</h3>
                <p className="text-sm text-gray-500">Sign in to unlock professional grade wellness tools and discreet shipping.</p>
              </div>
              <button onClick={() => setIsMember(true)} className="ml-auto px-8 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20">Sign In</button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collection..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {FILTERS.map(f => (
                <button 
                  key={f} onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${activeFilter === f ? 'bg-purple-700 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(p => (
              <motion.article 
                key={p.id} 
                layoutId={`product-${p.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                <div className="h-56 bg-gray-100 relative overflow-hidden">
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-lg backdrop-blur-sm">{p.tag}</span>
                  {!isMember && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Lock className="w-8 h-8 text-purple-900" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{p.specs}</p>
                </div>
                <div className="p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <span className="font-bold text-xl text-gray-900">${p.price.toFixed(2)}</span>
                  <button 
                    onClick={() => setSelectedProduct(p)}
                    className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-500/20"
                  >
                    {isMember ? 'View Details' : 'View'}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 flex flex-col md:flex-row gap-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 rounded-2xl overflow-hidden">
                <img src={selectedProduct.img} alt={selectedProduct.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X /></button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProduct.title}</h2>
                <p className="text-gray-600 mb-6">{selectedProduct.specs}</p>
                <div className="text-3xl font-bold text-purple-900 mb-8">${selectedProduct.price.toFixed(2)}</div>
                <button className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/20 transition-all">
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
