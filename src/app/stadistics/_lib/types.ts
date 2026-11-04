// Contratos de las respuestas del backend (apps/statistics/views.py).
// Se tipan como "posiblemente incompletos": la normalización valida cada campo.
// Los números pueden llegar como string (Decimal serializado) o faltar.

export type Numeric = number | string | null | undefined;
type Loose<T> = { [K in keyof T]?: T[K] | null };

export type PersonRow = Loose<{ name: string; last_name: string; phone: string }>;

export type StatusClientsResponse = Loose<{
  total_active_clients: Numeric;
  active_clients: PersonRow[];
  total_inactive_clients: Numeric;
  inactive_clients: PersonRow[];
}>;

export type PaymentsBreakdownResponse = Loose<{
  total_income: Numeric;
  by_method: Loose<{ method: string; total: Numeric }>[];
  by_concept: Loose<{ plans_subtype: string; total: Numeric }>[];
}>;

export type PlanValidityResponse = Loose<{
  today: string;
  days_ahead: Numeric;
  active: Numeric;
  expired: Numeric;
  expiring_soon: Numeric;
  sessions_exhausted: Numeric;
}>;

export type PersonActivePlanRow = Loose<{
  id: number;
  plans_subtype: Loose<{ id: number; name: string; activity_subtype: number; activity_subtype_name: string }>;
  exp_date: string;
  sessions_total: Numeric;
  sessions_remaining: Numeric;
  deleted: string;
}>;

export type ClientsByMonthResponse = Loose<{
  new_clients_by_month: Loose<{ month: string; total_new_clients: Numeric }>[];
  cancellations_by_month: Loose<{ month: string; total_cancellations: Numeric }>[];
  net_growth_by_month: Loose<{ month: string; net_growth: Numeric }>[];
}>;

export type RetentionResponse = Loose<{
  window_days: Numeric;
  eligible_plans: Numeric;
  renewed_plans: Numeric;
  renewal_rate: Numeric;
}>;

export type RangesResponse = Loose<{
  total: Numeric;
  ranges: Record<string, Numeric>;
  average_days: Numeric;
  average_age: Numeric;
}>;

export type ClientsByPlanRow = Loose<{ plans_subtype__name: string; total_clients: Numeric }>;

export type ProfitableRow = Loose<{ plans_subtype__name: string; total_income: Numeric }>;
export type MostProfitableResponse = Loose<{
  most_profitable_plan: ProfitableRow;
  ranking: ProfitableRow[];
  date_range: Loose<{ start_date: string; end_date: string }>;
}>;

export type PlanUsageResponse = Loose<{
  total_sessions: Numeric;
  consumed_sessions: Numeric;
  remaining_sessions: Numeric;
  unused_at_expiry: Numeric;
}>;

export type ClassesResponse = Loose<{
  total_classes: Numeric;
  reservations_active: Numeric;
  reservations_cancelled: Numeric;
  by_activity: Loose<{ activity_subtype_id: number; activity_subtype_name: string; classes: Numeric }>[];
  by_room: Loose<{ room_id: number; room_name: string; classes: Numeric }>[];
}>;

export type OccupancyResponse = Loose<{
  total_classes: Numeric;
  total_reservations: Numeric;
  total_cupos: Numeric;
  occupancy_pct: Numeric;
  full_classes: Numeric;
  full_classes_pct: Numeric;
}>;

export type OccupancyByHourRow = Loose<{
  room_name: string;
  activity_subtype_id: number;
  activity_subtype_name: string;
  weekday: Numeric;
  weekday_name: string;
  start_time: string;
  classes: Numeric;
  total_reservations: Numeric;
  total_cupos: Numeric;
  occupancy_pct: Numeric;
  full_classes_pct: Numeric;
  high_occupancy_recurrence: Numeric;
  low_occupancy_recurrence: Numeric;
}>;

export type OccupancyEvolutionRow = Loose<{
  period: string;
  activity_subtype_id: number;
  classes: Numeric;
  total_reservations: Numeric;
  total_cupos: Numeric;
}>;

export type WaitingListRow = Loose<{
  start_time: string;
  total_requests: Numeric;
  converted: Numeric;
  conversion_rate: Numeric;
}>;

export type CancellationResponse = Loose<{
  period: Loose<{ start_date: string; end_date: string }>;
  total_reservations: Numeric;
  cancelled_reservations: Numeric;
  cancellation_rate: Numeric;
  sessions_returned: Numeric;
  anticipation: Loose<{ average_hours: Numeric; buckets: Loose<{ lt_2h: Numeric; h2_24: Numeric; gt_24h: Numeric }> }>;
  reassignments: Numeric;
}>;

export type ExpenseByTypeRow = Loose<{ expense_type: string; total_expenses: Numeric }>;

export type GrossMarginResponse = Loose<{ total_income: Numeric; total_expenses: Numeric; gross_margin: Numeric }>;

export type CatalogItem = { id: number | string; name?: string | null; deleted?: string | null };
