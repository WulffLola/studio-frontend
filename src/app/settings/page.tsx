"use client";

import {
  Alert, AlertDescription, AlertIcon, Badge, Box, Card, CardBody, Container,
  Flex, Heading, SimpleGrid, Stack, Text,
} from "@chakra-ui/react";
import { useStudioStore } from "../stores/studio";
import { PageContainer } from "../components/ui/PageContainer";
import StatusBadge from "../components/ui/StatusBadge";

const mockQr = [
  "111111101010101111111", "100000101110101000001", "101110101000101011101",
  "101110101111101011101", "101110100010101011101", "100000101010101000001",
  "111111101010101111111", "000000001101100000000", "101011111001111010101",
  "011101001110001101110", "110011111011101110011", "001100010101010011100",
  "111011111100111110101", "000000001011001010010", "111111101101111011101",
  "100000100011001010010", "101110101110111111101", "101110100100100010100",
  "101110101111111011111", "100000101000001000010", "111111101101101011101",
];

function QrMockup() {
  return (
    <Box aria-label="Vista previa del código QR" bg="white" borderRadius="8px" border="1px solid" borderColor="border.subtle"
      display="grid" gridTemplateColumns="repeat(21, 1fr)" p={4}
      w={{ base: "250px", md: "300px" }} h={{ base: "250px", md: "300px" }}>
      {mockQr.join("").split("").map((cell, index) => (
        <Box key={index} bg={cell === "1" ? "black" : "white"} />
      ))}
    </Box>
  );
}

export default function SettingsPage() {
  const studio = useStudioStore((state) => state.selectedStudio);

  return (
    <PageContainer>
      <Stack spacing={6}>
        <Text color="text.secondary">Integraciones del estudio seleccionado.</Text>

        {!studio ? (
          <Alert status="warning"><AlertIcon /><AlertDescription>Seleccioná un estudio para configurar sus integraciones.</AlertDescription></Alert>
        ) : (
          <Card>
            <CardBody p={{ base: 5, md: 8 }}>
              <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={7}>
                <Box><Heading size="md">WhatsApp</Heading><Text color="text.secondary" fontSize="sm" mt={1}>{studio.name}</Text></Box>
                <StatusBadge label="Desconectado" tone="warning" />
              </Flex>

              <Alert status="warning" mb={7}>
                <AlertIcon />
                <AlertDescription>La conexión de WhatsApp se perdió. Escaneá el código para volver a vincular este estudio.</AlertDescription>
              </Alert>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
                <Flex bg="bg.subtle" borderRadius="card" p={5} justify="center"><QrMockup /></Flex>
                <Stack spacing={5}>
                  <Box>
                    <Text textStyle="overline" color="text.brand">Vincular dispositivo</Text>
                    <Heading size="md" mt={2}>Conectá nuevamente WhatsApp</Heading>
                  </Box>

                  <Stack spacing={4}>
                    {[
                      ["1", "Abrí WhatsApp", "Desde el teléfono principal del estudio."],
                      ["2", "Ingresá a Dispositivos vinculados", "Lo encontrás desde el menú o configuración."],
                      ["3", "Escaneá el código", "Tocá “Vincular dispositivo” y apuntá la cámara al QR."],
                    ].map(([number, title, description]) => (
                      <Flex key={number} gap={3} align="flex-start">
                        <Flex bg="brand.50" color="brand.700" borderRadius="full" w="28px" h="28px" align="center" justify="center" flexShrink={0} fontSize="13px" fontWeight={600}>{number}</Flex>
                        <Box><Text fontWeight="semibold">{title}</Text><Text color="text.muted" fontSize="sm">{description}</Text></Box>
                      </Flex>
                    ))}
                  </Stack>

                  <Text fontSize="sm" color="text.muted">El estado se actualizará automáticamente cuando se complete la vinculación.</Text>
                </Stack>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
      </Stack>
    </PageContainer>
  );
}
