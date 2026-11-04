"use client";

import { Box, SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";
import { PageContainer, PageHeader } from "../components/ui/PageContainer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStudioStore } from "../stores/studio";
import { useCatalogs } from "./_lib/api";
import { defaultFilters, rangeError, useDebouncedValue, type BlockProps, type GlobalFilters } from "./_lib/filters";
import { FiltersPanel } from "./_components/FiltersPanel";
import { ExpensesBlock, MarginBlock, PaymentsBlock } from "./_components/FinanceBlocks";
import { CancellationsBlock, ClassesBlock, EvolutionBlock, HoursBlock, OccupancyBlock, WaitingBlock } from "./_components/OperationBlocks";
import { ClientsByPlanBlock, PlanStatusBlock, ProfitableBlock, RetentionBlock, UsageBlock, ValidityBlock } from "./_components/PlanBlocks";
import { AgeBlock, ClientsByMonthBlock, StatusBlock, TenureBlock } from "./_components/StudentBlocks";

type Group = { id: string; title: string; blocks: Record<string, (props: BlockProps) => JSX.Element> };

const GROUPS: Group[] = [
  { id: "alumnos", title: "Alumnos", blocks: { StatusBlock, ClientsByMonthBlock, AgeBlock, TenureBlock } },
  { id: "planes", title: "Planes", blocks: { ValidityBlock, RetentionBlock, UsageBlock, ClientsByPlanBlock, ProfitableBlock, PlanStatusBlock } },
  { id: "operacion", title: "Clases y ocupación", blocks: { ClassesBlock, OccupancyBlock, HoursBlock, EvolutionBlock, WaitingBlock, CancellationsBlock } },
  { id: "finanzas", title: "Finanzas", blocks: { PaymentsBlock, ExpensesBlock, MarginBlock } },
];

export default function Stadistics() {
  const today = useMemo(() => new Date(), []);
  const selectedStudio = useStudioStore((state) => state.selectedStudio);
  const hydrated = useStudioStore((state) => state.hasHydrated);
  const catalogs = useCatalogs();
  const [filters, setFilters] = useState<GlobalFilters>(() => defaultFilters(today));
  const [initialized, setInitialized] = useState(false);
  const [ready, setReady] = useState(false);

  // El estudio elegido en la aplicación es el valor inicial del filtro.
  useEffect(() => {
    if (!hydrated || initialized) return;
    if (selectedStudio?.id) setFilters((old) => ({ ...old, studio: String(selectedStudio.id) }));
    setInitialized(true);
  }, [hydrated, initialized, selectedStudio?.id]);

  // Los bloques consultan con los filtros "asentados": cambios rápidos no generan una petición cada uno.
  const applied = useDebouncedValue(filters, 400);
  // Se espera a que el filtro inicial se asiente para no consultar dos veces al abrir la página.
  useEffect(() => { if (initialized && applied === filters) setReady(true); }, [initialized, applied, filters]);
  const rangeIssue = useMemo(() => rangeError(applied), [applied]);
  const blockProps = useMemo<BlockProps>(() => ({ filters: applied, rangeIssue, today }), [applied, rangeIssue, today]);

  const updateFilters = useCallback((patch: Partial<GlobalFilters>) => setFilters((old) => ({ ...old, ...patch })), []);
  const resetFilters = useCallback(() => setFilters(defaultFilters(today)), [today]);

  return <PageContainer>
    <Stack spacing={7}>
      <PageHeader level="page" title="Estadísticas" description="Alumnos, planes, clases, ocupación y finanzas." />
      <FiltersPanel filters={filters} catalogs={catalogs} today={today} rangeIssue={rangeError(filters)} pending={filters !== applied}
        onChange={updateFilters} onReset={resetFilters} />
      {GROUPS.map((group) => <Box as="section" key={group.id} aria-labelledby={`grupo-${group.id}`}>
        <Text as="h2" id={`grupo-${group.id}`} textStyle="sectionTitle" mb={4}>{group.title}</Text>
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
          {Object.entries(group.blocks).map(([key, Block]) => (ready ? <Block key={key} {...blockProps} /> : <Skeleton key={key} h="260px" borderRadius="lg" />))}
        </SimpleGrid>
      </Box>)}
    </Stack>
  </PageContainer>;
}
