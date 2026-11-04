// Capa de normalización: respuestas del backend → modelos listos para mostrar.
// Reglas: no se muta la respuesta original; un valor inválido es `null` (sin dato)
// y se cuenta en `invalid` para avisar de datos parciales; nunca se reemplaza por 0.

import { formatPeriod, parseIsoDate, toIsoDate } from "./format";
import type {
  CancellationResponse, ClassesResponse, ClientsByMonthResponse, ClientsByPlanRow, ExpenseByTypeRow,
  GrossMarginResponse, MostProfitableResponse, Numeric, OccupancyByHourRow, OccupancyEvolutionRow,
  OccupancyResponse, PaymentsBreakdownResponse, PersonActivePlanRow, PersonRow, PlanUsageResponse,
  PlanValidityResponse, RangesResponse, RetentionResponse, StatusClientsResponse, WaitingListRow,
} from "./types";

// ---------------------------------------------------------------- primitivas

/** Número finito o null. Acepta números y strings numéricos ("1234.50"). */
export const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/** Cantidad: entero no negativo o null. */
export const toCount = (value: unknown): number | null => {
  const number = toNumber(value);
  return number !== null && number >= 0 ? Math.round(number) : null;
};

const toText = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);

/** Lleva la cuenta de campos inválidos para poder avisar "datos parciales". */
class Tracker {
  invalid = 0;
  number(value: Numeric | unknown) { const n = toNumber(value); if (n === null && value !== undefined) this.invalid += 1; return n; }
  count(value: Numeric | unknown) { const n = toCount(value); if (n === null && value !== undefined) this.invalid += 1; return n; }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Las listas pueden llegar envueltas como {detail, results} cuando el estudio
 * filtrado está dado de baja (StudioNoticeMixin). Devuelve null si no es lista.
 */
export const unwrapList = <T>(data: unknown): T[] | null => {
  if (Array.isArray(data)) return data as T[];
  if (isRecord(data) && Array.isArray(data.results)) return data.results as T[];
  return null;
};

export const unwrapObject = <T>(data: unknown): T | null => (isRecord(data) ? (data as T) : null);

/** Aviso informativo del backend (p. ej. estudio dado de baja) en respuestas exitosas. */
export const backendNotice = (data: unknown): string | null => (isRecord(data) ? toText(data.detail) : null);

export const ratio = (part: number | null, total: number | null) =>
  part !== null && total !== null && total > 0 ? (part / total) * 100 : null;

export const sumValues = (values: (number | null)[]) => values.reduce<number>((acc, value) => acc + (value ?? 0), 0);

// ---------------------------------------------------------------- categorías

export type Category = { key: string; label: string; value: number; detail?: string };

export const OTHERS_KEY = "__otros__";

/**
 * Ordena de mayor a menor y agrupa la cola en "Otros" para no dibujar cientos de
 * barras. La suma de "Otros" conserva el total (solo para valores sumables).
 */
export const topWithOthers = (items: Category[], limit: number): { visible: Category[]; grouped: number } => {
  const sorted = [...items].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "es"));
  if (sorted.length <= limit) return { visible: sorted, grouped: 0 };
  const head = sorted.slice(0, limit - 1);
  const tail = sorted.slice(limit - 1);
  const others: Category = { key: OTHERS_KEY, label: `Otros (${tail.length})`, value: sumValues(tail.map((item) => item.value)) };
  return { visible: [...head, others], grouped: tail.length };
};

/** Une filas con la misma etiqueta (p. ej. dos planes con el mismo nombre). */
const mergeCategories = (rows: { label: string; value: number | null }[]): Category[] => {
  const map = new Map<string, Category>();
  for (const row of rows) {
    if (row.value === null) continue;
    const current = map.get(row.label);
    if (current) current.value += row.value;
    else map.set(row.label, { key: row.label, label: row.label, value: row.value });
  }
  return Array.from(map.values());
};

export type CategoryStat = { items: Category[]; total: number; invalid: number };

