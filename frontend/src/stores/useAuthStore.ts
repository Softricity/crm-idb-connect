// store/auth.ts
import { create } from "zustand";
import api from "@/lib/api";
import { resetAllStores } from "@/stores/resetStores";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: "partner"; // all auth based on partner table
  role: string; // "agent" for external agents, other custom roles for internal team
  permissions: string[]; // Array of permission names from role_permissions
  branch_id?: string | null; // Branch ID
  branch_name?: string | null; // Branch name
  branch_type?: string | null; // Branch type: HeadOffice, Regional, Branch
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
      // Backend returns { access_token, payload: { sub, email, name, role, permissions, branch_id, branch_name, branch_type } }
      const response = await api.AuthAPI.login(email, password);
      const { access_token, partner:payload } = response;
      
      const partnerUser: AuthUser = {
        id: payload.id,
        email: payload.email,
        name: payload.name || email.split('@')[0], // Fallback to email username if name not provided
        type: "partner",
        role: payload.role,
        permissions: payload.permissions || [], // Store permissions from backend
        branch_id: payload.branch_id || null,
        branch_name: payload.branch_name || null,
        branch_type: payload.branch_type || null,
      };
      
      console.log("Login response payload:", partnerUser);
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
    // Reset other global stores to clean slate
    try {
      resetAllStores();
    } catch (e) {
      console.warn("Failed to reset stores during logout:", e);
    }

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
