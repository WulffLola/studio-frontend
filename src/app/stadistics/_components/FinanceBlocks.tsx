"use client";

import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { useStatistic } from "../_lib/api";
import { dateParams, FILTER_NAMES as F, REQUIRED_RANGE_MESSAGE, type BlockProps } from "../_lib/filters";
import { formatCurrency, formatDateRange, formatSignedCurrency, pluralize } from "../_lib/format";
import { normalizeExpenses, normalizeMargin, normalizePayments } from "../_lib/normalize";
import { BarList } from "./BarList";
import { SERIES } from "./palette";
import { Kpi, KpiGrid, SectionLabel, StatBlock } from "./StatBlock";

export function PaymentsBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("payments-breakdown/", dateParams(filters), { blockedReason: rangeIssue });
  const model = useMemo(() => (request.status === "success" ? normalizePayments(request.data) : null), [request.status, request.data]);
  return <StatBlock id="pagos" title="Pagos e ingresos" description="Dinero cobrado en el período, por medio de pago y por plan." period={formatDateRange(filters.startDate, filters.endDate)}
    ignoredFilters={[F.activity, F.plan]} request={request} model={model} emptyMessage="No se registraron pagos en el período elegido.">
    {(data) => <>
      <KpiGrid columns={2}>
        <Kpi label="Ingresos cobrados" value={formatCurrency(data.total)} hint="Suma de los pagos registrados" />
        <Kpi label="Planes con cobros" value={String(data.byConcept.items.length)} />
      </KpiGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        {data.byMethod.items.length > 0 && <Box><SectionLabel>Por medio de pago</SectionLabel>
          <BarList items={data.byMethod.items} format={formatCurrency} total={data.byMethod.total || undefined} label="Ingresos por medio de pago" /></Box>}
        {data.byConcept.items.length > 0 && <Box><SectionLabel>Por plan</SectionLabel>
          <BarList items={data.byConcept.items} format={formatCurrency} total={data.byConcept.total || undefined} label="Ingresos por plan" limit={6} color={SERIES.secondary} />
          <Text fontSize="xs" color="gray.600" mt={1}>Montos finales de cada plan cobrado, después de descuentos.</Text></Box>}
      </SimpleGrid>
    </>}
  </StatBlock>;
}

const blockedWithoutRange = (filters: BlockProps["filters"], rangeIssue: string | null) =>
  rangeIssue ?? (!filters.startDate || !filters.endDate ? REQUIRED_RANGE_MESSAGE : null);

export function ExpensesBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("total-expenses-by-type/", { ...dateParams(filters), expense_type: filters.expenseType }, { blockedReason: blockedWithoutRange(filters, rangeIssue) });
  const model = useMemo(() => (request.status === "success" ? normalizeExpenses(request.data) : null), [request.status, request.data]);
  return <StatBlock id="gastos" title="Gastos por categoría" description="Gastos registrados en el período, agrupados por categoría." period={formatDateRange(filters.startDate, filters.endDate)}
    ignoredFilters={[F.activity, F.plan]} request={request} model={model} emptyMessage="No se registraron gastos en el período o en la categoría elegida.">
    {(data) => <>
      <KpiGrid columns={2}>
        <Kpi label="Gastos totales" value={formatCurrency(data.total)} />
        <Kpi label="Categorías con gastos" value={String(data.items.length)} hint={data.zeroCategories ? `${pluralize(data.zeroCategories, "categoría", "categorías")} sin gastos` : undefined} />
      </KpiGrid>
      <BarList items={data.items} format={formatCurrency} total={data.total || undefined} label="Gastos por categoría" color={SERIES.negative} />
    </>}
  </StatBlock>;
}

export function MarginBlock({ filters, rangeIssue }: BlockProps) {
  const request = useStatistic("margen-bruto/", dateParams(filters), { blockedReason: blockedWithoutRange(filters, rangeIssue) });
  const model = useMemo(() => (request.status === "success" ? normalizeMargin(request.data) : null), [request.status, request.data]);
  return <StatBlock id="resultado" title="Ingresos menos gastos" description="Diferencia entre lo cobrado y lo gastado en el período." skeleton="kpis" period={formatDateRange(filters.startDate, filters.endDate)}
    ignoredFilters={[F.activity, F.plan]} request={request} model={model} emptyMessage="No hay ingresos ni gastos registrados en el período elegido."
    footnote="No es un resultado contable: solo considera los pagos y gastos cargados en el sistema.">
    {(data) => <KpiGrid>
      <Kpi label="Ingresos" value={formatCurrency(data.income)} />
      <Kpi label="Gastos" value={formatCurrency(data.expenses)} />
      <Kpi label="Resultado" value={formatSignedCurrency(data.result)} tone={data.result === null || data.result === 0 ? "neutral" : data.result > 0 ? "positive" : "negative"}
        hint={data.result === null ? undefined : data.result > 0 ? "Positivo: se cobró más de lo gastado" : data.result < 0 ? "Negativo: se gastó más de lo cobrado" : "Sin diferencia"} />
    </KpiGrid>}
  </StatBlock>;
}
