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
  RadioGroup,
  Radio,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { getTypePlans } from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

const ModalTypePlansEdit = ({ onClose, isCancel, product }: any) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [frequency, setFrequency] = useState("");
  const [loading, setLoading] = useState(false);

  const { tokens } = useAuthStore();
  const { typePlans } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();
  const toast = useToast();

  useEffect(() => {
    if (product) {
      setName(product?.name || "");
      setQuantity(product?.quantity ? String(product.quantity) : "");
      setFrequency(product?.frequency || "");
    }
  }, [product]);

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const handleSubmitTypePlanEdit = async () => {
    setLoading(true);

    const trimmedName = name.trim();
    const trimmedQuantity = quantity.trim();

    if (!trimmedName || !trimmedQuantity || !frequency) {
      toast({
        title: "Faltan completar campos.",
        description: "Por favor completá todos los campos.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const wordsRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!wordsRegex.test(trimmedName)) {
      toast({
        title: "Nombre inválido.",
        description: "Por favor ingresá solo letras.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const numbersRegex = /^\d+$/;
    if (!numbersRegex.test(trimmedQuantity) || Number(trimmedQuantity) <= 0) {
      toast({
        title: "Cantidad inválida.",
        description: "La cantidad debe ser un número mayor a 0.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const exists =
      Array.isArray(typePlans) &&
      typePlans.some(
        (typePlan: any) =>
          Number(typePlan.id) !== Number(product?.id) &&
          normalizeText(typePlan.name || "") === normalizeText(trimmedName) &&
          String(typePlan.quantity || "") === String(trimmedQuantity) &&
          normalizeText(typePlan.frequency || "") === normalizeText(frequency)
      );

    if (exists) {
      toast({
        title: "Tipo de plan duplicado.",
        description:
          "Ya existe un tipo de plan con ese nombre, cantidad y frecuencia.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("quantity", trimmedQuantity);
    formData.append("frequency", frequency);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_TYPE_PLANS}${product.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      toast({
        title: "Tipo de plan editado correctamente.",
        description: "El tipo de plan fue editado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onClose();
      dispatch(getTypePlans());
    } catch (error: any) {
      console.error("Error en la solicitud:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al editar el tipo de plan.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
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
          Editar tipo de plan
        </Heading>

        <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
          <Box display="flex" justifyContent="center" w="100%">
            <FormControl id="name" isRequired>
              <FormLabel>Nombre</FormLabel>
              <Input
                type="text"
                w="100%"
                placeholder="Escribir..."
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FormControl>
          </Box>

          <Box display="flex" justifyContent="center" w="100%">
            <FormControl id="quantity" isRequired>
              <FormLabel>Cantidad</FormLabel>
              <Input
                type="number"
                min={1}
                placeholder="Ej: 8"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </FormControl>
          </Box>

          <Box w="100%">
            <FormControl id="frequency" isRequired>
              <FormLabel>Frecuencia</FormLabel>
              <RadioGroup value={frequency} onChange={setFrequency}>
                <Wrap spacing={5}>
                  <WrapItem>
                    <Radio value="mensual">Mensual</Radio>
                  </WrapItem>
                  <WrapItem>
                    <Radio value="semanal">Semanal</Radio>
                  </WrapItem>
                  <WrapItem>
                    <Radio value="diario">Diario</Radio>
                  </WrapItem>
                </Wrap>
              </RadioGroup>
            </FormControl>
          </Box>
        </SimpleGrid>

        <HStack spacing={3} justify="flex-end" mt={6}>
          <Button
            onClick={onClose}
            w={["100%", "135px"]}
            isDisabled={isCancel}
            aria-label="Cancelar"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitTypePlanEdit}
            w={["100%", "135px"]}
            variant="primary"
          >
            Guardar
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default ModalTypePlansEdit;