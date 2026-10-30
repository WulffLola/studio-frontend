import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Box,
    useToast,
    useDisclosure,
    SimpleGrid,
    Input,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Spinner,
    Text,
} from "@chakra-ui/react";
import { Select as Select2 } from "./ui/Select";
import DatePicker from "react-datepicker";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { useStudioStore } from "../stores/studio";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getAppointments,
    getPeoples,
    getSlots,
    getStudios,
    getRooms,
    getActivitySubType,
    getCalendar,
} from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

const ModalAppointmentsEdit = ({
    product,
    onClose,
    appointments,
}: any) => {
    const [idAppointment, setIdAppointment] = useState(product?.id || "");
    const [student, setStudent] = useState(String(product?.person?.id || ""));
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const [date, setDate] = useState(product?.slot?.date || "");
    const [hours, setHours] = useState<any>(null);
    const [code] = useState("admin");

    const [selectedSlotId, setSelectedSlotId] = useState(
        String(product?.slot?.id || "")
    );
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [selectedStudio, setSelectedStudio] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);

    const { tipo, tokens } = useAuthStore();
    const selectedStudioFromStore = useStudioStore(
        (state: any) => state.selectedStudio
    );

    const [isLoading, setIsLoading] = useState(false);

    const { peoples, slots, activitySubType, studios, rooms } = useSelector(
        (state: any) => state.studio
    );

    const dispatch = useAppDispatch();
    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    const parseLocalDate = (dateString?: string | null) => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const formatLocalDate = (dateValue: Date | null) => {
        if (!dateValue) return "";
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, "0");
        const day = String(dateValue.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const resetFromActivity = () => {
        setSelectedRoom(null);
        setDate("");
        setHours(null);
        setSelectedSlotId("");
    };

    const resetFromStudio = () => {
        setSelectedRoom(null);
        setDate("");
        setHours(null);
        setSelectedSlotId("");
    };

    const resetFromRoom = () => {
        setDate("");
        setHours(null);
        setSelectedSlotId("");
    };

    const resetFromDate = () => {
        setHours(null);
        setSelectedSlotId("");
    };

    useEffect(() => {
        setIsLoading(true);

        async function fetchData() {
            try {
                await Promise.all([
                    dispatch(getPeoples()),
                    dispatch(getSlots()),
                    dispatch(getStudios()),
                    dispatch(getRooms()),
                    dispatch(getActivitySubType()),
                ]);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [dispatch]);

    const activityOptions =
        activitySubType
            ?.filter((item: any) => item.deleted === null)
            .map((item: any) => ({
                value: item.id,
                label: item.name,
            })) || [];

    const studioOptions =
        studios
            ?.filter((studio: any) => {
                if (studio.is_active === false) return false;
                if (!selectedActivity?.value) return false;

                const hasMatchingSlot = slots.some((slot: any) => {
                    const slotRoomId =
                        typeof slot.room === "object" ? slot.room?.id : slot.room;

                    const slotActivityId =
                        typeof slot.activity_subtype === "object"
                            ? slot.activity_subtype?.id
                            : slot.activity_subtype;

                    const matchingRoom = rooms.find((room: any) => {
                        const roomId =
                            typeof room === "object" ? room.id : room;
                        return String(roomId) === String(slotRoomId);
                    });

                    const roomStudioId =
                        typeof matchingRoom?.studio === "object"
                            ? matchingRoom?.studio?.id
                            : matchingRoom?.studio;

                    return (
                        slot.deleted === null &&
                        String(slotActivityId) === String(selectedActivity.value) &&
                        String(roomStudioId) === String(studio.id)
                    );
                });

                return hasMatchingSlot;
            })
            .map((studio: any) => ({
                value: studio.id,
                label: studio.name,
            })) || [];

    const roomOptions =
        rooms
            ?.filter((room: any) => {
                if (room.is_active === false) return false;
                if (!selectedStudio?.value || !selectedActivity?.value) return false;

                const roomStudioId =
                    typeof room.studio === "object" ? room.studio?.id : room.studio;

                if (String(roomStudioId) !== String(selectedStudio.value)) return false;

                const hasMatchingSlot = slots.some((slot: any) => {
                    const slotRoomId =
                        typeof slot.room === "object" ? slot.room?.id : slot.room;
                    const slotActivityId =
                        typeof slot.activity_subtype === "object"
                            ? slot.activity_subtype?.id
                            : slot.activity_subtype;

                    return (
                        slot.deleted === null &&
                        String(slotRoomId) === String(room.id) &&
                        String(slotActivityId) === String(selectedActivity.value)
                    );
                });

                return hasMatchingSlot;
            })
            .map((room: any) => ({
                value: room.id,
                label: room.name,
            })) || [];

    const availableDates = useMemo(() => {
        return [
            ...new Set(
                slots
                    .filter((slot: any) => {
                        const slotRoomId =
                            typeof slot.room === "object" ? slot.room?.id : slot.room;

                        const slotActivityId =
                            typeof slot.activity_subtype === "object"
                                ? slot.activity_subtype?.id
                                : slot.activity_subtype;

                        return (
                            slot.deleted === null &&
                            selectedRoom?.value &&
                            selectedActivity?.value &&
                            String(slotRoomId) === String(selectedRoom.value) &&
                            String(slotActivityId) === String(selectedActivity.value) &&
                            Number(slot.availability) > 0
                        );
                    })
                    .map((slot: any) => slot.date)
            ),
        ];
    }, [slots, selectedRoom, selectedActivity]);

    const includeDateObjects = availableDates
        .map((dateStr: string) => parseLocalDate(dateStr))
        .filter(Boolean) as Date[];

    const availableSlotsByFilters = useMemo(() => {
        return slots.filter((slot: any) => {
            const slotRoomId =
                typeof slot.room === "object" ? slot.room?.id : slot.room;

            const slotActivityId =
                typeof slot.activity_subtype === "object"
                    ? slot.activity_subtype?.id
                    : slot.activity_subtype;

            return (
                slot.deleted === null &&
                slot.date === date &&
                selectedRoom?.value &&
                selectedActivity?.value &&
                String(slotRoomId) === String(selectedRoom.value) &&
                String(slotActivityId) === String(selectedActivity.value) &&
                Number(slot.availability) > 0
            );
        });
    }, [slots, date, selectedRoom, selectedActivity]);

    const hasSlots = availableSlotsByFilters.length > 0;

    const hourOptions = [
        ...new Map(
            availableSlotsByFilters.map((slot: any) => [
                slot.start_time?.slice(0, 5),
                {
                    label: slot.start_time?.slice(0, 5),
                    value: slot.start_time?.slice(0, 5),
                    slotId: slot.id,
                },
            ])
        ).values(),
    ];

    useEffect(() => {
        if (!peoples?.length || !product?.person?.id) return;

        const matchingPerson = peoples.find(
            (person: any) => String(person.id) === String(product.person.id)
        );

        if (matchingPerson) {
            setSelectedStudent({
                value: matchingPerson.id,
                label: `${matchingPerson.name} ${matchingPerson.last_name} - ${matchingPerson.dni}`,
            });
            setStudent(String(matchingPerson.id));
        }
    }, [peoples, product]);

    useEffect(() => {
        if (!slots?.length) return;

        const currentSlot = slots.find(
            (slot: any) => String(slot.id) === String(product?.slot?.id)
        );

        if (!currentSlot) {
            if (!selectedStudio && selectedStudioFromStore && studios?.length) {
                const studioIdFromStore =
                    typeof selectedStudioFromStore === "object"
                        ? selectedStudioFromStore?.id
                        : selectedStudioFromStore;

                const matchingStudio = studios.find(
                    (item: any) =>
                        item.is_active !== false &&
                        String(item.id) === String(studioIdFromStore)
                );

                if (matchingStudio) {
                    setSelectedStudio({
                        value: matchingStudio.id,
                        label: matchingStudio.name,
                    });
                }
            }
            return;
        }

        const activityId =
            typeof currentSlot.activity_subtype === "object"
                ? currentSlot.activity_subtype?.id
                : currentSlot.activity_subtype;

        const roomId =
            typeof currentSlot.room === "object"
                ? currentSlot.room?.id
                : currentSlot.room;

        const matchingActivity = activitySubType?.find(
            (item: any) => String(item.id) === String(activityId)
        );

        const matchingRoom = rooms?.find(
            (item: any) => String(item.id) === String(roomId)
        );

        const studioId =
            typeof matchingRoom?.studio === "object"
                ? matchingRoom?.studio?.id
                : matchingRoom?.studio;

        const matchingStudio = studios?.find(
            (item: any) =>
                item.is_active !== false &&
                String(item.id) === String(studioId)
        );

        if (matchingActivity) {
            setSelectedActivity({
                value: matchingActivity.id,
                label: matchingActivity.name,
            });
        }

        if (matchingStudio) {
            setSelectedStudio({
                value: matchingStudio.id,
                label: matchingStudio.name,
            });
        }

        if (matchingRoom) {
            setSelectedRoom({
                value: matchingRoom.id,
                label: matchingRoom.name,
            });
        }

        setDate(currentSlot.date || product?.slot?.date || "");

        const startTime =
            currentSlot.start_time?.slice(0, 5) ||
            product?.slot?.time_slot?.slice(0, 5) ||
            "";

        if (startTime) {
            setHours({
                value: startTime,
                label: startTime,
            });
        }

        setSelectedSlotId(String(currentSlot.id));
    }, [slots, rooms, studios, activitySubType, product, selectedStudioFromStore]);

    useEffect(() => {
        if (!selectedActivity || !selectedStudio) return;

        const stillExists = studioOptions.some(
            (option: any) => String(option.value) === String(selectedStudio.value)
        );

        if (!stillExists) {
            setSelectedStudio(null);
            setSelectedRoom(null);
            setDate("");
            setHours(null);
            setSelectedSlotId("");
        }
    }, [selectedActivity, studioOptions, selectedStudio]);

    const handleSubmitAppointments = async (codeValue: string) => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append("person_id", student);
        formData.append("slot_id", selectedSlotId);
        formData.append("code", codeValue);

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
            setIsLoading(false);
            return;
        }

        const isDuplicate =
            Array.isArray(appointments) &&
            appointments.some(
                (appointment: any) =>
                    String(appointment.id) !== String(idAppointment) &&
                    appointment.person &&
                    appointment.slot &&
                    String(appointment.person.id) === String(student) &&
                    String(appointment.slot.id) === String(selectedSlotId)
            );

        if (isDuplicate) {
            toast({
                title: "Turno duplicado.",
                description: "Esta persona ya tiene un turno disponible en este día y horario.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setIsLoading(false);
            return;
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}${idAppointment}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast({
                title: "Turno editado correctamente.",
                description: "El turno fue actualizado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();
            dispatch(getAppointments());
            dispatch(getCalendar());
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.detail || "Ocurrió un error al editar el turno.";

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box>
            {isLoading && (
                <LoadingOverlay />
            )}

            <Stack
                spacing={4}
                w="full"
                p={{ base: 5, md: 6 }}
            >
                <Modal
                    onClose={onCloseModalCode}
                    isOpen={isAlertCodeOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w="100%" h="100%" />
                    <ModalContent
                        maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }}
                        maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}
                        mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}
                    >
                        <ModalCloseButton />
                        <ModalCode
                            onClose={onCloseModalCode}
                            get={getAppointments}
                            onCloseAlert={onClose}
                            entityType="appointmentsEdit"
                            action={handleSubmitAppointments}
                        />
                    </ModalContent>
                </Modal>

                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Editar turno
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="student" isRequired>
                            <FormLabel>Alumno</FormLabel>
                            <Select2
                                w="100%"
                                placeholder="Seleccionar"
                                value={selectedStudent || undefined}
                                onChange={(selectedOption: any) => {
                                    setSelectedStudent(selectedOption || null);
                                    setStudent(String(selectedOption?.value || ""));
                                }}
                                options={peoples
                                    .filter((person: any) => person.deleted === null)
                                    .map((person: any) => ({
                                        label: `${person.name} ${person.last_name} - ${person.dni}`,
                                        value: person.id,
                                    }))}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="activity" isRequired>
                            <FormLabel>Actividad</FormLabel>
                            <Select2
                                w="100%"
                                placeholder="Seleccionar"
                                value={selectedActivity || undefined}
                                options={activityOptions}
                                onChange={(selectedOption: any) => {
                                    setSelectedActivity(selectedOption);
                                    resetFromActivity();
                                }}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="studio" isRequired>
                            <FormLabel>Estudio</FormLabel>
                            <Select2
                                w="100%"
                                placeholder={
                                    !selectedActivity
                                        ? "Seleccionar actividad primero"
                                        : !studioOptions.length
                                        ? "Sin estudios disponibles"
                                        : "Seleccionar"
                                }
                                value={selectedStudio || undefined}
                                isDisabled={!selectedActivity}
                                options={studioOptions}
                                onChange={(selectedOption: any) => {
                                    setSelectedStudio(selectedOption);
                                    resetFromStudio();
                                }}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="room" isRequired>
                            <FormLabel>Sala</FormLabel>
                            <Select2
                                w="100%"
                                placeholder={
                                    !selectedStudio
                                        ? "Seleccionar estudio primero"
                                        : !roomOptions.length
                                        ? "Sin salas disponibles"
                                        : "Seleccionar"
                                }
                                value={selectedRoom || undefined}
                                isDisabled={!selectedStudio || !selectedActivity}
                                options={roomOptions}
                                onChange={(selectedOption: any) => {
                                    setSelectedRoom(selectedOption);
                                    resetFromRoom();
                                }}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="date" isRequired>
                            <FormLabel>Día</FormLabel>
                            <Box
                                w="100%"
                                sx={{
                                    ".react-datepicker-wrapper": {
                                        width: "100%",
                                    },
                                    ".react-datepicker__input-container": {
                                        width: "100%",
                                    },
                                }}
                            >
                                <DatePicker
                                    selected={parseLocalDate(date)}
                                    onChange={(selectedDate: Date | null) => {
                                        const formatted = formatLocalDate(selectedDate);
                                        setDate(formatted);
                                        resetFromDate();
                                    }}
                                    includeDates={includeDateObjects}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText={
                                        !selectedRoom
                                            ? "Seleccionar sala primero"
                                            : availableDates.length === 0
                                            ? "Sin días disponibles"
                                            : "Seleccionar día"
                                    }
                                    disabled={!selectedRoom || availableDates.length === 0}
                                    customInput={<Input h="40px" w="100%" readOnly />}
                                />
                            </Box>

                            {selectedRoom && availableDates.length === 0 && !selectedSlotId && (
                                <Text color="error.fg" fontSize="sm" mt={2}>
                                    No hay días disponibles para la selección realizada
                                </Text>
                            )}
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="hours" isRequired>
                            <FormLabel>Horario</FormLabel>
                            <Select2
                                w="100%"
                                value={hours || undefined}
                                isDisabled={!date || !selectedRoom || !selectedActivity || !hasSlots}
                                placeholder={
                                    !selectedRoom
                                        ? "Seleccionar sala primero"
                                        : !date
                                        ? "Seleccionar día primero"
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
                                    setSelectedSlotId(String(selectedOption?.slotId || ""));
                                }}
                                options={hourOptions}
                            />

                            {date && !hasSlots && !selectedSlotId && (
                                <Text color="error.fg" fontSize="sm" mt={2}>
                                    No hay horarios disponibles para la selección realizada
                                </Text>
                            )}
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
                        onClick={() =>
                            tipo !== "Consultor"
                                ? handleSubmitAppointments(code)
                                : onOpenModalCode()
                        }
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

export default ModalAppointmentsEdit;
