// store/auth.ts
import { create } from "zustand";
import api from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: "partner"; // all auth based on partner table
  role: "agent" | "counsellor" | "admin";
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null, token?: string | null) => void;
  initAuth: () => Promise<void>;
  getToken: () => string | null;
}

// Token and session helpers
const setAuthToken = (token: string) => {
  document.cookie = `auth-token=${encodeURIComponent(
    token
  )}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=strict`;
};

const getAuthToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const tokenCookie = cookies.find((c) => c.trim().startsWith("auth-token="));
  if (!tokenCookie) return null;
  try {
    const value = tokenCookie.split("=")[1];
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const clearAuthToken = () => {
  document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
};

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
  token: null,
  loading: false,

  getToken: () => {
    return get().token || getAuthToken();
  },

  initAuth: async () => {
    set({ loading: true });

    // Try to restore from cookies
    const token = getAuthToken();
    const partnerUser = getPartnerCookie();
    
    if (token && partnerUser) {
      set({
        isAuthenticated: true,
        user: partnerUser,
        token,
        loading: false,
      });
      return;
    }

    // Clear invalid session
    clearAuthToken();
    clearPartnerCookie();
    set({ loading: false });
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      // Backend returns { access_token, partner: { id, name, role, email } }
      const response = await api.AuthAPI.login(email, password);
      const { access_token, partner } = response;

      const partnerUser: AuthUser = {
        id: partner.id,
        email: partner.email,
        name: partner.name,
        type: "partner",
        role: partner.role,
      };

      // Store token and user info in cookies
      setAuthToken(access_token);
      setPartnerCookie(partnerUser);

      set({
        isAuthenticated: true,
        user: partnerUser,
        token: access_token,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      console.error("Partner login failed:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.AuthAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    clearAuthToken();
    clearPartnerCookie();
    set({ isAuthenticated: false, user: null, token: null, loading: false });
  },

  setUser: (user, token = null) => {
    if (user && user.type === "partner") {
      setPartnerCookie(user);
      if (token) {
        setAuthToken(token);
      }
    } else if (!user) {
      clearAuthToken();
      clearPartnerCookie();
    }
    set({ isAuthenticated: !!user, user, token, loading: false });
  },
}));
