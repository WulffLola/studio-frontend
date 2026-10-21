"use client";

import { Box, Flex, Stack, Text, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

/**
 * Contenedor estándar de página. El shell (sidebar + topbar) ya reserva el
 * espacio de navegación: las páginas sólo definen su contenido.
 */
export const PageContainer = ({ children, ...rest }: BoxProps) => (
  <Box
    w="100%"
    maxW="1600px"
    mx="auto"
    px={{ base: 4, md: 6, xl: 8 }}
    pt={{ base: 4, md: 6 }}
    pb={{ base: 8, md: 10 }}
    {...rest}
  >
    {children}
  </Box>
);

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Nivel visual: `page` para encabezados de página, `section` para bloques. */
  level?: "page" | "section";
} & Omit<BoxProps, "title">;

/** Título + descripción + acciones, alineados y con responsive consistente. */
export const PageHeader = ({ title, description, actions, level = "section", ...rest }: PageHeaderProps) => (
  <Flex
    direction={{ base: "column", md: "row" }}
    align={{ base: "stretch", md: "center" }}
    justify="space-between"
    gap={3}
    mb={level === "page" ? 6 : 4}
    {...rest}
  >
    <Stack spacing={0.5} minW={0}>
      <Text as={level === "page" ? "h1" : "h2"} textStyle={level === "page" ? "pageTitle" : "sectionTitle"}>
        {title}
      </Text>
      {description && (
        <Text fontSize="14px" color="text.secondary">
          {description}
        </Text>
      )}
    </Stack>
    {actions && (
      <Flex gap={2} wrap="wrap" justify={{ base: "stretch", md: "flex-end" }} flexShrink={0}>
        {actions}
      </Flex>
    )}
  </Flex>
);

/** Barra de herramientas de una sección: filtros/búsqueda a la izquierda, acciones a la derecha. */
export const Toolbar = ({ children, ...rest }: BoxProps) => (
  <Flex
    direction={{ base: "column", md: "row" }}
    align={{ base: "stretch", md: "center" }}
    justify="space-between"
    gap={3}
    mb={4}
    {...rest}
  >
    {children}
  </Flex>
);

/** Superficie contenedora para tablas y bloques de datos. */
export const Surface = ({ children, ...rest }: BoxProps) => (
  <Box
    bg="bg.surface"
    border="1px solid"
    borderColor="border.subtle"
    borderRadius="card"
    boxShadow="card"
    {...rest}
  >
    {children}
  </Box>
);
