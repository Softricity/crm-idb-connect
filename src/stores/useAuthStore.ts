// store/auth.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface AuthUser {
  id: string;
  email: string;
  type: "partner"; // all auth based on partner table
  role: "agent" | "counsellor" | "admin";
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
  document.cookie = `partner-session=${encodeURIComponent(
    JSON.stringify(user)
  )}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=strict`;
};

const clearPartnerCookie = () => {
  document.cookie =
    "partner-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
};

const getPartnerCookie = (): AuthUser | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const partnerCookie = cookies.find((c) =>
    c.trim().startsWith("partner-session=")
  );

  if (!partnerCookie) return null;

  try {
    const value = partnerCookie.split("=")[1];
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

    // Check Supabase session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.email) {
      // Lookup partner entry
      const { data: partner } = await supabase
        .from("partners")
        .select("*")
        .eq("email", session.user.email)
        .single();

      if (partner) {
        const partnerUser: AuthUser = {
          id: partner.id,
          email: partner.email,
          type: "partner",
          role: partner.role,
        };

        set({
          isAuthenticated: true,
          user: partnerUser,
          loading: false,
        });
        setPartnerCookie(partnerUser);
        return;
      }
    }

    // Cookie fallback
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

    // Partner login only
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("*")
      .eq("email", email)
      .eq("password", password) // ⚠️ plaintext, hash in production
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

    setPartnerCookie(partnerUser);

    set({
      isAuthenticated: true,
      user: partnerUser,
      loading: false,
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    clearPartnerCookie();
    set({ isAuthenticated: false, user: null, loading: false });
  },

  setUser: (user) => {
    if (user && user.type === "partner") {
      setPartnerCookie(user);
    } else if (!user) {
      clearPartnerCookie();
    }
    set({ isAuthenticated: !!user, user, loading: false });
  },
}));
