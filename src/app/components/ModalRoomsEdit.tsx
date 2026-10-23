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
} from "@chakra-ui/react";
import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { getRooms } from "../stores/studioSlice";
import { useStudioStore } from "../stores/studio";
import { Select } from "./ui/Select";
import { Select as Select2 } from "./ui/Select";
import { LoadingOverlay } from "./ui/Loaders";

type Room = {
  id: number;
  name: string;
  capacity: number;
  studio: number; // FK id
  created_at?: string;
};

const PREFIX = "Sala ";


const ModalRoomsEdit = ({ product, onClose }: any) => {
  const [idRoom, setIdRoom] = useState(product.id);
  const [name, setName] = useState(product.name);
  const [capacity, setCapacity] = useState<number | "">(product.capacity);
  const [studio, setStudio] = useState(product.studio);
  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { rooms, studios } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();
  const toast = useToast();

  const selectedStudio = useStudioStore((s) => s.selectedStudio);


  const handleSubmitRoomsEdit = async () => {
    setLoading(true);

    const capNum = typeof capacity === "string" ? parseInt(capacity || "0", 10) : capacity;

    if (!name.trim() || !capNum || capNum <= 0) {
      toast({
        title: "Faltan completar campos.",
        description: "Completá el nombre y una capacidad mayor a 0.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    try {
      if (!selectedStudio) throw new Error("No hay estudio seleccionado.");

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("studio", studio); // FK al estudio
      formData.append("capacity", String(capNum));

      const res = await axios.put<Room>(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_ROOMS}${idRoom}/`,
        formData,
        { headers: { Authorization: `Bearer ${tokens?.access}` } }
      );

      /*       const createdRoom = res.data;
       */
      /*       if (onCreated) onCreated(createdRoom);
       */
      await dispatch(getRooms()).unwrap();

      toast({
        title: "Sala editada correctamente.",
        description: "La sala fue editada con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onClose();
    } catch (error) {
      console.error("Error en la solicitud:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al editar la sala.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  
  const handleNameChange = (value: string) => {
    // Si intenta borrar el prefijo -> lo volvemos a poner
    if (!value.startsWith(PREFIX)) {
      setName(PREFIX);
      return;
    }

    setName(value);
  };


  return (
    <Box>
      {loading && (
        <LoadingOverlay />
      )}

      <Stack
        spacing={4}
        w={"full"}
        p={{ base: 5, md: 6 }}
      >
        <Heading
          as="h2"
          size="lg"
          pr={8}
          mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
        >
          Editar sala
        </Heading>

        <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
          <Box display="flex" justifyContent="center" w="100%">
            <FormControl id="room_name" isRequired>
              <FormLabel>Nombre</FormLabel>
              <Input
                type="text"
                w="100%"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === PREFIX) {
                    e.target.setSelectionRange(PREFIX.length, PREFIX.length);
                  }
                }}
              />
            </FormControl>
          </Box>

          <Box display="flex" justifyContent="center" w="100%">
            <FormControl isRequired>
              <FormLabel>Estudio</FormLabel>
              <Select2
                w="100%"
                placeholder="Seleccionar"
                value={
                  studios
                    .map((stu) => ({ label: stu.name, value: stu.id }))
                    .find((opt) => opt.value === studio) || null
                }
                onChange={(selectedOption) => setStudio(selectedOption.value)}  // El `selectedOption` contiene `value` y `label`
                options={studios
                  .filter((stu) => stu.is_active === true) // 👈 solo activos
                  .map((stu) => ({
                    label: stu.name,
                    value: stu.id
                  }))
                }
              />
            </FormControl>
          </Box>

          <Box display="flex" justifyContent="center" w="100%">
            <FormControl id="room_capacity" isRequired>
              <FormLabel>Capacidad</FormLabel>
              <Input
                type="number"
                min={1}
                w="100%"
                placeholder="Ej: 8"
                value={capacity}
                onChange={(e) => {
                  const v = e.target.value;
                  setCapacity(v === "" ? "" : Number(v));
                }}
              />
            </FormControl>
          </Box>
        </SimpleGrid>

        <HStack spacing={3} justify="flex-end" mt={6}>
          <Button
            onClick={onClose}
            w={["100%", "135px"]}
            /*             isDisabled={isCancel}
 */
            aria-label="Cancelar"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitRoomsEdit}
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

export default ModalRoomsEdit;
