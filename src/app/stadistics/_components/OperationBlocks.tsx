"use client";

import { Box, Button, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useStatistic } from "../_lib/api";
import { dateParams, FILTER_NAMES as F, rangeDays, type BlockProps } from "../_lib/filters";
import { formatDateRange, formatHours, formatInteger, formatMonthParam, formatPercent, pluralize, toIsoDate } from "../_lib/format";
import {
  normalizeCancellations, normalizeClasses, normalizeEvolution, normalizeOccupancy, normalizeOccupancyByHour, normalizeWaiting,
  WEEKDAYS, type EvolutionGranularity,
} from "../_lib/normalize";
import { BarList, ProportionBar } from "./BarList";
import { TrendChart } from "./Charts";
import { MonthControl, SelectControl } from "./Controls";
import { DataTable } from "./DataTable";
import { Heatmap } from "./Heatmap";
import { SERIES } from "./palette";
import { Kpi, KpiGrid, SectionLabel, StatBlock } from "./StatBlock";
import { neutralScale } from "../../../theme/brand";

const NO_CLASSES = "No hay clases programadas en el período o con los filtros elegidos.";

export function ClassesBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("classes-and-reservations/", dateParams(filters), { blockedReason: rangeIssue });
  const model = useMemo(() => (request.status === "success" ? normalizeClasses(request.data) : null), [request.status, request.data]);
  return <StatBlock id="clases" title="Clases y reservas" description="Clases programadas, reservas vigentes y reservas canceladas." period={formatDateRange(filters.startDate, filters.endDate)}
    ignoredFilters={[F.activity, F.plan]} request={request} model={model} emptyMessage={NO_CLASSES}>
    {(data) => <>
      <KpiGrid>
        <Kpi label="Clases programadas" value={formatInteger(data.totalClasses)} />
        <Kpi label="Reservas vigentes" value={formatInteger(data.active)} />
        <Kpi label="Reservas canceladas" value={formatInteger(data.cancelled)} hint={data.cancelledPct !== null ? `${formatPercent(data.cancelledPct)} de todas las reservas` : undefined} />
      </KpiGrid>
      {(data.byActivity.items.length > 0 || data.byRoom.items.length > 0) && <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        {data.byActivity.items.length > 0 && <Box><SectionLabel>Clases por actividad</SectionLabel><BarList items={data.byActivity.items} format={formatInteger} total={data.byActivity.total} label="Clases por actividad" limit={6} /></Box>}
        {data.byRoom.items.length > 0 && <Box><SectionLabel>Clases por sala</SectionLabel><BarList items={data.byRoom.items} format={formatInteger} total={data.byRoom.total} label="Clases por sala" limit={6} color={SERIES.secondary} /></Box>}
      </SimpleGrid>}
    </>}
  </StatBlock>;
}

export function OccupancyBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("occupancy-rate/", dateParams(filters), { blockedReason: rangeIssue });
  const model = useMemo(() => (request.status === "success" ? normalizeOccupancy(request.data) : null), [request.status, request.data]);
  return <StatBlock id="ocupacion" title="Ocupación de cupos" description="Qué parte de los lugares disponibles en las clases se reservó." skeleton="kpis"
    period={formatDateRange(filters.startDate, filters.endDate)} ignoredFilters={[F.activity, F.plan]} request={request} model={model} emptyMessage={NO_CLASSES}
    footnote="Se calcula con el estado actual de las reservas, no con una foto tomada al momento de cada clase.">
    {(data) => <>
      <KpiGrid>
        <Kpi label="Ocupación" value={data.occupancyPct === null ? "Sin cupos" : formatPercent(data.occupancyPct)} hint={`${formatInteger(data.reservations)} reservas de ${formatInteger(data.cupos)} cupos`} />
        <Kpi label="Clases llenas" value={formatInteger(data.fullClasses)} hint={data.fullClassesPct !== null ? `${formatPercent(data.fullClassesPct)} de ${pluralize(data.classes ?? 0, "clase", "clases")}` : undefined} />
        <Kpi label="Cupos libres" value={formatInteger(data.cupos !== null && data.reservations !== null ? Math.max(0, data.cupos - data.reservations) : null)} />
      </KpiGrid>
      {data.cupos !== null && data.reservations !== null && data.cupos > 0 && <ProportionBar label="Cupos" format={formatInteger} segments={[
        { key: "reservados", label: "Reservados", value: data.reservations, color: SERIES.primary },
        { key: "libres", label: "Libres", value: Math.max(0, data.cupos - data.reservations), color: neutralScale[300] },
      ]} />}
    </>}
  </StatBlock>;
}

