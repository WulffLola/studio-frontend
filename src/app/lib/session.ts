/**
 * Manejo de sesión del panel (seguridad).
 *
 * - Actividad real: teclado, mouse, rueda o toque. Se comparte entre pestañas
 *   (localStorage "auth-activity"). Cada petición al backend informa en el
 *   header X-Client-Idle los segundos desde la última interacción, así el
 *   backend no cuenta como actividad el polling ni las peticiones automáticas.
 * - Inactividad: a los 30 min sin interacción se cierra la sesión (el backend
 *   también la rechaza por su cuenta).
 * - Refresh: solo ante un 401 y solo si hubo actividad reciente. Una sola
 *   renovación a la vez por pestaña y entre pestañas (navigator.locks); si
 *   otra pestaña ya renovó, se reutilizan sus tokens.
 * - Logout: avisa al backend para revocar la sesión y el refresh.
 */
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/auth";

export const IDLE_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_KEY = "auth-activity";
const AUTH_STORAGE_KEY = "auth";
const ACTIVITY_WRITE_THROTTLE_MS = 5000;
const PING_EVERY_MS = 4 * 60 * 1000;
const WATCHDOG_MS = 30 * 1000;

const backendBase = (): string =>
  (process.env.NEXT_PUBLIC__URL_BACKEND || "").trim().replace(/^["']|["']$/g, "");

const endpoint = (path: string): string => {
  const base = backendBase();
  return base ? new URL(path, base.endsWith("/") ? base : `${base}/`).toString() : `/${path}`;
};

const REFRESH_URL = () => endpoint("token/refresh/");
const LOGOUT_URL = () => endpoint("logout/");
const SESSION_URL = () => endpoint("session/");

const isBackendUrl = (url?: string): boolean => {
  if (!url) return false;
  const base = backendBase();
  if (!base) return false;
  try {
    return new URL(url, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
};

const isAuthEndpoint = (url?: string): boolean =>
  !!url && /\/(token\/refresh|token|login|student-login|logout)\/?(\?|$)/.test(url);

// ---------------------------------------------------------------- actividad
let lastActivityMem = 0;
let lastActivityWrite = 0;
let lastReportedActivity = 0;

const readSharedActivity = (): number => {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

export const lastActivityAt = (): number => Math.max(lastActivityMem, readSharedActivity());

export const idleMs = (): number => {
  const last = lastActivityAt();
  return last ? Math.max(0, Date.now() - last) : Number.MAX_SAFE_INTEGER;
};

export const markActivity = (force = false): void => {
  const now = Date.now();
  lastActivityMem = now;
  if (force || now - lastActivityWrite > ACTIVITY_WRITE_THROTTLE_MS) {
    lastActivityWrite = now;
    try {
      localStorage.setItem(ACTIVITY_KEY, String(now));
    } catch {
      /* almacenamiento no disponible: queda en memoria */
    }
  }
};

export const clearActivity = (): void => {
  lastActivityMem = 0;
  lastReportedActivity = 0;
  try {
    localStorage.removeItem(ACTIVITY_KEY);
  } catch {
    /* noop */
  }
};

// ----------------------------------------------------------------- refresh
type Tokens = { access: string; refresh: string; session_expires_at?: string };
let refreshInFlight: Promise<string | null> | null = null;

const readPersistedTokens = (): Tokens | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.state?.tokens ?? null : null;
  } catch {
    return null;
  }
};

const doRefresh = async (usedRefresh: string): Promise<string | null> => {
  // ¿Otra pestaña ya renovó mientras esperábamos el lock?
  const persisted = readPersistedTokens();
  if (persisted?.refresh && persisted.refresh !== usedRefresh) {
    useAuthStore.getState().setTokens(persisted);
    return persisted.access;
  }
  try {
    const { data } = await axios.post<Tokens>(REFRESH_URL(), { refresh: usedRefresh }, {
      // marca para que el interceptor no la intercepte
      headers: { "X-Skip-Auth": "1" },
    } as AxiosRequestConfig);
    useAuthStore.getState().setTokens(data);
    return data.access;
  } catch {
    // Pudo haber ganado otra pestaña la carrera: reintentar con lo persistido.
    const again = readPersistedTokens();
    if (again?.refresh && again.refresh !== usedRefresh) {
      useAuthStore.getState().setTokens(again);
      return again.access;
    }
    return null;
  }
};

export const refreshTokens = (): Promise<string | null> => {
  const current = useAuthStore.getState().tokens;
  if (!current?.refresh) return Promise.resolve(null);
  if (idleMs() >= IDLE_LIMIT_MS) return Promise.resolve(null); // inactivo: no se renueva
  if (refreshInFlight) return refreshInFlight;
  const used = current.refresh;
  const run = async () => {
    const locks = typeof navigator !== "undefined" ? (navigator as any).locks : undefined;
    if (locks?.request) {
      return locks.request("studio-auth-refresh", () => doRefresh(used));
    }
    return doRefresh(used);
  };
  refreshInFlight = run().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
};

// ------------------------------------------------------------------ logout
let loggingOut = false;

export const notifyBackendLogout = (tokens: Tokens | null): void => {
  if (!tokens?.refresh || loggingOut) return;
  loggingOut = true;
  // fire-and-forget: no bloquea la salida de la UI
  axios
    .post(
      LOGOUT_URL(),
      { refresh_token: tokens.refresh },
      { headers: { Authorization: `Bearer ${tokens.access}`, "X-Skip-Auth": "1" } } as AxiosRequestConfig,
    )
    .catch(() => undefined)
    .finally(() => {
      loggingOut = false;
    });
};

const forceLogout = () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated) state.logout();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
};

// ------------------------------------------------------------ interceptores
let installed = false;

export const installSessionHandling = (): void => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const headers: any = config.headers;
    const skip = headers?.["X-Skip-Auth"];
    if (skip) {
      delete headers["X-Skip-Auth"];
      return config;
    }
    if (!isBackendUrl(config.url)) return config; // nunca enviar el token a terceros
    const access = useAuthStore.getState().tokens?.access;
    if (access && !isAuthEndpoint(config.url)) {
      headers.Authorization = `Bearer ${access}`; // siempre el token vigente
    }
    const idle = Math.floor(Math.min(idleMs(), 365 * 24 * 3600 * 1000) / 1000);
    headers["X-Client-Idle"] = String(idle);
    if (idle < 60) lastReportedActivity = Math.max(lastReportedActivity, lastActivityAt());
    return config;
  });

  axios.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      const status = error.response?.status;
      if (!config || status !== 401 || config._retried || !isBackendUrl(config.url) || isAuthEndpoint(config.url)) {
        return Promise.reject(error);
      }
      if (!useAuthStore.getState().tokens) return Promise.reject(error);
      config._retried = true;
      const access = await refreshTokens();
      if (!access) {
        forceLogout();
        return Promise.reject(error);
      }
      (config.headers as any).Authorization = `Bearer ${access}`;
      return axios(config);
    },
  );

  // actividad real del usuario
  let lastMove = 0;
  const onActivity = (e: Event) => {
    if (e.type === "mousemove") {
      const now = Date.now();
      if (now - lastMove < 1000) return;
      lastMove = now;
    }
    if (useAuthStore.getState().isAuthenticated) markActivity();
  };
  ["pointerdown", "keydown", "wheel", "touchstart", "mousemove"].forEach((ev) =>
    window.addEventListener(ev, onActivity, { passive: true, capture: true }),
  );

  // sincronización entre pestañas
  window.addEventListener("storage", (e) => {
    if (e.key !== AUTH_STORAGE_KEY) return;
    if (!e.newValue) {
      forceLogout();
      return;
    }
    try {
      const next = JSON.parse(e.newValue)?.state;
      if (next && !next.isAuthenticated && useAuthStore.getState().isAuthenticated) {
        forceLogout();
      } else if (next?.tokens) {
        useAuthStore.getState().setTokens(next.tokens, { persist: false });
      }
    } catch {
      /* noop */
    }
  });

  // vigilancia: inactividad, máximo de 8 h y "ping" de actividad real
  window.setInterval(() => {
    const s = useAuthStore.getState();
    if (!s.isAuthenticated) return;
    if (idleMs() >= IDLE_LIMIT_MS || (s.sessionExpiresAt && Date.now() >= s.sessionExpiresAt)) {
      forceLogout();
      return;
    }
    // Hubo interacción que el backend todavía no vio: avisar (no es polling:
    // solo ocurre si el usuario estuvo activo).
    const last = lastActivityAt();
    if (last - lastReportedActivity > PING_EVERY_MS && Date.now() - last < 60 * 1000) {
      axios.get(SESSION_URL()).catch(() => undefined);
    }
  }, WATCHDOG_MS);
};
