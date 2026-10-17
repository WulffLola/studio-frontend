import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";

export interface AuthState {
  id: number | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  sessionExpiresAt: number | null;
  name: string | null;
  last_name: string | null;
  tipo: string | null;
  dni: string | null;
  email: string | null;
  profile_photo?: string | null;
  code?: string | null;
  tokens: {
    refresh: string;
    access: string;
  } | null;
  login: (userData: any) => void;
  edit: (userData: any) => void;
  logout: () => void;
  checkSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

let sessionInterval: NodeJS.Timeout | null = null;

const DEFAULT_SESSION_DURATION_MINUTES = 480;
const SESSION_CHECK_INTERVAL_MS = 60000;
const BACKEND_SESSION_CHECK_INTERVAL_MS = 300000;

const getSessionDurationMs = () => {
  const configuredMinutes = Number(process.env.NEXT_PUBLIC_SESSION_DURATION_MINUTES);
  const minutes =
    Number.isFinite(configuredMinutes) && configuredMinutes > 0
      ? configuredMinutes
      : DEFAULT_SESSION_DURATION_MINUTES;

  return minutes * 60 * 1000;
};

const isExpired = (expiresAt: number | null) =>
  typeof expiresAt === "number" && Date.now() >= expiresAt;

const hasSessionExpired = (isAuthenticated: boolean, expiresAt: number | null) =>
  isAuthenticated && (!expiresAt || isExpired(expiresAt));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasHydrated: false,
      sessionExpiresAt: null,
      id: null,
      name: null,
      last_name: null,
      tipo: null,
      dni: null,
      email: null,
      profile_photo: null,
      tokens: null,

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      login: (userData: any) => {
        set({
          isAuthenticated: true,
          sessionExpiresAt: Date.now() + getSessionDurationMs(),
          id: userData.id,
          name: userData.name,
          last_name: userData.last_name,
          tipo: userData.tipo,
          dni: userData.dni,
          email: userData.email,
          profile_photo: userData.profile_photo ?? null,
          tokens: {
            refresh: userData.tokens.refresh,
            access: userData.tokens.access,
          },
        });

        get().checkSession();
      },

      edit: (userData: any) => {
        set((state) => ({
          ...state,
          name: userData.name,
          last_name: userData.last_name,
          tipo: userData.tipo,
          email: userData.email,
          profile_photo: userData.profile_photo ?? state.profile_photo,
          code: userData.code ?? state.code,
        }));
      },

      logout: () => {
        if (sessionInterval) {
          clearInterval(sessionInterval);
          sessionInterval = null;
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem("studio-storage");
        }

        set({
          isAuthenticated: false,
          sessionExpiresAt: null,
          id: null,
          name: null,
          last_name: null,
          tipo: null,
          dni: null,
          email: null,
          profile_photo: null,
          code: null,
          tokens: null,
        });
      },

      checkSession: () => {
        if (sessionInterval) return;

        let lastBackendCheck = 0;

        sessionInterval = setInterval(async () => {
          const { isAuthenticated, sessionExpiresAt, tokens, logout } = get();

          if (hasSessionExpired(isAuthenticated, sessionExpiresAt)) {
            logout();
            return;
          }

          if (isAuthenticated && tokens?.access) {
            try {
              const now = Date.now();
              if (now - lastBackendCheck < BACKEND_SESSION_CHECK_INTERVAL_MS) {
                return;
              }

              lastBackendCheck = now;
              await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`, {
                headers: {
                  Authorization: `Bearer ${tokens.access}`,
                },
              });
            } catch (error) {
              console.error("La sesión ha expirado o no es válida.", error);
              logout();
            }
          } else {
            if (sessionInterval) {
              clearInterval(sessionInterval);
              sessionInterval = null;
            }
          }
        }, SESSION_CHECK_INTERVAL_MS);
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);

        if (state && hasSessionExpired(state.isAuthenticated, state.sessionExpiresAt)) {
          state.logout();
          return;
        }

        if (state?.isAuthenticated && state?.tokens?.access) {
          state.checkSession();
        }
      },
    },
  ),
);