export function HoursBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("occupancy-by-hour/", dateParams(filters), { blockedReason: rangeIssue });
  const model = useMemo(() => (request.status === "success" ? normalizeOccupancyByHour(request.data, filters.activity) : null), [request.status, request.data, filters.activity]);
  const [detailOpen, setDetailOpen] = useState(false);
  return <StatBlock id="ocupacion-horarios" wide title="Ocupación por día y horario" description="Porcentaje de cupos reservados en cada franja de la semana, sumando salas y actividades."
    period={formatDateRange(filters.startDate, filters.endDate)} ignoredFilters={[F.plan]} request={request} model={model} skeleton="table" emptyMessage={NO_CLASSES}>
    {(data) => <Stack spacing={4}>
      <KpiGrid columns={2}>
        <Kpi label="Franja más ocupada" value={data.highest ? `${WEEKDAYS[data.highest.weekday]} ${data.highest.time}` : "—"}
          hint={data.highest ? `${formatPercent(data.highest.pct)} · ${pluralize(data.highest.classes, "clase", "clases")}` : undefined} />
        <Kpi label="Franja menos ocupada" value={data.lowest ? `${WEEKDAYS[data.lowest.weekday]} ${data.lowest.time}` : "—"}
          hint={data.lowest ? `${formatPercent(data.lowest.pct)} · ${pluralize(data.lowest.classes, "clase", "clases")}` : "Se necesita más de una franja para comparar"} />
      </KpiGrid>
      <Heatmap caption="Ocupación por día de la semana y horario de inicio" weekdays={data.weekdays} times={data.times} cells={data.cells} />
      <Box>
        <Button size="sm" variant="secondary" onClick={() => setDetailOpen((open) => !open)} aria-expanded={detailOpen}>
          {detailOpen ? "Ocultar detalle por sala y actividad" : `Ver detalle por sala y actividad (${formatInteger(data.details.length)})`}
        </Button>
        {detailOpen && <Box mt={3}><DataTable
          caption="Ocupación por franja, sala y actividad"
          rows={data.details}
          rowKey={(row) => row.key}
          searchText={(row) => `${row.weekdayName} ${row.time} ${row.room} ${row.activity}`}
          initialSort={{ column: "pct", direction: "desc" }}
          columns={[
            { key: "day", header: "Día", render: (row) => row.weekdayName, sortValue: (row) => row.weekday * 10000 + Number(row.time.replace(":", "")) },
            { key: "time", header: "Hora", render: (row) => row.time, sortValue: (row) => row.time },
            { key: "room", header: "Sala", render: (row) => row.room, sortValue: (row) => row.room },
            { key: "activity", header: "Actividad", render: (row) => row.activity, sortValue: (row) => row.activity },
            { key: "classes", header: "Clases", numeric: true, render: (row) => formatInteger(row.classes), sortValue: (row) => row.classes },
            { key: "pct", header: "Ocupación", numeric: true, render: (row) => (row.pct === null ? "Sin cupos" : formatPercent(row.pct)), sortValue: (row) => row.pct },
            { key: "full", header: "Clases llenas", numeric: true, render: (row) => formatPercent(row.fullPct), sortValue: (row) => row.fullPct },
            { key: "high", header: "Con ocupación alta", numeric: true, render: (row) => formatPercent(row.highPct), sortValue: (row) => row.highPct },
          ]}
        /></Box>}
        {detailOpen && <Text fontSize="xs" color="text.secondary" mt={2}>“Con ocupación alta” es el porcentaje de clases de la franja con 80 % o más de sus cupos reservados.</Text>}
      </Box>
    </Stack>}
  </StatBlock>;
}

const EVOLUTION_OPTIONS = [{ value: "auto", label: "Automática" }, { value: "week", label: "Semanal" }, { value: "month", label: "Mensual" }, { value: "year", label: "Anual" }];
const EVOLUTION_UNIT: Record<EvolutionGranularity, [string, string]> = { week: ["semana", "semanas"], month: ["mes", "meses"], year: ["año", "años"] };

export function EvolutionBlock({ filters, rangeIssue }: BlockProps) {
  const [choice, setChoice] = useState("auto");
  const days = rangeDays(filters);
  // Automática: semanas hasta ~3 meses, meses hasta 3 años, luego años.
  const granularity: EvolutionGranularity = choice !== "auto" ? (choice as EvolutionGranularity) : days === null ? "month" : days <= 92 ? "week" : days <= 1096 ? "month" : "year";
  // El backend agrupa por semana o mes; "anual" se arma sumando meses.
  const request = useStatistic("occupancy-evolution/", { ...dateParams(filters), granularity: granularity === "week" ? "week" : "month" }, { blockedReason: rangeIssue });
  const model = useMemo(() => (request.status === "success" ? normalizeEvolution(request.data, granularity, filters.activity) : null), [request.status, request.data, granularity, filters.activity]);
  const [unit, units] = EVOLUTION_UNIT[granularity];
  return <StatBlock id="evolucion-ocupacion" wide title="Evolución de la ocupación" description={`Porcentaje de cupos reservados en cada ${unit}, sumando todas las clases.`}
    period={formatDateRange(filters.startDate, filters.endDate)} ignoredFilters={[F.plan]} request={request} model={model} emptyMessage={NO_CLASSES}
    controls={<SelectControl label="Agrupar por" value={choice} onChange={setChoice} options={EVOLUTION_OPTIONS} width="140px" />}
    footnote="La ocupación de cada período es el total de reservas dividido el total de cupos (no un promedio de porcentajes).">
    {(data) => {
      const valid = data.points.filter((point) => point.pct !== null);
      if (valid.length === 1) {
        const only = valid[0];
        return <><KpiGrid columns={2}>
          <Kpi label={`Ocupación · ${only.label}`} value={formatPercent(only.pct)} hint={`${formatInteger(only.reservations)} reservas de ${formatInteger(only.cupos)} cupos`} />
          <Kpi label="Clases" value={formatInteger(only.classes)} />
        </KpiGrid><Text fontSize="sm" color="text.secondary">Solo hay datos de un período ({only.label}). Ampliá el rango de fechas o elegí otra agrupación para ver la evolución.</Text></>;
      }
      return <TrendChart
        points={data.points}
        caption={`Ocupación por ${unit}`}
        series={[{ key: "pct", name: "Ocupación", color: SERIES.primary, type: "line" }]}
        format={(value) => formatPercent(value)}
        axisFormat={(value) => formatPercent(value, 0)}
        domainMax={100}
        summary={`${pluralize(data.points.length, unit, units)}. ${data.max ? `Máxima: ${formatPercent(data.max.pct)} (${data.max.label}).` : ""} ${data.min ? `Mínima: ${formatPercent(data.min.pct)} (${data.min.label}).` : ""}`.trim()}
      />;
    }}
  </StatBlock>;
}

