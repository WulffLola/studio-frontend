"use client";

import { Button, ButtonGroup, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useStatistic } from "../_lib/api";
import { FILTER_NAMES as F, type BlockProps } from "../_lib/filters";
import { formatDateRange, formatDays, formatDecimal, formatInteger, formatPercent, formatSignedInteger, pluralize } from "../_lib/format";
import { normalizeClientsByMonth, normalizeRanges, normalizeStatus, ratio, type Granularity, type Person } from "../_lib/normalize";
import { ColumnChart, TrendChart } from "./Charts";
import { SelectControl } from "./Controls";
import { DataTable } from "./DataTable";
import { SERIES } from "./palette";
import { Kpi, KpiGrid, StatBlock } from "./StatBlock";

const CURRENT = "Situación actual";

export function StatusBlock({ filters }: BlockProps) {
  const request = useStatistic("status-clients/", { studio: filters.studio, activity: filters.activity, plan: filters.plan });
  const model = useMemo(() => (request.status === "success" ? normalizeStatus(request.data) : null), [request.status, request.data]);
  const [list, setList] = useState<"active" | "inactive" | null>(null);

  return <StatBlock id="alumnos-estado" title="Alumnos activos e inactivos" description="Cantidad de alumnos dados de alta y de alumnos dados de baja." period={CURRENT}
    ignoredFilters={[F.dates]} request={request} model={model} skeleton="kpis" emptyMessage="No hay alumnos que coincidan con los filtros elegidos.">
    {(data) => {
      const rows: Person[] = list === "active" ? data.activeList : list === "inactive" ? data.inactiveList : [];
      const total = (data.active ?? 0) + (data.inactive ?? 0);
      return <>
        <KpiGrid>
          <Kpi label="Activos" value={formatInteger(data.active)} hint={total ? `${formatPercent(ratio(data.active, total))} del total` : undefined} />
          <Kpi label="Inactivos" value={formatInteger(data.inactive)} hint="Alumnos dados de baja" />
          <Kpi label="Total" value={formatInteger(total)} hint="Activos más inactivos" />
        </KpiGrid>
        <ButtonGroup size="sm" variant="secondary" flexWrap="wrap" gap={2} spacing={0}>
          <Button onClick={() => setList(list === "active" ? null : "active")} aria-pressed={list === "active"} isDisabled={!data.activeList.length}>
            {list === "active" ? "Ocultar listado" : `Ver activos (${formatInteger(data.activeList.length)})`}
          </Button>
          <Button onClick={() => setList(list === "inactive" ? null : "inactive")} aria-pressed={list === "inactive"} isDisabled={!data.inactiveList.length}>
            {list === "inactive" ? "Ocultar listado" : `Ver inactivos (${formatInteger(data.inactiveList.length)})`}
          </Button>
        </ButtonGroup>
        {list && <DataTable
          caption={list === "active" ? "Alumnos activos" : "Alumnos inactivos"}
          rows={rows}
          rowKey={(row) => row.key}
          searchText={(row) => `${row.fullName} ${row.phone}`}
          initialSort={{ column: "name", direction: "asc" }}
          columns={[
            { key: "name", header: "Nombre", render: (row) => row.fullName, sortValue: (row) => row.fullName },
            { key: "phone", header: "Teléfono", render: (row) => row.phone },
          ]}
        />}
      </>;
    }}
  </StatBlock>;
}

const GRANULARITY_OPTIONS = [{ value: "auto", label: "Automática" }, { value: "month", label: "Mensual" }, { value: "year", label: "Anual" }];

