import { create } from "zustand";
import { UserRole } from "../types";
import { toast } from "./useUIStore";
import api from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { resetSampleData } from "../lib/mockData";

export interface RoleDefinition {
  label: string;
  user: string;
  can: string[];
}

export const ROLES: Record<UserRole, RoleDefinition> = {
  admin: {
    label: "Administrator",
    user: "Amina Yusuf",
    can: ["quotes", "invoices", "payments", "customers", "settings", "audit"],
  },
  accountant: {
    label: "Accountant",
    user: "Hassan Ali",
    can: ["invoices", "payments"],
  },
  sales: {
    label: "Sales Officer",
    user: "Faadumo Nur",
    can: ["quotes", "customers"],
  },
  viewer: {
    label: "Viewer",
    user: "Guest Viewer",
    can: [],
  },
};

export const DEMO_CREDENTIALS: Record<
  UserRole,
  { email: string; pass: string }
> = {
  admin: { email: "admin@safetech.so", pass: "Admin@123" },
  accountant: { email: "accountant@safetech.so", pass: "Accountant@123" },
  sales: { email: "sales@safetech.so", pass: "Sales@123" },
  viewer: { email: "viewer@safetech.so", pass: "Viewer@123" },
};

export async function switchRoleAuth(newRole: UserRole) {
  const creds = DEMO_CREDENTIALS[newRole];
  if (!creds) return;
  try {
    const res = await api.post("/auth/login", {
      email: creds.email,
      password: creds.pass,
    });
    if (res.data?.token) {
      localStorage.setItem("safetech_token", res.data.token);
      useAuthStore.setState({ token: res.data.token });
      queryClient.invalidateQueries();
    }
  } catch {
    // Graceful fallback to offline/mock mode
  }
}

export function getAvatarInitials(userName: string): string {
  return userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface UserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  companyName?: string;
  onboardingCompleted?: boolean;
  isVerified?: boolean;
  isDemo?: boolean;
}

interface AuthState {
  role: UserRole;
  user: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  setUser: (user: Partial<UserProfile>, token?: string) => void;
  can: (permission: string) => boolean;
  needs: (permission: string) => boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  bootstrapDemoSession: () => void;
  exitDemoSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialRole: UserRole = "admin";
  const storedToken =
    typeof window !== "undefined"
      ? localStorage.getItem("safetech_token")
      : null;
  const isStoredDemo =
    typeof window !== "undefined" &&
    (localStorage.getItem("safetech_is_demo") === "true" || storedToken === "demo_token_admin");
  const isAuthRoute =
    typeof window !== "undefined" &&
    ["login", "signup", "onboarding", "accept-invite", "verify"].some((r) =>
      window.location.hash.toLowerCase().includes(r),
    );
  const initialToken = isAuthRoute ? null : storedToken;

  const initialUser: UserProfile = isStoredDemo
    ? {
        id: "usr_demo_admin",
        name: "Mohamed Aweis (Demo Admin)",
        fullName: "Mohamed Aweis (Demo Admin)",
        email: "demo@sayftek.com",
        phone: "+252 61 8294023",
        role: "admin",
        isVerified: true,
        isDemo: true,
        onboardingCompleted: true,
        companyName: "Safe Tech Solutions",
      }
    : initialToken
    ? {
        id: `usr_${initialRole}`,
        name: ROLES[initialRole].user,
        fullName: ROLES[initialRole].user,
        email: `${initialRole}@safetech.so`,
        role: initialRole,
        onboardingCompleted: true,
      }
    : {
        id: "",
        name: "",
        fullName: "",
        email: "",
        role: "viewer",
        onboardingCompleted: false,
      };

