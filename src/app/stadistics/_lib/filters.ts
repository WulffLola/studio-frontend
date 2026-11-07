import { useEffect, useState } from "react";
import { parseIsoDate, toIsoDate } from "./format";

export type GlobalFilters = {
  studio: string;
  startDate: string;
  endDate: string;
  activity: string;
  plan: string;
  expenseType: string;
};

export type QuickPeriod = { key: string; label: string; range: (today: Date) => { startDate: string; endDate: string } };

const shift = (date: Date, days: number) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };

export const QUICK_PERIODS: QuickPeriod[] = [
  { key: "7d", label: "Últimos 7 días", range: (today) => ({ startDate: toIsoDate(shift(today, -6)), endDate: toIsoDate(today) }) },
  { key: "30d", label: "Últimos 30 días", range: (today) => ({ startDate: toIsoDate(shift(today, -29)), endDate: toIsoDate(today) }) },
  {
    key: "month", label: "Mes actual",
    range: (today) => ({ startDate: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }),
  },
  { key: "year", label: "Año actual", range: (today) => ({ startDate: `${today.getFullYear()}-01-01`, endDate: `${today.getFullYear()}-12-31` }) },
];

export const defaultFilters = (today: Date, studio = ""): GlobalFilters => ({
  studio, activity: "", plan: "", expenseType: "", ...QUICK_PERIODS[2].range(today),
});

export const activeQuickPeriod = (filters: GlobalFilters, today: Date) =>
  QUICK_PERIODS.find((period) => { const range = period.range(today); return range.startDate === filters.startDate && range.endDate === filters.endDate; })?.key ?? null;

/** Valida el rango; devuelve un mensaje en español o null si es válido. */
export const rangeError = (filters: GlobalFilters): string | null => {
  const start = filters.startDate ? parseIsoDate(filters.startDate) : null;
  const end = filters.endDate ? parseIsoDate(filters.endDate) : null;
  if (filters.startDate && !start) return "La fecha de inicio no es válida.";
  if (filters.endDate && !end) return "La fecha de fin no es válida.";
  if (start && end && start > end) return "La fecha de inicio es posterior a la fecha de fin.";
  return null;
};

export const rangeDays = (filters: GlobalFilters) => {
  const start = parseIsoDate(filters.startDate);
  const end = parseIsoDate(filters.endDate);
  return start && end ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1 : null;
};

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export type BlockProps = {
  filters: GlobalFilters;
  /** Error del rango de fechas; bloquea las estadísticas que dependen de fechas. */
  rangeIssue: string | null;
  today: Date;
};

/** Nombres de los filtros generales, para avisar cuáles no aplica cada bloque. */
export const FILTER_NAMES = { studio: "estudio", dates: "fechas", activity: "actividad", plan: "plan" } as const;

export const dateParams = (filters: GlobalFilters) => ({ start_date: filters.startDate, end_date: filters.endDate, studio: filters.studio });

export const REQUIRED_RANGE_MESSAGE = "Elegí una fecha de inicio y una de fin para ver esta estadística.";