export function ClientsByMonthBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("clients-by-month/", {}, { blockedReason: rangeIssue });
  const [choice, setChoice] = useState("auto");
  const months = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return null;
    const [sy, sm] = filters.startDate.split("-").map(Number);
    const [ey, em] = filters.endDate.split("-").map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
  }, [filters.startDate, filters.endDate]);
  // Más de dos años de meses se vuelven ilegibles: se agrupa por año.
  const granularity: Granularity = choice === "auto" ? (months === null || months > 24 ? "year" : "month") : (choice as Granularity);
  const model = useMemo(
    () => (request.status === "success" ? normalizeClientsByMonth(request.data, { start: filters.startDate, end: filters.endDate }, granularity) : null),
    [request.status, request.data, filters.startDate, filters.endDate, granularity],
  );

  return <StatBlock id="altas-bajas" title="Altas y bajas de alumnos" description="Alumnos nuevos y alumnos dados de baja en cada período, y la diferencia entre ambos."
    period={`${formatDateRange(filters.startDate, filters.endDate)} (meses completos)`} ignoredFilters={[F.studio, F.activity, F.plan]} request={request} model={model}
    controls={<SelectControl label="Agrupar por" value={choice} onChange={setChoice} options={GRANULARITY_OPTIONS} width="140px" />}
    emptyMessage="No hubo altas ni bajas en los meses del período elegido."
    footnote="El sistema no guarda reactivaciones: un alumno que vuelve figura con su fecha de alta original.">
    {(data) => <>
      <KpiGrid>
        <Kpi label="Altas" value={formatInteger(data.totals.altas)} hint="Alumnos nuevos" />
        <Kpi label="Bajas" value={formatInteger(data.totals.bajas)} hint="Alumnos dados de baja" />
        <Kpi label="Crecimiento neto" value={formatSignedInteger(data.totals.neto)} tone={data.totals.neto > 0 ? "positive" : data.totals.neto < 0 ? "negative" : "neutral"}
          hint={data.totals.neto > 0 ? "Más altas que bajas" : data.totals.neto < 0 ? "Más bajas que altas" : "Altas y bajas iguales"} />
      </KpiGrid>
      {data.points.length === 1
        ? <Text fontSize="sm" color="text.secondary">Solo hay datos de {data.points[0].label}. Se necesitan al menos dos períodos para mostrar una evolución.</Text>
        : <TrendChart
          points={data.points}
          caption="Altas, bajas y crecimiento neto por período"
          series={[
            { key: "altas", name: "Altas", color: SERIES.primary, type: "bar" },
            { key: "bajas", name: "Bajas", color: SERIES.negative, type: "bar" },
            { key: "neto", name: "Crecimiento neto", color: SERIES.anchor, type: "line" },
          ]}
          format={formatSignedIntegerOrCount}
          axisFormat={(value) => formatInteger(value)}
          summary={`${pluralize(data.points.length, granularity === "year" ? "año" : "mes", granularity === "year" ? "años" : "meses")} con movimientos${granularity === "year" ? ", agrupados por año" : ""}. Mayor cantidad de altas: ${formatInteger(Math.max(...data.points.map((p) => p.altas)))} (${data.points.reduce((a, b) => (b.altas > a.altas ? b : a)).label}).`}
        />}
      {data.undated > 0 && <Text fontSize="xs" color="text.secondary">{pluralize(data.undated, "movimiento no tiene", "movimientos no tienen")} fecha y no se incluyen.</Text>}
    </>}
  </StatBlock>;
}

// Altas y bajas son cantidades; el neto lleva signo.
const formatSignedIntegerOrCount = (value: number) => (value < 0 ? formatSignedInteger(value) : formatInteger(value));

export function TenureBlock(_: BlockProps) {
  const request = useStatistic("tenure/", {});
  const model = useMemo(() => (request.status === "success" ? normalizeRanges(request.data, "tenure") : null), [request.status, request.data]);
  return <StatBlock id="permanencia" title="Permanencia de alumnos" description="Cuánto tiempo pasó desde el alta de cada alumno activo." period={CURRENT}
    ignoredFilters={[F.studio, F.dates, F.activity, F.plan]} request={request} model={model} emptyMessage="No hay alumnos activos con fecha de alta registrada."
    footnote="Se mide desde la fecha de alta; una reactivación no reinicia la antigüedad.">
    {(data) => <>
      <KpiGrid columns={2}>
        <Kpi label="Antigüedad promedio" value={formatDays(data.average)} />
        <Kpi label="Alumnos considerados" value={formatInteger(data.total)} />
      </KpiGrid>
      <ColumnChart data={data.ranges} format={formatInteger} seriesName="Alumnos" summary={rangeSummary(data.ranges, "alumnos")} />
    </>}
  </StatBlock>;
}

export function AgeBlock({ filters }: BlockProps) {
  const request = useStatistic("average-age/", { studio: filters.studio, activity: filters.activity });
  const model = useMemo(() => (request.status === "success" ? normalizeRanges(request.data, "age") : null), [request.status, request.data]);
  return <StatBlock id="edades" title="Edades de alumnos" description="Edad promedio y distribución por rangos de los alumnos activos." period={CURRENT}
    ignoredFilters={[F.dates, F.plan]} request={request} model={model} emptyMessage="No hay alumnos activos con fecha de nacimiento para los filtros elegidos."
    footnote="Solo se cuentan alumnos con fecha de nacimiento cargada.">
    {(data) => <>
      <KpiGrid columns={2}>
        <Kpi label="Edad promedio" value={data.average === null ? "—" : `${formatDecimal(data.average)} años`} />
        <Kpi label="Alumnos considerados" value={formatInteger(data.total)} />
      </KpiGrid>
      <ColumnChart data={data.ranges} format={formatInteger} seriesName="Alumnos" summary={rangeSummary(data.ranges, "alumnos")} />
    </>}
  </StatBlock>;
}

const rangeSummary = (ranges: { label: string; value: number | null }[], unit: string) => {
  const top = ranges.reduce<{ label: string; value: number } | null>((best, item) => (item.value !== null && (!best || item.value > best.value) ? { label: item.label, value: item.value } : best), null);
  return top && top.value > 0 ? `El rango con más ${unit} es “${top.label}”, con ${formatInteger(top.value)}.` : `No hay ${unit} en ningún rango.`;
};
