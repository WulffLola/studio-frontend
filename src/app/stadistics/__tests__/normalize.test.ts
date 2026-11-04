// Pruebas de la capa de normalización y formateo de estadísticas.
// Ejecutar con: npm run test:stats
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_VALUE, formatCurrency, formatDate, formatDays, formatHours, formatInteger, formatPercent, formatPeriod, formatSignedCurrency, formatTime,
} from "../_lib/format";
import {
  normalizeCancellations, normalizeClientsByMonth, normalizeClientsByPlan, normalizeEvolution, normalizeExpenses, normalizeMargin,
  normalizeOccupancy, normalizeOccupancyByHour, normalizePayments, normalizePlanStatus, normalizeProfitable, normalizeRanges,
  normalizeRetention, normalizeStatus, normalizeUsage, normalizeValidity, normalizeWaiting, toCount, toNumber, topWithOthers, unwrapList,
} from "../_lib/normalize";

const FORBIDDEN = /NaN|undefined|null|Invalid Date|Infinity/;
const assertReadable = (text: string) => assert.doesNotMatch(text, FORBIDDEN, `texto ilegible: ${text}`);
const RANGE = { start: "2026-01-01", end: "2026-12-31" };

describe("conversión segura de números", () => {
  it("acepta números y strings numéricos", () => {
    assert.equal(toNumber(12.5), 12.5);
    assert.equal(toNumber("1500.75"), 1500.75);
    assert.equal(toNumber(0), 0);
  });
  it("devuelve null para valores inválidos, sin convertirlos en 0", () => {
    for (const value of [null, undefined, "", "abc", NaN, Infinity, {}, [], "12,5"]) assert.equal(toNumber(value), null);
    assert.equal(toCount(-3), null);
  });
});

describe("formateadores es-AR", () => {
  it("nunca muestra NaN, undefined, null ni Invalid Date", () => {
    const weird = [null, undefined, NaN, Infinity, -Infinity];
    for (const value of weird) {
      for (const formatter of [formatCurrency, formatInteger, formatPercent, formatSignedCurrency, formatDays, formatHours]) {
        assert.equal(formatter(value as number), EMPTY_VALUE);
      }
    }
    for (const value of ["", "2026-13-45x", "hola", null, undefined]) assertReadable(formatDate(value));
    assertReadable(formatTime(undefined));
  });
  it("formatea fechas como dd/mm/aaaa sin corrimiento de zona horaria", () => {
    assert.equal(formatDate("2026-03-01"), "01/03/2026");
    assert.equal(formatDate("2026-03-01T23:59:00Z"), "01/03/2026");
  });
  it("formatea moneda en pesos y porcentajes", () => {
    assert.match(formatCurrency(1234567), /\$\s?1\.234\.567/);
    assert.equal(formatPercent(33.3333), "33,3 %");
    assert.match(formatSignedCurrency(-500), /^−\$\s?500$/);
  });
  it("traduce períodos mensuales y semanas ISO", () => {
    assert.equal(formatPeriod("2026-10"), "Octubre de 2026");
    assert.equal(formatPeriod("2026-W01"), "Semana del 29/12/2025");
    assert.equal(formatPeriod("2026"), "Año 2026");
  });
});

describe("respuestas vacías e inválidas", () => {
  it("respuesta vacía → estado vacío, no error", () => {
    assert.equal(normalizeExpenses([])?.isEmpty, true);
    assert.equal(normalizeWaiting([])?.isEmpty, true);
    assert.equal(normalizeOccupancyByHour([], "")?.isEmpty, true);
    assert.equal(normalizeEvolution([], "month", "")?.isEmpty, true);
    assert.equal(normalizeClientsByPlan([])?.isEmpty, true);
    assert.equal(normalizePlanStatus([], new Date(2026, 9, 27), { plan: "", activity: "" })?.isEmpty, true);
    assert.equal(normalizeClientsByMonth({ new_clients_by_month: [], cancellations_by_month: [] }, RANGE, "month")?.isEmpty, true);
  });
  it("formato inesperado → null (no se inventan datos)", () => {
    assert.equal(normalizeExpenses({ foo: 1 }), null);
    assert.equal(normalizeStatus("texto"), null);
    assert.equal(normalizeWaiting(null), null);
  });
  it("lee listas envueltas por el aviso de estudio dado de baja", () => {
    const wrapped = { detail: "El estudio está dado de baja.", results: [{ expense_type: "Luz", total_expenses: 100 }] };
    assert.deepEqual(unwrapList(wrapped), wrapped.results);
    assert.equal(normalizeExpenses(wrapped)?.total, 100);
  });
  it("cuenta los valores inválidos como datos parciales", () => {
    const model = normalizePayments({ total_income: "abc", by_method: [{ method: "Efectivo", total: "100" }, { method: "Transferencia", total: null }] });
    assert.equal(model?.total, null);
    assert.equal(model?.byMethod.items.length, 1);
    assert.ok((model?.invalid ?? 0) >= 2);
  });
  it("no muta la respuesta original", () => {
    const raw = { ranking: [{ plans_subtype__name: "B", total_income: 1 }, { plans_subtype__name: "A", total_income: 5 }] };
    const copy = JSON.parse(JSON.stringify(raw));
    normalizeProfitable(raw);
    assert.deepEqual(raw, copy);
  });
});

