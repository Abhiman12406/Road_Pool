import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type AuthUserProfile,
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  isFirebaseConfigured,
} from '../services/firebaseAuthService';

interface AuthContextValue {
  user: AuthUserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  login: typeof loginWithEmail;
  register: typeof registerWithEmail;
  loginWithGoogle: typeof loginWithGoogle;
  logout: typeof logoutUser;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        login: loginWithEmail,
        register: registerWithEmail,
        loginWithGoogle,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
