// Formateadores centralizados de la sección de estadísticas (es-AR).
// Reciben `number | null`: null significa "sin dato" y nunca se muestra como 0.

export const EMPTY_VALUE = "—";
const LOCALE = "es-AR";

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const currencyCompactFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "ARS", notation: "compact", maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const compactFormatter = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" });
const shortMonthFormatter = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "2-digit" });

const isNumber = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const formatCurrency = (value: number | null | undefined) => (isNumber(value) ? currencyFormatter.format(value) : EMPTY_VALUE);
export const formatCurrencyCompact = (value: number | null | undefined) => (isNumber(value) ? currencyCompactFormatter.format(value) : EMPTY_VALUE);
export const formatInteger = (value: number | null | undefined) => (isNumber(value) ? integerFormatter.format(value) : EMPTY_VALUE);
export const formatDecimal = (value: number | null | undefined) => (isNumber(value) ? decimalFormatter.format(value) : EMPTY_VALUE);
export const formatCompact = (value: number | null | undefined) => (isNumber(value) ? compactFormatter.format(value) : EMPTY_VALUE);

/** Porcentaje expresado en escala 0-100 (como lo devuelve el backend). */
export const formatPercent = (value: number | null | undefined, digits = 1) => {
  if (!isNumber(value)) return EMPTY_VALUE;
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(value)} %`;
};

export const formatSignedCurrency = (value: number | null | undefined) => {
  if (!isNumber(value)) return EMPTY_VALUE;
  const formatted = currencyFormatter.format(Math.abs(value));
  return value < 0 ? `−${formatted}` : value > 0 ? `+${formatted}` : formatted;
};

export const formatSignedInteger = (value: number | null | undefined) => {
  if (!isNumber(value)) return EMPTY_VALUE;
  return value > 0 ? `+${integerFormatter.format(value)}` : value < 0 ? `−${integerFormatter.format(Math.abs(value))}` : "0";
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;
const ISO_WEEK = /^(\d{4})-W(\d{2})$/;

/** Convierte "AAAA-MM-DD" (o un datetime ISO) a Date local, sin corrimientos por zona horaria. */
export const parseIsoDate = (value: string | null | undefined): Date | null => {
  const match = typeof value === "string" ? value.match(ISO_DATE) : null;
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** dd/mm/aaaa */
export const formatDate = (value: string | Date | null | undefined) => {
  const date = value instanceof Date ? value : parseIsoDate(value);
  return date && !Number.isNaN(date.getTime()) ? dateFormatter.format(date) : EMPTY_VALUE;
};

export const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
  if (start && end) return start === end ? formatDate(start) : `${formatDate(start)} al ${formatDate(end)}`;
  if (start) return `Desde el ${formatDate(start)}`;
  if (end) return `Hasta el ${formatDate(end)}`;
  return "Todo el historial";
};

/** Lunes de una semana ISO (la semana 1 contiene el 4 de enero). */
export const isoWeekStart = (year: number, week: number) => {
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  return monday;
};

/** Etiqueta legible para un período "AAAA", "AAAA-MM" o "AAAA-Www". */
export const formatPeriod = (period: string, variant: "long" | "short" = "long") => {
  const month = period.match(ISO_MONTH);
  if (month) {
    const date = new Date(Number(month[1]), Number(month[2]) - 1, 1);
    return capitalize((variant === "long" ? monthFormatter : shortMonthFormatter).format(date));
  }
  const week = period.match(ISO_WEEK);
  if (week) {
    const monday = isoWeekStart(Number(week[1]), Number(week[2]));
    // Corta: dd/mm/aa, para no confundir semanas de distintos años.
    return variant === "long" ? `Semana del ${formatDate(monday)}` : `${formatDate(monday).slice(0, 6)}${formatDate(monday).slice(8)}`;
  }
  if (/^\d{4}$/.test(period)) return variant === "long" ? `Año ${period}` : period;
  return period;
};

export const formatMonthParam = (value: string) => (ISO_MONTH.test(value) ? formatPeriod(value) : EMPTY_VALUE);

/** "08:30:00" → "08:30" */
export const formatTime = (value: string | null | undefined) =>
  typeof value === "string" && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : EMPTY_VALUE;

export const formatDays = (days: number | null | undefined) => {
  if (!isNumber(days)) return EMPTY_VALUE;
  if (days < 60) return `${formatInteger(days)} días`;
  return `${formatDecimal(days / 30.44)} meses`;
};

export const formatHours = (hours: number | null | undefined) => {
  if (!isNumber(hours)) return EMPTY_VALUE;
  if (Math.abs(hours) < 48) return `${formatDecimal(hours)} h`;
  return `${formatDecimal(hours / 24)} días`;
};

export const pluralize = (count: number, singular: string, plural: string) => `${formatInteger(count)} ${count === 1 ? singular : plural}`;
