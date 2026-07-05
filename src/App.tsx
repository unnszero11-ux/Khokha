import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  useAuth 
} from './hooks/useAuth';
import { 
  loginWithGoogle, 
  logout, 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  increment,
  orderBy,
  limit,
  getDocs,
  setDoc,
  Timestamp,
  documentId
} from './firebase';
import { 
  LiveRoom, 
  UserProfile, 
  Gift, 
  Transaction,
  Artist,
  LiveCategory
} from './types';
import { GIFTS, AGORA_APP_ID, ARTISTS } from './constants';
import { 
  Video, 
  Users, 
  Heart, 
  Coins, 
  LogOut, 
  Plus, 
  TrendingUp, 
  MessageSquare, 
  Gift as GiftIcon,
  X,
  Play,
  StopCircle,
  Wallet as WalletIcon,
  ChevronRight,
  History,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Send,
  Search,
  Mic,
  Unlock,
  ShieldCheck,
  Info,
  Star,
  Ban,
  VolumeX,
  Bell,
  Share2,
  Home,
  Compass,
  LayoutGrid,
  User,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StoreItem, Order } from './types';

import AdminDashboard from './components/AdminDashboard';
import { KhokhaVoice } from './components/KhokhaVoice';
import Web3Portal from './components/Web3Portal';
import { ProductStore } from './components/ProductStore';
import { LiveCommandCenter } from './components/LiveCommandCenter';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const ProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'recordings'>('following');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchLists = async () => {
      setLoading(true);
      try {
        // Fetch Following directly via local query
        const followingQ = query(collection(db, 'follows'), where('followerId', '==', user.uid));
        const followingSnap = await getDocs(followingQ);
        const followingIds = followingSnap.docs.map(doc => doc.data().followingId);
        let followingProfiles: UserProfile[] = [];
        if (followingIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < followingIds.length; i += 30) {
            chunks.push(followingIds.slice(i, i + 30));
          }
          const profilePromises = chunks.map(chunk => 
            getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
          );
          const profileSnaps = await Promise.all(profilePromises);
          followingProfiles = profileSnaps.flatMap(snap => 
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
          );
        }
        setFollowing(followingProfiles);

        // Fetch Followers directly via local query
        const followersQ = query(collection(db, 'follows'), where('followingId', '==', user.uid));
        const followersSnap = await getDocs(followersQ);
        const followerIds = followersSnap.docs.map(doc => doc.data().followerId);
        let followerProfiles: UserProfile[] = [];
        if (followerIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < followerIds.length; i += 30) {
            chunks.push(followerIds.slice(i, i + 30));
          }
          const profilePromises = chunks.map(chunk => 
            getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
          );
          const profileSnaps = await Promise.all(profilePromises);
          followerProfiles = profileSnaps.flatMap(snap => 
            snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
          );
        }
        setFollowers(followerProfiles);

        // Fetch Recordings
        const recordingsQ = query(
          collection(db, `users/${user.uid}/recordings`),
          orderBy('createdAt', 'desc')
        );
        const recordingsSnap = await getDocs(recordingsQ);
        setRecordings(recordingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, [user]);

  const currentList = activeTab === 'following' ? following : followers;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
              className="w-10 h-10 rounded-xl border border-zinc-800"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.displayName}</h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">{profile?.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{profile?.followersCount || 0}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Followers</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{profile?.followingCount || 0}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Following</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-xl mb-4">
            <button 
              onClick={() => setActiveTab('following')}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === 'following' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              FOLLOWING
            </button>
            <button 
              onClick={() => setActiveTab('followers')}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === 'followers' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              FOLLOWERS
            </button>
            <button 
              onClick={() => setActiveTab('recordings')}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === 'recordings' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              RECORDINGS
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : activeTab === 'recordings' ? (
              recordings.length > 0 ? recordings.map((rec) => (
                <div key={rec.id} className="flex flex-col gap-2 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-rose-500" />
                      <p className="text-sm font-bold text-zinc-200">{rec.modelName}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      {rec.createdAt ? new Date(rec.createdAt._seconds * 1000).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  <audio controls src={rec.audioData} className="w-full h-8 mt-2" />
                </div>
              )) : (
                <div className="text-center py-12 text-zinc-600 italic text-sm">
                  No recordings yet
                </div>
              )
            ) : currentList.length > 0 ? currentList.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={u.photoURL} className="w-8 h-8 rounded-full border border-zinc-800" />
                  <div>
                    <p className="text-sm font-bold text-zinc-200">{u.displayName}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{u.role}</p>
                  </div>
                </div>
                <button className="p-2 text-zinc-500 hover:text-rose-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )) : (
              <div className="text-center py-12 text-zinc-600 italic text-sm">
                No {activeTab} yet
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ 
  onOpenWallet, 
  onOpenStartLive, 
  onOpenStore, 
  onOpenAdmin, 
  onOpenProfile, 
  onOpenKhokhaVoice, 
  onLoginError,
  notifications,
  onClearNotifications,
  onNotificationClick
}: { 
  onOpenWallet: () => void, 
  onOpenStartLive: () => void, 
  onOpenStore: () => void, 
  onOpenAdmin: () => void, 
  onOpenProfile: () => void, 
  onOpenKhokhaVoice: () => void, 
  onLoginError: (err: string) => void,
  notifications: any[],
  onClearNotifications: () => void,
  onNotificationClick: (notif: any) => void
}) => {
  const { user, profile } = useAuth();
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-4 mx-4 mb-4 rounded-full h-16 bg-black/40 backdrop-blur-3xl border border-white/5 z-50 px-5 flex items-center justify-between shadow-2xl shadow-black/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
          <Video className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-display font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight">
          KHOKHA
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button 
              onClick={onOpenKhokhaVoice}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-rose-500 text-white rounded-full font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20 animate-pulse border border-white/10"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifPopover(!showNotifPopover)}
                className="p-2 hover:bg-white/10 border border-transparent hover:border-white/5 rounded-full transition-all relative text-zinc-400 hover:text-white"
              >
                <Bell className={cn("w-5 h-5", unreadCount > 0 && "text-primary animate-pulse")} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center animate-bounce shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifPopover && (
                <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
                    <span className="text-sm font-semibold text-white uppercase tracking-wider">Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => {
                          onClearNotifications();
                          setShowNotifPopover(false);
                        }}
                        className="text-[10px] uppercase font-bold tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-900 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-600 italic">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            onNotificationClick(notif);
                            setShowNotifPopover(false);
                          }}
                          className={cn(
                            "p-4 hover:bg-zinc-900/50 cursor-pointer transition-colors flex gap-3 items-start",
                            !notif.read && "bg-rose-500/5"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-xl flex items-center justify-center text-lg shrink-0",
                            notif.type === 'gift_received' ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                          )}>
                            {notif.type === 'gift_received' ? "🎁" : "🔴"}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white leading-snug">{notif.title}</p>
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-zinc-800">
              <img 
                onClick={onOpenProfile}
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer hover:border-primary transition-colors"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-white hover:bg-card rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={async () => {
              try {
                await loginWithGoogle();
              } catch (error: any) {
                if (error?.code === 'auth/popup-blocked') {
                  onLoginError("يرجى السماح بالنوافذ المنبثقة (Pop-ups) في متصفحك لتتمكن من تسجيل الدخول، أو قم بفتح التطبيق في نافذة جديدة.");
                } else if (
                  error?.code === 'auth/cancelled-popup-request' || 
                  error?.code === 'auth/network-request-failed' || 
                  (error?.message && error?.message.includes('Pending promise'))
                ) {
                  onLoginError("حماية متصفحك تمنع تسجيل الدخول داخل نافذة المعاينة. يرجى الضغط على زر 'فتح في نافذة جديدة' (Open in new tab) أعلى اليمين لتسجيل الدخول بسهولة!");
                } else if (error?.code !== 'auth/popup-closed-by-user') {
                  console.error("Login failed:", error);
                  onLoginError(`فشل تسجيل الدخول: ${error?.message || error}`);
                }
              }
            }}
            className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

