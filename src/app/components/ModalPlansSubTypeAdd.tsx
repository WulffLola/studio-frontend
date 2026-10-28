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
  Select,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import {
  getPlans,
  getTypePlans,
  getActivitySubType,
  getPlanSubType,
} from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

const ModalPlansSubTypeAdd = ({ onClose, isCancel }: any) => {
  const [name, setName] = useState("");
  const [plansTypeId, setPlansTypeId] = useState("");
  const [activitySubtypeId, setActivitySubtypeId] = useState("");
  const [sessions, setSessions] = useState("");

  const [loading, setLoading] = useState(false);

  const { tokens } = useAuthStore();
  const { plansSubType, typePlans, activitySubType } = useSelector(
    (state: any) => state.studio
  );

  const dispatch = useAppDispatch();
  const toast = useToast();

  useEffect(() => {
    dispatch(getTypePlans());
    dispatch(getActivitySubType());
    dispatch(getPlans());
  }, [dispatch]);

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const handleSubmitPlan = async () => {
    setLoading(true);

    const trimmedName = name.trim();

    if (!trimmedName || !plansTypeId || !activitySubtypeId || !sessions) {
      toast({
        title: "Faltan completar campos.",
        description: "Por favor complete todos los campos.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const exists =
      Array.isArray(plansSubType) &&
      plansSubType.some(
        (plan: any) =>
          String(plan.plans_type) === String(plansTypeId) &&
          normalizeText(plan.name || "") === normalizeText(trimmedName)
      );

    if (exists) {
      toast({
        title: "Nombre duplicado.",
        description: "Ya existe un plan con ese nombre para ese tipo.",
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
    formData.append("plan_type", String(plansTypeId));
    formData.append("activity_subtype", String(activitySubtypeId));
    formData.append("sessions", String(sessions));

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN_SUB_TYPE}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      toast({
        title: "Plan creado correctamente.",
        description: "El plan fue creado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onClose();
      dispatch(getPlanSubType());
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el plan.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(getTypePlans());
    dispatch(getActivitySubType());
    dispatch(getPlans());
    dispatch(getPlanSubType());
  }, [dispatch]);

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
          Nuevo plan
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
            <FormControl id="activity_subtype" isRequired>
              <FormLabel>Actividad</FormLabel>
              <Select
                placeholder="Seleccionar"
                value={activitySubtypeId}
                onChange={(event) => setActivitySubtypeId(event.target.value)}
              >
                {activitySubType?.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>

          <HStack
            spacing={4}
            w="100%"
            align="flex-end"
            flexWrap="wrap"
          >

            <Box flex="1" minW=" 200px">
              <FormControl id="sessions" isRequired>
                <FormLabel>Veces</FormLabel>
                <Input
                  type="number"
                  min={1}
                  placeholder="Ej: 8"
                  value={sessions}
                  onChange={(event) => setSessions(event.target.value)}
                />
              </FormControl>
            </Box>

            <Box flex="1" minW="200px">
              <FormControl id="plans_type" isRequired>
                <FormLabel>Tipo de plan</FormLabel>
                <Select
                  placeholder="Seleccionar"
                  value={plansTypeId}
                  onChange={(event) => setPlansTypeId(event.target.value)}
                >
                  {typePlans?.map((typePlan: any) => (
                    <option key={typePlan.id} value={typePlan.id}>
                      {typePlan.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>

          </HStack>
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
            onClick={handleSubmitPlan}
            w={["100%", "135px"]}
            variant="primary"
          >
            Guardar
          </Button>
        </HStack>
      </Stack>
    </Box >
  );
};

export default ModalPlansSubTypeAdd;
