"use client";

import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  Bar, BarChart, Brush, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Text as SvgText, Tooltip, XAxis, YAxis,
  type TooltipProps,
} from "recharts";
import { DataTable } from "./DataTable";
import { AXIS_TICK, GRID_STROKE, SERIES } from "./palette";

type Formatter = (value: number) => string;

/** Tooltip legible: fondo de marca, etiquetas en español y valores formateados. */
function ChartTooltip({ active, payload, label, format, labelFor }: TooltipProps<number, string> & { format: Formatter; labelFor?: (label: string) => string }) {
  if (!active || !payload?.length) return null;
  return <Box bg="bg.inverted" color="text.onBrand" px={3} py={2} borderRadius="md" fontSize="sm" boxShadow="md" maxW="240px">
    <Text fontWeight="700" mb={1}>{labelFor ? labelFor(String(label)) : label}</Text>
    {payload.map((item) => <Flex key={String(item.dataKey)} align="center" gap={2}>
      <Box w="10px" h="10px" borderRadius="2px" bg={item.color} flexShrink={0} aria-hidden />
      <Text>{item.name}: <b>{typeof item.value === "number" ? format(item.value) : "—"}</b></Text>
    </Flex>)}
  </Box>;
}

function TableToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return <Link as="button" type="button" fontSize="xs" fontWeight="600" color="text.brand" textDecoration="underline" onClick={onToggle} aria-expanded={open}>{open ? "Ocultar tabla" : "Ver valores en tabla"}</Link>;
}

// ------------------------------------------------------------------ columnas ordinales

type ColumnDatum = { key: string; label: string; value: number | null };

/** Etiqueta del eje X que se ajusta en varias líneas al ancho de su columna. */
function WrappedTick({ x, y, payload, width, visibleTicksCount }: { x?: number; y?: number; payload?: { value: string }; width?: number; visibleTicksCount?: number }) {
  const band = width && visibleTicksCount ? width / visibleTicksCount - 4 : 80;
  return <SvgText x={x} y={y} width={Math.max(band, 40)} textAnchor="middle" verticalAnchor="start" fontSize={11} fill={AXIS_TICK.fill} lineHeight={13}>{payload?.value ?? ""}</SvgText>;
}

/**
 * Columnas para pocas categorías ordenadas (rangos de edad, antigüedad, horarios).
 * Cada columna lleva su valor escrito encima, por eso no hace falta eje Y.
 */
export function ColumnChart({ data, format, seriesName, summary, color = SERIES.primary }: { data: ColumnDatum[]; format: Formatter; seriesName: string; summary: string; color?: string }) {
  return <Box>
    <Box role="img" aria-label={summary} h={{ base: "220px", md: "240px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={<WrappedTick />} interval={0} tickLine={false} axisLine={{ stroke: GRID_STROKE }} height={48} />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip cursor={{ fill: "rgba(109,91,166,0.06)" }} content={<ChartTooltip format={format} />} />
          <Bar dataKey="value" name={seriesName} fill={color} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
            <LabelList dataKey="value" position="top" formatter={(value: number | null) => (typeof value === "number" ? format(value) : "Sin dato")} style={{ fontSize: 12, fill: "#3A3A40", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
    <Text fontSize="xs" color="gray.600" mt={1}>{summary}</Text>
  </Box>;
}

// ------------------------------------------------------------------ series temporales

export type Series<K extends string> = { key: K; name: string; color: string; type: "bar" | "line" };

type TrendChartProps<P extends { period: string; label: string; shortLabel?: string }, K extends string> = {
  points: (P & Record<K, number | null>)[];
  series: Series<K>[];
  format: Formatter;
  axisFormat?: Formatter;
  summary: string;
  caption: string;
  domainMax?: number;
};

/**
 * Evolución temporal en un único eje. Con muchos puntos se espacian las
 * etiquetas del eje (sin quitar datos) y aparece un selector de rango.
 */
export function TrendChart<P extends { period: string; label: string; shortLabel?: string }, K extends string>({
  points, series, format, axisFormat, summary, caption, domainMax,
}: TrendChartProps<P, K>) {
  const [tableOpen, setTableOpen] = useState(false);
  const dense = points.length > 12;
  const showBrush = points.length > 36;
  const singleSeries = series.length === 1;
  const { labelByPeriod, shortByPeriod } = useMemo(() => ({
    labelByPeriod: new Map(points.map((point) => [point.period, point.label])),
    shortByPeriod: new Map(points.map((point) => [point.period, point.shortLabel ?? point.label])),
  }), [points]);

  return <Box>
    <Box role="img" aria-label={summary} h={{ base: showBrush ? "300px" : "250px", md: showBrush ? "330px" : "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: singleSeries && !dense ? 22 : 10, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={(period: string) => shortByPeriod.get(period) ?? period}
            tick={AXIS_TICK}
            interval={dense ? "preserveStartEnd" : 0}
            minTickGap={dense ? 24 : 4}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            padding={{ left: 16, right: 16 }}
          />
          <YAxis tick={AXIS_TICK} tickFormatter={axisFormat ?? format} width={56} axisLine={false} tickLine={false} domain={[(min: number) => Math.min(0, min), domainMax ?? "auto"]} allowDecimals={false} />
          <Tooltip content={<ChartTooltip format={format} labelFor={(period) => labelByPeriod.get(period) ?? period} />} cursor={{ fill: "rgba(109,91,166,0.06)", stroke: "#A0AEC0" }} />
          {!singleSeries && <Legend wrapperStyle={{ fontSize: 12, color: "#3A3A40" }} iconType="square" />}
          {series.map((item) => item.type === "bar"
            ? <Bar key={item.key} dataKey={item.key} name={item.name} fill={item.color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={!dense}>
              {singleSeries && !dense && <LabelList dataKey={item.key} position="top" formatter={(value: number) => format(value)} style={{ fontSize: 11, fill: "#3A3A40" }} />}
            </Bar>
            : <Line key={item.key} dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} type="monotone" connectNulls={false}
              dot={points.length <= 24 ? { r: 4, strokeWidth: 2, stroke: "#fff", fill: item.color } : false} activeDot={{ r: 5 }} isAnimationActive={!dense}>
              {singleSeries && !dense && <LabelList dataKey={item.key} position="top" formatter={(value: number) => format(value)} style={{ fontSize: 11, fill: "#3A3A40" }} />}
            </Line>)}
          {showBrush && <Brush dataKey="period" height={22} stroke="#6D5BA6" travellerWidth={10} tickFormatter={(period: string) => labelByPeriod.get(period) ?? period} />}
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
    <Flex justify="space-between" align="flex-start" gap={2} wrap="wrap" mt={1}>
      <Text fontSize="xs" color="gray.600" flex="1 1 220px">{summary}{showBrush ? " Usá el selector inferior para acotar el rango visible." : ""}</Text>
      <TableToggle open={tableOpen} onToggle={() => setTableOpen((open) => !open)} />
    </Flex>
    {tableOpen && <Box mt={3}>
      <DataTable
        caption={caption}
        rows={points}
        rowKey={(point) => point.period}
        initialSort={{ column: "period", direction: "asc" }}
        columns={[
          { key: "period", header: "Período", render: (point) => point.label, sortValue: (point) => point.period },
          ...series.map((item) => ({
            key: item.key, header: item.name, numeric: true,
            render: (point: P & Record<K, number | null>) => { const value = point[item.key]; return typeof value === "number" ? format(value) : "Sin datos"; },
            sortValue: (point: P & Record<K, number | null>) => point[item.key],
          })),
        ]}
      />
    </Box>}
  </Box>;
}