const categoryStat = <T>(rows: T[] | null | undefined, pick: (row: T, t: Tracker) => { label: string; value: number | null }): CategoryStat => {
  const tracker = new Tracker();
  const items = mergeCategories((rows ?? []).filter(isRecord).map((row) => pick(row as T, tracker)));
  return { items, total: sumValues(items.map((item) => item.value)), invalid: tracker.invalid };
};

// ---------------------------------------------------------------- alumnos

export type Person = { key: string; fullName: string; phone: string };
const toPeople = (rows: PersonRow[] | null | undefined): Person[] =>
  (rows ?? []).filter(isRecord).map((row, index) => ({
    key: String(index),
    fullName: [toText(row.name), toText(row.last_name)].filter(Boolean).join(" ") || "Sin nombre",
    phone: toText(row.phone) ?? "Sin teléfono",
  }));

export const normalizeStatus = (raw: unknown) => {
  const data = unwrapObject<StatusClientsResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const activeList = toPeople(data.active_clients);
  const inactiveList = toPeople(data.inactive_clients);
  // Si el total falta, el largo de la lista es una fuente equivalente y confiable.
  const active = t.count(data.total_active_clients) ?? (Array.isArray(data.active_clients) ? activeList.length : null);
  const inactive = t.count(data.total_inactive_clients) ?? (Array.isArray(data.inactive_clients) ? inactiveList.length : null);
  return { active, inactive, activeList, inactiveList, invalid: t.invalid, isEmpty: !active && !inactive };
};

export type MonthlyClientsPoint = { period: string; label: string; altas: number; bajas: number; neto: number };
export type Granularity = "month" | "year";

/**
 * Altas y bajas por mes. El endpoint no filtra por fecha: se recorta en el
 * navegador a los meses que se superponen con el rango elegido.
 */
export const normalizeClientsByMonth = (raw: unknown, range: { start: string; end: string }, granularity: Granularity) => {
  const data = unwrapObject<ClientsByMonthResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const byMonth = new Map<string, { altas: number; bajas: number }>();
  let undated = 0;
  const add = (month: unknown, field: "altas" | "bajas", value: unknown) => {
    const count = t.count(value);
    if (count === null) return;
    const key = toText(month);
    if (!key || !/^\d{4}-\d{2}$/.test(key)) { undated += count; return; }
    const item = byMonth.get(key) ?? { altas: 0, bajas: 0 };
    item[field] += count;
    byMonth.set(key, item);
  };
  (data.new_clients_by_month ?? []).filter(isRecord).forEach((row) => add(row.month, "altas", row.total_new_clients));
  (data.cancellations_by_month ?? []).filter(isRecord).forEach((row) => add(row.month, "bajas", row.total_cancellations));

  const startMonth = range.start ? range.start.slice(0, 7) : "";
  const endMonth = range.end ? range.end.slice(0, 7) : "";
  const grouped = new Map<string, { altas: number; bajas: number }>();
  byMonth.forEach((value, month) => {
    if ((startMonth && month < startMonth) || (endMonth && month > endMonth)) return;
    const key = granularity === "year" ? month.slice(0, 4) : month;
    const item = grouped.get(key) ?? { altas: 0, bajas: 0 };
    item.altas += value.altas;
    item.bajas += value.bajas;
    grouped.set(key, item);
  });
  const points: MonthlyClientsPoint[] = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, value]) => ({ period, label: formatPeriod(period), ...value, neto: value.altas - value.bajas }));
  const totals = { altas: sumValues(points.map((p) => p.altas)), bajas: sumValues(points.map((p) => p.bajas)) };
  return { points, totals: { ...totals, neto: totals.altas - totals.bajas }, monthsAvailable: byMonth.size, undated, invalid: t.invalid, isEmpty: points.length === 0 };
};

export const normalizeRetention = (raw: unknown) => {
  const data = unwrapObject<RetentionResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const eligible = t.count(data.eligible_plans);
  const renewed = t.count(data.renewed_plans);
  // El backend devuelve 0 % cuando no hay planes elegibles: eso es "sin base", no 0 %.
  const rate = eligible ? t.number(data.renewal_rate) ?? ratio(renewed, eligible) : null;
  return { eligible, renewed, rate, windowDays: t.count(data.window_days), invalid: t.invalid, isEmpty: !eligible };
};

