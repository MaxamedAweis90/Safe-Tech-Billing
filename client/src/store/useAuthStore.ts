import { create } from "zustand";
import { UserRole, UserProfile } from "../types";
import { api } from "../lib/api";
import { toast } from "./useUIStore";
import { queryClient } from "../lib/queryClient";
import { resetSampleData } from "../lib/mockData";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export const ROLES: Record<
  UserRole,
  { label: string; user: string; can: string[] }
> = {
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

export const DEMO_BYPASS_ACCOUNT = {
  email: "demo@account.com",
  name: "Demo Administrator",
  role: "admin" as UserRole,
  phone: "+252610000000",
};

export function getAvatarInitials(userName?: string): string {
  if (!userName || !userName.trim()) return "ST";
  return userName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface AuthState {
  role: UserRole;
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
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
  const isStoredDemo =
    typeof window !== "undefined" &&
    localStorage.getItem("safetech_is_demo") === "true";

  const storedToken =
    typeof window !== "undefined"
      ? localStorage.getItem("safetech_token")
      : null;

  return {
    role: isStoredDemo ? "admin" : "viewer",
    user: isStoredDemo
      ? {
          id: "usr_demo_admin",
          name: DEMO_BYPASS_ACCOUNT.name,
          fullName: DEMO_BYPASS_ACCOUNT.name,
          email: DEMO_BYPASS_ACCOUNT.email,
          phone: DEMO_BYPASS_ACCOUNT.phone,
          role: "admin",
          isVerified: true,
          isDemo: true,
          onboardingCompleted: true,
          companyName: "Safe Tech Solutions",
        }
      : null,
    token: storedToken,
    isAuthenticated: isStoredDemo,
    isLoading: !isStoredDemo && Boolean(storedToken),
    authStatus: isStoredDemo
      ? "authenticated"
      : storedToken
      ? "loading"
      : "idle",

    setRole: (newRole: UserRole) => {
      // Role switching restricted to existing demo session or administrative users
      const currentUser = get().user;
      if (!currentUser?.isDemo && currentUser?.role !== "admin") {
        toast("Only workspace administrators can switch simulated roles.", true);
        return;
      }
      const roleInfo = ROLES[newRole];
      set({
        role: newRole,
        user: {
          id: currentUser?.id || `usr_${newRole}`,
          name: roleInfo.user,
          fullName: roleInfo.user,
          email: currentUser?.email || `${newRole}@safetech.so`,
          role: newRole,
          isDemo: true,
          onboardingCompleted: true,
        },
      });
      toast(`Now viewing as ${roleInfo.label} (${roleInfo.user})`);
      queryClient.invalidateQueries();
    },

    setUser: (userUpdates: Partial<UserProfile>, token?: string) => {
      if (token && typeof window !== "undefined") {
        localStorage.setItem("safetech_token", token);
      }
      set((state) => {
        const baseUser: UserProfile = state.user || {
          id: "",
          name: "",
          fullName: "",
          email: "",
          role: "admin",
        };
        const updatedUser: UserProfile = {
          ...baseUser,
          ...userUpdates,
          name: userUpdates.fullName || userUpdates.name || baseUser.name,
          fullName: userUpdates.fullName || userUpdates.name || baseUser.fullName,
          isVerified: userUpdates.isVerified ?? true,
          onboardingCompleted: userUpdates.onboardingCompleted ?? true,
        };
        return {
          user: updatedUser,
          role: updatedUser.role || state.role,
          token: token || state.token,
          isAuthenticated: true,
          authStatus: "authenticated",
          isLoading: false,
        };
      });
      queryClient.invalidateQueries();
    },

    can: (permission: string) => {
      const currentRole = get().role || "viewer";
      return ROLES[currentRole]?.can.includes(permission) ?? false;
    },

    needs: (permission: string) => {
      if (get().can(permission)) {
        return true;
      }
      const currentRole = get().role || "viewer";
      toast(
        `${ROLES[currentRole]?.label || "User"}s cannot perform this action.`,
        true
      );
      return false;
    },

    logout: async () => {
      try {
        await api.post("/auth/logout");
      } catch {
        // Fallback cleanup
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("safetech_token");
        localStorage.removeItem("safetech_is_demo");
        sessionStorage.removeItem("safetech_just_onboarded");
      }
      set({
        token: null,
        isAuthenticated: false,
        authStatus: "unauthenticated",
        isLoading: false,
        user: null,
        role: "viewer",
      });
      queryClient.clear();
      toast("Signed out successfully");
    },

    checkAuth: async () => {
      if (typeof window !== "undefined" && localStorage.getItem("safetech_is_demo") === "true") {
        set({
          isAuthenticated: true,
          authStatus: "authenticated",
          isLoading: false,
        });
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("safetech_token") : null;
      if (!token) {
        set({
          token: null,
          isAuthenticated: false,
          authStatus: "unauthenticated",
          isLoading: false,
          user: null,
        });
        return;
      }

      set({ isLoading: true, authStatus: "loading" });
      try {
        const res = await api.get("/auth/me");
        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          const userObj: UserProfile = {
            id: u.id || u._id,
            name: u.fullName || u.name,
            fullName: u.fullName || u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            companyName: u.companyName,
            isVerified: Boolean(u.isVerified),
            onboardingCompleted: u.onboardingCompleted ?? u.role !== "admin",
          };
          set({
            isAuthenticated: true,
            authStatus: "authenticated",
            user: userObj,
            role: u.role,
            isLoading: false,
          });
        } else {
          throw new Error("Invalid session data");
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("safetech_token");
          localStorage.removeItem("safetech_is_demo");
        }
        set({
          token: null,
          isAuthenticated: false,
          authStatus: "unauthenticated",
          isLoading: false,
          user: null,
          role: "viewer",
        });
      }
    },

    bootstrapDemoSession: () => {
      // Authenticated real users cannot access demo mode
      const currentState = get();
      if (currentState.isAuthenticated && !currentState.user?.isDemo) {
        toast("You are already authenticated with a live account. Please sign out before entering Demo Mode.", true);
        return;
      }

      resetSampleData();
      const demoUser: UserProfile = {
        id: "usr_demo_admin",
        name: DEMO_BYPASS_ACCOUNT.name,
        fullName: DEMO_BYPASS_ACCOUNT.name,
        email: DEMO_BYPASS_ACCOUNT.email,
        phone: DEMO_BYPASS_ACCOUNT.phone,
        role: "admin",
        isVerified: true,
        isDemo: true,
        onboardingCompleted: true,
        companyName: "Safe Tech Solutions",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("safetech_token", "demo_token_admin");
        localStorage.setItem("safetech_is_demo", "true");
      }

      set({
        role: "admin",
        user: demoUser,
        token: "demo_token_admin",
        isAuthenticated: true,
        authStatus: "authenticated",
        isLoading: false,
      });

      queryClient.invalidateQueries();
      toast("Entered Live Demo Mode as Demo Administrator");
    },

    exitDemoSession: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("safetech_token");
        localStorage.removeItem("safetech_is_demo");
      }

      set({
        token: null,
        isAuthenticated: false,
        authStatus: "unauthenticated",
        isLoading: false,
        user: null,
        role: "viewer",
      });

      queryClient.clear();
      toast("Exited Live Demo Mode");
    },
  };
});

export default useAuthStore;
