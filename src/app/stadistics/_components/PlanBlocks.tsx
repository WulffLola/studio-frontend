"use client";

import { Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useStatistic } from "../_lib/api";
import { FILTER_NAMES as F, type BlockProps } from "../_lib/filters";
import { formatCurrency, formatDate, formatInteger, formatPercent, formatPeriod, pluralize } from "../_lib/format";
import { normalizeClientsByPlan, normalizePlanStatus, normalizeProfitable, normalizeRetention, normalizeUsage, normalizeValidity } from "../_lib/normalize";
import { BarList, ProportionBar } from "./BarList";
import { NumberControl, SelectControl } from "./Controls";
import { DataTable } from "./DataTable";
import { SERIES } from "./palette";
import { Kpi, KpiGrid, StatBlock } from "./StatBlock";

const CURRENT = "Situación actual";
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function ValidityBlock(_: BlockProps) {
  const [daysAhead, setDaysAhead] = useState(7);
  const request = useStatistic("plan-validity/", { days_ahead: String(daysAhead) });
  const model = useMemo(() => (request.status === "success" ? normalizeValidity(request.data) : null), [request.status, request.data]);
  return <StatBlock id="vigencia" title="Vigencia de planes" description="Planes contratados según su fecha de vencimiento." skeleton="kpis"
    period={model?.today ? `Al ${formatDate(model.today)}` : CURRENT} ignoredFilters={[F.studio, F.dates, F.activity, F.plan]} request={request} model={model}
    controls={<NumberControl label="Días para “por vencer”" value={daysAhead} onChange={setDaysAhead} min={0} max={365} />}
    emptyMessage="No hay planes contratados registrados.">
    {(data) => <KpiGrid columns={4}>
      <Kpi label="Vigentes" value={formatInteger(data.active)} hint="Vencen hoy o después" />
      <Kpi label="Vencidos" value={formatInteger(data.expired)} hint="Ya pasó su vencimiento" />
      <Kpi label="Por vencer" value={formatInteger(data.expiringSoon)} hint={`Vigentes que vencen en ${pluralize(data.daysAhead ?? daysAhead, "día", "días")}`} />
      <Kpi label="Sin sesiones" value={formatInteger(data.sessionsExhausted)} hint="Vigentes, pero sin clases disponibles" />
    </KpiGrid>}
  </StatBlock>;
}

export function PlanStatusBlock({ filters, today }: BlockProps) {
  const request = useStatistic("person-active-plan/", {});
  const model = useMemo(
    () => (request.status === "success" ? normalizePlanStatus(request.data, today, { plan: filters.plan, activity: filters.activity }) : null),
    [request.status, request.data, today, filters.plan, filters.activity],
  );
  return <StatBlock id="vigencia-por-plan" title="Vigencia por plan" description="Cuántos planes contratados de cada tipo están vigentes, sin sesiones o vencidos."
    period={`Al ${formatDate(today)}`} ignoredFilters={[F.studio, F.dates]} request={request} model={model} skeleton="table"
    emptyMessage="No hay planes contratados para la actividad o el plan elegidos.">
    {(data) => <DataTable
      caption={`${pluralize(data.total, "plan contratado", "planes contratados")}, agrupados por tipo de plan`}
      rows={data.items}
      rowKey={(row) => row.key}
      searchText={(row) => `${row.plan} ${row.activity}`}
      initialSort={{ column: "total", direction: "desc" }}
      columns={[
        { key: "plan", header: "Plan", render: (row) => row.plan, sortValue: (row) => row.plan },
        { key: "activity", header: "Actividad", render: (row) => row.activity, sortValue: (row) => row.activity },
        { key: "vigentes", header: "Vigentes", numeric: true, render: (row) => formatInteger(row.vigentes), sortValue: (row) => row.vigentes },
        { key: "sinSesiones", header: "Sin sesiones", numeric: true, render: (row) => formatInteger(row.sinSesiones), sortValue: (row) => row.sinSesiones },
        { key: "vencidos", header: "Vencidos", numeric: true, render: (row) => formatInteger(row.vencidos), sortValue: (row) => row.vencidos },
        { key: "total", header: "Total", numeric: true, render: (row) => formatInteger(row.total), sortValue: (row) => row.total },
      ]}
    />}
  </StatBlock>;
}

export function ClientsByPlanBlock(_: BlockProps) {
  const request = useStatistic("clients-by-plan/", {});
  const model = useMemo(() => (request.status === "success" ? normalizeClientsByPlan(request.data) : null), [request.status, request.data]);
  return <StatBlock id="alumnos-por-plan" title="Alumnos por plan" description="Cantidad de alumnos activos que tienen cada plan." period={CURRENT}
    ignoredFilters={[F.studio, F.dates, F.activity, F.plan]} request={request} model={model} emptyMessage="No hay alumnos activos con planes asignados."
    footnote="Un alumno con varios planes se cuenta en cada uno, por eso no se muestran porcentajes sobre un total.">
    {(data) => <>
      <Text fontSize="sm" color="gray.600">{pluralize(data.items.length, "plan tiene", "planes tienen")} alumnos asignados.</Text>
      <BarList items={data.items} format={formatInteger} label="Alumnos por plan" />
    </>}
  </StatBlock>;
}

