import { useEffect, useMemo, useState } from "react";
import {
    Button,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select,
    Stack,
    Heading,
    SimpleGrid,
    Box,
    Wrap,
    WrapItem,
    useToast,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    RadioGroup,
    Radio,
    Spinner,
    CheckboxGroup,
    Checkbox,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { IconButton } from "@chakra-ui/react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { getActivitySubType, getSlots, getSlotTemplates } from "../stores/studioSlice";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { LoadingOverlay } from "./ui/Loaders";
import { isSelectableStudio } from "../utils/studios";

const getRoomStudioId = (room: any) => {
    if (!room) return "";

    const studio = room.studio ?? room.studio_id;
    return String(typeof studio === "object" ? studio?.id ?? "" : studio ?? "");
};

const slotTemplatesUrl =
    process.env.NEXT_PUBLIC_URL_BACKEND_SLOT_TEMPLATES ||
    `${process.env.NEXT_PUBLIC__URL_BACKEND}slot-templates/`;

const ModalGenerateSlots = ({ onClose, isCancel }: { onClose: () => void; isCancel?: boolean }) => {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedDayUnique, setSelectedDayUnique] = useState("");

    const [roomId, setRoomId] = useState("");
    const [roomIdUnique, setRoomIdUnique] = useState("");
    const [studioId, setStudioId] = useState("");
    const [studioIdUnique, setStudioIdUnique] = useState("");
    const [activitySubtypeId, setActivitySubtypeId] = useState("");

    const [multipleSchedules, setMultipleSchedules] = useState([
        { start_time: "", end_time: "", availability: "" },
    ]);

    const [uniqueSchedule, setUniqueSchedule] = useState({
        start_time: "",
        end_time: "",
        availability: "",
    });

    const [isUniqueSlot, setIsUniqueSlot] = useState(false);
    const { tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { rooms, studios, activitySubType } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const filteredRooms = useMemo(
        () => (rooms || []).filter((room: any) => getRoomStudioId(room) === studioId),
        [rooms, studioId]
    );

    const filteredRoomsUnique = useMemo(
        () => (rooms || []).filter((room: any) => getRoomStudioId(room) === studioIdUnique),
        [rooms, studioIdUnique]
    );

    const toast = useToast();
    const week = [
        { id: 1, day: "Lunes" },
        { id: 2, day: "Martes" },
        { id: 3, day: "Miércoles" },
        { id: 4, day: "Jueves" },
        { id: 5, day: "Viernes" },
        { id: 6, day: "Sábado" },
        { id: 7, day: "Domingo" },
    ];

    const availableActivitySubtypes = useMemo(
        () => (activitySubType || []).filter(
            (activity: any) => activity.is_active !== false && !activity.deleted
        ),
        [activitySubType]
    );

    const handleCheckboxChange = (value: string[]) => {
        setSelectedDays(value);
    };

    const handleCheckboxChangeUnique = (value: string) => {
        setSelectedDayUnique(value);
    };

    const handleChangeUniqueSchedule = (
        field: "start_time" | "end_time" | "availability",
        value: string
    ) => {
        setUniqueSchedule((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddMultipleSchedule = () => {
        setMultipleSchedules((prev) => [
            ...prev,
            { start_time: "", end_time: "", availability: "" },
        ]);
    };

    const handleRemoveMultipleSchedule = (index: number) => {
        setMultipleSchedules((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeMultipleSchedule = (
        index: number,
        field: "start_time" | "end_time" | "availability",
        value: string
    ) => {
        setMultipleSchedules((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const formatTime = (time: string) => {
        return time.length === 5 ? `${time}:00` : time;
    };

    useEffect(() => {
        dispatch(getActivitySubType());
    }, [dispatch]);

    const getErrorMessage = (error: any) => {
        const data = error?.response?.data;
        if (typeof data?.detail === "string") return data.detail;

        const firstError = data && Object.values(data).find(Boolean);
        if (Array.isArray(firstError)) return String(firstError[0]);
        if (typeof firstError === "string") return firstError;

        return "No se pudo crear y generar la plantilla de horario.";
    };

    const createTemplateAndGenerate = async (payload: any) => {
        const templateResponse = await axios.post(
            slotTemplatesUrl,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                    "Content-Type": "application/json",
                },
            }
        );

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_GENERATE_SLOTS}`,
                { template_id: templateResponse.data.id },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        } catch (error: any) {
            error.templateCreated = true;
            throw error;
        }

        return templateResponse.data;
    };

    const refreshTemplatesAndSlots = async () => {
        await Promise.all([
            dispatch(getSlotTemplates()),
            dispatch(getSlots()),
        ]);
    };

    const handleSubmitMultiple = async () => {
        setLoading(true);

        const invalidSchedule = multipleSchedules.some(
            (schedule) =>
                !schedule.start_time ||
                !schedule.end_time ||
                schedule.availability === "" ||
                Number(schedule.availability) < 0 ||
                schedule.end_time <= schedule.start_time
        );

        if (!selectedDays.length || !studioId || !roomId || !activitySubtypeId || invalidSchedule) {
            toast({
                title: "Faltan completar campos.",
                description: "Completá días, estudio, sala, actividad y todos los rangos horarios.",
                status: "error",
                position: "bottom-right",
            });
            setLoading(false);
            return;
        }

        let createdTemplates = 0;
        let generatedTemplates = 0;

        try {
            for (const schedule of multipleSchedules) {
                const payload = {
                    days_of_week_ids: selectedDays.map(Number),
                    start_time: formatTime(schedule.start_time),
                    end_time: formatTime(schedule.end_time),
                    availability: Number(schedule.availability),
                    room: Number(roomId),
                    activity_subtype: Number(activitySubtypeId),
                    is_active: true,
                };

                const templateResponse = await axios.post(
                    slotTemplatesUrl,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${tokens?.access}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                createdTemplates += 1;

                await axios.post(
                    `${process.env.NEXT_PUBLIC_URL_BACKEND_GENERATE_SLOTS}`,
                    { template_id: templateResponse.data.id },
                    {
                        headers: {
                            Authorization: `Bearer ${tokens?.access}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                generatedTemplates += 1;
            }

            toast({
                title: "Plantillas creadas correctamente.",
                description: `${createdTemplates} plantilla(s) creada(s) y sus horarios generados para los próximos tres meses.`,
                status: "success",
                position: "bottom-right",
            });

            await refreshTemplatesAndSlots();
            onClose();
        } catch (error: any) {
            await refreshTemplatesAndSlots();
            toast({
                title: createdTemplates ? "Creación incompleta" : "No se pudo crear la plantilla",
                description: `${getErrorMessage(error)} Creadas: ${createdTemplates}. Generadas: ${generatedTemplates}.`,
                status: "error",
                position: "bottom-right",
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitUnique = async () => {
        setLoading(true);

        const { start_time, end_time, availability } = uniqueSchedule;

        if (
            !selectedDayUnique ||
            !studioIdUnique ||
            !roomIdUnique ||
            !activitySubtypeId ||
            !start_time ||
            !end_time ||
            availability === "" ||
            Number(availability) < 0 ||
            end_time <= start_time
        ) {
            toast({
                title: "Faltan completar campos.",
                description: "Completá día, estudio, sala, actividad, horarios y disponibilidad.",
                status: "error",
                position: "bottom-right",
            });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                days_of_week_ids: [Number(selectedDayUnique)],
                start_time: formatTime(start_time),
                end_time: formatTime(end_time),
                availability: Number(availability),
                room: Number(roomIdUnique),
                activity_subtype: Number(activitySubtypeId),
                is_active: true,
            };

            await createTemplateAndGenerate(payload);

            toast({
                title: "Plantilla creada correctamente.",
                description: "Los horarios se generaron para los próximos tres meses.",
                status: "success",
                position: "bottom-right",
            });

            await refreshTemplatesAndSlots();
            onClose();
        } catch (error: any) {
            await refreshTemplatesAndSlots();
            toast({
                title: error.templateCreated
                    ? "Plantilla creada sin generar horarios"
                    : "No se pudo crear la plantilla",
                description: error.templateCreated
                    ? `${getErrorMessage(error)} La plantilla quedó guardada, pero sus horarios no se generaron.`
                    : getErrorMessage(error),
                status: "error",
                position: "bottom-right",
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (index: number) => {
        setIsUniqueSlot(index === 1);
    };

    return (
        <>
            <Box>
                {loading && (
                    <LoadingOverlay />
                )}

                <Stack spacing={4} w={"full"} p={{ base: 5, md: 6 }}>
                    <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                        Nueva plantilla horario
                    </Heading>

                    <Tabs variant="line" onChange={handleTabChange}>
                        <TabList>
                            <Tab
                                borderTopRadius="md"
                            >
                                Configuración Múltiple
                            </Tab>
                            <Tab
                                borderTopRadius="md"
                            >
                                Configuración Única
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel>
                                <SimpleGrid columns={1} spacing={4}>
                                    <Box>
                                        <FormControl id="days" isRequired>
                                            <FormLabel>Días de la semana</FormLabel>
                                            <CheckboxGroup value={selectedDays} onChange={handleCheckboxChange}>
                                                <Wrap spacing={4}>
                                                    {week?.map((day: any) => (
                                                        <WrapItem key={day.id}>
                                                            <Checkbox value={day.id.toString()}>{day.day}</Checkbox>
                                                        </WrapItem>
                                                    ))}
                                                </Wrap>
                                            </CheckboxGroup>
                                        </FormControl>
                                    </Box>

                                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <Box>
                                        <FormControl isRequired>
                                            <FormLabel>Estudio</FormLabel>
                                            <Select
                                                placeholder="Seleccionar..."
                                                value={studioId}
                                                onChange={(e) => {
                                                    setStudioId(e.target.value);
                                                    setRoomId("");
                                                }}
                                            >
                                                {studios?.filter(isSelectableStudio).map((studio: any) => (
                                                    <option key={studio.id} value={studio.id}>
                                                        {studio.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <FormControl isRequired>
                                            <FormLabel>Sala</FormLabel>
                                            <Select
                                                placeholder={studioId ? "Seleccionar..." : "Seleccioná un estudio primero"}
                                                value={roomId}
                                                onChange={(e) => setRoomId(e.target.value)}
                                                isDisabled={!studioId}
                                            >
                                                {filteredRooms.map((room: any) => (
                                                    <option key={room.id} value={room.id}>
                                                        {room.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <FormControl isRequired>
                                            <FormLabel>Actividad</FormLabel>
                                            <Select
                                                placeholder="Seleccionar..."
                                                value={activitySubtypeId}
                                                onChange={(e) => setActivitySubtypeId(e.target.value)}
                                            >
                                                {availableActivitySubtypes.map((activity: any) => (
                                                    <option key={activity.id} value={activity.id}>
                                                        {activity.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    </SimpleGrid>

                                    <Stack spacing={4}>
                                        {multipleSchedules.map((schedule, index) => (
                                            <Box
                                                key={index}
                                                border="1px solid"
                                                borderColor="border.subtle"
                                                borderRadius="md"
                                                p={4}
                                            >
                                                <HStack align="flex-end" spacing={3}>
                                                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} w="100%">
                                                        <FormControl isRequired>
                                                            <FormLabel>Hora inicio</FormLabel>
                                                            <Input
                                                                type="time"
                                                                step="300"
                                                                value={schedule.start_time}
                                                                onChange={(e) =>
                                                                    handleChangeMultipleSchedule(
                                                                        index,
                                                                        "start_time",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormControl isRequired>
                                                            <FormLabel>Hora fin</FormLabel>
                                                            <Input
                                                                type="time"
                                                                step="300"
                                                                value={schedule.end_time}
                                                                onChange={(e) =>
                                                                    handleChangeMultipleSchedule(
                                                                        index,
                                                                        "end_time",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormControl isRequired>
                                                            <FormLabel>Disponibilidad</FormLabel>
                                                            <Input
                                                                type="number"
                                                                placeholder="Ej: 7"
                                                                value={schedule.availability}
                                                                onChange={(e) =>
                                                                    handleChangeMultipleSchedule(
                                                                        index,
                                                                        "availability",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                        </FormControl>
                                                    </SimpleGrid>

                                                    {/* BOTONES + y - */}
                                                    <HStack pb={1}>
                                                        {index === multipleSchedules.length - 1 && (
                                                            <IconButton
                                                                aria-label="Agregar turno"
                                                                icon={<AddIcon />}
                                                                size="sm"
                                                                onClick={handleAddMultipleSchedule}
                                                                variant="secondary"
                                                            />
                                                        )}
                                                        {multipleSchedules.length > 1 && (
                                                            <IconButton
                                                                aria-label="Eliminar turno"
                                                                icon={<MinusIcon />}
                                                                size="sm"
                                                                onClick={() => handleRemoveMultipleSchedule(index)}
                                                                variant="ghostDanger"
                                                            />
                                                        )}
                                                    </HStack>
                                                </HStack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </SimpleGrid>
                            </TabPanel>

                            <TabPanel>
                                <SimpleGrid columns={1} spacing={4}>
                                    <Box>
                                        <FormControl id="days" isRequired>
                                            <FormLabel>Día de la semana</FormLabel>
                                            <RadioGroup value={selectedDayUnique} onChange={handleCheckboxChangeUnique}>
                                                <Wrap spacing={4}>
                                                    {week?.map((day: any) => (
                                                        <WrapItem key={day.id}>
                                                            <Radio value={day.id.toString()}>{day.day}</Radio>
                                                        </WrapItem>
                                                    ))}
                                                </Wrap>
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>

                                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <Box>
                                        <FormControl isRequired>
                                            <FormLabel>Estudio</FormLabel>
                                            <Select
                                                placeholder="Seleccionar..."
                                                value={studioIdUnique}
                                                onChange={(e) => {
                                                    setStudioIdUnique(e.target.value);
                                                    setRoomIdUnique("");
                                                }}
                                            >
                                                {studios?.filter(isSelectableStudio).map((studio: any) => (
                                                    <option key={studio.id} value={studio.id}>
                                                        {studio.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <FormControl isRequired>
                                            <FormLabel>Sala</FormLabel>
                                            <Select
                                                placeholder={studioIdUnique ? "Seleccionar..." : "Seleccioná un estudio primero"}
                                                value={roomIdUnique}
                                                onChange={(e) => setRoomIdUnique(e.target.value)}
                                                isDisabled={!studioIdUnique}
                                            >
                                                {filteredRoomsUnique.map((room: any) => (
                                                    <option key={room.id} value={room.id}>
                                                        {room.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <FormControl isRequired>
                                            <FormLabel>Actividad</FormLabel>
                                            <Select
                                                placeholder="Seleccionar..."
                                                value={activitySubtypeId}
                                                onChange={(e) => setActivitySubtypeId(e.target.value)}
                                            >
                                                {availableActivitySubtypes.map((activity: any) => (
                                                    <option key={activity.id} value={activity.id}>
                                                        {activity.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    </SimpleGrid>

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        <Box>
                                            <FormControl mt={4} isRequired>
                                                <FormLabel>Hora de inicio</FormLabel>
                                                <Input
                                                    type="time"
                                                    step="300"
                                                    value={uniqueSchedule.start_time}
                                                    onChange={(e) =>
                                                        handleChangeUniqueSchedule("start_time", e.target.value)
                                                    }
                                                />
                                            </FormControl>
                                        </Box>

                                        <Box>
                                            <FormControl mt={4} isRequired>
                                                <FormLabel>Hora de fin</FormLabel>
                                                <Input
                                                    type="time"
                                                    step="300"
                                                    value={uniqueSchedule.end_time}
                                                    onChange={(e) =>
                                                        handleChangeUniqueSchedule("end_time", e.target.value)
                                                    }
                                                />
                                            </FormControl>
                                        </Box>
                                    </SimpleGrid>

                                    <Box>
                                        <FormControl mt={4} isRequired>
                                            <FormLabel>Disponibilidad por turno</FormLabel>
                                            <Input
                                                type="number"
                                                placeholder="Ej: 7"
                                                value={uniqueSchedule.availability}
                                                onChange={(e) =>
                                                    handleChangeUniqueSchedule("availability", e.target.value)
                                                }
                                            />
                                        </FormControl>
                                    </Box>
                                </SimpleGrid>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>

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
                            onClick={isUniqueSlot ? handleSubmitUnique : handleSubmitMultiple}
                            w={["100%", "135px"]}
                            variant="primary"
                        >
                            Guardar
                        </Button>
                    </HStack>
                </Stack>
            </Box>
        </>
    );
};

export default ModalGenerateSlots;
