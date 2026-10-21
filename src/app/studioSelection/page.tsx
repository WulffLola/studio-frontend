"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Center,
  Text,
  Container,
  Spinner,
  useDisclosure,
  Stack,
  SimpleGrid,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "../stores/studio";
import { useAppDispatch } from "@/app/stores/hooks";
import { getStudios } from "../stores/studioSlice";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer, Surface } from "../components/ui/PageContainer";
import StatusBadge from "../components/ui/StatusBadge";
import Icon from "@mdi/react";
import { mdiCheckCircle } from "@mdi/js";

interface Studio {
  id: number;
  name: string;
  is_active: boolean;
  is_ready: boolean;
}

export default function StudioSelection() {
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { studios, rooms, slots } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { selectedStudio, setSelectedStudio } = useStudioStore();
  const { tipo } = useAuthStore();
  const normalizedRole = tipo?.toLowerCase();
  const canSeeStudioStatus =
    normalizedRole === "admin" ||
    normalizedRole === "administrador" ||
    normalizedRole === "super";

  const activeStudios: Studio[] = (Array.isArray(studios) ? studios : []).filter((studio: Studio) => {
    if (!studio?.is_active) return false;

    if (tipo !== "Consultor") return true;
    if (!studio.is_ready) return false;

    const hasRooms =
      Array.isArray(rooms) &&
      rooms.some((room: any) => room.studio === studio.id || room.studio_id === studio.id);

    const hasSlots =
      Array.isArray(slots) &&
      slots.some((slot: any) => slot.studio === studio.id || slot.studio_id === studio.id);

    return hasRooms 
    // && hasSlots;

  });

  const count = activeStudios.length;

  useEffect(() => {
    dispatch(getStudios());
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const columns = count === 1 ? 1 : count === 2 ? 2 : 3;

  const remainder = columns === 3 ? count % 3 : 0;

  const mainItems =
    columns === 3 ? activeStudios.slice(0, count - remainder) : activeStudios;

  const lastRowItems =
    columns === 3 && remainder > 0 ? activeStudios.slice(count - remainder) : [];

  const StudioBtn = ({ estudio }: { estudio: Studio }) => {
    const isSelected = selectedStudio?.id === estudio.id;

    return (
      <Button
        aria-pressed={isSelected}
        variant="unstyled"
        w="100%"
        h="auto"
        minH="76px"
        px={4}
        py={3.5}
        bg={isSelected ? "bg.selected" : "bg.surface"}
        color={isSelected ? "text.brand" : "text.primary"}
        border="1px solid"
        borderColor={isSelected ? "brand.500" : "border.default"}
        borderRadius="card"
        boxShadow={isSelected ? "0 0 0 1px var(--chakra-colors-brand-500)" : "none"}
        _hover={{ borderColor: isSelected ? "brand.500" : "brand.300", bg: isSelected ? "bg.selected" : "bg.subtle" }}
        textAlign="center"
        whiteSpace="normal"
        fontWeight={isSelected ? 600 : 500}
        onClick={() => setSelectedStudio(estudio)}
        position="relative"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        {isSelected && (
          <Box position="absolute" top={2} right={2} color="brand.500" display="flex">
            <Icon path={mdiCheckCircle} size={0.75} />
          </Box>
        )}
        <Text lineHeight="1.3" fontSize="14px" px={4}>
          {estudio.name}
        </Text>

        {canSeeStudioStatus && (
          <StatusBadge
            label={estudio.is_ready ? "Completo" : "Falta configurar"}
            tone={estudio.is_ready ? "success" : "warning"}
          />
        )}

        {/* <Text fontSize="xs" color="text.muted">
          Falta terminar de configurar
        </Text> */}
      </Button>
    );
  };

  if (loading) {
    return (
      <FullPageLoader />
    );
  }

  console.log(mainItems)
  console.log(activeStudios)


  return (
    <>

      <PageContainer>
        <Stack spacing={4} w="100%" align="stretch">
          <Center pt={{ base: 2, md: 10 }}>
            <Surface
              p={{ base: 5, md: 8 }}
              w={{ base: "full", md: "auto" }}
              minW={{ md: "420px" }}
              maxW="760px"
              textAlign="center"
            >
              {!(tipo === "Consultor" && count === 0) && (
                <Text as="h2" textStyle="sectionTitle" mb={6}>
                  ¿A qué estudio querés ingresar?
                </Text>
              )}

              {tipo === "Consultor" && count === 0 ? (
                <Alert status="warning" variant="subtle" borderRadius="md" textAlign="left">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">No hay estudios disponibles</AlertTitle>
                    <AlertDescription fontSize="sm">
                      No hay estudios configurados para tu usuario. Comunicate con el administrador
                      para poder continuar.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <>
                  <SimpleGrid
                    columns={{ base: 1, md: columns }}
                    spacing={4}
                    mb={remainder ? 4 : 6}
                    w="100%"
                  >
                    {mainItems.map((estudio: Studio) => (
                      <StudioBtn key={estudio.id} estudio={estudio} />
                    ))}
                  </SimpleGrid>

                  {columns === 3 && remainder === 1 && lastRowItems.length === 1 && (
                    <Box mb={6}>
                      <StudioBtn estudio={lastRowItems[0]} />
                    </Box>
                  )}

                  {columns === 3 && remainder === 2 && lastRowItems.length === 2 && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6} w="100%">
                      {lastRowItems.map((estudio: Studio) => (
                        <StudioBtn key={estudio.id} estudio={estudio} />
                      ))}
                    </SimpleGrid>
                  )}
                </>
              )}

              {!(tipo === "Consultor" && count === 0) && <Button
                variant="primary"
                isDisabled={
                  !selectedStudio ||
                  !activeStudios.some((studio) => studio.id === selectedStudio.id)
                }
                w="100%"
                onClick={() => router.push("/")}
              >
                Aceptar
              </Button>}
            </Surface>
          </Center>
        </Stack>
      </PageContainer>
    </>
  );
}
