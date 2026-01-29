import { create } from 'zustand';
import type { User, SignInRequest, SignUpRequest } from '@chorechamp/types';
import { apiClient } from '../lib/api-client';
import { storage } from '../lib/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signIn: (data: SignInRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Check for existing token
      const token = await storage.getAuthToken();
      if (!token) {
        set({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      // Validate session with API
      const session = await apiClient.getSession();
      if (session?.user) {
        await storage.setUserData(session.user);
        set({ user: session.user, isAuthenticated: true, isLoading: false });
      } else {
        // Token is invalid, clear it
        await storage.clearAuth();
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch {
      // Network error or invalid session
      await storage.clearAuth();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  signIn: async (data: SignInRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.signIn(data);
      if (response.user) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false, error: 'Invalid response from server' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  signUp: async (data: SignUpRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.signUp(data);
      if (response.user) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false, error: 'Invalid response from server' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.signOut();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
