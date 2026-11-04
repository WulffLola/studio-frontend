"use client";

import { Box, Flex, IconButton, Input, Link, Table, TableCaption, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatInteger } from "../_lib/format";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null;
  numeric?: boolean;
};

type Sort = { column: string; direction: "asc" | "desc" };

type DataTableProps<T> = {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  pageSize?: number;
  initialSort?: Sort;
  /** Texto en el que se busca; si se define, aparece un buscador. */
  searchText?: (row: T) => string;
  emptyMessage?: string;
};

const normalizeSearch = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Tabla con encabezados semánticos, orden por columna, búsqueda y paginación local. */
export function DataTable<T>({ caption, rows, columns, rowKey, pageSize = 10, initialSort, searchText, emptyMessage = "No hay registros que coincidan con la búsqueda." }: DataTableProps<T>) {
  const [sort, setSort] = useState<Sort | undefined>(initialSort);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!searchText || !deferredQuery.trim()) return rows;
    const needle = normalizeSearch(deferredQuery.trim());
    return rows.filter((row) => normalizeSearch(searchText(row)).includes(needle));
  }, [rows, searchText, deferredQuery]);

  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sort?.column);
    if (!sort || !column?.sortValue) return filtered;
    const factor = sort.direction === "asc" ? 1 : -1;
    const getValue = column.sortValue;
    return [...filtered].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      if (left === null) return 1;
      if (right === null) return -1;
      return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "es")) * factor;
    });
  }, [filtered, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { setPage(1); }, [deferredQuery, sort, rows]);
  const current = Math.min(page, pages);
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (column: string) =>
    setSort((old) => (old?.column === column ? { column, direction: old.direction === "asc" ? "desc" : "asc" } : { column, direction: "desc" }));

  return <Box>
    {searchText && <Input size="sm" mb={3} maxW={{ base: "100%", sm: "280px" }} placeholder="Buscar…" aria-label={`Buscar en ${caption}`} value={query} onChange={(event) => setQuery(event.target.value)} />}
    <TableContainer border="1px solid" borderColor="border.subtle" borderRadius="md" overflowX="auto">
      <Table size="sm">
        <TableCaption placement="top" textAlign="left" m={0} px={3} py={2} fontSize="xs" color="text.secondary">{caption}</TableCaption>
        <Thead bg="bg.subtle">
          <Tr>
            {columns.map((column) => {
              const active = sort?.column === column.key;
              return <Th key={column.key} isNumeric={column.numeric} scope="col" aria-sort={active ? (sort?.direction === "asc" ? "ascending" : "descending") : undefined} color="text.primary" textTransform="none" fontSize="xs" letterSpacing="normal">
                {column.sortValue ? <Link as="button" type="button" fontWeight="700" display="inline-flex" alignItems="center" gap={1} textAlign="inherit" onClick={() => toggleSort(column.key)} title={`Ordenar por ${column.header.toLowerCase()}`}>
                  {column.header}
                  {active && (sort?.direction === "asc" ? <TriangleUpIcon boxSize={2} aria-hidden /> : <TriangleDownIcon boxSize={2} aria-hidden />)}
                </Link> : column.header}
              </Th>;
            })}
          </Tr>
        </Thead>
        <Tbody>
          {visible.length ? visible.map((row) => <Tr key={rowKey(row)}>
            {columns.map((column) => <Td key={column.key} isNumeric={column.numeric} whiteSpace={column.numeric ? "nowrap" : "normal"} sx={column.numeric ? { fontVariantNumeric: "tabular-nums" } : undefined}>{column.render(row)}</Td>)}
          </Tr>) : <Tr><Td colSpan={columns.length}><Text fontSize="sm" color="text.secondary" py={2}>{emptyMessage}</Text></Td></Tr>}
        </Tbody>
      </Table>
    </TableContainer>
    {sorted.length > pageSize && <Flex justify="space-between" align="center" mt={2} gap={2} wrap="wrap">
      <Text fontSize="xs" color="text.secondary">{formatInteger((current - 1) * pageSize + 1)}–{formatInteger(Math.min(current * pageSize, sorted.length))} de {formatInteger(sorted.length)}</Text>
      <Flex align="center" gap={1}>
        <IconButton size="sm" variant="ghost" aria-label="Página anterior" icon={<ChevronLeftIcon boxSize={5} />} isDisabled={current === 1} onClick={() => setPage(current - 1)} />
        <Text fontSize="sm" minW="90px" textAlign="center" aria-live="polite">Página {current} de {pages}</Text>
        <IconButton size="sm" variant="ghost" aria-label="Página siguiente" icon={<ChevronRightIcon boxSize={5} />} isDisabled={current === pages} onClick={() => setPage(current + 1)} />
      </Flex>
    </Flex>}
  </Box>;
}
