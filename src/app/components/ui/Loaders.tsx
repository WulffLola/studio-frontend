"use client";

import { Flex, Spinner, Stack, Text, type FlexProps } from "@chakra-ui/react";

type FullPageLoaderProps = FlexProps & {
  message?: string;
};

/** Loader de pantalla completa (hidratación, carga inicial de página). */
export const FullPageLoader = ({ message = "Cargando", ...props }: FullPageLoaderProps) => (
  <Flex
    minH="calc(100dvh - 60px)"
    w="100%"
    align="center"
    justify="center"
    role="status"
    aria-live="polite"
    aria-label="Cargando"
    {...props}
  >
    <Stack spacing={3} align="center" textAlign="center">
      <Spinner size="lg" thickness="3px" speed="0.7s" emptyColor="gray.200" color="brand.500" />
      <Text fontSize="sm" fontWeight={500} color="text.secondary">
        {message}
      </Text>
    </Stack>
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
