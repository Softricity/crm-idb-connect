// store/auth.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: { id: string; email: string } | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      set({ loading: false });
      throw error;
    }

    if (data.user) {
      set({
        isAuthenticated: true,
        user: { id: data.user.id, email: data.user.email ?? "" },
        loading: false,
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null });
  },

  setUser: (user) =>
    set({
      isAuthenticated: !!user,
      user,
      loading: false,
    }),
}));

supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user
    ? { id: session.user.id, email: session.user.email ?? "" }
    : null;
  useAuthStore.getState().setUser(user);
});