export function RetentionBlock(_: BlockProps) {
  const [windowDays, setWindowDays] = useState(30);
  const request = useStatistic("retention-rate/", { window_days: String(windowDays) });
  const model = useMemo(() => (request.status === "success" ? normalizeRetention(request.data) : null), [request.status, request.data]);
  return <StatBlock id="renovaciones" title="Renovaciones de planes" description="Porcentaje de planes vencidos que el alumno renovó en la misma actividad." skeleton="kpis"
    period="Todo el historial" ignoredFilters={[F.studio, F.dates, F.activity, F.plan]} request={request} model={model}
    controls={<NumberControl label="Días para renovar" value={windowDays} onChange={setWindowDays} min={1} max={365} />}
    emptyMessage="Todavía no hay planes cuyo plazo de renovación haya terminado, así que no se puede calcular la tasa.">
    {(data) => <>
      <KpiGrid>
        <Kpi label="Tasa de renovación" value={formatPercent(data.rate)} hint={`${formatInteger(data.renewed)} de ${formatInteger(data.eligible)} planes`} />
        <Kpi label="Renovados" value={formatInteger(data.renewed)} hint={`Dentro de los ${formatInteger(data.windowDays ?? windowDays)} días del vencimiento`} />
        <Kpi label="No renovados" value={formatInteger(data.eligible !== null && data.renewed !== null ? data.eligible - data.renewed : null)} />
      </KpiGrid>
      {data.eligible !== null && data.renewed !== null && <ProportionBar label="Renovaciones" format={formatInteger} segments={[
        { key: "renovados", label: "Renovados", value: data.renewed, color: SERIES.primary },
        { key: "no", label: "No renovados", value: data.eligible - data.renewed, color: SERIES.negative },
      ]} />}
    </>}
  </StatBlock>;
}

export function ProfitableBlock({ filters, today }: BlockProps) {
  const [year, setYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState("");
  const request = useStatistic("most-profitable-plan/", { year, month, studio: filters.studio }, { notFoundIsEmpty: true });
  const model = useMemo(() => (request.status === "success" ? normalizeProfitable(request.data) : null), [request.status, request.data]);
  const years = Array.from({ length: 10 }, (_, index) => String(today.getFullYear() - index));
  const period = month ? formatPeriod(`${year}-${month.padStart(2, "0")}`) : `Año ${year}`;
  return <StatBlock id="ingresos-por-plan" title="Ingresos por plan" description="Cuánto facturó cada plan según los pagos registrados." period={period}
    ignoredFilters={[F.dates, F.activity, F.plan]} request={request} model={model}
    controls={<>
      <SelectControl label="Año" value={year} onChange={setYear} options={years.map((value) => ({ value, label: value }))} width="100px" />
      <SelectControl label="Mes" value={month} onChange={setMonth} options={[{ value: "", label: "Todo el año" }, ...MONTH_NAMES.map((label, index) => ({ value: String(index + 1), label }))]} width="140px" />
    </>}
    emptyMessage={`No hay pagos de planes en ${month ? period.toLowerCase() : `el año ${year}`}.`}>
    {(data) => <>
      <KpiGrid columns={2}>
        <Kpi label="Plan con más ingresos" value={data.top?.label ?? "—"} hint={data.top ? formatCurrency(data.top.value) : undefined} />
        <Kpi label="Ingresos por planes" value={formatCurrency(data.total)} hint={pluralize(data.items.length, "plan con pagos", "planes con pagos")} />
      </KpiGrid>
      <BarList items={data.items} format={formatCurrency} total={data.total > 0 ? data.total : undefined} label="Ingresos por plan" />
    </>}
  </StatBlock>;
}

export function UsageBlock({ filters }: BlockProps) {
  const request = useStatistic("plan-usage/", { activity: filters.activity });
  const model = useMemo(() => (request.status === "success" ? normalizeUsage(request.data) : null), [request.status, request.data]);
  return <StatBlock id="uso-planes" title="Uso de planes" description="Sesiones incluidas en los planes contratados: cuántas se usaron y cuántas quedan." period={CURRENT}
    ignoredFilters={[F.studio, F.dates, F.plan]} request={request} model={model} skeleton="kpis" emptyMessage="No hay sesiones registradas en planes contratados."
    footnote="Una sesión se considera usada cuando se descuenta al reservar, no cuando el alumno asiste.">
    {(data) => <>
      <KpiGrid columns={4}>
        <Kpi label="Sesiones totales" value={formatInteger(data.total)} />
        <Kpi label="Usadas" value={formatInteger(data.consumed)} hint={data.consumedPct !== null ? `${formatPercent(data.consumedPct)} del total` : undefined} />
        <Kpi label="Disponibles" value={formatInteger(data.remaining)} />
        <Kpi label="Sin usar al vencer" value={formatInteger(data.unusedAtExpiry)} hint="Quedaron en planes ya vencidos" />
      </KpiGrid>
      {data.consumed !== null && data.remaining !== null && <ProportionBar label="Uso de sesiones" format={formatInteger} segments={[
        { key: "usadas", label: "Usadas", value: data.consumed, color: SERIES.primary },
        { key: "disponibles", label: "Disponibles", value: data.remaining, color: SERIES.secondary },
      ]} />}
    </>}
  </StatBlock>;
}
