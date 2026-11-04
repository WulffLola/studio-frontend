"use client";

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { Select as Select2 } from "./ui/Select";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import {
  getActivitySubType,
  getAppointments,
  getCalendar,
  getPeoples,
  getRooms,
  getSlots,
  getSlotTemplates,
} from "../stores/studioSlice";

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fixedSlotsUrl = () =>
  process.env.NEXT_PUBLIC_URL_BACKEND_FIXED_SLOTS ||
  `${process.env.NEXT_PUBLIC__URL_BACKEND}fixed-slots/`;

const entityId = (value: any) => String(typeof value === "object" ? value?.id ?? "" : value ?? "");

const templateDaysKey = (template: any) =>
  (template.days_of_week || [])
    .map((day: any) => entityId(day) || String(day?.day || day))
    .sort()
    .join(",");

const templateDaysLabel = (template: any) =>
  (template.days_of_week || [])
    .map((day: any) => day?.day || String(day))
    .join(", ");

const templateTimeKey = (template: any) =>
  `${String(template.start_time || "").slice(0, 5)}|${String(template.end_time || "").slice(0, 5)}`;

const uniqueOptions = (options: Array<{ value: string; label: string }>) =>
  options.filter(
    (option, index) => options.findIndex((candidate) => candidate.value === option.value) === index,
  );

type Props = {
  onClose: () => void;
  onCreated: () => void;
  embedded?: boolean;
  initialPersonId?: string | number;
  initialStartDate?: string;
  conversionMode?: boolean;
};