export type RangeBucket = { key: string; label: string; value: number | null };

/** Rangos en orden fijo. Un valor inválido queda como null ("Sin dato"), nunca como 0. */
const ordinalRanges = (ranges: Record<string, Numeric> | null | undefined, order: { key: string; label: string }[], t: Tracker): RangeBucket[] => {
  if (!isRecord(ranges)) return [];
  const known = order.map(({ key, label }) => ({ key, label, value: t.count(ranges[key]) }));
  // Rangos que el frontend no conoce se muestran igual, para no perder datos.
  const extra = Object.keys(ranges).filter((key) => !order.some((item) => item.key === key))
    .map((key) => ({ key, label: key, value: t.count(ranges[key]) }));
  return [...known, ...extra];
};

export const AGE_RANGES = [
  { key: "<18", label: "Menos de 18" }, { key: "18-29", label: "18 a 29" }, { key: "30-44", label: "30 a 44" },
  { key: "45-59", label: "45 a 59" }, { key: "60+", label: "60 o más" },
];
export const TENURE_RANGES = [
  { key: "<1m", label: "Menos de 1 mes" }, { key: "1-3m", label: "1 a 3 meses" }, { key: "3-6m", label: "3 a 6 meses" },
  { key: "6-12m", label: "6 a 12 meses" }, { key: ">12m", label: "Más de 1 año" },
];

export const normalizeRanges = (raw: unknown, kind: "age" | "tenure") => {
  const data = unwrapObject<RangesResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const total = t.count(data.total);
  const average = t.number(kind === "age" ? data.average_age : data.average_days);
  const ranges = ordinalRanges(data.ranges, kind === "age" ? AGE_RANGES : TENURE_RANGES, t);
  return { total, average: total ? average : null, ranges, invalid: t.invalid, isEmpty: !total };
};

// ---------------------------------------------------------------- planes

export const normalizeValidity = (raw: unknown) => {
  const data = unwrapObject<PlanValidityResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const active = t.count(data.active);
  const expired = t.count(data.expired);
  return {
    today: toText(data.today),
    daysAhead: t.count(data.days_ahead),
    active, expired,
    expiringSoon: t.count(data.expiring_soon),
    sessionsExhausted: t.count(data.sessions_exhausted),
    invalid: t.invalid,
    isEmpty: !active && !expired,
  };
};

export type PlanStatusRow = { key: string; plan: string; activity: string; vigentes: number; sinSesiones: number; vencidos: number; total: number };

/**
 * Agrupa los planes contratados por plan y estado de vigencia en una sola pasada.
 * Mismo criterio que /plan-validity/: vigente = vencimiento ≥ hoy; se excluyen
 * los planes dados de baja.
 */
export const normalizePlanStatus = (raw: unknown, today: Date, filter: { plan: string; activity: string }) => {
  const rows = unwrapList<PersonActivePlanRow>(raw);
  if (!rows) return null;
  const todayIso = toIsoDate(today);
  const map = new Map<string, PlanStatusRow>();
  let invalid = 0;
  for (const row of rows) {
    if (!isRecord(row) || row.deleted) continue;
    if (filter.plan && String(row.plans_subtype?.id ?? "") !== filter.plan) continue;
    if (filter.activity && String(row.plans_subtype?.activity_subtype ?? "") !== filter.activity) continue;
    const exp = parseIsoDate(row.exp_date);
    if (!exp) { invalid += 1; continue; }
    const plan = toText(row.plans_subtype?.name) ?? "Plan sin nombre";
    const activity = toText(row.plans_subtype?.activity_subtype_name) ?? "Sin actividad";
    const key = `${plan}·${activity}`;
    const item = map.get(key) ?? { key, plan, activity, vigentes: 0, sinSesiones: 0, vencidos: 0, total: 0 };
    if (toIsoDate(exp) < todayIso) item.vencidos += 1;
    else if ((toNumber(row.sessions_remaining) ?? 1) <= 0) item.sinSesiones += 1;
    else item.vigentes += 1;
    item.total += 1;
    map.set(key, item);
  }
  const items = Array.from(map.values()).sort((a, b) => b.total - a.total || a.plan.localeCompare(b.plan, "es"));
  return { items, total: sumValues(items.map((item) => item.total)), invalid, isEmpty: items.length === 0 };
};

