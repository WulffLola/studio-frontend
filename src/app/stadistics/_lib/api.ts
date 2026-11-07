// Obtención de datos de estadísticas: una petición por bloque, deduplicada por
// parámetros, cancelable y con reintento. Un bloque con error no afecta al resto.

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../stores/auth";
import { backendNotice, unwrapList } from "./normalize";
import type { CatalogItem } from "./types";

const baseUrl = (process.env.NEXT_PUBLIC__URL_BACKEND || "http://localhost:8000/").trim().replace(/\/$/, "");
const url = (path: string) => `${baseUrl}/${path}`;

export type QueryParams = Record<string, string | undefined>;

export type RequestStatus = "loading" | "success" | "empty" | "error" | "blocked";
export type StatRequest = {
  status: RequestStatus;
  data: unknown;
  error: string | null;
  /** Aviso informativo del backend, p. ej. estudio dado de baja. */
  notice: string | null;
  /** Motivo por el que no se consulta (faltan filtros obligatorios). */
  blockedReason: string | null;
  retry: () => void;
};

/** Mensajes de error sin detalles técnicos ni nombres de parámetros. */
const errorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Ocurrió un error inesperado al procesar la información.";
  const code = error.response?.status;
  if (!error.response) return "No se pudo conectar con el servidor. Revisá la conexión.";
  if (code === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
  if (code === 403) return "Tu usuario no tiene permiso para ver esta estadística.";
  if (code === 400) return "Los filtros elegidos no son válidos para esta estadística.";
  if (code === 404) return "No se encontró la información solicitada.";
  return "El servidor no pudo calcular esta estadística.";
};

const clean = (params: QueryParams) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

type Options = {
  /** Motivo para no consultar (p. ej. rango de fechas incompleto). */
  blockedReason?: string | null;
  /** El endpoint responde 404 cuando no hay datos para el período. */
  notFoundIsEmpty?: boolean;
};

export function useStatistic(path: string, params: QueryParams, options: Options = {}): StatRequest {
  const access = useAuthStore((state) => state.tokens?.access);
  const { blockedReason = null, notFoundIsEmpty = false } = options;
  // La clave serializada evita repetir la petición si los parámetros no cambiaron.
  const key = JSON.stringify(clean(params));
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<Omit<StatRequest, "retry">>({ status: "loading", data: null, error: null, notice: null, blockedReason: null });

  useEffect(() => {
    if (blockedReason) { setState({ status: "blocked", data: null, error: null, notice: null, blockedReason }); return; }
    if (!access) return;
    const controller = new AbortController();
    setState((old) => ({ ...old, status: "loading", error: null, blockedReason: null }));
    axios.get(url(path), { headers: { Authorization: `Bearer ${access}` }, params: JSON.parse(key), signal: controller.signal })
      .then((response) => {
        setState({ status: "success", data: response.data, error: null, notice: backendNotice(response.data), blockedReason: null });
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error)) return;
        if (notFoundIsEmpty && axios.isAxiosError(error) && error.response?.status === 404) {
          setState({ status: "empty", data: null, error: null, notice: null, blockedReason: null });
          return;
        }
        setState({ status: "error", data: null, error: errorMessage(error), notice: null, blockedReason: null });
      });
    return () => controller.abort();
  }, [access, blockedReason, key, nonce, notFoundIsEmpty, path]);

  const retry = useCallback(() => setNonce((value) => value + 1), []);
  return useMemo(() => ({ ...state, retry }), [state, retry]);
}

export type Catalogs = { studios: CatalogItem[]; activities: CatalogItem[]; plans: CatalogItem[]; expenseTypes: CatalogItem[] };
const emptyCatalogs: Catalogs = { studios: [], activities: [], plans: [], expenseTypes: [] };

const toCatalog = (data: unknown): CatalogItem[] =>
  (unwrapList<CatalogItem>(data) ?? []).filter((item) => item && item.id !== undefined && !item.deleted && typeof item.name === "string" && item.name.trim() !== "");

/** Opciones de los filtros. Si un catálogo falla, ese filtro queda solo con "Todos". */
export function useCatalogs() {
  const access = useAuthStore((state) => state.tokens?.access);
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs);
  useEffect(() => {
    if (!access) return;
    const controller = new AbortController();
    const paths = ["studios/", "activity-subtype/", "plans-subtype/", "expense-type/"];
    Promise.allSettled(paths.map((path) => axios.get(url(path), { headers: { Authorization: `Bearer ${access}` }, signal: controller.signal }))).then((settled) => {
      if (controller.signal.aborted) return;
      const [studios, activities, plans, expenseTypes] = settled.map((result) => (result.status === "fulfilled" ? toCatalog(result.value.data) : []));
      setCatalogs({ studios, activities, plans, expenseTypes });
    });
    return () => controller.abort();
  }, [access]);
  return catalogs;
}
