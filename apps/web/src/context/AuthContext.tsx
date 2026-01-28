import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      // Add timeout to prevent hanging if API is unavailable
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      );

      const session = await Promise.race([
        authApi.getSession(),
        timeoutPromise
      ]) as { user?: User } | null;

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch {
      // If API is unavailable or times out, just set user to null
      setUser(null);
    }
  };

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    await authApi.signIn(email, password);
    await refreshSession();
  };

  const signUp = async (email: string, password: string, name: string) => {
    await authApi.signUp(email, password, name);
    await refreshSession();
  };

  const signOut = async () => {
    await authApi.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
