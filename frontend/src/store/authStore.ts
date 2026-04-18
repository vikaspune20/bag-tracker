import { create } from 'zustand';
import api from '../utils/api';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  identificationNo?: string;
  profilePicUrl?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True after checkAuth finishes (handles token + /auth/profile). Prevents Layout redirect before user loads. */
  authReady: boolean;
  login: (userData: User, tokenStr: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  authReady: false,

  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, authReady: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, authReady: true });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    try {
      const stored = localStorage.getItem('token');
      if (!stored) {
        set({ user: null, token: null, isAuthenticated: false, authReady: true });
        return;
      }
      const response = await api.get('/auth/profile');
      set({
        user: response.data.user,
        token: stored,
        isAuthenticated: true,
        authReady: true,
      });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, authReady: true });
    }
  },
}));
