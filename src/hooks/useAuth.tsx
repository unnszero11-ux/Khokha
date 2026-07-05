import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial check/creation
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined,
            balance: 0,
            earnings: 0,
            role: (firebaseUser.email === 'cardsnour6@gmail.com' || firebaseUser.email === 'khokha@admin.com') ? 'admin' : 'user',
            createdAt: serverTimestamp() as any,
          };
          await setDoc(userRef, newProfile);
        } else {
          const data = userDoc.data();
          if ((firebaseUser.email === 'cardsnour6@gmail.com' || firebaseUser.email === 'khokha@admin.com') && data.role !== 'admin') {
            await setDoc(userRef, { role: 'admin' }, { merge: true });
          }
        }

        // Real-time listener for profile (balance, earnings, etc.)
        unsubscribeProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserProfile;
            if (data.email === 'cardsnour6@gmail.com' || data.email === 'khokha@admin.com') data.role = 'admin';
            setProfile(data);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