function ArtistCard({ artist, key }: { artist: Artist, key?: any }) {
  return (
    <motion.div 
      key={key}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.07 }}
      className="bg-gradient-to-br from-[#8B0000] to-[#FF4D4D] rounded-[15px] p-4 text-center group transition-all hover:shadow-[0_0_20px_#FFD166,0_0_40px_#FFAAAA]"
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-black/20">
        <img 
          src={artist.image} 
          alt={artist.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-[#FFD166] uppercase tracking-widest">
          {artist.category}
        </div>
      </div>
      <h3 className="text-[#FFD166] font-bold text-lg mb-1">{artist.name}</h3>
      <p className="text-[#FFE599] text-[11px] font-bold uppercase tracking-widest">{artist.category} Music</p>
    </motion.div>
  );
}

const LiveCard = ({ room, onClick }: { room: LiveRoom, onClick: () => void, key?: any }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      className="relative group cursor-pointer aspect-[3/4] rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-xl hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300"
    >
      <img 
        src={room.modelPhoto || `https://images.unsplash.com/photo-1516280440502-a2989cb34dd0?auto=format&fit=crop&w=400&h=600&q=80`} 
        alt={room.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/90 backdrop-blur text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse border border-white/10 shadow-lg shadow-primary/30">
            LIVE
          </div>
          <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
            <Users className="w-3 h-3" />
            {room.viewerCount}
          </div>
        </div>
        {room.adultFlag && (
          <div className="bg-primary/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-lg w-fit border border-white/10">
            <ShieldAlert className="w-3 h-3" />
            18+
          </div>
        )}
        {(room.sectionId || room.isVip) && (
          <div className="bg-yellow-500/90 backdrop-blur text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-lg w-fit border border-white/20">
            <Star className="w-3 h-3" />
            VIP {room.vipPrice ? `(${room.vipPrice} Coins)` : ''}
          </div>
        )}
        <div className="bg-black/60 backdrop-blur-md text-[#FFD166] text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg w-fit border border-white/10">
          {room.category}
        </div>
        {room.isExternal && (
          <div className="bg-emerald-500/90 backdrop-blur text-black text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg w-fit flex items-center gap-1 border border-emerald-300/30">
            <ShieldAlert className="w-2 h-2" />
            {room.agencyName || 'Partner'}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-display font-medium text-lg md:text-xl leading-tight mb-2 line-clamp-2 drop-shadow-md">{room.title}</h3>
        <div className="flex items-center gap-2">
          <img 
            src={room.modelPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.modelId}`} 
            className="w-6 h-6 rounded-full border-2 border-white shadow-md shadow-black/50"
            referrerPolicy="no-referrer"
          />
          <span className="text-zinc-300 text-xs font-semibold drop-shadow-md">@{room.modelName}</span>
        </div>
      </div>
    </motion.div>
  );
};

const GiftPanel = ({ onSend }: { onSend: (gift: Gift) => void }) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-4 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800">
      {GIFTS.map((gift) => (
        <button
          key={gift.id}
          onClick={() => onSend(gift)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-zinc-800 transition-colors group"
        >
          <span className="text-3xl group-hover:scale-125 transition-transform">{gift.icon}</span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{gift.name}</span>
          <div className="flex items-center gap-1">
            <Coins className="w-3 h-3 text-gold" />
            <span className="text-xs font-bold text-zinc-100">{gift.value}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

const WalletModal = ({ onClose, onOpenWeb3 }: { onClose: () => void; onOpenWeb3: () => void }) => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    return onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
  }, [profile]);

  const addCoins = async (amount: number) => {
    if (!profile) return;
    try {
      const response = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.uid, amount })
      });
      if (!response.ok) throw new Error('Failed to add coins');
    } catch (err) {
      console.error("Failed to add coins", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <WalletIcon className="text-yellow-500 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">My Wallet</h2>
              <p className="text-zinc-500 text-xs">Manage your coins and history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 rounded-2xl mb-6 flex flex-col items-center w-full">
            <span className="text-zinc-500 text-xs font-medium mb-1">Total Balances</span>
            
            <div className="flex items-center justify-center gap-6 w-full">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Coins</span>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-black text-white">{profile?.balance || 0}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800"></div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Web3 (ETH)</span>
                <div className="flex items-center gap-2">
                  <WalletIcon className="w-5 h-5 text-indigo-400" />
                  <span className="text-2xl font-black text-white">2.54</span>
                </div>
              </div>
            </div>
            
            <button 
              id="wallet-modal-web3-btn"
              onClick={() => {
                onClose();
                onOpenWeb3();
              }}
              className="mt-6 w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Manage Web3 Portal</span>
            </button>
          </div>

          <button 
            onClick={onOpenWeb3}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 mb-6"
          >
            <WalletIcon className="w-4 h-4" />
            Pay with Crypto (Web3)
          </button>

          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Top Up Coins</h3>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[100, 500, 1000, 5000, 10000, 50000].map((amount) => (
              <button
                key={amount}
                onClick={() => addCoins(amount)}
                className="flex flex-col items-center gap-1 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-lg font-bold text-white">{amount}</span>
                <span className="text-[10px] text-zinc-500 font-bold">COINS</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Recent Activity</h3>
            <History className="w-4 h-4 text-zinc-600" />
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {transactions.length > 0 ? transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    tx.type === 'deposit' ? "bg-green-500/10 text-green-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {tx.type === 'deposit' ? <Plus className="w-4 h-4" /> : <GiftIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200 capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-zinc-500">
                      {tx.createdAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "font-bold",
                  tx.type === 'deposit' ? "text-green-500" : "text-rose-500"
                )}>
                  {tx.type === 'deposit' ? '+' : '-'}{tx.amount}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 text-zinc-600 italic text-sm">No transactions yet</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BecomeModelModal = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/model-application/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userDisplayName: profile.displayName,
          userEmail: profile.email,
          fullName,
          age,
          socialLinks,
          contentDescription
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit application');
      
      alert("Application submitted successfully! We will review it shortly.");
      onClose();
    } catch (error: any) {
      console.error("Application submission failed:", error);
      alert(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-8"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-black text-white">Become a Model</h2>
            <p className="text-zinc-400 text-sm mt-1">Join our platform and start earning</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Legal Name</label>
            <input 
              required
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Age</label>
            <input 
              required
              type="number" 
              min="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="Must be 18+"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Social Media Links</label>
            <textarea 
              required
              value={socialLinks}
              onChange={(e) => setSocialLinks(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none h-24"
              placeholder="Instagram, Twitter, TikTok, etc."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">What kind of content will you stream?</label>
            <textarea 
              required
              value={contentDescription}
              onChange={(e) => setContentDescription(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none h-24"
              placeholder="Describe your stream style, schedule, and content..."
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const StartLiveModal = ({ onClose, onStart }: { onClose: () => void, onStart: (room: LiveRoom, token?: string) => void }) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LiveCategory>('chatting');
  const [isAdult, setIsAdult] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [vipPrice, setVipPrice] = useState(100);
  const [vipDescription, setVipDescription] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [enableRecording, setEnableRecording] = useState(false);
  const [viewerLimit, setViewerLimit] = useState<number | ''>('');

  const startLive = async () => {
    if (!user || !profile || !title) return;
    setIsStarting(true);
    try {
      const response = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          modelName: profile.displayName,
          modelPhoto: user.photoURL,
          title,
          category,
          adultFlag: isAdult,
          isVip,
          vipPrice: isVip ? vipPrice : undefined,
          vipDescription: isVip ? vipDescription : undefined,
          enableRecording,
          viewerLimit: viewerLimit !== '' ? Number(viewerLimit) : undefined
        })
      });
      
      if (!response.ok) throw new Error('Failed to start live');
      
      const data = await response.json();
      const newRoom: LiveRoom = {
        id: data.id,
        modelId: user.uid,
        modelName: profile.displayName,
        modelPhoto: user.photoURL || undefined,
        title,
        category,
        status: 'active',
        viewerCount: 0,
        startedAt: Timestamp.now(),
        agoraChannel: data.channelName,
        adultFlag: isAdult,
        isVip,
        vipPrice: isVip ? vipPrice : undefined,
        enableRecording,
        viewerLimit: viewerLimit !== '' ? Number(viewerLimit) : undefined
      };
      
      onStart(newRoom, data.token);
    } catch (err) {
      console.error("Failed to start live", err);
      alert("Failed to start live. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <Play className="text-rose-500 w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Go Live</h2>
              <p className="text-zinc-500 text-xs">Start your streaming session</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Stream Title</label>
            <input 
              type="text" 
              placeholder="What's your stream about?" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all cursor-pointer"
            >
              <option value="chatting">Chatting</option>
              <option value="girls">Girls</option>
              <option value="adults">Adults</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-sm font-bold text-white">Adult Content (18+)</p>
                <p className="text-[10px] text-zinc-500">Enable for adult-only streams</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAdult(!isAdult)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isAdult ? "bg-rose-600" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                isAdult ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-bold text-white">VIP Room</p>
                <p className="text-[10px] text-zinc-500">Require coins to join</p>
              </div>
            </div>
            <button 
              onClick={() => setIsVip(!isVip)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isVip ? "bg-yellow-500" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                isVip ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          {isVip && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">VIP Price (Coins)</label>
                <input 
                  type="number" 
                  min="1"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Private Room Description</label>
                <textarea 
                  placeholder="Describe what viewers will get in this VIP room..." 
                  value={vipDescription}
                  onChange={(e) => setVipDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all resize-none h-24"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Viewer Limit (Optional)</label>
            <input 
              type="number" 
              placeholder="e.g. 10 (Leave blank for unlimited)" 
              min="1"
              value={viewerLimit}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                setViewerLimit(val);
              }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-white">Record Stream</p>
                <p className="text-[10px] text-zinc-500">Record stream audio to On-Demand</p>
              </div>
            </div>
            <button 
              onClick={() => setEnableRecording(!enableRecording)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                enableRecording ? "bg-emerald-600" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                enableRecording ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              <Video className="w-5 h-5" />
              <span>Camera and Microphone will be activated</span>
            </div>
          </div>

          <button
            onClick={startLive}
            disabled={!title || isStarting}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Start Streaming Now
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LiveRoomOverlay = ({ room, onClose, token, onShareClick }: { room: LiveRoom, onClose: () => void, token?: string, onShareClick: (url: string, title: string) => void }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<{id: string, text: string, sender: string, senderId: string, senderPhoto?: string}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isBannedFromChat, setIsBannedFromChat] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isModel = user?.uid === room.modelId;

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      const trackToRecord = isModel ? localAudioTrack?.getMediaStreamTrack() : remoteAudioTrack?.getMediaStreamTrack();
      if (!trackToRecord) {
        alert("No audio track available to record.");
        return;
      }
      const stream = new MediaStream([trackToRecord]);
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const token = await user?.getIdToken();
            const response = await fetch('/api/user/recordings/save', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                userId: user?.uid,
                roomId: room.id,
                modelName: room.modelName,
                audioData: base64Audio,
                title: room.title
              })
            });
            if (response.ok) {
              alert("Recording saved to your profile!");
            } else {
              alert("Failed to save recording.");
            }
          } catch (err) {
            console.error("Save recording failed", err);
          }
        };
      };
      
      recorder.start();
      setIsRecording(true);
    }
  };

  // Auto-start recording if enabled by the model on stream start
  useEffect(() => {
    if (isModel && room.enableRecording && !isRecording && localAudioTrack) {
      toggleRecording();
    }
  }, [isModel, room.enableRecording, localAudioTrack]);

  useEffect(() => {
    if (!user || isModel) return;
    const checkFollow = async () => {
      const q = query(
        collection(db, 'follows'),
        where('followerId', '==', user.uid),
        where('followingId', '==', room.modelId)
      );
      const snapshot = await getDocs(q);
      setIsFollowing(!snapshot.empty);
    };
    checkFollow();
  }, [user, room.modelId, isModel]);

  const toggleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    const action = isFollowing ? 'unfollow' : 'follow';
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          followerId: user.uid,
          followingId: room.modelId,
          action
        })
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (err) {
      console.error("Follow action failed", err);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    // Agora Setup
    const initAgora = async () => {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      let appId = (import.meta as any).env.VITE_AGORA_APP_ID;
      if (!appId || appId === "MY_AGORA_APP_ID") {
        try {
          const res = await fetch('/api/public-keys');
          if (res.ok) {
            const keys = await res.json();
            appId = keys.agoraAppId;
          }
        } catch (e) {
          console.error("Failed to fetch public keys", e);
        }
      }
      
      if (!appId || appId === "YOUR_AGORA_APP_ID" || appId === "MY_AGORA_APP_ID") {
        console.warn("Agora App ID not configured");
        return;
      }

      try {
        // For external/demo rooms, we might not have a token or might need a specific join logic
        // The "dynamic use static key" error happens when a token is passed to a project that doesn't require it
        // or when no token is passed to a project that DOES require it.
        // We'll try to join with the provided token, or null if it fails/not provided.
        const joinToken = (token && token.trim() !== "") ? token : null;
        
        console.log(`Joining Agora channel: ${room.agoraChannel} with appId: ${appId} and token: ${joinToken ? 'PROVIDED (starts with ' + joinToken.substring(0, 5) + '...)' : 'NONE'}`);
        
        // Use null for UID to let Agora assign a numeric one, matching the token generated for UID 0
        await client.join(appId, room.agoraChannel, joinToken, null);
        
        if (!active) return;

        if (isModel) {
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            { AEC: true, ANS: true, AGC: true },
            {}
          );
          if (!active) {
            audioTrack.close();
            videoTrack.close();
            return;
          }
          setLocalVideoTrack(videoTrack);
          setLocalAudioTrack(audioTrack);
          await client.publish([audioTrack, videoTrack]);
          if (videoRef.current) videoTrack.play(videoRef.current);
        } else {
          client.on('user-published', async (user, mediaType) => {
            if (!active) return;
            await client.subscribe(user, mediaType);
            if (mediaType === 'video') {
              setRemoteVideoTrack(user.videoTrack);
              if (videoRef.current) user.videoTrack?.play(videoRef.current);
            }
            if (mediaType === 'audio') {
              setRemoteAudioTrack(user.audioTrack);
              user.audioTrack?.play();
            }
          });
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("OPERATION_ABORTED")) {
          // Quietly ignore aborted operations
          return;
        }
        
        if (err instanceof Error && err.message.includes("static key")) {
          alert("Agora Error: Token mismatch. Please ensure AGORA_APP_CERTIFICATE is correctly set in your environment variables if your project has App Certificate enabled.");
        } else if (err instanceof Error && err.message.includes("invalid token")) {
          alert("Agora Error: Invalid token. Please check that your VITE_AGORA_APP_ID and AGORA_APP_CERTIFICATE match exactly with your Agora Console.");
        }
        
        console.error("Agora Error", err);
        // Fallback for "dynamic use static key" or "invalid token" - retry without token if token was provided but failed
        if (token && err instanceof Error && (err.message.includes("static key") || err.message.includes("invalid token"))) {
          try {
            console.log("Retrying Agora join without token...");
            await client.join(appId, room.agoraChannel, null, null);
          } catch (retryErr) {
            if (!(retryErr instanceof Error && retryErr.message.includes("OPERATION_ABORTED"))) {
              console.error("Agora Retry Error", retryErr);
            }
          }
        }
      }
    };

    initAgora();

    // Socket.io Setup
    const newSocket = io();
    setSocket(newSocket);
    newSocket.emit("join_live", room.id);

    newSocket.on("user_moderated", (data) => {
      if (data.userId === user?.uid) {
        if (data.action === "mute") {
          setIsMuted(true);
          const duration = data.duration || 60000;
          setTimeout(() => setIsMuted(false), duration);
          alert(`You have been muted for ${duration / 1000} seconds.`);
        } else if (data.action === "ban") {
          setIsBannedFromChat(true);
          alert("You have been banned from this chat.");
        }
      }
    });

    // Chat Setup
    // Enable full access live chat for all rooms including partner rooms
    let unsubscribeChat = () => {};
    const q = query(
      collection(db, `lives/${room.id}/messages`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    unsubscribeChat = onSnapshot(q, (snapshot) => {
      if (active) {
        setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)).reverse());
      }
    });

    // Increment viewer count (only for real Firestore rooms)
    if (!isModel && !room.isExternal) {
      updateDoc(doc(db, 'lives', room.id), {
        viewerCount: increment(1)
      }).catch(err => console.error("Failed to increment viewer count", err));
    }

    return () => {
      active = false;
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (!isModel && !room.isExternal) {
        updateDoc(doc(db, 'lives', room.id), {
          viewerCount: increment(-1)
        }).catch(err => console.error("Failed to decrement viewer count", err));
      }
      if (newSocket) {
        newSocket.emit("leave_live", room.id);
        newSocket.disconnect();
      }
      unsubscribeChat();
    };
  }, [room.id, isModel, room.isExternal, token]);

  const handleModeration = async (targetUserId: string, action: 'mute' | 'ban') => {
    if (!socket || !user) return;
    const adminToken = await user.getIdToken();
    socket.emit("moderation_action", {
      liveId: room.id,
      userId: targetUserId,
      action,
      duration: action === 'mute' ? 60000 : undefined,
      adminToken
    });
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isMuted || isBannedFromChat) return;
    try {
      await addDoc(collection(db, `lives/${room.id}/messages`), {
        text: newMessage,
        sender: user.displayName || "User",
        senderId: user.uid,
        senderPhoto: user.photoURL || "",
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const sendGift = async (gift: Gift) => {
    if (!user || !profile || profile.balance < gift.value) {
      alert("Insufficient balance!");
      return;
    }
    try {
      const response = await fetch('/api/gift/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          modelId: room.modelId,
          giftId: gift.id,
          liveId: room.id,
          adultFlag: gift.adultFlag
        })
      });
      if (!response.ok) throw new Error('Failed to send gift');
    } catch (err) {
      console.error("Failed to send gift", err);
    }
  };

  const endStream = async () => {
    if (!isModel || !user) return;
    try {
      const response = await fetch('/api/live/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId: room.id, userId: user.uid })
      });
      if (!response.ok) throw new Error('Failed to end stream');
      onClose();
    } catch (err) {
      console.error("Failed to end stream", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col md:flex-row">
      {/* Video Area */}
      <div className="relative flex-1 bg-zinc-900 overflow-hidden">
        {(!isModel && !remoteVideoTrack) ? (
          <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center">
            <video
              src={room.id === 'agency-1' 
                ? "https://assets.mixkit.co/videos/preview/mixkit-girl-in-sunglasses-under-neon-lights-42240-large.mp4" 
                : "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-under-neon-lights-42283-large.mp4"}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
            {/* Ambient vignette/overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center max-w-xs transition-all animate-pulse">
              <div className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                Live Partner Feed
              </div>
              <p className="text-[10px] text-zinc-400 font-medium font-bold">Streaming through secure global partner network</p>
            </div>
          </div>
        ) : (
          <div ref={videoRef} className="w-full h-full object-cover" />
        )}
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
              <img src={room.modelPhoto} className="w-10 h-10 rounded-full border border-white/20" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-bold leading-none">{room.modelName}</p>
                  {room.isExternal && (
                    <div className="bg-emerald-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                      <ShieldAlert className="w-2 h-2" />
                      {room.agencyName}
                    </div>
                  )}
                  {room.isVip && (
                    <div className="bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                      <Star className="w-2 h-2" />
                      VIP
                    </div>
                  )}
                  {!isModel && user && (
                    <button 
                      onClick={toggleFollow}
                      disabled={followLoading}
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full transition-all active:scale-95",
                        isFollowing 
                          ? "bg-zinc-800 text-zinc-400 border border-zinc-700" 
                          : "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                      )}
                    >
                      {followLoading ? "..." : isFollowing ? "FOLLOWING" : "FOLLOW"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">{room.viewerCount} Viewers</span>
                  </div>
                  {room.adultFlag && (
                    <span className="bg-rose-500 text-white text-[8px] font-black px-1 rounded uppercase tracking-tighter">18+</span>
                  )}
                  {room.sectionId && (
                    <span className="bg-yellow-500 text-black text-[8px] font-black px-1 rounded uppercase tracking-tighter">VIP</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onShareClick(window.location.origin + `/room/${room.id}`, room.title)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button 
                onClick={toggleRecording}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg transition-all",
                  isRecording 
                    ? "bg-red-500 text-white shadow-red-500/20 animate-pulse" 
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                )}
              >
                <Mic className="w-4 h-4" />
                {isRecording ? "Stop Recording" : "Record Audio"}
              </button>
              {isModel && (
                <button 
                  onClick={endStream}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  <StopCircle className="w-4 h-4" />
                  End Stream
                </button>
              )}
              <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/60">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Gift Animation Area could go here */}
          </div>
        </div>
      </div>

      {/* Sidebar (Chat & Gifts) */}
      <div className="w-full md:w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col h-[40vh] md:h-full">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-rose-500" />
          <h2 className="text-white font-bold">Live Chat</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 group">
              <img src={msg.senderPhoto} className="w-8 h-8 rounded-full border border-zinc-800" />
              <div className="flex-1">
                <div className={cn(
                  "p-2 rounded-2xl text-sm inline-block",
                  msg.sender === room.modelName ? "bg-rose-500/10 border border-rose-500/20" : "bg-zinc-900 border border-zinc-800"
                )}>
                  <p className="font-bold text-xs text-zinc-400 mb-0.5">{msg.sender}</p>
                  <p className={cn("text-zinc-100", (msg as any).isGift && "text-yellow-500 font-bold")}>
                    {msg.text}
                  </p>
                </div>
                { (isModel || profile?.role === 'admin') && msg.senderId !== user?.uid && (
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleModeration(msg.senderId, 'mute')}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-yellow-500 transition-colors"
                      title="Mute for 60s"
                    >
                      <VolumeX className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleModeration(msg.senderId, 'ban')}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500 transition-colors"
                      title="Ban from chat"
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!isModel && <GiftPanel onSend={sendGift} />}

        <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 flex items-center gap-2">
          <input 
            type="text" 
            placeholder={isBannedFromChat ? "You are banned" : isMuted ? "You are muted" : "Say something..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isMuted || isBannedFromChat}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={isMuted || isBannedFromChat}
            className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const VipPurchaseModal = ({ room, onClose, onPurchase }: { room: LiveRoom, onClose: () => void, onPurchase: (room: LiveRoom) => void }) => {
  const { profile } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!profile) return;
    if (profile.balance < (room.vipPrice || 0)) {
      alert("Insufficient coins. Please recharge your wallet.");
      return;
    }
    
    setIsPurchasing(true);
    try {
      const response = await fetch('/api/vip/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.uid,
          roomId: room.id,
          price: room.vipPrice
        })
      });

      if (!response.ok) throw new Error('Failed to purchase VIP access');
      
      onPurchase(room);
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Failed to purchase VIP access. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-950 border border-yellow-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-500/10 text-center p-8"
      >
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Star className="w-10 h-10 text-yellow-500" />
        </div>
        
        <h2 className="text-2xl font-black text-white mb-2">VIP Room Access</h2>
        <p className="text-zinc-400 mb-4">
          This is a private VIP room hosted by <span className="text-white font-bold">{room.modelName}</span>. 
          You need to purchase access to join.
        </p>

        {room.vipDescription && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 text-left">
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Room Description</p>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{room.vipDescription}</p>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <span className="text-zinc-400">Access Price</span>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-xl font-bold text-white">{room.vipPrice}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
            <span className="text-zinc-400">Your Balance</span>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className={cn("text-xl font-bold", (profile?.balance || 0) >= (room.vipPrice || 0) ? "text-white" : "text-red-500")}>
                {profile?.balance || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handlePurchase}
            disabled={isPurchasing || (profile?.balance || 0) < (room.vipPrice || 0)}
            className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            {isPurchasing ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Unlock className="w-5 h-5" />
                Unlock Now
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AgeVerificationModal = ({ onClose, onVerify }: { onClose: () => void, onVerify: () => void }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-zinc-950 border border-rose-900/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-rose-950/20"
      >
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Age Verification</h2>
          <p className="text-zinc-400 text-sm">You must be at least 18 years old to access this section. Please confirm your age.</p>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onVerify}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-black text-lg transition-all active:scale-95"
          >
            I am 18+
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-4 rounded-xl font-bold transition-all"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StoreModal = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/store/items')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error("Store items data is not an array:", data);
          setItems([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch store items:", err);
        setItems([]);
        setLoading(false);
      });
  }, []);

  const purchase = async (item: StoreItem) => {
    if (!user) return;
    try {
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, itemId: item.id })
      });
      if (response.ok) {
        alert("Purchase successful!");
      }
    } catch (err) {
      console.error("Purchase failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-rose-500 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Khokha Store</h2>
              <p className="text-zinc-500 text-xs text-rose-500 font-bold">Premium Items & Coins</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between group hover:border-rose-500/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-950 rounded-xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                      {item.image || "🎁"}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{item.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.type}</p>
                      {item.bonus ? <p className="text-emerald-500 text-[10px] font-bold">+{item.bonus} Bonus</p> : null}
                    </div>
                  </div>
                  <button 
                    onClick={() => purchase(item)}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95"
                  >
                    ${item.price}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const SecretSectionModal = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingSection, setConfirmingSection] = useState<any | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    fetch('/api/sections/list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSections(data);
        } else {
          console.error("Sections data is not an array:", data);
          setSections([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch sections:", err);
        setSections([]);
        setLoading(false);
      });
  }, []);

  const unlock = async () => {
    if (!user || !confirmingSection) return;
    
    if ((profile?.balance || 0) < confirmingSection.price) {
      alert("Insufficient balance!");
      setConfirmingSection(null);
      return;
    }

    setIsUnlocking(true);
    try {
      const response = await fetch('/api/sections/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, sectionId: confirmingSection.id })
      });
      if (response.ok) {
        setConfirmingSection(null);
      } else {
        const errData = await response.json();
        alert(errData.error || "Unlock failed");
      }
    } catch (err) {
      console.error("Unlock failed", err);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Lock className="text-yellow-500 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Secret Sections</h2>
              <p className="text-zinc-500 text-xs text-yellow-500 font-bold uppercase tracking-widest">VIP Access Only</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar relative">
          {confirmingSection && (
            <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xs w-full space-y-6"
              >
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Coins className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Unlock {confirmingSection.name}?</h3>
                  <p className="text-zinc-400 text-sm">
                    This will deduct <span className="text-yellow-500 font-bold">{confirmingSection.price} coins</span> from your balance.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={unlock}
                    disabled={isUnlocking}
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isUnlocking ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      "Confirm Unlock"
                    )}
                  </button>
                  <button 
                    onClick={() => setConfirmingSection(null)}
                    disabled={isUnlocking}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sections.map((section) => {
                const isUnlocked = profile?.unlockedSections?.includes(section.id);
                return (
                  <div key={section.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 group hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center text-2xl">
                        {isUnlocked ? <Eye className="text-emerald-500" /> : <EyeOff className="text-zinc-600" />}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{section.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{section.type}</p>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-xs line-clamp-2">{section.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-white font-bold">{section.price}</span>
                      </div>
                      <button 
                        onClick={() => !isUnlocked && setConfirmingSection(section)}
                        disabled={isUnlocked}
                        className={cn(
                          "px-4 py-2 rounded-xl font-black text-xs transition-all active:scale-95",
                          isUnlocked ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-600 hover:bg-yellow-500 text-black"
                        )}
                      >
                        {isUnlocked ? "UNLOCKED" : "UNLOCK NOW"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const CommunityChat = ({ onClose }: { onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "community_chat"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs.reverse());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, "community_chat"), {
        text: newMessage,
        sender: profile?.displayName || "User",
        senderId: user.uid,
        senderPhoto: profile?.photoURL || "",
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed top-0 right-0 h-full w-full md:w-96 bg-zinc-950 border-l border-zinc-800 z-[300] flex flex-col shadow-2xl"
    >
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="text-primary w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">Community Chat</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.senderId === user?.uid ? "flex-row-reverse" : "")}>
            <img src={msg.senderPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=32&h=32&q=80"} className="w-8 h-8 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />
            <div className={cn("max-w-[80%]", msg.senderId === user?.uid ? "items-end" : "items-start")}>
              <p className="text-[10px] text-zinc-500 font-bold mb-1 px-1">{msg.sender}</p>
              <div className={cn(
                "p-3 rounded-2xl text-sm",
                msg.senderId === user?.uid 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800"
              )}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-zinc-900/50 border-t border-zinc-800">
        <div className="relative">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-rose-500 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// --- Share Modal ---
const ShareModal = ({ url, title, type, onClose }: { url: string; title: string; type: 'stream' | 'profile'; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    {
      name: 'Twitter (X)',
      icon: '🐦',
      color: 'bg-zinc-900 text-white',
      link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this live stream on Khokha: "${title}"!`)}&url=${encodeURIComponent(url)}`
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 text-white',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'Instagram',
      icon: '📸',
      color: 'bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 text-white',
      link: `https://www.instagram.com/`
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="text-emerald-400 w-5 h-5 animate-pulse" />
            <h3 className="text-white font-bold text-base">Share Stream</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Invite your friends and followers to join this live broadcast! Share via a Direct Link or your favorite social network:
          </p>

          <div className="space-y-3">
            {platforms.map((plat) => (
              <a 
                key={plat.name}
                href={plat.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-3 rounded-2xl ${plat.color} hover:opacity-90 active:scale-98 transition-all font-bold text-sm`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{plat.icon}</span>
                  {plat.name}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Share →</span>
              </a>
            ))}
          </div>

          <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Stream URL</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={url} 
                className="flex-1 bg-zinc-950 border border-zinc-805 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none select-all"
              />
              <button 
                onClick={handleCopy}
                className="px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition-all active:scale-95"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

// --- BottomNav ---
const BottomNav = ({ profile, onOpenWallet, onOpenStartLive, onOpenStore, onOpenAdmin, onOpenProfile }: any) => {
  return (
    <div className="bg-black/90 backdrop-blur-3xl border-t border-white/10 flex items-end justify-around pb-6 pt-3 px-2 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition-colors w-16">
        <Home className="w-6 h-6" />
        <span className="text-[9px] uppercase font-bold tracking-wider">Home</span>
      </button>
      <button onClick={onOpenWallet} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-gold transition-colors w-16">
        <Coins className="w-6 h-6" />
        <span className="text-[9px] uppercase font-bold tracking-wider">Wallet</span>
      </button>
      
      {profile?.role === 'model' ? (
        <button onClick={onOpenStartLive} className="flex flex-col items-center gap-1.5 -mt-8 w-20 relative group">
          <div className="bg-gradient-to-tr from-pink-500 to-rose-500 p-4 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)] group-hover:scale-105 transition-transform text-white border-4 border-zinc-950 relative z-10">
            <Play className="w-7 h-7 fill-current" />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-rose-500">Live</span>
        </button>
      ) : (profile?.role === 'admin' ? (
        <button onClick={onOpenAdmin} className="flex flex-col items-center gap-1.5 -mt-8 w-20 relative group">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform text-white border-4 border-zinc-950 relative z-10">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400">Panel</span>
        </button>
      ) : (
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-become-model'))} className="flex flex-col items-center gap-1.5 -mt-8 w-20 relative group">
          <div className="bg-gradient-to-tr from-yellow-500 to-orange-500 p-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] group-hover:scale-105 transition-transform text-white border-4 border-zinc-950 relative z-10">
            <Star className="w-7 h-7 fill-current" />
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-yellow-500">Creator</span>
        </button>
      ))}

      <button onClick={onOpenStore} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition-colors w-16">
        <ShoppingBag className="w-6 h-6" />
        <span className="text-[9px] uppercase font-bold tracking-wider">Store</span>
      </button>

      {profile?.role === 'admin' && (
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-command-center'))} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-indigo-400 transition-colors w-16">
          <Network className="w-6 h-6" />
          <span className="text-[9px] uppercase font-bold tracking-wider">System</span>
        </button>
      )}

      <button onClick={onOpenProfile} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition-colors w-16">
        <User className="w-6 h-6" />
        <span className="text-[9px] uppercase font-bold tracking-wider">Profile</span>
      </button>
    </div>
  );
};

export default function App() {
  const { user, profile } = useAuth();
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null);
  const [activeToken, setActiveToken] = useState<string | undefined>(undefined);
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [showWallet, setShowWallet] = useState(false);
  const [showWeb3Portal, setShowWeb3Portal] = useState(false);
  const [showStartLive, setShowStartLive] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showKhokhaVoice, setShowKhokhaVoice] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showSecretSections, setShowSecretSections] = useState(false);
  const [showPrivateStore, setShowPrivateStore] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showBecomeModel, setShowBecomeModel] = useState(false);
  const [showVipPurchase, setShowVipPurchase] = useState<{show: boolean, room: LiveRoom | null}>({show: false, room: null});

  useEffect(() => {
    const handleOpenBecomeModel = () => setShowBecomeModel(true);
    const handleOpenWeb3 = () => setShowWeb3Portal(true);
    const handleOpenCommandCenter = () => setShowCommandCenter(true);
    window.addEventListener('open-become-model', handleOpenBecomeModel);
    window.addEventListener('open-web3', handleOpenWeb3);
    window.addEventListener('open-command-center', handleOpenCommandCenter);
    return () => {
      window.removeEventListener('open-become-model', handleOpenBecomeModel);
      window.removeEventListener('open-web3', handleOpenWeb3);
      window.removeEventListener('open-command-center', handleOpenCommandCenter);
    };
  }, []);
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'following' | 'artists' | 'ondemand'>('all');
  const [artistCategory, setArtistCategory] = useState<'all' | 'pop' | 'hiphop' | 'rock' | 'jazz'>('all');
  const [streamCategory, setStreamCategory] = useState<'all' | LiveCategory>('all');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCommunityChat, setShowCommunityChat] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Notifications and Sharing states
  const [globalSocket, setGlobalSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState<{ show: boolean; type: 'stream' | 'profile'; url: string; title: string } | null>(null);
  const [allRecordings, setAllRecordings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      if (globalSocket) {
        globalSocket.disconnect();
        setGlobalSocket(null);
      }
      return;
    }
    const socket = io();
    setGlobalSocket(socket);

    socket.emit("register_user", user.uid);

    socket.on("notification", (data: any) => {
      console.log("Real-time notification arrived:", data);
      setNotifications(prev => [
        { id: Math.random().toString(), read: false, createdAt: new Date(), ...data },
        ...prev
      ].slice(0, 50));
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [user]);

  const handleNotificationClick = (notif: any) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.roomId) {
      const roomToJoin = rooms.find(r => r.id === notif.roomId);
      if (roomToJoin) {
        handleJoinRoom(roomToJoin);
      }
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (activeTab === 'ondemand') {
      const fetchAllRecordings = async () => {
        try {
          const q = query(collection(db, "recordings"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          setAllRecordings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
          console.error("Failed to fetch all recordings", err);
        }
      };
      fetchAllRecordings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user) {
      setFollowingIds([]);
      return;
    }
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      setFollowingIds(snapshot.docs.map(d => d.data().followingId));
    });
  }, [user]);

  const [externalRooms, setExternalRooms] = useState<LiveRoom[]>([]);

  useEffect(() => {
    // Fetch external API streams
    fetch('/api/external-streams')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExternalRooms(data);
        }
      })
      .catch(err => console.error("Failed to fetch external streams", err));
  }, []);

  useEffect(() => {
    let q = query(
      collection(db, 'lives'),
      where('status', '==', 'active'),
      orderBy('startedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      let allRooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LiveRoom));
      
      // Add Demo Agency Rooms
      const demoAgencyRooms: LiveRoom[] = [
        {
          id: 'agency-1',
          modelId: 'agency-u-1',
          modelName: 'Elena_Live',
          modelPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=600&q=80',
          title: 'Morning Coffee & Chat ☕️ [Agency Partner]',
          category: 'agency',
          status: 'active',
          viewerCount: 1240,
          startedAt: Timestamp.now(),
          agoraChannel: 'agency_1',
          isExternal: true,
          agencyName: 'Global Stream Co.'
        },
        {
          id: 'agency-2',
          modelId: 'agency-u-2',
          modelName: 'Sarah_Vibe',
          modelPhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&h=600&q=80',
          title: 'Late Night Music & Dance 💃 [Agency Partner]',
          category: 'agency',
          status: 'active',
          viewerCount: 850,
          startedAt: Timestamp.now(),
          agoraChannel: 'agency_2',
          isExternal: true,
          agencyName: 'Elite Models API'
        }
      ];
      
      const uniqueRooms = [...allRooms];
      demoAgencyRooms.forEach(demo => {
        if (!uniqueRooms.some(r => r.id === demo.id)) {
          uniqueRooms.push(demo);
        }
      });
      externalRooms.forEach(ext => {
        if (!uniqueRooms.some(r => r.id === ext.id)) {
          uniqueRooms.push(ext as any);
        }
      });
      setRooms(uniqueRooms);
    });
  }, [externalRooms]);

  const filteredRooms = rooms.filter(room => {
    if (activeTab === 'following' && !followingIds.includes(room.modelId)) return false;
    if (activeTab === 'trending' && room.viewerCount <= 10) return false;
    if (streamCategory !== 'all' && room.category !== streamCategory) return false;
    return true;
  });

  const handleJoinRoom = async (room: LiveRoom) => {
    if (room.adultFlag && !profile?.ageVerified) {
      setShowAgeVerification(true);
      return;
    }
    if (room.sectionId && !profile?.unlockedSections?.includes(room.sectionId)) {
      setShowSecretSections(true);
      return;
    }
    if (room.isVip && room.modelId !== user?.uid) {
      if (!profile?.purchasedVipRooms?.includes(room.id)) {
        setShowVipPurchase({ show: true, room });
        return;
      }
    }
    
    await joinRoom(room);
  };

  const joinRoom = async (room: LiveRoom) => {
    // Client-side quick check
    if (room.viewerLimit && room.viewerLimit > 0 && room.viewerCount >= room.viewerLimit) {
      alert(`This room is full! Max viewer limit of ${room.viewerLimit} reached.`);
      return;
    }

    // Fetch viewer token if needed
    try {
      const response = await fetch('/api/live/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: room.agoraChannel, uid: 0, roomId: room.id })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setActiveToken(data.token);
        } else {
          setActiveToken(undefined);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "ROOM_FULL" || response.status === 403) {
          alert(errorData.message || `This room is full and cannot accept more viewers (Limit: ${room.viewerLimit || 'max'}).`);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch viewer token", err);
      setActiveToken(undefined);
    }
    
    setActiveRoom(room);
  };

  const verifyAge = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/user/verify-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      if (response.ok) {
        setShowAgeVerification(false);
      }
    } catch (err) {
      console.error("Age verification failed", err);
    }
  };

  return (
    <div className="fixed inset-0 sm:py-4 md:py-8 flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Premium ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />
      
      <div className={cn(
        "w-full h-[100dvh] sm:max-w-[460px] sm:max-h-[900px] relative overflow-hidden transition-colors duration-500 flex flex-col",
        "sm:rounded-[3rem] sm:border-[8px] sm:border-zinc-900 shadow-2xl backdrop-blur-3xl bg-black/60",
        activeTab === 'artists' ? "bg-[#2a0000]/90" : "bg-black/90",
        "text-zinc-100 selection:bg-rose-500/30"
      )}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar flex flex-col h-full w-full">
        <Navbar 
          onOpenWallet={() => setShowWallet(true)} 
          onOpenStartLive={() => setShowStartLive(true)} 
          onOpenStore={() => setShowStore(true)}
          onOpenAdmin={() => setShowAdminDashboard(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenKhokhaVoice={() => setShowKhokhaVoice(true)}
          onLoginError={(err) => setLoginError(err)}
          notifications={notifications}
          onClearNotifications={handleClearNotifications}
          onNotificationClick={handleNotificationClick}
        />

        {loginError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-3 animate-in slide-in-from-top-4">
            <span>{loginError}</span>
            <button onClick={() => setLoginError(null)} className="hover:bg-red-600 p-1 rounded-full">
              <LogOut className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}

        <main className="flex-1 pt-6 pb-32 sm:pb-12 px-4 max-w-7xl mx-auto w-full">
          <section className="mb-10 px-2 sm:px-0">
            <div className={cn(
              "relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[3/1] border border-zinc-800 transition-all duration-500",
              activeTab === 'artists' ? "bg-gradient-to-r from-[#FF4D4D] to-[#FFD166]" : "bg-zinc-900"
            )}>
              <img 
                src="https://images.unsplash.com/photo-1516280440502-a2989cb34dd0?auto=format&fit=crop&w=1200&q=80" 
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-500",
                  activeTab === 'artists' ? "opacity-20 blur-[1px]" : "opacity-30 blur-[2px]"
                )}
                referrerPolicy="no-referrer"
              />
              <div className={cn(
                "absolute inset-0 flex flex-col justify-center p-6 sm:p-12 transition-all duration-500",
                activeTab === 'artists' ? "bg-transparent" : "bg-gradient-to-r from-black/80 via-black/40 to-transparent"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={cn("w-4 h-4", activeTab === 'artists' ? "text-[#0F0F0F]" : "text-primary")} />
                  <span className={cn("font-bold text-[10px] uppercase tracking-[0.2em]", activeTab === 'artists' ? "text-[#0F0F0F]" : "text-primary/90")}>
                    {activeTab === 'artists' ? "Featured Artists" : "Trending Now"}
                  </span>
                </div>
                <h1 className={cn(
                  "text-3xl sm:text-5xl font-black mb-3 leading-[1.1] transition-colors duration-500",
                  activeTab === 'artists' ? "text-[#0F0F0F]" : "text-white"
                )}>
                  {activeTab === 'artists' ? (
                    <>Khokha <br /> <span className="text-[#8B0000]">Artists</span></>
                  ) : (
                    <>Connect with <br /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-500">Live Creators</span></>
                  )}
                </h1>
                <p className={cn(
                  "max-w-xs sm:max-w-sm text-xs sm:text-sm mb-6 leading-relaxed opacity-90 transition-colors duration-500",
                  activeTab === 'artists' ? "text-[#0F0F0F]/80" : "text-zinc-300"
                )}>
                  {activeTab === 'artists' 
                    ? "Explore the best musical talents across all genres. Support your favorite artists and discover new sounds."
                    : "Join the most vibrant community of live streamers. Support your favorites with gifts and chat in real-time."
                  }
                </p>
                <div className="flex items-center gap-3">
                  <button className={cn(
                    "px-6 py-2.5 text-sm font-bold rounded-full transition-all hover:scale-105 active:scale-95",
                    activeTab === 'artists' ? "bg-[#0F0F0F] text-[#FFD166] hover:bg-black" : "bg-white text-black hover:bg-zinc-100"
                  )}>
                    Explore All
                  </button>
                  <button className={cn(
                    "px-6 py-2.5 text-sm font-bold rounded-full border transition-all hover:scale-105 active:scale-95",
                    activeTab === 'artists' ? "bg-transparent border-[#0F0F0F] text-[#0F0F0F] hover:bg-[#0F0F0F]/10" : "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                  )}>
                    {activeTab === 'artists' ? "Top Artists" : "Top Models"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-6 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {(['all', 'trending', 'following', 'artists', 'ondemand'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "text-sm font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap py-2 px-1",
                    activeTab === tab 
                      ? (activeTab === 'artists' ? "text-[#FFD166]" : "text-white") 
                      : (activeTab === 'artists' ? "text-[#FFAAAA]/60 hover:text-[#FFAAAA]" : "text-zinc-500 hover:text-zinc-300")
                  )}
                >
                  {tab === 'ondemand' ? 'on-demand' : tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="tab-underline" 
                      className={cn(
                        "absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full",
                        activeTab === 'artists' ? "bg-[#FFD166]" : "bg-primary"
                      )} 
                    />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'artists' && (
              <div className="flex items-center gap-3 pb-4 sm:pb-0">
                <span className="text-[#FFD166] text-[10px] font-bold uppercase tracking-widest">Genre:</span>
                <select 
                  value={artistCategory}
                  onChange={(e) => setArtistCategory(e.target.value as any)}
                  className="bg-[#B22222] border-none text-[#FFD166] text-xs rounded-lg px-4 py-2 outline-none hover:bg-[#FF4D4D] hover:text-[#0F0F0F] transition-all cursor-pointer font-bold"
                >
                  <option value="all">All Genres</option>
                  <option value="pop">Pop</option>
                  <option value="hiphop">Hip Hop</option>
                  <option value="rock">Rock</option>
                  <option value="jazz">Jazz</option>
                </select>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'trending') && (
              <div className="flex items-center gap-3 pb-4 sm:pb-0">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Genre:</span>
                <select 
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 text-white text-xs rounded-xl px-4 py-2 outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="all">All Streams</option>
                  <option value="chatting">Chatting</option>
                  <option value="girls">Girls</option>
                  <option value="adults">Adults</option>
                  <option value="gaming">Gaming</option>
                  <option value="music">Music</option>
                  <option value="agency">Partner Agencies</option>
                </select>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 pb-8">
            <AnimatePresence mode="popLayout">
              {activeTab === 'artists' ? (
                ARTISTS.filter(a => artistCategory === 'all' || a.category === artistCategory).map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))
              ) : activeTab === 'ondemand' ? (
                allRecordings.length > 0 ? allRecordings.map((rec) => (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-950 border border-zinc-900 hover:border-zinc-850 rounded-3xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden group transition-all"
                  >
                    <div className="absolute top-3 right-3 bg-rose-500/10 text-rose-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Mic className="w-2.5 h-2.5" />
                      Recorded
                    </div>
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.modelId || rec.modelName}`} 
                        className="w-12 h-12 rounded-2xl border border-zinc-800 object-cover bg-zinc-900"
                        referrerPolicy="no-referrer"
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-white font-bold text-sm truncate">{rec.title}</h4>
                        <p className="text-zinc-500 text-xs">@{rec.modelName}</p>
                      </div>
                    </div>
                    
                    <div className="p-2 bg-zinc-900/60 rounded-2xl border border-zinc-850">
                      <audio controls src={rec.audioData} className="w-full h-8 mt-1 accent-rose-500" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium px-1">
                      <span>Live replay</span>
                      <span>
                        {rec.createdAt ? (rec.createdAt._seconds ? new Date(rec.createdAt._seconds * 1000).toLocaleDateString() : rec.createdAt.seconds ? new Date(rec.createdAt.seconds * 1000).toLocaleDateString() : 'Just now') : 'Just now'}
                      </span>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-650 gap-4">
                    <Mic className="w-12 h-12 opacity-20" />
                    <p className="text-lg font-medium italic">
                      No recorded streams available yet.
                    </p>
                  </div>
                )
              ) : filteredRooms.length > 0 ? filteredRooms.map((room) => (
                <LiveCard 
                  key={room.id} 
                  room={room} 
                  onClick={() => handleJoinRoom(room)} 
                />
              )) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 gap-4">
                  <Video className="w-12 h-12 opacity-20" />
                  <p className="text-lg font-medium italic">
                    {activeTab === 'following' 
                      ? "You're not following any active models right now." 
                      : "No active streams right now. Be the first to go live!"}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Modals */}
        <AnimatePresence>
          {showKhokhaVoice && <KhokhaVoice onClose={() => setShowKhokhaVoice(false)} />}
          {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
          {showCommunityChat && <CommunityChat onClose={() => setShowCommunityChat(false)} />}
          {showWallet && <WalletModal onClose={() => setShowWallet(false)} onOpenWeb3={() => setShowWeb3Portal(true)} />}
          {showWeb3Portal && <Web3Portal profile={profile} onClose={() => setShowWeb3Portal(false)} />}
          {showStore && <StoreModal onClose={() => setShowStore(false)} />}
          {showAgeVerification && <AgeVerificationModal onClose={() => setShowAgeVerification(false)} onVerify={verifyAge} />}
          {showSecretSections && <SecretSectionModal onClose={() => setShowSecretSections(false)} />}
          {showPrivateStore && <ProductStore onClose={() => setShowPrivateStore(false)} />}
          {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}
          {showCommandCenter && <LiveCommandCenter onClose={() => setShowCommandCenter(false)} />}
          {showBecomeModel && <BecomeModelModal onClose={() => setShowBecomeModel(false)} />}
          {showVipPurchase.show && showVipPurchase.room && (
            <VipPurchaseModal 
              room={showVipPurchase.room} 
              onClose={() => setShowVipPurchase({show: false, room: null})} 
              onPurchase={(room) => {
                setShowVipPurchase({show: false, room: null});
                joinRoom(room);
              }} 
            />
          )}
          {showStartLive && (
            <StartLiveModal 
              onClose={() => setShowStartLive(false)} 
              onStart={(room, token) => {
                setShowStartLive(false);
                setActiveRoom(room);
                setActiveToken(token);
              }}
            />
          )}
          {activeRoom && (
            <LiveRoomOverlay 
              room={activeRoom} 
              token={activeToken}
              onClose={() => {
                setActiveRoom(null);
                setActiveToken(undefined);
              }} 
              onShareClick={(url, title) => {
                setShowShareModal({ show: true, type: 'stream', url, title });
              }}
            />
          )}

          {showShareModal && showShareModal.show && (
            <ShareModal 
              url={showShareModal.url} 
              title={showShareModal.title} 
              type={showShareModal.type} 
              onClose={() => setShowShareModal(null)} 
            />
          )}
        </AnimatePresence>

        {/* Floating Chat Button */}
        {!activeRoom && (
          <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-4">
            <button 
              onClick={() => setShowPrivateStore(true)}
              className="w-14 h-14 bg-gold text-black rounded-full shadow-2xl shadow-gold/20 flex items-center justify-center hover:scale-110 transition-all active:scale-95 group"
              title="Private Store"
            >
              <ShoppingBag className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowSecretSections(true)}
              className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 group"
              title="Secret Sections"
            >
              <Lock className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowCommunityChat(true)}
              className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:bg-primary/80 transition-all active:scale-95 group"
              title="Community Chat"
            >
              <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full" />
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-zinc-900 py-12 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <Video className="text-zinc-400 w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-zinc-400">KHOKHA</span>
          </div>
          <p className="text-zinc-600 text-xs">© 2026 Khokha Live Streaming. All rights reserved.</p>
        </footer>
        </div>
        
        <div className="w-full absolute bottom-0 left-0 z-50">
          <BottomNav 
            profile={profile} 
            onOpenWallet={() => setShowWallet(true)}
            onOpenStartLive={() => setShowStartLive(true)}
            onOpenStore={() => setShowStore(true)}
            onOpenAdmin={() => setShowAdminDashboard(true)}
            onOpenProfile={() => setShowProfile(true)}
          />
        </div>
      </div>
    </div>
  );
}
