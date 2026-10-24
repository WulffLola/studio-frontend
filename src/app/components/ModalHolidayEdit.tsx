import {
  Button,
  Stack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  Box,
  Spinner,
  HStack,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { getHolidays } from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

type Holiday = {
  id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  deleted?: string | null;
};

const ModalHolidayEdit = ({
  onClose,
  holiday,
}: {
  onClose: () => void;
  holiday: Holiday | null;
}) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const toast = useToast();

  useEffect(() => {
    if (holiday) {
      setName(holiday.name ?? "");
      setStartDate(holiday.start_date ?? "");
      setEndDate(holiday.end_date ?? "");
    }
  }, [holiday]);

  const formatDateEs = (dateString: string) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-");
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

    return dateObj.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleEditHoliday = async () => {
    if (!holiday) return;

    setLoading(true);

    if (!name.trim() || !startDate.trim()) {
      toast({
        title: "Faltan completar campos.",
        description: "Por favor complete los campos obligatorios.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    if (endDate && startDate > endDate) {
      toast({
        title: "Rango inválido.",
        description: "La fecha desde no puede ser mayor que la fecha hasta.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("start_date", startDate);
      formData.append("end_date", endDate || "");

      await axios.patch(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_HOLIDAYS}${holiday.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      await dispatch(getHolidays()).unwrap();

      toast({
        title: "Feriado editado correctamente.",
        description: "El feriado fue actualizado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onClose();
    } catch (error: any) {
      console.error("Error en la solicitud:", error);

      if (
        error.response?.data?.name?.[0] ===
        "Ensure this field has no more than 120 characters."
      ) {
        toast({
          title: "Nombre demasiado largo",
          description: "El nombre debe contener un máximo de 120 caracteres.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      } else if (error.response?.data?.start_date?.length > 0) {
        toast({
          title: "Fecha de inicio inválida",
          description: error.response.data.start_date[0],
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      } else if (error.response?.data?.end_date?.length > 0) {
        toast({
          title: "Fecha de fin inválida",
          description: error.response.data.end_date[0],
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      } else {
        toast({
          title: "Error",
          description: "Ocurrió un error al editar el feriado.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {loading && (
        <LoadingOverlay />
      )}

      <Stack
        spacing={4}
        w="full"
        p={{ base: 5, md: 6 }}
      >
        <Heading
          as="h2"
          size="lg"
          pr={8}
          mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
        >
          Editar feriado
        </Heading>

        <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
          <Box display="flex" justifyContent="center" w="100%">
            <FormControl id="holiday-name" isRequired>
              <FormLabel>Nombre</FormLabel>
              <Input
                type="text"
                w="100%"
                placeholder="Ej: Día del Trabajador"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box display="flex" justifyContent="center" w="100%">
              <FormControl id="holiday-start-date" isRequired>
                <FormLabel>Fecha desde</FormLabel>
                <Input
                  type="date"
                  w="100%"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormControl>
            </Box>

            <Box display="flex" justifyContent="center" w="100%">
              <FormControl id="holiday-end-date">
                <FormLabel>Fecha hasta</FormLabel>
                <Input
                  type="date"
                  w="100%"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          {startDate && (
            <Text fontSize="sm" color="text.muted">
              {endDate
                ? `El feriado quedará registrado desde ${formatDateEs(
                    startDate
                  )} hasta ${formatDateEs(endDate)}.`
                : `El feriado quedará registrado para el día ${formatDateEs(
                    startDate
                  )}.`}
            </Text>
          )}
        </SimpleGrid>

        <HStack spacing={3} justify="flex-end" mt={6}>
          <Button
            onClick={onClose}
            w={["100%", "135px"]}
            aria-label="Cancelar"
            variant="secondary"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleEditHoliday}
            w={["100%", "135px"]}
            isLoading={loading}
            loadingText="Guardando..."
            variant="primary"
          >
            Guardar
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default ModalHolidayEdit;