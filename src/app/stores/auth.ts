import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
  setTokens: (tokens: { access: string; refresh: string; session_expires_at?: string }, opts?: { persist?: boolean }) => void;
  edit: (userData: any) => void;
  logout: () => void;
  checkSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

let sessionInterval: NodeJS.Timeout | null = null;

// Máximo absoluto de la sesión: lo informa el backend (session_expires_at,
// 8 h desde el login). Esto es solo el valor de respaldo.
const DEFAULT_SESSION_DURATION_MINUTES = 480;
const SESSION_CHECK_INTERVAL_MS = 30000;

const serverExpiry = (tokens: any): number | null => {
  const t = Date.parse(tokens?.session_expires_at ?? "");
  return Number.isFinite(t) ? t : null;
};

// Import diferido para evitar el ciclo store <-> lib/session.
const sessionLib = () => import("../lib/session");

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
      code: null,
      profile_photo: null,
      tokens: null,

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      login: (userData: any) => {
        const fallback = Date.now() + getSessionDurationMs();
        const fromServer = serverExpiry(userData?.tokens);
        sessionLib().then((m) => m.markActivity(true));
        set({
          isAuthenticated: true,
          sessionExpiresAt: fromServer ? Math.min(fromServer, fallback) : fallback,
          id: userData.id,
          name: userData.name,
          last_name: userData.last_name,
          tipo: userData.tipo,
          dni: userData.dni,
          email: userData.email,
          code: userData.code ?? null,
          profile_photo: userData.profile_photo ?? null,
          tokens: {
            refresh: userData.tokens.refresh,
            access: userData.tokens.access,
          },
        });

        get().checkSession();
      },

      setTokens: (tokens, opts) => {
        if (!get().isAuthenticated || !tokens?.access || !tokens?.refresh) return;
        const fromServer = serverExpiry(tokens);
        const patch: any = { tokens: { access: tokens.access, refresh: tokens.refresh } };
        if (fromServer) patch.sessionExpiresAt = fromServer;
        if (opts?.persist === false) {
          // cambio llegado desde otra pestaña: ya está persistido
          useAuthStore.setState(patch, false);
        } else {
          set(patch);
        }
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

        // Revocar la sesión en el backend (refresh + access) antes de limpiar.
        const tokens = get().tokens;
        sessionLib().then((m) => {
          m.notifyBackendLogout(tokens);
          m.clearActivity();
        });

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

        // Solo controles locales (8 h). Ya no se hace polling al backend: eso
        // mantenía viva la sesión aunque el usuario estuviera inactivo. La
        // inactividad la controlan lib/session.ts y, sobre todo, el backend.
        sessionInterval = setInterval(() => {
          const { isAuthenticated, sessionExpiresAt, logout } = get();
          if (hasSessionExpired(isAuthenticated, sessionExpiresAt)) {
            logout();
            return;
          }
          if (!isAuthenticated && sessionInterval) {
            clearInterval(sessionInterval);
            sessionInterval = null;
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
          // Recarga de página: si pasó el límite de inactividad, se cierra.
          sessionLib().then((m) => {
            if (m.idleMs() >= m.IDLE_LIMIT_MS) state.logout();
          });
          state.checkSession();
        }
      },
    },
  ),
);
