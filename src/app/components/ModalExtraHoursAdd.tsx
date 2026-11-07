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
import { useStudioStore } from "../stores/studio";
import { useSelector } from "react-redux";
import {
    getExtraHours,
    getRooms,
    getStudios,
    getTeachers,
    getSlots,
} from "../stores/studioSlice";
import DatePicker from "react-datepicker";
import { LoadingOverlay } from "./ui/Loaders";
import { isSelectableStudio } from "../utils/studios";

const getSlotRoomId = (slot: any) =>
    typeof slot?.room === "object" ? slot.room?.id : slot?.room;

const getRoomStudioId = (room: any) =>
    typeof room?.studio === "object"
        ? room.studio?.id
        : room?.studio_id ?? room?.studio;

const ModalExtraHoursAdd = ({ product, onClose }: any) => {
    const isEditing = Boolean(product?.id);
    const productDate = product?.slot?.date
        ? (() => { const [year, month, day] = product.slot.date.split("-").map(Number); return new Date(year, month - 1, day); })()
        : null;
    const [date, setDate] = useState<Date | null>(productDate);
    const [teacher, setTeacher] = useState(product?.teacher?.id ? String(product.teacher.id) : "");
    const [selectedStudio, setSelectedStudio] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [hours, setHours] = useState<any>(null);
    const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { teachers, slots, rooms, studios } = useSelector((state: any) => state.studio);
    const selectedStudioFromHeader = useStudioStore(
        (state: any) => state.selectedStudio
    );
    const dispatch = useAppDispatch();

    const [selectedSlotId, setSelectedSlotId] = useState(product?.slot?.id ? String(product.slot.id) : "");

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

    const activeSlots = (Array.isArray(slots) ? slots : []).filter(
        (slot: any) => slot.deleted === null
    );

    const originalRoomId = getSlotRoomId(product?.slot);
    const originalRoom = (Array.isArray(rooms) ? rooms : []).find(
        (room: any) => String(room.id) === String(originalRoomId)
    );
    const originalStudioId = getRoomStudioId(originalRoom) ?? product?.studio?.id ?? product?.studio_id;

    const studioOptions = (Array.isArray(studios) ? studios : [])
        .filter((studio: any) => isSelectableStudio(studio) || (isEditing && String(studio.id) === String(originalStudioId)))
        .map((studio: any) => ({
            label: studio.name,
            value: String(studio.id),
        }));

    useEffect(() => {
        if (selectedStudio) return;

        if (isEditing && originalStudioId) {
            const historicalStudio = (Array.isArray(studios) ? studios : []).find(
                (studio: any) => String(studio.id) === String(originalStudioId)
            );
            if (historicalStudio) {
                setSelectedStudio({ label: historicalStudio.name, value: String(historicalStudio.id) });
                return;
            }
        }

        const headerStudioId =
            typeof selectedStudioFromHeader === "object"
                ? selectedStudioFromHeader?.id
                : selectedStudioFromHeader;
        if (!headerStudioId) return;

        const matchingStudio = (Array.isArray(studios) ? studios : []).find(
            (studio: any) =>
                studio.is_active !== false &&
                !studio.deleted &&
                String(studio.id) === String(headerStudioId)
        );

        if (matchingStudio) {
            setSelectedStudio({
                label: matchingStudio.name,
                value: String(matchingStudio.id),
            });
        }
    }, [isEditing, originalStudioId, selectedStudio, selectedStudioFromHeader, studios]);

    useEffect(() => {
        if (!isEditing || selectedRoom || !originalRoom) return;
        setSelectedRoom({ label: originalRoom.name, value: String(originalRoom.id) });
    }, [isEditing, originalRoom, selectedRoom]);

    useEffect(() => {
        if (!isEditing || !product?.slot?.id || hours) return;
        setHours({ label: product.slot.start_time?.slice(0, 5), value: String(product.slot.id) });
    }, [hours, isEditing, product]);

    const roomOptions = (Array.isArray(rooms) ? rooms : [])
        .filter((room: any) => {
            if (!selectedStudio || room.is_active === false || room.deleted) return false;
            if (String(getRoomStudioId(room)) !== String(selectedStudio.value)) return false;

            return activeSlots.some(
                (slot: any) => String(getSlotRoomId(slot)) === String(room.id)
            );
        })
        .map((room: any) => ({
            label: room.name,
            value: String(room.id),
        }));

    const availableDateStrings = Array.from(
        new Set(
            activeSlots
                .filter(
                    (slot: any) =>
                        selectedRoom &&
                        String(getSlotRoomId(slot)) === String(selectedRoom.value)
                )
                .map((slot: any) => slot.date)
                .filter(Boolean)
        )
    ) as string[];

    const availableDates = availableDateStrings.map((dateString) => {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    });

    const availableSlotsByDate = activeSlots.filter(
        (slot: any) =>
            selectedRoom &&
            String(getSlotRoomId(slot)) === String(selectedRoom.value) &&
            slot.date === formattedDate
    );

    const hasSlots = availableSlotsByDate.length > 0;

    const hourOptions = availableSlotsByDate.map((slot: any) => ({
        label: slot.start_time?.slice(0, 5),
        value: String(slot.id),
    }));

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
            await axios.request({
                method: isEditing ? "put" : "post",
                url: isEditing
                    ? `${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}${product.id}/`
                    : `${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}`,
                data: formData,
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            toast({
                title: isEditing ? "Hora extra editada correctamente." : "Hora extra registrada correctamente.",
                description: isEditing ? "Los cambios fueron guardados con éxito." : "La hora extra fue registrada con éxito.",
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
        dispatch(getRooms());
        dispatch(getStudios());
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
                    {isEditing ? "Editar hora extra" : "Nueva hora extra"}
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="teacher" isRequired>
                            <FormLabel>Profesora</FormLabel>
                            <Select2
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
                        <FormControl id="studio" isRequired>
                            <FormLabel>Estudio</FormLabel>
                            <Select2
                                value={selectedStudio}
                                options={studioOptions}
                                isClearable={false}
                                placeholder={
                                    studioOptions.length
                                        ? "Seleccionar"
                                        : "Sin estudios disponibles"
                                }
                                onChange={(selectedOption: any) => {
                                    setSelectedStudio(selectedOption || null);
                                    setSelectedRoom(null);
                                    setDate(null);
                                    setHours(null);
                                    setSelectedSlotId("");
                                }}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="room" isRequired>
                            <FormLabel>Sala</FormLabel>
                            <Select2
                                value={selectedRoom}
                                options={roomOptions}
                                isDisabled={!selectedStudio}
                                placeholder={
                                    !selectedStudio
                                        ? "Seleccionar estudio primero"
                                        : roomOptions.length
                                        ? "Seleccionar"
                                        : "Sin salas disponibles"
                                }
                                onChange={(selectedOption: any) => {
                                    setSelectedRoom(selectedOption || null);
                                    setDate(null);
                                    setHours(null);
                                    setSelectedSlotId("");
                                }}
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
                                    includeDates={availableDates}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText={
                                        !selectedRoom
                                            ? "Seleccionar sala primero"
                                            : availableDates.length
                                            ? "Seleccionar"
                                            : "Sin fechas disponibles"
                                    }
                                    disabled={!selectedRoom || availableDates.length === 0}
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
                                value={hours}
                                isDisabled={!formattedDate || !hasSlots}
                                placeholder={
                                    !selectedRoom
                                        ? "Seleccionar sala primero"
                                        : !formattedDate
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