const ModalFixedSlotAdd = ({
  onClose,
  onCreated,
  embedded = false,
  initialPersonId,
  initialStartDate,
  conversionMode = false,
}: Props) => {
  const [personId, setPersonId] = useState(initialPersonId ? String(initialPersonId) : "");
  const [templateId, setTemplateId] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedDays, setSelectedDays] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [startDate, setStartDate] = useState(() => initialStartDate || formatDateInput(new Date()));
  const [endDate, setEndDate] = useState("");
  const [observation, setObservation] = useState("");
  const [saving, setSaving] = useState(false);
  const { tokens } = useAuthStore();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { peoples, slotTemplates, rooms, activitySubType } = useSelector(
    (state: any) => state.studio,
  );

  useEffect(() => {
    Promise.all([
      dispatch(getPeoples()),
      dispatch(getSlotTemplates()),
      dispatch(getRooms()),
      dispatch(getActivitySubType()),
    ]);
  }, [dispatch]);

  const personOptions = useMemo(
    () => (peoples || [])
      .filter((person: any) => person.deleted === null)
      .map((person: any) => ({
        value: person.id,
        label: `${person.name} ${person.last_name} · DNI ${person.dni}`,
      })),
    [peoples],
  );

  const activeTemplates = useMemo(
    () => (slotTemplates || []).filter(
      (template: any) => template.deleted === null && template.is_active !== false,
    ),
    [slotTemplates],
  );

  const activityOptions = useMemo(() => uniqueOptions(activeTemplates.map((template: any) => {
    const id = entityId(template.activity_subtype);
    const activity = activitySubType?.find((item: any) => String(item.id) === id);
    return { value: id, label: activity?.name || `Actividad ${id}` };
  })), [activeTemplates, activitySubType]);

  const roomOptions = useMemo(() => uniqueOptions(activeTemplates
    .filter((template: any) => entityId(template.activity_subtype) === selectedActivityId)
    .map((template: any) => {
      const id = entityId(template.room);
      const room = rooms?.find((item: any) => String(item.id) === id);
      return { value: id, label: room?.name || `Sala ${id}` };
    })), [activeTemplates, rooms, selectedActivityId]);

  const dayOptions = useMemo(() => uniqueOptions(activeTemplates
    .filter((template: any) =>
      entityId(template.activity_subtype) === selectedActivityId &&
      entityId(template.room) === selectedRoomId)
    .map((template: any) => ({
      value: templateDaysKey(template),
      label: templateDaysLabel(template),
    }))), [activeTemplates, selectedActivityId, selectedRoomId]);

  const timeOptions = useMemo(() => uniqueOptions(activeTemplates
    .filter((template: any) =>
      entityId(template.activity_subtype) === selectedActivityId &&
      entityId(template.room) === selectedRoomId &&
      templateDaysKey(template) === selectedDays)
    .map((template: any) => ({
      value: templateTimeKey(template),
      label: `${template.start_time?.slice(0, 5)} a ${template.end_time?.slice(0, 5)}`,
    }))), [activeTemplates, selectedActivityId, selectedRoomId, selectedDays]);

  useEffect(() => {
    const template = activeTemplates.find((candidate: any) =>
      entityId(candidate.activity_subtype) === selectedActivityId &&
      entityId(candidate.room) === selectedRoomId &&
      templateDaysKey(candidate) === selectedDays &&
      templateTimeKey(candidate) === selectedTime);
    setTemplateId(template ? String(template.id) : "");
  }, [activeTemplates, selectedActivityId, selectedRoomId, selectedDays, selectedTime]);

  const submit = async () => {
    if (!personId || !templateId || !startDate) {
      toast({ title: "Completá los campos obligatorios", status: "error", position: "bottom-right" });
      return;
    }
    if (endDate && endDate < startDate) {
      toast({ title: "La fecha de fin no puede ser anterior al inicio", status: "error", position: "bottom-right" });
      return;
    }

    setSaving(true);
    try {
      const { data } = await axios.post(
        fixedSlotsUrl(),
        {
          person: Number(personId),
          template_id: Number(templateId),
          start_date: startDate,
          end_date: endDate || null,
          observation: observation.trim(),
        },
        { headers: { Authorization: `Bearer ${tokens?.access}`, "Content-Type": "application/json" } },
      );

      const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
      toast({
        title: "Turno fijo creado",
        description: warnings.length
          ? `Se crearon ${data?.reservas_creadas ?? 0} reservas. ${warnings.length} clase(s) no pudieron reservarse.`
          : `Se crearon ${data?.reservas_creadas ?? 0} reservas automáticamente.`,
        status: warnings.length ? "warning" : "success",
        duration: 6500,
        isClosable: true,
        position: "bottom-right",
      });
      await Promise.all([
        dispatch(getAppointments()),
        dispatch(getCalendar()),
        dispatch(getSlots()),
      ]);
      onCreated();
      onClose();
    } catch (error: any) {
      toast({
        title: "No se pudo crear el turno fijo",
        description: error.response?.data?.detail || "Revisá los datos e intentá nuevamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={5} p={embedded ? 0 : { base: 5, md: 8 }}>
      {!embedded && (
        <Box>
          <Heading as="h2" size="lg" pr={8} mb={1}>Nuevo turno fijo</Heading>
          <Box color="text.secondary" fontSize="sm" mt={1}>
            Reservá automáticamente este horario durante el período indicado.
          </Box>
        </Box>
      )}

      <Alert status="info" borderRadius="md" alignItems="flex-start">
        <AlertIcon mt={0.5} />
        {conversionMode
          ? "Se conservará esta reserva y se asignará la recurrencia elegida para las próximas clases."
          : "El horario se repite según la plantilla. Las clases futuras también se reservarán al generarse."}
      </Alert>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired gridColumn={{ md: "span 2" }}>
          <FormLabel>Alumno</FormLabel>
          <Select2
            options={personOptions}
            placeholder="Buscar por nombre o DNI"
            value={personOptions.find((option: any) => String(option.value) === personId) || null}
            onChange={(option: any) => setPersonId(String(option?.value || ""))}
            menuPosition="fixed"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Actividad</FormLabel>
          <Select2
            options={activityOptions}
            value={activityOptions.find((option) => option.value === selectedActivityId) || null}
            placeholder="Seleccionar actividad"
            onChange={(option: any) => {
              setSelectedActivityId(String(option?.value || ""));
              setSelectedRoomId("");
              setSelectedDays("");
              setSelectedTime("");
            }}
            menuPosition="fixed"
            noOptionsMessage={() => "No hay actividades con horarios recurrentes"}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Sala</FormLabel>
          <Select2
            options={roomOptions}
            value={roomOptions.find((option) => option.value === selectedRoomId) || null}
            placeholder={selectedActivityId ? "Seleccionar sala" : "Seleccionar actividad primero"}
            isDisabled={!selectedActivityId}
            onChange={(option: any) => {
              setSelectedRoomId(String(option?.value || ""));
              setSelectedDays("");
              setSelectedTime("");
            }}
            menuPosition="fixed"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Días</FormLabel>
          <Select2
            options={dayOptions}
            value={dayOptions.find((option) => option.value === selectedDays) || null}
            placeholder={selectedRoomId ? "Seleccionar días" : "Seleccionar sala primero"}
            isDisabled={!selectedRoomId}
            onChange={(option: any) => {
              setSelectedDays(String(option?.value || ""));
              setSelectedTime("");
            }}
            menuPosition="fixed"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Horario</FormLabel>
          <Select2
            options={timeOptions}
            value={timeOptions.find((option) => option.value === selectedTime) || null}
            placeholder={selectedDays ? "Seleccionar horario" : "Seleccionar días primero"}
            isDisabled={!selectedDays}
            onChange={(option: any) => setSelectedTime(String(option?.value || ""))}
            menuPosition="fixed"
          />
          {templateId && <FormHelperText color="success.fg">Horario recurrente encontrado.</FormHelperText>}
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Comienza</FormLabel>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </FormControl>

        <FormControl>
          <FormLabel>Finaliza</FormLabel>
          <Input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <FormHelperText>Dejalo vacío para que no tenga vencimiento.</FormHelperText>
        </FormControl>

        <FormControl gridColumn={{ md: "span 2" }}>
          <FormLabel>Observación</FormLabel>
          <Textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value.slice(0, 250))}
            placeholder="Ej.: Turno solicitado por administración"
            resize="vertical"
          />
          <FormHelperText textAlign="right">{observation.length}/250</FormHelperText>
        </FormControl>
      </SimpleGrid>

      <HStack justify="flex-end" spacing={3}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={submit} isLoading={saving} loadingText="Creando">
          {conversionMode ? "Convertir en turno fijo" : "Crear turno fijo"}
        </Button>
      </HStack>
    </Stack>
  );
};

export default ModalFixedSlotAdd;