  return {
    role: isStoredDemo ? "admin" : initialRole,
    user: initialUser,
    token: initialToken,
    isAuthenticated: Boolean(initialToken),
    isLoading: false,

    setRole: (newRole: UserRole) => {
      const roleInfo = ROLES[newRole];
      const demoToken = `demo_token_${newRole}`;
      if (typeof window !== "undefined") {
        localStorage.setItem("safetech_token", demoToken);
      }
      set({
        role: newRole,
        user: {
          id: `usr_${newRole}`,
          name: roleInfo.user,
          fullName: roleInfo.user,
          email: `${newRole}@safetech.so`,
          role: newRole,
        },
        token: demoToken,
        isAuthenticated: true,
      });
      toast(`Now viewing as ${roleInfo.label} (${roleInfo.user})`);
      queryClient.invalidateQueries();
      switchRoleAuth(newRole);
    },

    setUser: (userUpdates: Partial<UserProfile>, token?: string) => {
      if (token && typeof window !== "undefined") {
        localStorage.setItem("safetech_token", token);
      }
      set((state) => {
        const updatedUser: UserProfile = {
          ...state.user,
          ...userUpdates,
          name: userUpdates.fullName || userUpdates.name || state.user.name,
          fullName:
            userUpdates.fullName || userUpdates.name || state.user.fullName,
        };
        return {
          user: updatedUser,
          role: updatedUser.role || state.role,
          token: token || state.token,
          isAuthenticated: true,
        };
      });
      queryClient.invalidateQueries();
    },

    can: (permission: string) => {
      const currentRole = get().role;
      return ROLES[currentRole].can.includes(permission);
    },

    needs: (permission: string) => {
      if (get().can(permission)) {
        return true;
      }
      const currentRole = get().role;
      toast(
        `${ROLES[currentRole].label}s can't do that. Switch role to try it.`,
        true,
      );
      return false;
    },

    logout: async () => {
      try {
        await api.post("/auth/logout");
      } catch {
        // Continue clearing client credentials even if backend network call fails
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("safetech_token");
        localStorage.removeItem("safetech_is_demo");
      }
      set({
        token: null,
        isAuthenticated: false,
        user: {
          id: "",
          name: "Signed Out",
          fullName: "Signed Out",
          email: "",
          role: "viewer",
          isDemo: false,
          onboardingCompleted: false,
        },
        role: "viewer",
      });
      queryClient.clear();
      // Route to login
      if (typeof window !== "undefined") {
        window.location.hash = "#login";
      }
      toast("Signed out successfully");
    },

    checkAuth: async () => {
      if (get().user?.isDemo || get().token === "demo_token_admin") {
        return;
      }
      set({ isLoading: true });
      try {
        const res = await api.get("/auth/me");
        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          set({
            isAuthenticated: true,
            user: {
              id: u.id || u._id,
              name: u.fullName || u.name,
              fullName: u.fullName || u.name,
              email: u.email,
              phone: u.phone,
              role: u.role,
              companyName: u.companyName,
              onboardingCompleted: u.onboardingCompleted ?? u.role !== "admin",
            },
            role: u.role,
            isLoading: false,
          });
        }
      } catch {
        set({ isLoading: false });
      }
    },

    bootstrapDemoSession: () => {
      resetSampleData();
      const demoUser: UserProfile = {
        id: "usr_demo_admin",
        name: "Mohamed Aweis (Demo Admin)",
        fullName: "Mohamed Aweis (Demo Admin)",
        email: "demo@sayftek.com",
        phone: "+252 61 8294023",
        role: "admin",
        isVerified: true,
        isDemo: true,
        onboardingCompleted: true,
        companyName: "Safe Tech Solutions",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("safetech_token", "demo_token_admin");
        localStorage.setItem("safetech_is_demo", "true");
        window.location.hash = "#dashboard";
      }

      set({
        role: "admin",
        user: demoUser,
        token: "demo_token_admin",
        isAuthenticated: true,
        isLoading: false,
      });

      queryClient.invalidateQueries();
      toast("Entered Live Demo Mode as Mohamed Aweis (Admin)");
    },

    exitDemoSession: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("safetech_token");
        localStorage.removeItem("safetech_is_demo");
        window.location.hash = "#login";
      }

      set({
        token: null,
        isAuthenticated: false,
        user: {
          id: "",
          name: "Signed Out",
          fullName: "Signed Out",
          email: "",
          role: "viewer",
          isDemo: false,
          onboardingCompleted: false,
        },
        role: "viewer",
      });

      queryClient.clear();
      toast("Exited Live Demo Mode");
    },
  };
});

// Auto-seed and login in background if needed, except when directly visiting auth/onboarding screens or in demo mode
if (typeof window !== "undefined") {
  const hash = window.location.hash.toLowerCase();
  const isAuthRoute =
    hash.includes("login") ||
    hash.includes("signup") ||
    hash.includes("onboarding") ||
    hash.includes("accept-invite") ||
    hash.includes("verify");
  const isDemoActive =
    localStorage.getItem("safetech_is_demo") === "true" ||
    localStorage.getItem("safetech_token") === "demo_token_admin";
  if (!isAuthRoute && !isDemoActive) {
    switchRoleAuth("admin");
  }
}