export const normalizeClientsByPlan = (raw: unknown) => {
  const rows = unwrapList<ClientsByPlanRow>(raw);
  if (!rows) return null;
  const stat = categoryStat(rows, (row, t) => ({ label: toText(row.plans_subtype__name) ?? "Plan sin nombre", value: t.count(row.total_clients) }));
  return { ...stat, isEmpty: stat.total === 0 };
};

/** El endpoint responde 404 con "No se encontraron datos" cuando el período no tiene ingresos. */
export const normalizeProfitable = (raw: unknown) => {
  const data = unwrapObject<MostProfitableResponse>(raw);
  if (!data) return null;
  const stat = categoryStat(data.ranking, (row, t) => ({ label: toText(row.plans_subtype__name) ?? "Plan sin nombre", value: t.number(row.total_income) }));
  const sorted = [...stat.items].sort((a, b) => b.value - a.value);
  const top = sorted[0] && sorted[0].value > 0 ? sorted[0] : null;
  return { ...stat, top, start: toText(data.date_range?.start_date), end: toText(data.date_range?.end_date), isEmpty: stat.items.length === 0 };
};

export const normalizeUsage = (raw: unknown) => {
  const data = unwrapObject<PlanUsageResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const total = t.count(data.total_sessions);
  const consumed = t.count(data.consumed_sessions);
  const remaining = t.count(data.remaining_sessions);
  return { total, consumed, remaining, unusedAtExpiry: t.count(data.unused_at_expiry), consumedPct: ratio(consumed, total), invalid: t.invalid, isEmpty: !total };
};

// ---------------------------------------------------------------- operación

export const normalizeClasses = (raw: unknown) => {
  const data = unwrapObject<ClassesResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const totalClasses = t.count(data.total_classes);
  const active = t.count(data.reservations_active);
  const cancelled = t.count(data.reservations_cancelled);
  const byActivity = categoryStat(data.by_activity, (row, tr) => ({ label: toText(row.activity_subtype_name) ?? "Sin actividad", value: tr.count(row.classes) }));
  const byRoom = categoryStat(data.by_room, (row, tr) => ({ label: toText(row.room_name) ?? "Sin sala", value: tr.count(row.classes) }));
  const totalReservations = active !== null && cancelled !== null ? active + cancelled : null;
  return {
    totalClasses, active, cancelled, cancelledPct: ratio(cancelled, totalReservations), byActivity, byRoom,
    invalid: t.invalid + byActivity.invalid + byRoom.invalid,
    isEmpty: !totalClasses && !totalReservations,
  };
};

export const normalizeOccupancy = (raw: unknown) => {
  const data = unwrapObject<OccupancyResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const classes = t.count(data.total_classes);
  const reservations = t.count(data.total_reservations);
  const cupos = t.count(data.total_cupos);
  const fullClasses = t.count(data.full_classes);
  return {
    classes, reservations, cupos, fullClasses,
    occupancyPct: cupos ? t.number(data.occupancy_pct) ?? ratio(reservations, cupos) : null,
    fullClassesPct: classes ? t.number(data.full_classes_pct) ?? ratio(fullClasses, classes) : null,
    invalid: t.invalid,
    isEmpty: !classes,
  };
};

export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export type HourCell = { classes: number; reservations: number; cupos: number; pct: number | null };
export type HourDetailRow = {
  key: string; weekday: number; weekdayName: string; time: string; room: string; activity: string;
  classes: number; reservations: number; cupos: number; pct: number | null; fullPct: number | null; highPct: number | null;
};

/**
 * Ocupación por franja. Las filas vienen por sala y actividad; para el mapa de
 * calor se recalcula la ocupación como Σ reservas ÷ Σ cupos (no se promedian %).
 */
