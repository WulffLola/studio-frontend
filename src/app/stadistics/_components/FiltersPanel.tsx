"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Alert, AlertDescription, AlertIcon, Box, Button, Collapse, Flex, FormControl, FormLabel, Heading, IconButton, Input, Select, SimpleGrid, Tag, TagCloseButton, TagLabel, Text, Wrap, WrapItem,
} from "@chakra-ui/react";
import { useState } from "react";
import type { Catalogs } from "../_lib/api";
import { activeQuickPeriod, QUICK_PERIODS, type GlobalFilters } from "../_lib/filters";
import { formatDateRange } from "../_lib/format";
import type { CatalogItem } from "../_lib/types";

type FiltersPanelProps = {
  filters: GlobalFilters;
  catalogs: Catalogs;
  today: Date;
  rangeIssue: string | null;
  pending: boolean;
  onChange: (patch: Partial<GlobalFilters>) => void;
  onReset: () => void;
};

const nameOf = (items: CatalogItem[], id: string) => items.find((item) => String(item.id) === id)?.name ?? "Seleccionado";

function CatalogSelect({ id, label, value, items, allLabel, onChange }: { id: string; label: string; value: string; items: CatalogItem[]; allLabel: string; onChange: (value: string) => void }) {
  return <FormControl>
    <FormLabel htmlFor={id} fontSize="sm">{label}</FormLabel>
    <Select id={id} bg="bg.surface" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{allLabel}</option>
      {items.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
    </Select>
  </FormControl>;
}

export function FiltersPanel({ filters, catalogs, today, rangeIssue, pending, onChange, onReset }: FiltersPanelProps) {
  const [open, setOpen] = useState(true);
  const quick = activeQuickPeriod(filters, today);
  const chips = [
    { key: "dates", label: `Período: ${formatDateRange(filters.startDate, filters.endDate)}`, clear: null },
    filters.studio && { key: "studio", label: `Estudio: ${nameOf(catalogs.studios, filters.studio)}`, clear: () => onChange({ studio: "" }) },
    filters.activity && { key: "activity", label: `Actividad: ${nameOf(catalogs.activities, filters.activity)}`, clear: () => onChange({ activity: "" }) },
    filters.plan && { key: "plan", label: `Plan: ${nameOf(catalogs.plans, filters.plan)}`, clear: () => onChange({ plan: "" }) },
    filters.expenseType && { key: "expenseType", label: `Categoría de gasto: ${nameOf(catalogs.expenseTypes, filters.expenseType)}`, clear: () => onChange({ expenseType: "" }) },
  ].filter(Boolean) as { key: string; label: string; clear: (() => void) | null }[];

  return <Box as="section" aria-labelledby="filtros-titulo" bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card" p={{ base: 4, md: 5 }}>
    <Flex justify="space-between" align="center" gap={3}>
      <Heading as="h2" id="filtros-titulo" size="sm" color="text.primary">Filtros</Heading>
      <IconButton aria-label={open ? "Ocultar filtros" : "Mostrar filtros"} aria-expanded={open} aria-controls="filtros-contenido"
        icon={open ? <ChevronUpIcon boxSize={5} /> : <ChevronDownIcon boxSize={5} />} variant="ghost" size="sm" onClick={() => setOpen((value) => !value)} />
    </Flex>

    <Wrap spacing={2} mt={3} aria-label="Filtros activos">
      {chips.map((chip) => <WrapItem key={chip.key}>
        <Tag size="md" borderRadius="full" bg="bg.subtle" color="text.primary" border="1px solid" borderColor="border.subtle">
          <TagLabel>{chip.label}</TagLabel>
          {chip.clear && <TagCloseButton aria-label={`Quitar ${chip.label}`} onClick={chip.clear} />}
        </Tag>
      </WrapItem>)}
      {pending && <WrapItem><Text fontSize="xs" color="gray.600" alignSelf="center" role="status">Actualizando…</Text></WrapItem>}
    </Wrap>

    <Collapse in={open} animateOpacity>
      <Box id="filtros-contenido" pt={4}>
        <Text fontSize="sm" fontWeight="600" color="text.primary" mb={2}>Período</Text>
        <Wrap spacing={2} role="group" aria-label="Períodos rápidos">
          {QUICK_PERIODS.map((period) => <WrapItem key={period.key}>
            <Button size="sm" variant={quick === period.key ? "studioPrimary" : "outline"} aria-pressed={quick === period.key} leftIcon={quick === period.key ? <CheckIcon boxSize={3} aria-hidden /> : undefined} fontWeight={quick === period.key ? 700 : 500} onClick={() => onChange(period.range(today))}>{period.label}</Button>
          </WrapItem>)}
        </Wrap>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} mt={4}>
          <FormControl isInvalid={!!rangeIssue}>
            <FormLabel htmlFor="filtro-desde" fontSize="sm">Desde</FormLabel>
            <Input id="filtro-desde" type="date" bg="bg.surface" value={filters.startDate} max={filters.endDate || undefined} onChange={(event) => onChange({ startDate: event.target.value })} />
          </FormControl>
          <FormControl isInvalid={!!rangeIssue}>
            <FormLabel htmlFor="filtro-hasta" fontSize="sm">Hasta</FormLabel>
            <Input id="filtro-hasta" type="date" bg="bg.surface" value={filters.endDate} min={filters.startDate || undefined} onChange={(event) => onChange({ endDate: event.target.value })} />
          </FormControl>
          <CatalogSelect id="filtro-estudio" label="Estudio" value={filters.studio} items={catalogs.studios} allLabel="Todos los estudios" onChange={(studio) => onChange({ studio })} />
          <CatalogSelect id="filtro-actividad" label="Actividad" value={filters.activity} items={catalogs.activities} allLabel="Todas las actividades" onChange={(activity) => onChange({ activity })} />
          <CatalogSelect id="filtro-plan" label="Plan" value={filters.plan} items={catalogs.plans} allLabel="Todos los planes" onChange={(plan) => onChange({ plan })} />
          <CatalogSelect id="filtro-gasto" label="Categoría de gasto" value={filters.expenseType} items={catalogs.expenseTypes} allLabel="Todas las categorías" onChange={(expenseType) => onChange({ expenseType })} />
        </SimpleGrid>
        {rangeIssue && <Alert status="warning" borderRadius="md" mt={3} py={2}><AlertIcon /><AlertDescription fontSize="sm">{rangeIssue} Las estadísticas por fecha quedan en pausa hasta corregirlo.</AlertDescription></Alert>}
        <Flex justify="space-between" align="center" mt={4} gap={3} wrap="wrap">
          <Text fontSize="xs" color="gray.600" flex="1 1 260px">Los cambios se aplican solos. Cada estadística indica qué filtros no puede usar.</Text>
          <Button size="sm" variant="outline" leftIcon={<CloseIcon boxSize={2.5} />} onClick={onReset}>Limpiar filtros</Button>
        </Flex>
      </Box>
    </Collapse>
  </Box>;
}
