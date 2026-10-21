"use client";

import { Flex, Spinner, type FlexProps } from "@chakra-ui/react";

/** Loader de pantalla completa (hidratación, carga inicial de página). */
export const FullPageLoader = (props: FlexProps) => (
  <Flex
    minH="60vh"
    w="100%"
    align="center"
    justify="center"
    role="status"
    aria-live="polite"
    aria-label="Cargando"
    {...props}
  >
    <Spinner size="lg" thickness="3px" speed="0.7s" emptyColor="gray.200" color="brand.500" />
  </Flex>
);

/**
 * Overlay bloqueante mientras se procesa una operación (guardar, eliminar…).
 * Mantiene el bloqueo de interacción del diseño anterior con una superficie clara.
 */
export const LoadingOverlay = (props: FlexProps) => (
  <Flex
    position="fixed"
    inset={0}
    bg="rgba(245, 245, 247, 0.72)"
    backdropFilter="blur(1px)"
    align="center"
    justify="center"
    zIndex={2000}
    role="status"
    aria-live="polite"
    aria-label="Procesando"
    {...props}
  >
    <Flex bg="bg.surface" p={4} borderRadius="card" boxShadow="dropdown">
      <Spinner size="lg" thickness="3px" speed="0.7s" emptyColor="gray.200" color="brand.500" />
    </Flex>
  </Flex>
);
