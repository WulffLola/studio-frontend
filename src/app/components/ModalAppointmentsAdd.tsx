import {
    Button,
    Flex,
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
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
} from "@chakra-ui/react";
import { Select as Select2 } from "./ui/Select";
import DatePicker from "react-datepicker";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useStudioStore } from "../stores/studio";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
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
import { isSelectableStudio } from "../utils/studios";
import { isSlotCapacityError, isSlotFull } from "../utils/slots";
import ModalFixedSlotAdd from "./ModalFixedSlotAdd";

const ModalAppointmentsAdd = ({ product, onClose, hour, day, initialRoom }: any) => {
    const [student, setStudent] = useState("");
    const [date, setDate] = useState(day?.date || "");
    const [hours, setHours] = useState(
        hour ? { value: hour, label: hour } : null
    );
    const [code, setCode] = useState("admin");
    const { tipo, tokens } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState(product || "");
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [selectedStudio, setSelectedStudio] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [turnType, setTurnType] = useState(0);

    const selectedStudioFromStore = useStudioStore((state: any) => state.selectedStudio);
    const { appointments, peoples, slots, activitySubType, studios, rooms } =
        useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();
    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    const handleSubmitAppointments = async (code: string) => {
        setIsLoading(true);

        const formData = new FormData();
        formData.append("person_id", student);
        formData.append("slot_id", selectedSlotId);
        formData.append("code", code);

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

        const selectedSlot = slots.find((slot: any) => String(slot.id) === String(selectedSlotId));

        if (isSlotFull(selectedSlot)) {
            toast({
                title: "Cupo completo.",
                description: "Este horario alcanzó su capacidad máxima. Elegí otro horario.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setIsLoading(false);
            return;
        }

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast({
                title: "Turno registrado correctamente.",
                description: "El turno fue registrado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();
            await Promise.all([
                dispatch(getAppointments()),
                dispatch(getCalendar()),
                dispatch(getSlots()),
            ]);
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.detail || "Ocurrió un error al registrar el turno.";

            if (isSlotCapacityError(errorMessage)) {
                toast({
                    title: "Cupo completo.",
                    description: errorMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
                await Promise.all([
                    dispatch(getAppointments()),
                    dispatch(getCalendar()),
                    dispatch(getSlots()),
                ]);
            } else if (errorMessage === "La persona ya está registrada en ese turno.") {
                toast({
                    title: "Error",
                    description: errorMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (errorMessage === "El código proporcionado no corresponde a ningún usuario.") {
                toast({
                    title: "Error",
                    description: errorMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (errorMessage.includes("no tiene un plan asignado.")) {
                toast({
                    title: "Error",
                    description: errorMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (errorMessage.includes("ya tiene el máximo de turnos permitidos por su plan.")) {
                toast({
                    title: "Error",
                    description: errorMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar el turno.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

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


    const activityOptions = activitySubType
        ?.filter((item: any) => item.deleted === null)
        .map((item: any) => ({
            value: item.id,
            label: item.name,
        })) || [];

    const studioOptions = React.useMemo(
        () => studios
            ?.filter(isSelectableStudio)
            .map((studio: any) => ({
                value: studio.id,
                label: studio.name,
            })) || [],
        [studios]
    );

    const roomOptions = rooms
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

    useEffect(() => {
        if (!product || !slots?.length || !rooms?.length || !studios?.length || !activitySubType?.length) {
            return;
        }

        const initialSlot = slots.find(
            (slot: any) => String(slot.id) === String(product)
        );

        if (!initialSlot) return;

        const activityId =
            typeof initialSlot.activity_subtype === "object"
                ? initialSlot.activity_subtype?.id
                : initialSlot.activity_subtype;
        const roomId =
            typeof initialSlot.room === "object"
                ? initialSlot.room?.id
                : initialSlot.room;
        const matchingActivity = activitySubType.find(
            (activity: any) => String(activity.id) === String(activityId)
        );
        const matchingRoom = rooms.find(
            (room: any) => String(room.id) === String(roomId)
        );
        const studioId =
            typeof matchingRoom?.studio === "object"
                ? matchingRoom.studio?.id
                : matchingRoom?.studio;
        const matchingStudio = studios.find(
            (studio: any) => String(studio.id) === String(studioId)
        );
        const initialHour =
            initialSlot.start_time?.slice(0, 5) ||
            initialSlot.time_slot?.slice(0, 5) ||
            hour?.slice(0, 5) ||
            "";

        setSelectedActivity(
            matchingActivity
                ? { value: matchingActivity.id, label: matchingActivity.name }
                : null
        );
        setSelectedStudio(
            matchingStudio
                ? { value: matchingStudio.id, label: matchingStudio.name }
                : null
        );
        setSelectedRoom(
            matchingRoom
                ? { value: matchingRoom.id, label: matchingRoom.name }
                : null
        );
        setDate(initialSlot.date || day?.date || "");
        setHours(initialHour ? { value: initialHour, label: initialHour } : null);
        setSelectedSlotId(String(initialSlot.id));
    }, [product, slots, rooms, studios, activitySubType, hour, day?.date]);

    const availableDates = [
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
                        !isSlotFull(slot)
                    );
                })
                .map((slot: any) => slot.date)
        ),
    ];

    useEffect(() => {
        if (!studios?.length) return;
        if (selectedStudio) return;

        const studioIdFromStore =
            typeof selectedStudioFromStore === "object"
                ? selectedStudioFromStore?.id
                : selectedStudioFromStore;

        if (!studioIdFromStore) return;

        const matchingStudio = studios.find(
            (item: any) =>
                isSelectableStudio(item) &&
                String(item.id) === String(studioIdFromStore)
        );

        if (matchingStudio) {
            setSelectedStudio({
                value: matchingStudio.id,
                label: matchingStudio.name,
            });
        }
    }, [studios, selectedStudioFromStore, selectedStudio]);

    useEffect(() => {
        if (!initialRoom || !rooms?.length || selectedRoom) return;

        const initialRoomId = typeof initialRoom === "object" ? initialRoom.id : initialRoom;
        const matchingRoom = rooms.find(
            (room: any) =>
                room.is_active !== false &&
                String(room.id) === String(initialRoomId)
        );

        if (matchingRoom) {
            setSelectedRoom({ value: matchingRoom.id, label: matchingRoom.name });
        }
    }, [initialRoom, rooms, selectedRoom]);


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

    const availableSlotsByFilters = slots.filter((slot: any) => {
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
            !isSlotFull(slot)
        );
    });

    const availableSlotsByDate = slots.filter(
        (slot: any) =>
            slot.deleted === null &&
            slot.date === date
    );


    const hasSlots = availableSlotsByFilters.length > 0;
    const hasPreselectedSlot = Boolean(hours?.value && selectedSlotId);

    const hourOptions = [
        ...new Map(
            availableSlotsByFilters.map((slot: any) => [
                slot.start_time?.slice(0, 5),
                {
                    label: /* `${slot.start_time?.slice(0, 5)}${slot.end_time ? ` - ${slot.end_time.slice(0, 5)}` : ""
                        }` */slot.start_time?.slice(0, 5),
                    value: slot.start_time?.slice(0, 5),
                    slotId: slot.id,
                },
            ])
        ).values(),
    ];

    const dateOptions = availableDates.map((item: string) => ({
        value: item,
        label: item.split("-").reverse().join("/"),
    }));

    const includeDateObjects = availableDates
        .map((dateStr: string) => parseLocalDate(dateStr))
        .filter(Boolean);


    return (
        <>
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
                                entityType="appointmentsAdd"
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
                        Nuevo turno
                    </Heading>

                    <Tabs variant="enclosed" index={turnType} onChange={setTurnType}>
                        <TabList>
                            <Tab>Turno individual</Tab>
                            <Tab>Turno fijo</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel px={0} pt={5}>
                    <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                        <Box>
                            <FormControl id="student" isRequired>
                                <FormLabel>Alumno</FormLabel>
                            <Select2
                                w="100%"
                                menuPosition="fixed"
                                chakraStyles={{ menu: (provided) => ({ ...provided, zIndex: 1500 }) }}
                                placeholder="Seleccionar"
                                    onChange={(selectedOption: any) =>
                                        setStudent(String(selectedOption?.value || ""))
                                    }
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
                                menuPosition="fixed"
                                chakraStyles={{ menu: (provided) => ({ ...provided, zIndex: 1500 }) }}
                                placeholder="Seleccionar"
                                    value={selectedActivity || undefined}
                                    options={activityOptions}
                                    isDisabled={Boolean(product)}
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
                                menuPosition="fixed"
                                chakraStyles={{ menu: (provided) => ({ ...provided, zIndex: 1500 }) }}
                                placeholder={
                                        !selectedStudio
                                            ? "Seleccionar actividad primero"
                                            : !studioOptions.length
                                                ? "Sin estudios disponibles"
                                                : "Seleccionar"
                                    }
                                    value={selectedStudio || undefined}
                                    isDisabled={Boolean(product) || !selectedActivity}
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
                                menuPosition="fixed"
                                chakraStyles={{ menu: (provided) => ({ ...provided, zIndex: 1500 }) }}
                                placeholder={
                                        !selectedStudio
                                            ? "Seleccionar estudio primero"
                                            : !roomOptions.length
                                                ? "Sin salas disponibles"
                                                : "Seleccionar"
                                    }
                                    value={selectedRoom || undefined}
                                    isDisabled={Boolean(product) || !selectedStudio || !selectedActivity}
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
                                        includeDates={includeDateObjects as Date[]}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText={
                                            !selectedRoom
                                                ? "Seleccionar sala primero"
                                                : availableDates.length === 0
                                                    ? "Sin días disponibles"
                                                    : "Seleccionar día"
                                        }
                                        disabled={Boolean(product) || !selectedRoom || availableDates.length === 0 || Boolean(day)}
                                        customInput={<Input h="40px" w="100%" readOnly />}
                                    />
                                </Box>

                                {selectedRoom && availableDates.length === 0 && !hasPreselectedSlot && (
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
                                    menuPosition="fixed"
                                    chakraStyles={{ menu: (provided) => ({ ...provided, zIndex: 1500 }) }}
                                    value={hours || undefined}
                                    isDisabled={Boolean(product) || !date || !selectedRoom || !selectedActivity || !hasSlots}
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

                                {date && !hasSlots && !hasPreselectedSlot && (
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
                            </TabPanel>
                            <TabPanel px={0} pt={5}>
                                <ModalFixedSlotAdd
                                    embedded
                                    onClose={onClose}
                                    onCreated={() => undefined}
                                />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Stack>
            </Box>
        </>
    );
};

export default ModalAppointmentsAdd;
