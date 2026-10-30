import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    Box,
    Text,
    useToast,
    useDisclosure,
    SimpleGrid,
    Input,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Spinner,
    HStack,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select as Select2 } from "./ui/Select";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getExtraHours,
    getTeachers,
    getSlots,
} from "../stores/studioSlice";
import DatePicker from "react-datepicker";
import { LoadingOverlay } from "./ui/Loaders";

const ModalExtraHoursAdd = ({ product, onClose }: any) => {
    const [date, setDate] = useState<Date | null>(null);
    const [teacher, setTeacher] = useState("");
    const [hours, setHours] = useState<any>(null);
    const [price, setPrice] = useState("");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { teachers, slots } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const [selectedSlotId, setSelectedSlotId] = useState("");

    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    const formattedDate = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
              date.getDate()
          ).padStart(2, "0")}`
        : "";

    const availableSlotsByDate = slots.filter(
        (slot: any) => slot.deleted === null && slot.date === formattedDate
    );

    const hasSlots = availableSlotsByDate.length > 0;

    const hourOptions = availableSlotsByDate.map((slot: any) => ({
        label: slot.start_time?.slice(0, 5),
        value: String(slot.id),
    }));

    useEffect(() => {
        if (!formattedDate) {
            setHours(null);
            setSelectedSlotId("");
            return;
        }

        const firstAvailableSlot = slots.find(
            (slot: any) => slot.deleted === null && slot.date === formattedDate
        );

        if (!firstAvailableSlot) {
            setHours(null);
            setSelectedSlotId("");
            return;
        }

        const option = {
            label: firstAvailableSlot.start_time?.slice(0, 5),
            value: String(firstAvailableSlot.id),
        };

        setHours(option);
        setSelectedSlotId(option.value);
    }, [formattedDate, slots]);

    const handleSubmitExtraHours = async () => {
        setLoading(true);

        const formData = new FormData();

        formData.append("teacher_id", teacher);
        formData.append("slot_id", selectedSlotId);
        formData.append("date", formattedDate);
        formData.append("price", price);

        let isFormValid = true;
        formData.forEach((value) => {
            if (value === "" || value === "--:--") {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
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

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast({
                title: "Hora extra registrada correctamente.",
                description: "La hora extra fue registrada con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();
            dispatch(getExtraHours());
        } catch (error: any) {
            const errorMessage = error?.response?.data?.detail || error?.message;
            const isScheduleDuplicate =
                typeof errorMessage === "string" &&
                errorMessage.includes("Ya existe una hora extra asignada al mismo día y horario");

            if (errorMessage === "No Hour matches the given query.") {
                toast({
                    title: "Error",
                    description: "La profesora debe tener horas calculadas y guardadas.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (isScheduleDuplicate) {
                toast({
                    title: "Hora extra duplicada.",
                    description: "Ya existe una hora extra asignada al mismo día y horario para esta profesora.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar la hora extra.",
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

    useEffect(() => {
        dispatch(getTeachers());
        dispatch(getSlots());
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
                    Nueva hora extra
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="teacher" isRequired>
                            <FormLabel>Profesora</FormLabel>
                            <Select2
                                w="100%"
                                placeholder="Seleccionar"
                                value={
                                    teacher
                                        ? teachers
                                              .filter((person: any) => person.deleted === null)
                                              .map((person: any) => ({
                                                  label: `${person.name} ${person.last_name} - ${person.dni}`,
                                                  value: String(person.id),
                                              }))
                                              .find((option: any) => option.value === String(teacher))
                                        : null
                                }
                                onChange={(selectedOption: any) =>
                                    setTeacher(String(selectedOption?.value || ""))
                                }
                                options={teachers
                                    .filter((person: any) => person.deleted === null)
                                    .map((person: any) => ({
                                        label: `${person.name} ${person.last_name} - ${person.dni}`,
                                        value: String(person.id),
                                    }))}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="day" isRequired>
                            <FormLabel>Fecha</FormLabel>
                            <Box
                                border="1px solid"
                                borderColor="border.subtle"
                                borderRadius="md"
                                px={3}
                                py={2}
                                h="40px"
                                display="flex"
                                alignItems="center"
                            >
                                <DatePicker
                                    selected={date}
                                    onChange={(selectedDate) => {
                                        setDate(selectedDate);
                                        setHours(null);
                                        setSelectedSlotId("");
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Seleccionar"
                                    customInput={
                                        <input
                                            style={{
                                                border: "none",
                                                outline: "none",
                                                width: "100%",
                                                background: "transparent",
                                            }}
                                        />
                                    }
                                />
                            </Box>
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="hours" isRequired>
                            <FormLabel>Horario</FormLabel>
                            <Select2
                                h="40px"
                                w="100%"
                                value={hours || undefined}
                                isDisabled={!formattedDate || !hasSlots}
                                placeholder={
                                    !formattedDate
                                        ? "Seleccionar fecha primero"
                                        : !hasSlots
                                        ? "Sin horarios disponibles"
                                        : "Seleccionar"
                                }
                                noOptionsMessage={() =>
                                    !hasSlots
                                        ? "No hay horarios disponibles para este día"
                                        : "Sin opciones"
                                }
                                onChange={(selectedOption: any) => {
                                    setHours(selectedOption || null);
                                    setSelectedSlotId(selectedOption?.value || "");
                                }}
                                options={hourOptions}
                            />

                            {formattedDate && !hasSlots && (
                                <Text color="error.fg" fontSize="sm" mt={2}>
                                    No hay horarios disponibles para la fecha seleccionada
                                </Text>
                            )}
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="price" isRequired>
                            <FormLabel>Valor hora</FormLabel>
                            <Input
                                h="40px"
                                w="100%"
                                placeholder="Escribir..."
                                type="text"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                </SimpleGrid>

                <HStack
                    flexDirection={{ base: "column", md: "row" }}
                    spacing={3}
                    justify="flex-end"
                    mt={6}
                >
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleSubmitExtraHours}
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

export default ModalExtraHoursAdd;
