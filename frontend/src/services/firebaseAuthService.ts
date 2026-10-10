import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'passenger' | 'driver' | 'dispatcher';
  provider: 'password' | 'google' | 'demo';
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.MODE !== 'test' &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  !firebaseConfig.apiKey.includes('YOUR_')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (err) {
    console.warn('[RouteMates Firebase] Initialization warning, falling back to simulated session:', err);
  }
}

// Local storage session key for demo/offline fallback persistence
const DEMO_USER_STORAGE_KEY = 'routemates_auth_user_session';
let inMemoryDemoUser: AuthUserProfile | null = null;

function getStoredDemoUser(): AuthUserProfile | null {
  if (inMemoryDemoUser) return inMemoryDemoUser;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (!raw) return null;
      inMemoryDemoUser = JSON.parse(raw) as AuthUserProfile;
      return inMemoryDemoUser;
    }
  } catch {
    // Ignore storage errors
  }
  return inMemoryDemoUser;
}

function setStoredDemoUser(user: AuthUserProfile | null) {
  inMemoryDemoUser = user;
  try {
    if (typeof localStorage !== 'undefined') {
      if (user) {
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUserProfile> {
  if (auth && isFirebaseConfigured) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const profile: AuthUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      photoURL: user.photoURL,
      role: email.includes('driver') ? 'driver' : email.includes('ops') ? 'dispatcher' : 'passenger',
      provider: 'password',
    };
    setStoredDemoUser(profile);
    return profile;
  }

  // Graceful Demo / Local fallback when live Firebase keys are not populated yet
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (!email || !password) {
    throw new Error('Please provide both email and password.');
  }
  const role: 'passenger' | 'driver' | 'dispatcher' =
    email.includes('driver') ? 'driver' : email.includes('ops') ? 'dispatcher' : 'passenger';
  
  const profile: AuthUserProfile = {
    uid: 'demo-' + Math.random().toString(36).substring(2, 9),
    email,
    displayName: email.split('@')[0],
    photoURL: null,
    role,
    provider: 'demo',
  };
  setStoredDemoUser(profile);
  notifyDemoAuthListeners(profile);
  return profile;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: 'passenger' | 'driver' | 'dispatcher' = 'passenger'
): Promise<AuthUserProfile> {
  if (auth && isFirebaseConfigured) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    const profile: AuthUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || email.split('@')[0],
      photoURL: user.photoURL,
      role,
      provider: 'password',
    };
    setStoredDemoUser(profile);
    return profile;
  }

  // Demo Fallback
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  const profile: AuthUserProfile = {
    uid: 'demo-' + Math.random().toString(36).substring(2, 9),
    email,
    displayName: displayName || email.split('@')[0],
    photoURL: null,
    role,
    provider: 'demo',
  };
  setStoredDemoUser(profile);
  notifyDemoAuthListeners(profile);
  return profile;
}

export async function loginWithGoogle(): Promise<AuthUserProfile> {
  if (auth && isFirebaseConfigured) {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    const profile: AuthUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'passenger',
      provider: 'google',
    };
    setStoredDemoUser(profile);
    return profile;
  }

  // Demo Fallback for Google sign-in
  await new Promise((resolve) => setTimeout(resolve, 350));
  const profile: AuthUserProfile = {
    uid: 'google-demo-user-101',
    email: 'aditi.sharma@routemates.ai',
    displayName: 'Aditi Sharma',
    photoURL: null,
    role: 'passenger',
    provider: 'google',
  };
  setStoredDemoUser(profile);
  notifyDemoAuthListeners(profile);
  return profile;
}

export async function logoutUser(): Promise<void> {
  if (auth && isFirebaseConfigured) {
    await signOut(auth);
  }
  setStoredDemoUser(null);
  notifyDemoAuthListeners(null);
}

// Subscription helper for react hooks
type AuthCallback = (user: AuthUserProfile | null) => void;
const demoListeners: Set<AuthCallback> = new Set();

function notifyDemoAuthListeners(user: AuthUserProfile | null) {
  demoListeners.forEach((cb) => cb(user));
}

export function subscribeToAuth(callback: AuthCallback): () => void {
  if (auth && isFirebaseConfigured) {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const stored = getStoredDemoUser();
        const profile: AuthUserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'RouteMates User',
          photoURL: user.photoURL,
          role: stored?.role || 'passenger',
          provider: 'password',
        };
        callback(profile);
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  }

  // Fallback observer
  demoListeners.add(callback);
  callback(getStoredDemoUser());
  return () => {
    demoListeners.delete(callback);
  };
}

export function getCurrentUserSync(): AuthUserProfile | null {
  return getStoredDemoUser();
}
