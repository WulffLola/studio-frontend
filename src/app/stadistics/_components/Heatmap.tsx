"use client";

import { Box, Flex, Table, TableCaption, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { formatInteger, formatPercent } from "../_lib/format";
import type { HourCell } from "../_lib/normalize";
import { HEAT_DARK_FROM, HEAT_SCALE } from "./palette";

const LEVELS = HEAT_SCALE.length;
/** 0-100 % → paso de la escala (tramos iguales de ~16,7 puntos). */
const levelFor = (pct: number) => Math.min(LEVELS - 1, Math.floor((Math.min(Math.max(pct, 0), 100) / 100) * LEVELS));

type HeatmapProps = {
  caption: string;
  weekdays: { index: number; name: string }[];
  times: string[];
  cells: Map<string, HourCell>;
};

/**
 * Mapa de calor día × horario como tabla semántica: cada celda muestra el
 * porcentaje escrito, así el color es un refuerzo y no el único canal.
 */
export function Heatmap({ caption, weekdays, times, cells }: HeatmapProps) {
  return <Box>
    <TableContainer overflowX="auto" border="1px solid" borderColor="gray.100" borderRadius="md">
      <Table size="sm" sx={{ borderCollapse: "separate", borderSpacing: "2px" }}>
        <TableCaption placement="top" textAlign="left" m={0} px={2} py={2} fontSize="xs" color="gray.600">{caption}</TableCaption>
        <Thead>
          <Tr>
            <Th scope="col" position="sticky" left={0} bg="bg.surface" zIndex={1} textTransform="none" color="text.primary" w="1%">Horario</Th>
            {weekdays.map((day) => <Th key={day.index} scope="col" textAlign="center" textTransform="none" color="text.primary" px={1}>
              <Box as="abbr" title={day.name} textDecoration="none">{day.name.slice(0, 3)}</Box>
            </Th>)}
          </Tr>
        </Thead>
        <Tbody>
          {times.map((time) => <Tr key={time}>
            <Th scope="row" position="sticky" left={0} bg="bg.surface" zIndex={1} fontSize="xs" color="text.primary" sx={{ fontVariantNumeric: "tabular-nums" }}>{time}</Th>
            {weekdays.map((day) => {
              const cell = cells.get(`${day.index}|${time}`);
              if (!cell) return <Td key={day.index} textAlign="center" bg="gray.50" color="gray.500" fontSize="xs" px={1} aria-label={`${day.name} ${time}: sin clases`}>—</Td>;
              if (cell.pct === null) return <Td key={day.index} textAlign="center" bg="gray.100" color="gray.600" fontSize="xs" px={1} title="Clases sin cupos registrados">s/c</Td>;
              const level = levelFor(cell.pct);
              return <Td
                key={day.index}
                textAlign="center"
                bg={HEAT_SCALE[level]}
                color={level >= HEAT_DARK_FROM ? "white" : "text.primary"}
                fontWeight="600"
                fontSize="xs"
                px={1}
                minW="52px"
                borderRadius="3px"
                title={`${day.name} ${time} · ${formatInteger(cell.classes)} clases · ${formatInteger(cell.reservations)} reservas de ${formatInteger(cell.cupos)} cupos`}
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatPercent(cell.pct, 0)}
              </Td>;
            })}
          </Tr>)}
        </Tbody>
      </Table>
    </TableContainer>
    <Flex align="center" gap={2} mt={2} wrap="wrap" fontSize="xs" color="gray.600">
      <Text>Ocupación:</Text>
      <Flex aria-hidden>{HEAT_SCALE.map((color) => <Box key={color} w="22px" h="10px" bg={color} />)}</Flex>
      <Text>0 % a 100 %</Text>
      <Text>· “—” sin clases · “s/c” sin cupos registrados</Text>
    </Flex>
  </Box>;
}
