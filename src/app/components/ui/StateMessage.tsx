"use client";

import { Box, Flex, Spinner, Stack, Td, Text, Tr, type FlexProps } from "@chakra-ui/react";
import Icon from "@mdi/react";
import { mdiAlertCircleOutline, mdiInboxOutline, mdiLockOutline, mdiMagnify } from "@mdi/js";
import type { ReactNode } from "react";

export type StateKind = "loading" | "empty" | "noResults" | "error" | "forbidden";

const defaults: Record<StateKind, { icon?: string; title: string; description?: string }> = {
  loading: { title: "Cargando…" },
  empty: { icon: mdiInboxOutline, title: "Todavía no hay registros" },
  noResults: {
    icon: mdiMagnify,
    title: "No se encontraron resultados",
    description: "Probá con otra búsqueda o ajustá los filtros.",
  },
  error: {
    icon: mdiAlertCircleOutline,
    title: "No pudimos cargar la información",
    description: "Intentá nuevamente en unos instantes.",
  },
  forbidden: {
    icon: mdiLockOutline,
    title: "No tenés permisos para ver esta sección",
  },
};

type StateMessageProps = {
  kind: StateKind;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
} & Omit<FlexProps, "title">;

/** Estado de carga / vacío / error reutilizable, sin ilustraciones. */
export const StateMessage = ({ kind, title, description, action, compact, ...rest }: StateMessageProps) => {
  const d = defaults[kind];
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      textAlign="center"
      py={compact ? 6 : 12}
      px={4}
      gap={3}
      color="text.muted"
      role={kind === "loading" ? "status" : undefined}
      aria-live={kind === "loading" ? "polite" : undefined}
      {...rest}
    >
      {kind === "loading" ? (
        <Spinner size={compact ? "sm" : "md"} thickness="2px" emptyColor="gray.200" color="brand.500" />
      ) : (
        <Flex
          w={compact ? "36px" : "44px"}
          h={compact ? "36px" : "44px"}
          borderRadius="full"
          bg={kind === "error" ? "error.bg" : "bg.muted"}
          color={kind === "error" ? "error.fg" : "text.muted"}
          align="center"
          justify="center"
        >
          <Icon path={d.icon!} size={compact ? 0.8 : 0.95} />
        </Flex>
      )}
      <Stack spacing={1} maxW="360px">
        <Text fontSize="14px" fontWeight={500} color={kind === "loading" ? "text.muted" : "text.primary"}>
          {title ?? d.title}
        </Text>
        {(description ?? d.description) && (
          <Text fontSize="13px" color="text.muted">
            {description ?? d.description}
          </Text>
        )}
      </Stack>
      {action && <Box pt={1}>{action}</Box>}
    </Flex>
  );
};

type TableStateProps = Omit<StateMessageProps, "compact"> & { colSpan: number };

/**
 * Fila de estado para tablas: ocupa todo el ancho y no reacciona al hover.
 * En tablas con scroll horizontal el mensaje queda fijo en el área visible.
 */
export const TableState = ({ colSpan, ...rest }: TableStateProps) => (
  <Tr _hover={{ bg: "transparent" }}>
    <Td colSpan={colSpan} p={0} borderBottom="none">
      <StateMessage
        compact
        position="sticky"
        left={0}
        w="100%"
        maxW="calc(100vw - 34px)"
        {...rest}
      />
    </Td>
  </Tr>
);

export default StateMessage;
