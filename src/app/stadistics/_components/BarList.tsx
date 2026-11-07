"use client";

import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { OTHERS_KEY, topWithOthers, type Category } from "../_lib/normalize";
import { formatPercent } from "../_lib/format";
import { SERIES } from "./palette";
import { DataTable } from "./DataTable";

type BarListProps = {
  items: Category[];
  format: (value: number) => string;
  /** Base para el porcentaje de cada fila; omitir si las filas no suman un total. */
  total?: number;
  /** Cantidad máxima de barras; el resto se agrupa en "Otros". */
  limit?: number;
  label: string;
  color?: string;
  /** Mantiene el orden recibido (categorías ordinales, p. ej. rangos). */
  keepOrder?: boolean;
};

/**
 * Barras horizontales en HTML: los nombres largos se ajustan en varias líneas y
 * cada valor queda escrito (no depende del tooltip ni del color).
 */
export function BarList({ items, format, total, limit = 8, label, color = SERIES.primary, keepOrder = false }: BarListProps) {
  const [showTable, setShowTable] = useState(false);
  const { visible, grouped } = useMemo(() => (keepOrder ? { visible: items, grouped: 0 } : topWithOthers(items, limit)), [items, limit, keepOrder]);
  const max = Math.max(...visible.map((item) => Math.abs(item.value)), 0);

  return <Box>
    <Box as="ul" role="list" aria-label={label} listStyleType="none">
      {visible.map((item) => {
        const share = total ? (item.value / total) * 100 : null;
        const width = max > 0 ? Math.max((Math.abs(item.value) / max) * 100, item.value !== 0 ? 1.5 : 0) : 0;
        return <Box as="li" key={item.key} py={1.5}>
          <Flex justify="space-between" gap={3} align="baseline">
            <Text fontSize="sm" color="text.primary" minW={0} fontStyle={item.key === OTHERS_KEY ? "italic" : undefined}>{item.label}</Text>
            <Text fontSize="sm" fontWeight="700" color="text.primary" whiteSpace="nowrap" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {format(item.value)}{share !== null && <Text as="span" fontWeight="400" color="gray.600"> · {formatPercent(share)}</Text>}
            </Text>
          </Flex>
          <Box h="10px" bg="gray.100" borderRadius="4px" mt={1} aria-hidden>
            <Box h="100%" w={`${width}%`} bg={item.key === OTHERS_KEY ? "gray.400" : color} borderRadius="0 4px 4px 0" />
          </Box>
        </Box>;
      })}
    </Box>
    {grouped > 0 && <Flex justify="space-between" align="center" gap={2} wrap="wrap" mt={2}>
      <Text fontSize="xs" color="gray.600">Se muestran {visible.length - 1} de {items.length} categorías; las demás se suman en “Otros”.</Text>
      <Link as="button" type="button" fontSize="xs" fontWeight="600" color="text.brand" textDecoration="underline" onClick={() => setShowTable((open) => !open)} aria-expanded={showTable}>
        {showTable ? "Ocultar detalle" : "Ver todas en tabla"}
      </Link>
    </Flex>}
    {showTable && <Box mt={3}>
      <DataTable
        caption={label}
        rows={items}
        rowKey={(item) => item.key}
        initialSort={{ column: "value", direction: "desc" }}
        columns={[
          { key: "label", header: "Categoría", render: (item) => item.label, sortValue: (item) => item.label },
          { key: "value", header: "Valor", numeric: true, render: (item) => format(item.value), sortValue: (item) => item.value },
          ...(total ? [{ key: "share", header: "Porcentaje", numeric: true, render: (item: Category) => formatPercent((item.value / total) * 100), sortValue: (item: Category) => item.value }] : []),
        ]}
      />
    </Box>}
  </Box>;
}

type Segment = { key: string; label: string; value: number; color: string };

/**
 * Barra 100 % para una composición de 2 o 3 partes de un mismo total (en lugar
 * de una torta). Cada parte se lista con su cantidad y porcentaje.
 */
export function ProportionBar({ segments, format, label }: { segments: Segment[]; format: (value: number) => string; label: string }) {
  const total = segments.reduce((acc, segment) => acc + Math.max(segment.value, 0), 0);
  if (total <= 0) return null;
  return <Box>
    <Flex h="14px" gap="2px" borderRadius="4px" overflow="hidden" role="img" aria-label={`${label}: ${segments.map((s) => `${s.label} ${format(s.value)} (${formatPercent((s.value / total) * 100)})`).join(", ")}`}>
      {segments.filter((segment) => segment.value > 0).map((segment) => <Box key={segment.key} flex={`${segment.value} 1 0`} minW="3px" bg={segment.color} />)}
    </Flex>
    <Flex gap={4} mt={2} wrap="wrap">
      {segments.map((segment) => <Flex key={segment.key} align="center" gap={2} fontSize="sm">
        <Box w="10px" h="10px" borderRadius="2px" bg={segment.color} flexShrink={0} aria-hidden />
        <Text color="text.primary">{segment.label}: <b>{format(segment.value)}</b> <Text as="span" color="gray.600">({formatPercent((segment.value / total) * 100)})</Text></Text>
      </Flex>)}
    </Flex>
  </Box>;
}
