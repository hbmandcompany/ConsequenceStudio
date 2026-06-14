import { create } from "zustand";

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
}

export interface AuthActions {
  signIn: (username: string, password: string) => boolean;
  signUp: (username: string, password: string) => boolean;
  signOut: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  isAuthenticated: false,
  username: "",
  signIn: (username, password) => {
    if (!username.trim() || !password.trim()) return false;
    set({ isAuthenticated: true, username: username.trim() });
    return true;
  },
  signUp: (username, password) => {
    if (!username.trim() || !password.trim()) return false;
    set({ isAuthenticated: true, username: username.trim() });
    return true;
  },
  signOut: () => set({ isAuthenticated: false, username: "" }),
}));
