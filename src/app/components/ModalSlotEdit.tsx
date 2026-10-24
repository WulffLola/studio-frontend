import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Select,
    SimpleGrid,
    Spinner,
    Stack,
    Wrap,
    WrapItem,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { LoadingOverlay } from "./ui/Loaders";

type DayOfWeek = {
    id: number;
    day: string;
};

type SlotTemplate = {
    id: number;
    days_of_week?: Array<DayOfWeek | string | number> | string;
    start_time?: string;
    end_time?: string;
    availability?: number | string;
    room?: number | string;
    activity_subtype?: number | string;
    is_active?: boolean | string | number;
};

type ModalSlotEditProps = {
    product: SlotTemplate;
    onClose: () => void;
    getSlots: () => void;
};

const week: DayOfWeek[] = [
    { id: 1, day: "Lunes" },
    { id: 2, day: "Martes" },
    { id: 3, day: "Miércoles" },
    { id: 4, day: "Jueves" },
    { id: 5, day: "Viernes" },
    { id: 6, day: "Sábado" },
    { id: 7, day: "Domingo" },
];

const dayIdByName = week.reduce<Record<string, string>>((result, day) => {
    const normalizedName = day.day
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    result[normalizedName] = String(day.id);
    return result;
}, {});

const getSelectedDays = (days: SlotTemplate["days_of_week"]): string[] => {
    const values = Array.isArray(days)
        ? days
        : String(days || "")
            .split(",")
            .map((day) => day.trim())
            .filter(Boolean);

    return values
        .map((day) => {
            if (typeof day === "object" && day !== null) {
                if (day.id) return String(day.id);
                return dayIdByName[String(day.day || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
            }

            const value = String(day);
            if (/^\d+$/.test(value)) return value;
            return dayIdByName[value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
        })
        .filter((day): day is string => Boolean(day));
};

const formatTime = (time?: string) => String(time || "").slice(0, 5);

const getRoomStudioId = (room: any) => {
    if (!room) return "";

    const studio = room.studio ?? room.studio_id;
    return String(typeof studio === "object" ? studio?.id ?? "" : studio ?? "");
};

const ModalSlotEdit = ({ product, onClose, getSlots }: ModalSlotEditProps) => {
    const [selectedDays, setSelectedDays] = useState<string[]>(() => getSelectedDays(product.days_of_week));
    const [roomId, setRoomId] = useState(String(product.room || ""));
    const [studioId, setStudioId] = useState("");
    const [startTime, setStartTime] = useState(formatTime(product.start_time));
    const [endTime, setEndTime] = useState(formatTime(product.end_time));
    const [availability, setAvailability] = useState(String(product.availability ?? ""));
    const [loading, setLoading] = useState(false);

    const { tokens } = useAuthStore();
    const { rooms, studios } = useSelector((state: any) => state.studio);
    const toast = useToast();

    const filteredRooms = useMemo(
        () => (rooms || []).filter((room: any) => getRoomStudioId(room) === studioId),
        [rooms, studioId]
    );

    useEffect(() => {
        setSelectedDays(getSelectedDays(product.days_of_week));
        setRoomId(String(product.room || ""));
        const currentRoom = rooms?.find(
            (room: any) => String(room.id) === String(product.room || "")
        );
        setStudioId(getRoomStudioId(currentRoom));
        setStartTime(formatTime(product.start_time));
        setEndTime(formatTime(product.end_time));
        setAvailability(String(product.availability ?? ""));
    }, [product, rooms]);

    const handleSubmit = async () => {
        if (!selectedDays.length || !studioId || !roomId || !startTime || !endTime || !availability) {
            toast({
                title: "Faltan completar campos.",
                description: "Completá los días, el estudio, la sala, los horarios y la disponibilidad.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setLoading(true);

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_SLOT_TEMPLATES}${product.id}/`,
                {
                    days_of_week: selectedDays.map(Number),
                    start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
                    end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
                    availability: Number(availability),
                    room: Number(roomId),
                    activity_subtype: product.activity_subtype,
                    is_active: product.is_active,
                },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Plantilla actualizada correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            getSlots();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo actualizar la plantilla de horario.",
                status: "error",
                duration: 3000,
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

            <Stack spacing={4} w="full" p={{ base: 5, md: 6 }}>
                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Editar plantilla horario
                </Heading>

                <SimpleGrid columns={1} spacing={4}>
                    <FormControl id="days" isRequired>
                        <FormLabel>Días de la semana</FormLabel>
                        <CheckboxGroup value={selectedDays} onChange={(values) => setSelectedDays(values as string[])}>
                            <Wrap spacing={4}>
                                {week.map((day) => (
                                    <WrapItem key={day.id}>
                                        <Checkbox value={String(day.id)}>{day.day}</Checkbox>
                                    </WrapItem>
                                ))}
                            </Wrap>
                        </CheckboxGroup>
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Estudio</FormLabel>
                            <Select
                                placeholder="Seleccionar..."
                                value={studioId}
                                onChange={(event) => {
                                    setStudioId(event.target.value);
                                    setRoomId("");
                                }}
                            >
                                {studios?.map((studio: any) => (
                                    <option key={studio.id} value={studio.id}>
                                        {studio.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Sala</FormLabel>
                            <Select
                                placeholder={studioId ? "Seleccionar..." : "Seleccioná un estudio primero"}
                                value={roomId}
                                onChange={(event) => setRoomId(event.target.value)}
                                isDisabled={!studioId}
                            >
                                {filteredRooms.map((room: any) => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Hora inicio</FormLabel>
                            <Input type="time" step="300" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Hora fin</FormLabel>
                            <Input type="time" step="300" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                        </FormControl>
                    </SimpleGrid>

                    <FormControl isRequired>
                        <FormLabel>Disponibilidad por turno</FormLabel>
                        <Input type="number" min={1} value={availability} onChange={(event) => setAvailability(event.target.value)} />
                    </FormControl>
                </SimpleGrid>

                <Stack spacing={4} direction={["column", "row"]} mt={8} justifyContent="center">
                    <Button onClick={onClose} w={["100%", "135px"]} aria-label="Cancelar" variant="secondary">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} w={["100%", "135px"]} variant="primary">
                        Guardar
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default ModalSlotEdit;