export const normalizeOccupancyByHour = (raw: unknown, activityId: string) => {
  const rows = unwrapList<OccupancyByHourRow>(raw);
  if (!rows) return null;
  const t = new Tracker();
  const details: HourDetailRow[] = [];
  const cells = new Map<string, HourCell>();
  const times = new Set<string>();
  rows.forEach((row, index) => {
    if (!isRecord(row)) return;
    if (activityId && String(row.activity_subtype_id ?? "") !== activityId) return;
    const weekday = toCount(row.weekday);
    const time = typeof row.start_time === "string" ? row.start_time.slice(0, 5) : null;
    if (weekday === null || weekday > 6 || !time) { t.invalid += 1; return; }
    const classes = t.count(row.classes) ?? 0;
    const reservations = t.count(row.total_reservations) ?? 0;
    const cupos = t.count(row.total_cupos) ?? 0;
    const high = t.number(row.high_occupancy_recurrence);
    details.push({
      key: String(index), weekday, weekdayName: toText(row.weekday_name) ?? WEEKDAYS[weekday], time,
      room: toText(row.room_name) ?? "Sin sala", activity: toText(row.activity_subtype_name) ?? "Sin actividad",
      classes, reservations, cupos, pct: ratio(reservations, cupos), fullPct: classes ? t.number(row.full_classes_pct) : null,
      // La recurrencia llega como fracción (0-1).
      highPct: high !== null && classes ? high * 100 : null,
    });
    times.add(time);
    const key = `${weekday}|${time}`;
    const cell = cells.get(key) ?? { classes: 0, reservations: 0, cupos: 0, pct: null };
    cell.classes += classes; cell.reservations += reservations; cell.cupos += cupos;
    cells.set(key, cell);
  });
  cells.forEach((cell) => { cell.pct = ratio(cell.reservations, cell.cupos); });
  const weekdays = WEEKDAYS.map((name, index) => ({ index, name })).filter(({ index }) => Array.from(times).some((time) => cells.has(`${index}|${time}`)));
  const ranked = Array.from(cells.entries()).filter(([, cell]) => cell.pct !== null)
    .map(([key, cell]) => { const [weekday, time] = key.split("|"); return { weekday: Number(weekday), time, ...cell }; })
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  return {
    cells, weekdays, times: Array.from(times).sort(), details: details.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1)),
    highest: ranked[0] ?? null, lowest: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    invalid: t.invalid, isEmpty: details.length === 0,
  };
};

export type EvolutionGranularity = "week" | "month" | "year";
export type EvolutionPoint = { period: string; label: string; shortLabel: string; pct: number | null; reservations: number; cupos: number; classes: number };

/** Evolución de ocupación ponderada (Σ reservas ÷ Σ cupos) por período, en orden cronológico. */
export const normalizeEvolution = (raw: unknown, granularity: EvolutionGranularity, activityId: string) => {
  const rows = unwrapList<OccupancyEvolutionRow>(raw);
  if (!rows) return null;
  const t = new Tracker();
  const map = new Map<string, { reservations: number; cupos: number; classes: number }>();
  for (const row of rows) {
    if (!isRecord(row)) continue;
    if (activityId && String(row.activity_subtype_id ?? "") !== activityId) continue;
    const period = toText(row.period);
    if (!period) { t.invalid += 1; continue; }
    // "Anual" se arma agregando los meses que devuelve el backend.
    const key = granularity === "year" ? period.slice(0, 4) : period;
    const item = map.get(key) ?? { reservations: 0, cupos: 0, classes: 0 };
    item.reservations += t.count(row.total_reservations) ?? 0;
    item.cupos += t.count(row.total_cupos) ?? 0;
    item.classes += t.count(row.classes) ?? 0;
    map.set(key, item);
  }
  const points: EvolutionPoint[] = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
    .map(([period, value]) => ({ period, label: formatPeriod(period), shortLabel: formatPeriod(period, "short"), pct: ratio(value.reservations, value.cupos), ...value }));
  const valid = points.filter((point) => point.pct !== null);
  const sorted = [...valid].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  return { points, max: sorted[0] ?? null, min: sorted.length > 1 ? sorted[sorted.length - 1] : null, invalid: t.invalid, isEmpty: valid.length === 0 };
};

