import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { getUserProfile } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signupWithEmail: (e: string, p: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => void;
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const p = await getUserProfile(currentUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const setupRecaptcha = (containerId: string) => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible'
      });
    }
  };

  const loginWithPhone = async (phoneNumber: string) => {
    const appVerifier = (window as any).recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    (window as any).confirmationResult = confirmationResult;
  };

  const verifyPhoneCode = async (code: string) => {
    const confirmationResult = (window as any).confirmationResult as ConfirmationResult;
    if (!confirmationResult) throw new Error("No confirmation result found");
    await confirmationResult.confirm(code);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      loginWithGoogle, loginWithEmail, signupWithEmail, 
      setupRecaptcha, loginWithPhone, verifyPhoneCode,
      logout, refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
