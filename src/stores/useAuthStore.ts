// store/auth.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface AuthUser {
  id: string;
  email: string;
  type: "supabase" | "partner";
  role?: "agent" | "counsellor" | "admin"; 
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  initAuth: () => Promise<void>;
}

// Cookie helpers
const setPartnerCookie = (user: AuthUser) => {
  document.cookie = `partner-session=${JSON.stringify(user)}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=strict`;
};

const clearPartnerCookie = () => {
  document.cookie = 'partner-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
};

const getPartnerCookie = (): AuthUser | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const partnerCookie = cookies.find(c => c.trim().startsWith('partner-session='));
  
  if (!partnerCookie) return null;
  
  try {
    const value = partnerCookie.split('=')[1];
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  loading: false,

  initAuth: async () => {
    set({ loading: true });

    // Check Supabase session first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      set({
        isAuthenticated: true,
        user: { 
          id: session.user.id, 
          email: session.user.email ?? "", 
          type: "supabase", 
          role: "admin" 
        },
        loading: false,
      });
      return;
    }

    // Check partner cookie
    const partnerUser = getPartnerCookie();
    if (partnerUser) {
      set({
        isAuthenticated: true,
        user: partnerUser,
        loading: false,
      });
      return;
    }

    set({ loading: false });
  },

  login: async (email, password) => {
    set({ loading: true });

    // 1️⃣ Supabase Auth (admins)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (data?.user) {
      const user = { 
        id: data.user.id, 
        email: data.user.email ?? "", 
        type: "supabase" as const, 
        role: "admin" as const 
      };
      
      set({
        isAuthenticated: true,
        user,
        loading: false,
      });
      return;
    }

    // 2️⃣ Partner login
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("*")
      .eq("email", email)
      .eq("password", password) // ⚠️ plaintext, should hash in production
      .single();

    if (partnerError || !partner) {
      set({ loading: false });
      console.error("Partner login failed:", partnerError);
      throw partnerError || new Error("Invalid credentials");
    }

    const partnerUser: AuthUser = {
      id: partner.id,
      email: partner.email,
      type: "partner",
      role: partner.role,
    };

    // Set cookie for middleware
    setPartnerCookie(partnerUser);

    set({
      isAuthenticated: true,
      user: partnerUser,
      loading: false,
    });
  },

  logout: async () => {
    const { user } = get();
    
    // Logout from Supabase if it's a Supabase user
    if (user?.type === 'supabase') {
      await supabase.auth.signOut();
    }
    
    // Clear partner cookie
    clearPartnerCookie();
    
    set({ isAuthenticated: false, user: null, loading: false });
  },

  setUser: (user) => {
    if (user && user.type === 'partner') {
      setPartnerCookie(user);
    } else if (!user) {
      clearPartnerCookie();
    }
    set({ isAuthenticated: !!user, user, loading: false });
  },
}));