export type WaitingPoint = { key: string; time: string; requests: number; converted: number; rate: number | null };

export const normalizeWaiting = (raw: unknown) => {
  const rows = unwrapList<WaitingListRow>(raw);
  if (!rows) return null;
  const t = new Tracker();
  const points: WaitingPoint[] = rows.filter(isRecord).map((row, index) => {
    const requests = t.count(row.total_requests) ?? 0;
    const converted = t.count(row.converted) ?? 0;
    return { key: String(index), time: typeof row.start_time === "string" ? row.start_time.slice(0, 5) : "Sin horario", requests, converted, rate: ratio(converted, requests) };
  }).sort((a, b) => a.time.localeCompare(b.time));
  const requests = sumValues(points.map((p) => p.requests));
  const converted = sumValues(points.map((p) => p.converted));
  return { points, requests, converted, rate: ratio(converted, requests), invalid: t.invalid, isEmpty: requests === 0 };
};

export const normalizeCancellations = (raw: unknown) => {
  const data = unwrapObject<CancellationResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const total = t.count(data.total_reservations);
  const cancelled = t.count(data.cancelled_reservations);
  const buckets = data.anticipation?.buckets ?? {};
  const anticipation: Category[] = [
    { key: "lt_2h", label: "Menos de 2 horas antes", value: t.count(buckets.lt_2h) ?? 0 },
    { key: "h2_24", label: "Entre 2 y 24 horas antes", value: t.count(buckets.h2_24) ?? 0 },
    { key: "gt_24h", label: "Más de 24 horas antes", value: t.count(buckets.gt_24h) ?? 0 },
  ];
  return {
    total, cancelled,
    rate: total ? t.number(data.cancellation_rate) ?? ratio(cancelled, total) : null,
    sessionsReturned: t.count(data.sessions_returned),
    reassignments: t.count(data.reassignments),
    averageHours: cancelled ? t.number(data.anticipation?.average_hours) : null,
    anticipation,
    start: toText(data.period?.start_date), end: toText(data.period?.end_date),
    invalid: t.invalid, isEmpty: !total,
  };
};

// ---------------------------------------------------------------- finanzas

export const normalizePayments = (raw: unknown) => {
  const data = unwrapObject<PaymentsBreakdownResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const total = t.number(data.total_income);
  const byMethod = categoryStat(data.by_method, (row, tr) => ({ label: toText(row.method) ?? "Sin medio informado", value: tr.number(row.total) }));
  const byConcept = categoryStat(data.by_concept, (row, tr) => ({ label: toText(row.plans_subtype) ?? "Sin plan asociado", value: tr.number(row.total) }));
  return { total, byMethod, byConcept, invalid: t.invalid + byMethod.invalid + byConcept.invalid, isEmpty: !total && byMethod.items.length === 0 };
};

export const normalizeExpenses = (raw: unknown) => {
  const rows = unwrapList<ExpenseByTypeRow>(raw);
  if (!rows) return null;
  const stat = categoryStat(rows, (row, t) => ({ label: toText(row.expense_type) ?? "Sin categoría", value: t.number(row.total_expenses) }));
  const withExpenses = stat.items.filter((item) => item.value !== 0);
  return { ...stat, items: withExpenses, zeroCategories: stat.items.length - withExpenses.length, isEmpty: withExpenses.length === 0 };
};

export const normalizeMargin = (raw: unknown) => {
  const data = unwrapObject<GrossMarginResponse>(raw);
  if (!data) return null;
  const t = new Tracker();
  const income = t.number(data.total_income);
  const expenses = t.number(data.total_expenses);
  const result = t.number(data.gross_margin) ?? (income !== null && expenses !== null ? income - expenses : null);
  return { income, expenses, result, invalid: t.invalid, isEmpty: !income && !expenses };
};
