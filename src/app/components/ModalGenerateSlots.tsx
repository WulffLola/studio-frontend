import React, { useMemo, useState } from "react";
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
    useDisclosure,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
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
import { getSlots } from "../stores/studioSlice";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { LoadingOverlay } from "./ui/Loaders";

const getRoomStudioId = (room: any) => {
    if (!room) return "";

    const studio = room.studio ?? room.studio_id;
    return String(typeof studio === "object" ? studio?.id ?? "" : studio ?? "");
};

const ModalGenerateSlots = ({ onClose, isCancel }: { onClose: () => void; isCancel?: boolean }) => {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedDayUnique, setSelectedDayUnique] = useState("");

    const [roomId, setRoomId] = useState("");
    const [roomIdUnique, setRoomIdUnique] = useState("");
    const [studioId, setStudioId] = useState("");
    const [studioIdUnique, setStudioIdUnique] = useState("");

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

    const { rooms, studios } = useSelector((state: any) => state.studio);
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
    const cancelRef = React.useRef<HTMLButtonElement | null>(null);

const week = [
    { id: 1, day: "Lunes" },
    { id: 2, day: "Martes" },
    { id: 3, day: "Miércoles" },
    { id: 4, day: "Jueves" },
    { id: 5, day: "Viernes" },
    { id: 6, day: "Sábado" },
    { id: 7, day: "Domingo" },
];

    const {
        isOpen: isAlertDialogOpenExists,
        onOpen: onOpenAlertDialogExists,
        onClose: onCloseAlertDialogExists,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogOpenExistsUnique,
        onOpen: onOpenAlertDialogExistsUnique,
        onClose: onCloseAlertDialogExistsUnique,
    } = useDisclosure();

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

    const handleSubmitMultiple = async () => {
        setLoading(true);

        if (!selectedDays.length || !studioId || !roomId) {
            toast({
                title: "Faltan completar campos.",
                description: "Seleccioná días, estudio y sala.",
                status: "error",
                position: "bottom-right",
            });
            setLoading(false);
            return;
        }

        try {
            for (const day of selectedDays) {
                for (const schedule of multipleSchedules) {

                    const payload = {
                        week_day: Number(day),
                        start_time: formatTime(schedule.start_time),
                        end_time: formatTime(schedule.end_time),
                        availability: Number(schedule.availability),
                        room: Number(roomId),
                        /* activity_subtype: 4, // ⚠️ ajustar si cambia
                        status: 1, */
                    };

                    await axios.post(
                        `${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${tokens?.access}`,
                            },
                        }
                    );
                }
            }

            toast({
                title: "Horarios creados correctamente.",
                status: "success",
                position: "bottom-right",
            });

            onClose();
            dispatch(getSlots());

        } catch (error: any) {
            if (error.response?.data?.detail?.includes("slot")) {
                onOpenAlertDialogExists();
            } else {
                toast({
                    title: "Error",
                    description: "Error al crear horarios",
                    status: "error",
                    position: "bottom-right",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitUnique = async () => {
        setLoading(true);

        const { start_time, end_time, availability } = uniqueSchedule;

        if (!selectedDayUnique || !studioIdUnique || !roomIdUnique || !start_time || !end_time) {
            toast({
                title: "Faltan completar campos.",
                description: "Seleccioná día, estudio, sala y horarios.",
                status: "error",
                position: "bottom-right",
            });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                week_day: Number(selectedDayUnique),
                start_time: formatTime(start_time),
                end_time: formatTime(end_time),
                availability: Number(availability),
                room: Number(roomIdUnique),
                activity_subtype: 4,
                status: 1,
            };

            await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                    },
                }
            );

            toast({
                title: "Horario creado correctamente.",
                status: "success",
                position: "bottom-right",
            });

            onClose();
            dispatch(getSlots());

        } catch (error: any) {
            if (error.response?.data?.detail?.includes("slot")) {
                onOpenAlertDialogExistsUnique();
            } else {
                toast({
                    title: "Error",
                    description: "Error al crear horario",
                    status: "error",
                    position: "bottom-right",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (index: number) => {
        setIsUniqueSlot(index === 1);
    };

    return (
        <>
            <AlertDialog
                isOpen={isAlertDialogOpenExistsUnique}
                onClose={onCloseAlertDialogExistsUnique}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody fontStyle="Source Sans Pro">
                            Ya existe un horario en este día y hora.
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={onCloseAlertDialogExistsUnique}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Cerrar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <AlertDialog
                isOpen={isAlertDialogOpenExists}
                onClose={onCloseAlertDialogExists}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody fontStyle="Source Sans Pro">
                            Ya existen horarios en estos días y horas.
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={onCloseAlertDialogExists}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Cerrar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

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

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
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
                                                {studios?.map((studio: any) => (
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

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
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
                                                {studios?.map((studio: any) => (
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
