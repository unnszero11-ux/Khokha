import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'model' | 'admin' | 'client';

export interface ModelApplication {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  fullName: string;
  age: number;
  socialLinks: string;
  contentDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  balance: number;
  earnings: number;
  role: UserRole;
  ageVerified?: boolean;
  unlockedSections?: string[];
  purchasedVipRooms?: string[];
  isBanned?: boolean;
  followingCount?: number;
  followersCount?: number;
  createdAt: Timestamp;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}

export type LiveStatus = 'active' | 'ended';

export type LiveCategory = 'adults' | 'girls' | 'chatting' | 'gaming' | 'music' | 'agency';

export interface LiveRoom {
  id: string;
  modelId: string;
  modelName: string;
  modelPhoto?: string;
  title: string;
  category: LiveCategory;
  status: LiveStatus;
  viewerCount: number;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  agoraChannel: string;
  adultFlag?: boolean;
  isVip?: boolean;
  vipPrice?: number;
  vipDescription?: string;
  sectionId?: string;
  earnings?: number;
  thumbnailUrl?: string;
  isExternal?: boolean;
  agencyName?: string;
  externalUrl?: string;
  enableRecording?: boolean;
  viewerLimit?: number;
}

export interface Gift {
  id: string;
  name: string;
  value: number;
  icon: string;
  adultFlag?: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  type: 'coins' | 'gift' | 'premium' | 'adult' | 'secret';
  price: number;
  bonus?: number;
  adultFlag?: boolean;
  image?: string;
  icon?: string;
}

export interface Order {
  id: string;
  userId: string;
  itemId: string;
  status: 'pending' | 'completed' | 'cancelled';
  amount: number;
  createdAt: Timestamp;
}

export type TransactionType = 'deposit' | 'gift_sent' | 'gift_received' | 'purchase';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  relatedId?: string;
  createdAt: Timestamp;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string; // liveId or userId
  targetType: 'live' | 'user';
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
}

export interface Section {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'vip' | 'secret';
  price?: number;
  image?: string;
  createdAt: Timestamp;
}

export interface Artist {
  id: string;
  name: string;
  category: 'pop' | 'hiphop' | 'rock' | 'jazz';
  image: string;
  description?: string;
}