describe("cero frente a sin datos", () => {
  it("renovación sin planes elegibles no es 0 %", () => {
    const model = normalizeRetention({ window_days: 30, eligible_plans: 0, renewed_plans: 0, renewal_rate: 0 });
    assert.equal(model?.rate, null);
    assert.equal(model?.isEmpty, true);
  });
  it("ocupación con clases pero sin cupos → sin dato, no 0 %", () => {
    const model = normalizeOccupancy({ total_classes: 3, total_reservations: 0, total_cupos: 0, occupancy_pct: 0, full_classes: 0, full_classes_pct: 0 });
    assert.equal(model?.occupancyPct, null);
    assert.equal(model?.isEmpty, false);
  });
  it("cancelación con reservas y ninguna cancelada → 0 % real", () => {
    const model = normalizeCancellations({ total_reservations: 10, cancelled_reservations: 0, cancellation_rate: 0, anticipation: { average_hours: 0, buckets: {} } });
    assert.equal(model?.rate, 0);
    assert.equal(model?.averageHours, null);
  });
  it("un rango inválido queda sin dato, no en 0", () => {
    const model = normalizeRanges({ average_age: 30, total: 5, ranges: { "<18": "x", "18-29": 2, "30-44": null } }, "age");
    assert.equal(model?.ranges.find((range) => range.key === "<18")?.value, null);
    assert.equal(model?.ranges.find((range) => range.key === "18-29")?.value, 2);
    assert.equal(model?.invalid, 2);
  });
  it("edad promedio null no se muestra como 0", () => {
    const model = normalizeRanges({ average_age: null, total: 0, ranges: { "<18": 0 } }, "age");
    assert.equal(model?.average, null);
    assert.equal(model?.isEmpty, true);
  });
  it("gastos en cero se separan de las categorías con gastos", () => {
    const model = normalizeExpenses([{ expense_type: "Luz", total_expenses: 0 }, { expense_type: "Sueldos", total_expenses: "2500.50" }]);
    assert.equal(model?.items.length, 1);
    assert.equal(model?.zeroCategories, 1);
    assert.equal(model?.total, 2500.5);
  });
  it("resultado negativo se conserva con signo", () => {
    assert.equal(normalizeMargin({ total_income: 100, total_expenses: 300, gross_margin: -200 })?.result, -200);
  });
});

describe("un solo registro y pocos registros", () => {
  it("un único mes queda como un solo punto", () => {
    const model = normalizeClientsByMonth({ new_clients_by_month: [{ month: "2026-10", total_new_clients: 4 }] }, RANGE, "month");
    assert.equal(model?.points.length, 1);
    assert.deepEqual(model?.totals, { altas: 4, bajas: 0, neto: 4 });
  });
  it("vigencia con valores del backend", () => {
    const model = normalizeValidity({ today: "2026-10-27", days_ahead: 7, active: 5, expired: 2, expiring_soon: 1, sessions_exhausted: 0 });
    assert.equal(model?.sessionsExhausted, 0);
    assert.equal(model?.isEmpty, false);
  });
  it("uso de planes calcula el porcentaje usado", () => {
    assert.equal(normalizeUsage({ total_sessions: 40, consumed_sessions: 10, remaining_sessions: 30, unused_at_expiry: 2 })?.consumedPct, 25);
  });
});

describe("orden cronológico y agregación", () => {
  it("ordena meses desordenados y combina altas y bajas", () => {
    const model = normalizeClientsByMonth({
      new_clients_by_month: [{ month: "2026-03", total_new_clients: 1 }, { month: "2026-01", total_new_clients: 2 }, { month: null, total_new_clients: 9 }],
      cancellations_by_month: [{ month: "2026-02", total_cancellations: 3 }],
    }, RANGE, "month");
    assert.deepEqual(model?.points.map((point) => point.period), ["2026-01", "2026-02", "2026-03"]);
    assert.equal(model?.points[1].neto, -3);
    assert.equal(model?.undated, 9);
  });
  it("recorta al rango y agrupa por año", () => {
    const model = normalizeClientsByMonth({ new_clients_by_month: [{ month: "2024-05", total_new_clients: 1 }, { month: "2025-05", total_new_clients: 2 }, { month: "2025-06", total_new_clients: 3 }] },
      { start: "2025-01-01", end: "2025-12-31" }, "year");
    assert.deepEqual(model?.points.map((point) => [point.period, point.altas]), [["2025", 5]]);
  });
  it("la evolución pondera por cupos en vez de promediar porcentajes", () => {
    const model = normalizeEvolution([
      { period: "2026-02", total_reservations: 1, total_cupos: 10, classes: 1 },
      { period: "2026-01", total_reservations: 9, total_cupos: 10, classes: 1 },
      { period: "2026-01", total_reservations: 1, total_cupos: 90, classes: 1 },
    ], "month", "");
    assert.deepEqual(model?.points.map((point) => point.period), ["2026-01", "2026-02"]);
    assert.equal(model?.points[0].pct, 10); // (9+1)/(10+90), no (90 %+1,1 %)/2
  });
  it("la evolución anual suma meses y respeta el filtro de actividad", () => {
    const model = normalizeEvolution([
      { period: "2025-12", total_reservations: 5, total_cupos: 10, activity_subtype_id: 1 },
      { period: "2026-01", total_reservations: 5, total_cupos: 10, activity_subtype_id: 1 },
      { period: "2026-02", total_reservations: 10, total_cupos: 10, activity_subtype_id: 2 },
    ], "year", "1");
    assert.deepEqual(model?.points.map((point) => [point.period, point.pct]), [["2025", 50], ["2026", 50]]);
  });
  it("lista de espera ordenada por horario", () => {
    const model = normalizeWaiting([{ start_time: "18:00:00", total_requests: 2, converted: 1 }, { start_time: "08:00:00", total_requests: 4, converted: 0 }]);
    assert.deepEqual(model?.points.map((point) => point.time), ["08:00", "18:00"]);
    assert.equal(model?.rate, (1 / 6) * 100);
  });
});

