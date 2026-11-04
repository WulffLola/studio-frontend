"use client";

import {
  Alert, AlertDescription, AlertIcon, Box, Button, Flex, Heading, Skeleton, SimpleGrid, Stack, Tag, Text, VisuallyHidden,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { StatRequest } from "../_lib/api";

export type BlockModel = { isEmpty: boolean; invalid: number } | null;
export type SkeletonShape = "kpis" | "chart" | "table";

type StatBlockProps<M extends BlockModel> = {
  id: string;
  title: string;
  /** Qué se mide, en una frase para personas no técnicas. */
  description: string;
  /** Período que comprende el dato (texto ya formateado). */
  period: string;
  /** Filtros generales que este bloque NO puede aplicar. */
  ignoredFilters?: string[];
  request: StatRequest;
  model: M;
  emptyMessage: string;
  skeleton?: SkeletonShape;
  controls?: ReactNode;
  footnote?: string;
  wide?: boolean;
  children: (model: NonNullable<M>) => ReactNode;
};

function BlockSkeleton({ shape }: { shape: SkeletonShape }) {
  return <Stack spacing={3} aria-hidden>
    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
      {Array.from({ length: shape === "kpis" ? 3 : 2 }, (_, index) => <Skeleton key={index} h="76px" borderRadius="md" />)}
    </SimpleGrid>
    {shape === "chart" && <Skeleton h={{ base: "220px", md: "260px" }} borderRadius="md" />}
    {shape === "table" && Array.from({ length: 5 }, (_, index) => <Skeleton key={index} h="28px" borderRadius="sm" />)}
  </Stack>;
}

export function EmptyState({ message }: { message: string }) {
  return <Flex direction="column" align="center" justify="center" textAlign="center" minH="120px" px={4} py={6} bg="bg.subtle" borderRadius="md" border="1px dashed" borderColor="border.default">
    <Text fontWeight={600} color="text.primary">Sin datos para mostrar</Text>
    <Text fontSize="sm" color="text.secondary" mt={1} maxW="420px">{message}</Text>
  </Flex>;
}

export function StatBlock<M extends BlockModel>({
  id, title, description, period, ignoredFilters, request, model, emptyMessage, skeleton = "chart", controls, footnote, wide, children,
}: StatBlockProps<M>) {
  const headingId = `${id}-titulo`;
  let body: ReactNode;
  if (request.status === "blocked") {
    body = <Alert status="info" borderRadius="md"><AlertIcon /><AlertDescription fontSize="sm">{request.blockedReason}</AlertDescription></Alert>;
  } else if (request.status === "loading") {
    body = <><VisuallyHidden role="status">Cargando {title}</VisuallyHidden><BlockSkeleton shape={skeleton} /></>;
  } else if (request.status === "error") {
    body = <Alert status="error" borderRadius="md" flexWrap="wrap" gap={2}>
      <AlertIcon />
      <AlertDescription fontSize="sm" flex="1" minW="180px">{request.error}</AlertDescription>
      <Button size="sm" variant="secondary" onClick={request.retry}>Reintentar</Button>
    </Alert>;
  } else if (request.status === "empty" || (model && model.isEmpty)) {
    body = <EmptyState message={emptyMessage} />;
  } else if (!model) {
    body = <Alert status="warning" borderRadius="md" flexWrap="wrap" gap={2}>
      <AlertIcon />
      <AlertDescription fontSize="sm" flex="1" minW="180px">La respuesta del servidor no tiene el formato esperado. No se muestran datos para evitar resultados incorrectos.</AlertDescription>
      <Button size="sm" variant="secondary" onClick={request.retry}>Reintentar</Button>
    </Alert>;
  } else {
    body = <Stack spacing={4}>
      {model.invalid > 0 && <Alert status="warning" borderRadius="md" py={2}><AlertIcon /><AlertDescription fontSize="sm">Datos parciales: se omitieron {model.invalid === 1 ? "1 valor inválido" : `${model.invalid} valores inválidos`}.</AlertDescription></Alert>}
      {children(model as NonNullable<M>)}
    </Stack>;
  }

  return <Box as="section" aria-labelledby={headingId} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" p={{ base: 4, md: 5 }} minW={0} gridColumn={wide ? { xl: "1 / -1" } : undefined}>
    <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
      <Box minW={0} flex="1 1 240px">
        <Heading as="h3" id={headingId} size="sm" color="text.primary">{title}</Heading>
        <Text fontSize="sm" color="text.secondary" mt={1}>{description}</Text>
      </Box>
      {controls && <Flex gap={2} wrap="wrap" align="flex-end">{controls}</Flex>}
    </Flex>
    <Flex gap={2} wrap="wrap" mt={3} mb={4}>
      <Tag size="sm" bg="bg.subtle" color="text.primary" border="1px solid" borderColor="border.subtle">Período: {period}</Tag>
      {ignoredFilters?.length ? <Tag size="sm" bg="bg.muted" color="text.primary">No filtra por {ignoredFilters.join(", ")}</Tag> : null}
    </Flex>
    {request.notice && request.status === "success" && <Alert status="info" borderRadius="md" py={2} mb={3}><AlertIcon /><AlertDescription fontSize="sm">{request.notice}</AlertDescription></Alert>}
    {body}
    {footnote && <Text fontSize="xs" color="text.secondary" mt={3}>{footnote}</Text>}
  </Box>;
}

type KpiProps = { label: string; value: string; hint?: string; tone?: "neutral" | "positive" | "negative" };

const toneColor = { neutral: "text.primary", positive: "success.fg", negative: "error.fg" };

/** Tarjeta de indicador: la cifra es el dato principal; el `hint` aclara la base del cálculo. */
export function Kpi({ label, value, hint, tone = "neutral" }: KpiProps) {
  return <Box bg="bg.subtle" borderRadius="md" p={3} minW={0}>
    <Text textStyle="overline">{label}</Text>
    <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight={600} color={toneColor[tone]} lineHeight="1.2" mt={1} sx={{ fontVariantNumeric: "tabular-nums" }} wordBreak="break-word">{value}</Text>
    {hint && <Text fontSize="xs" color="text.secondary" mt={1}>{hint}</Text>}
  </Box>;
}

export function KpiGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <SimpleGrid columns={{ base: 2, md: columns }} spacing={{ base: 2, md: 3 }}>{children}</SimpleGrid>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text as="h4" fontSize="sm" fontWeight={600} color="text.primary">{children}</Text>;
}
