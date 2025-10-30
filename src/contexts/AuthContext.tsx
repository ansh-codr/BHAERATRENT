import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (role: UserRole, university?: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  markTutorialCompleted: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const disallowedDomains = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'aol.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
]);

const allowedSuffixes = [
  '.edu',
  '.edu.in',
  '.edu.au',
  '.edu.sg',
  '.edu.my',
  '.edu.ph',
  '.edu.pk',
  '.edu.bd',
  '.edu.lk',
  '.edu.sa',
  '.edu.qa',
  '.college.edu',
  '.ac.in',
  '.ac.uk',
  '.ac.jp',
  '.ac.nz',
  '.ac.id',
  '.ac.kr',
  '.ac.za',
  '.ac.ke',
];

const validateUniversityEmail = (email: string): boolean => {
  if (!email?.includes('@')) return false;
  const [, domainPartRaw] = email.split('@');
  if (!domainPartRaw) return false;

  const domainPart = domainPartRaw.toLowerCase();

  if (disallowedDomains.has(domainPart)) {
    return false;
  }

  return allowedSuffixes.some((suffix) => domainPart.endsWith(suffix));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || data.displayName || 'User',
          photoURL: firebaseUser.photoURL || data.photoURL,
          role: data.role || 'renter',
          university: data.university || data.college || null,
          college: data.college || data.university || null,
          phone: data.phone || null,
          bio: data.bio || null,
          notificationsEnabled: data.notificationsEnabled ?? true,
          tutorialCompleted: data.tutorialCompleted ?? false,
          isVerified: data.isVerified || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!validateUniversityEmail(email)) {
      throw new Error('Only university email accounts are allowed to sign up.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      role: 'renter',
      isVerified: validateUniversityEmail(email),
      notificationsEnabled: true,
      tutorialCompleted: false,
      createdAt: new Date(),
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const email = userCredential.user.email || '';

    if (!validateUniversityEmail(email)) {
      await firebaseSignOut(auth);
      throw new Error('Only university email accounts are allowed to sign up.');
    }

    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          role: 'renter',
          isVerified: true,
          notificationsEnabled: true,
          tutorialCompleted: false,
          createdAt: new Date(),
        });
      } catch (err) {
        console.error('Failed to write user document after Google sign-in. This is likely a Firestore rules / permission issue:', err);
        try {
          const { default: toast } = await import('react-hot-toast');
          toast.error('Unable to create user profile in Firestore: check Firestore rules & authorized domains.');
        } catch (e) {
          console.error('Toast failed to load', e);
        }
        throw err;
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateUserRole = async (role: UserRole, university?: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await setDoc(doc(db, 'users', user.uid), {
      role,
      ...(university ? { university, college: university } : {}),
    }, { merge: true });

    const refreshed = await fetchUserData(user);
    if (refreshed) {
      setCurrentUser(refreshed);
    } else if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role,
        university: university ?? currentUser.university,
        college: university ?? currentUser.college,
      });
    }
  };

  const switchRole = async (role: UserRole) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await updateDoc(doc(db, 'users', user.uid), { role });
    const refreshed = await fetchUserData(user);
    if (refreshed) {
      setCurrentUser(refreshed);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { ...data }, { merge: true });
    const refreshed = await fetchUserData(user);
    if (refreshed) {
      setCurrentUser(refreshed);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, ...data } as User);
    }
  };

  const markTutorialCompleted = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await updateDoc(doc(db, 'users', user.uid), { tutorialCompleted: true });
    const refreshed = await fetchUserData(user);
    if (refreshed) {
      setCurrentUser(refreshed);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, tutorialCompleted: true });
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateUserRole,
    switchRole,
    updateProfile,
    markTutorialCompleted,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