describe("categorías con nombres largos y muchas categorías", () => {
  it("conserva el total al agrupar la cola en Otros", () => {
    const items = Array.from({ length: 50 }, (_, index) => ({ key: String(index), label: `Plan con un nombre muy largo número ${index}`, value: index + 1 }));
    const { visible, grouped } = topWithOthers(items, 8);
    assert.equal(visible.length, 8);
    assert.equal(grouped, 43);
    assert.equal(visible.reduce((acc, item) => acc + item.value, 0), items.reduce((acc, item) => acc + item.value, 0));
    assert.equal(visible[0].value, 50); // el extremo superior no se pierde
  });
  it("une planes repetidos y nombra los vacíos", () => {
    const model = normalizeClientsByPlan([{ plans_subtype__name: "Pilates", total_clients: 2 }, { plans_subtype__name: "Pilates", total_clients: 3 }, { plans_subtype__name: null, total_clients: 1 }]);
    assert.deepEqual(model?.items.map((item) => [item.label, item.value]).sort(), [["Pilates", 5], ["Plan sin nombre", 1]]);
  });
});

describe("volúmenes grandes", () => {
  it("procesa 5.000 franjas de ocupación rápido y en una grilla acotada", () => {
    const rows = Array.from({ length: 5000 }, (_, index) => ({
      weekday: index % 7, weekday_name: "x", start_time: `${String(7 + (index % 14)).padStart(2, "0")}:00:00`, room_name: `Sala ${index % 9}`,
      activity_subtype_id: index % 5, activity_subtype_name: `Actividad ${index % 5}`, classes: 4, total_reservations: index % 11, total_cupos: 10,
      full_classes_pct: 0, high_occupancy_recurrence: 0.25,
    }));
    const started = performance.now();
    const model = normalizeOccupancyByHour(rows, "");
    const elapsed = performance.now() - started;
    assert.ok(elapsed < 200, `tardó ${elapsed} ms`);
    assert.equal(model?.details.length, 5000);
    assert.ok((model?.cells.size ?? 0) <= 7 * 14);
    assert.equal(model?.details[0].highPct, 25);
    assert.ok(model?.highest && model.lowest && (model.highest.pct ?? 0) >= (model.lowest.pct ?? 0));
  });
  it("agrupa 10.000 planes contratados en una pasada", () => {
    const today = new Date(2026, 9, 27);
    const rows = Array.from({ length: 10000 }, (_, index) => ({
      id: index, exp_date: index % 2 ? "2026-12-31" : "2026-01-01", sessions_remaining: index % 3 === 0 ? 0 : 4,
      plans_subtype: { id: index % 20, name: `Plan ${index % 20}`, activity_subtype: index % 4, activity_subtype_name: "Funcional" }, deleted: index % 50 === 0 ? "2026-01-01" : null,
    }));
    const started = performance.now();
    const model = normalizePlanStatus(rows, today, { plan: "", activity: "" });
    assert.ok(performance.now() - started < 200);
    assert.equal(model?.items.length, 20);
    assert.equal(model?.total, 10000 - 200);
    const filtered = normalizePlanStatus(rows, today, { plan: "3", activity: "" });
    assert.equal(filtered?.items.length, 1);
  });
  it("cientos de semanas en la evolución quedan ordenadas", () => {
    const rows = Array.from({ length: 900 }, (_, index) => ({ period: `${2020 + Math.floor(index / 52) % 6}-W${String((index % 52) + 1).padStart(2, "0")}`, total_reservations: 3, total_cupos: 10 }))
      .reverse();
    const model = normalizeEvolution(rows, "week", "");
    const periods = model?.points.map((point) => point.period) ?? [];
    assert.deepEqual(periods, [...periods].sort());
    for (const point of model?.points ?? []) assertReadable(point.label);
  });
});