export function WaitingBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("waiting-list-stats/", dateParams(filters), { blockedReason: rangeIssue });
  const model = useMemo(() => (request.status === "success" ? normalizeWaiting(request.data) : null), [request.status, request.data]);
  return <StatBlock id="lista-espera" title="Lista de espera" description="Pedidos para entrar a clases completas y cuántos terminaron en una reserva."
    period={formatDateRange(filters.startDate, filters.endDate)} ignoredFilters={[F.activity, F.plan]} request={request} model={model}
    emptyMessage="No hubo pedidos en lista de espera en el período elegido." footnote="Cada alumno cuenta una sola vez por clase.">
    {(data) => <>
      <KpiGrid>
        <Kpi label="Pedidos" value={formatInteger(data.requests)} />
        <Kpi label="Convertidos en reserva" value={formatInteger(data.converted)} />
        <Kpi label="Tasa de conversión" value={formatPercent(data.rate)} hint={`${formatInteger(data.converted)} de ${formatInteger(data.requests)} pedidos`} />
      </KpiGrid>
      {data.points.length > 1 && <TrendChart
        points={data.points.map((point) => ({ period: point.time, label: `${point.time} h`, shortLabel: point.time, requests: point.requests, converted: point.converted }))}
        caption="Pedidos en lista de espera por horario de inicio"
        series={[
          { key: "requests", name: "Pedidos", color: SERIES.primary, type: "bar" },
          { key: "converted", name: "Convertidos", color: SERIES.secondary, type: "bar" },
        ]}
        format={formatInteger}
        summary={`${pluralize(data.points.length, "horario", "horarios")} con pedidos, ordenados por hora de inicio.`}
      />}
    </>}
  </StatBlock>;
}

export function CancellationsBlock({ filters, today }: BlockProps) {
  const [month, setMonth] = useState(toIsoDate(today).slice(0, 7));
  const request = useStatistic("cancellation-rate/", { month, studio: filters.studio });
  const model = useMemo(() => (request.status === "success" ? normalizeCancellations(request.data) : null), [request.status, request.data]);
  return <StatBlock id="cancelaciones" title="Cancelaciones de reservas" description="Reservas canceladas sobre el total de reservas de clases del mes." period={formatMonthParam(month)}
    ignoredFilters={[F.dates, F.activity, F.plan]} request={request} model={model} skeleton="kpis"
    controls={<MonthControl label="Mes" value={month} onChange={setMonth} />}
    emptyMessage="No hubo reservas de clases en el mes elegido."
    footnote="Los cambios de turno se informan aparte y no cuentan como cancelación.">
    {(data) => <>
      <KpiGrid columns={4}>
        <Kpi label="Tasa de cancelación" value={formatPercent(data.rate)} hint={`${formatInteger(data.cancelled)} de ${formatInteger(data.total)} reservas`} />
        <Kpi label="Sesiones devueltas" value={formatInteger(data.sessionsReturned)} hint="Volvieron al plan del alumno" />
        <Kpi label="Cambios de turno" value={formatInteger(data.reassignments)} />
        <Kpi label="Anticipación promedio" value={data.cancelled ? formatHours(data.averageHours) : "—"} hint={data.cancelled ? "Antes del inicio de la clase" : "Sin cancelaciones"} />
      </KpiGrid>
      {data.cancelled ? <Box>
        <SectionLabel>¿Con cuánta anticipación se cancela?</SectionLabel>
        <BarList items={data.anticipation} format={formatInteger} total={data.anticipation.reduce((acc, item) => acc + item.value, 0) || undefined} label="Cancelaciones según anticipación" color={SERIES.negative} keepOrder />
      </Box> : null}
    </>}
  </StatBlock>;
}
