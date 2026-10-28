import {
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Avatar,
    AvatarBadge,
    IconButton,
    Center,
    Switch,
    Select,
    Box,
    Text,
    useToast,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
    SimpleGrid,
    Input,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Spinner,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { Select as Select2 } from "./ui/Select";
import { LoadingOverlay } from "./ui/Loaders";

const getSlotDateValue = (slot: any) =>
    slot?.date || slot?.week_day?.day || "";

const getSlotTimeValue = (slot: any) =>
    slot?.start_time || slot?.time_slot || "";

const ModalTeacherTurnEdit = ({ product, onClose, getTeachersTurn }: any) => {
    const [idTeacherTurn] = useState(product?.id ?? "")
    const [isReceptionist, setIsReceptionist] = useState(
        String(product?.rol ?? product?.isReceptionist ?? "")
    );
    const [teacher, setTeacher] = useState({
        id: product?.teacher?.id ?? product?.teacher_id ?? product?.id,
        name: product?.teacher?.name ?? product?.name,
        last_name: product?.teacher?.last_name ?? product?.last_name,
        dni: product?.teacher?.dni ?? product?.dni,
    })
    const [date, setDate] = useState(getSlotDateValue(product?.slot))
    const [code, setCode] = useState("admin")
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [studio, setStudio] = useState<any>(null)
    const [room, setRoom] = useState<any>(null)


    const [teachers, setTeachers] = useState([])
    const [slots, setSlots] = useState([])
    const [studios, setStudios] = useState([])
    const [rooms, setRooms] = useState([])
    const [selectedSlotId, setSelectedSlotId] = useState(product?.slot?.id); // Para almacenar el ID del slot

    const toast = useToast();


    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    // get Peoples for table
    async function getTeachers() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS}`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setTeachers(response.data)
        } catch (error) {
            console.log(error);
        }
    };

    // get Slots for table
    async function getSlots() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setSlots(response.data)
        } catch (error) {
            console.log(error);
        }
    };

    async function getStudios() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_STUDIOS}`, {
                headers: { Authorization: `Bearer ${tokens?.access}` },
            });
            setStudios(response.data);
        } catch (error) {
            console.log(error);
        }
    }

    async function getRooms() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_ROOMS}`, {
                headers: { Authorization: `Bearer ${tokens?.access}` },
            });
            setRooms(response.data);
        } catch (error) {
            console.log(error);
        }
    }


    const handleSubmitTeacherTurn = async (code) => {
        setLoading(true)
        const formData = new FormData();

        // Agrega los parámetros obligatorios
        formData.append('teacher_id', String(teacher?.id ?? ""));
        formData.append('slot_id', String(selectedSlotId ?? ""));
        formData.append('rol', isReceptionist);
        formData.append('code', code);
        formData.append('studio', String(studio?.value ?? ""));
        formData.append('room', String(room?.value ?? ""));

        console.log(teacher.id)
        console.log(selectedSlotId)
        console.log(isReceptionist)
        console.log(code)

        // Validar si algún campo está vacío
        let isFormValid = true;
        formData.forEach((value) => {
            if ((value === "") || value === "--:--") {
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
            setLoading(false)
            return;
        }
        // Envía el formulario con axios, incluyendo el token en los headers
        try {
            const { data } = await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_TURN}${idTeacherTurn}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`, // Enviar el token como Bearer
                        'Content-Type': 'multipart/form-data', // Especifica que estás enviando FormData
                    }
                }
            );

            toast({
                title: "Turno editado correctamente.",
                description: "El turno fue editado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();
            getTeachersTurn();
        } catch (error) {
            if (error.response?.data?.non_field_errors?.includes("Ya hay dos profesores asignados a este slot.")) {
                toast({
                    title: "Turno no disponible.",
                    description: "Ya existe un profesor en ese turno.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
            } else if (error.response?.data?.non_field_errors?.[0] === "Ya hay dos profesores asignados a este slot.") {
                toast({
                    title: "Error",
                    description: "Ya hay dos profesores asignados a este horario.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
            } else if (error.response?.data?.detail?.includes("ya está asignada al slot con otro rol.")) {
                toast({
                    title: "Error",
                    description: "La profesora ya está asignada el dia y horario seleccionado con otro rol.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                // Manejo genérico de otros errores
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar el turno de la profesora. Inténtalo de nuevo.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } finally {
            setLoading(false)
        }
    };


    useEffect(() => {
        getTeachers()
        getSlots()
        getStudios()
        getRooms()
    }, []);

    useEffect(() => {
        if (!rooms.length || !studios.length || room || studio) return;

        const currentRoomId = product?.slot?.room?.id ?? product?.slot?.room;
        const currentRoom = rooms.find(
            (item: any) => String(item.id) === String(currentRoomId)
        ) as any;
        if (!currentRoom) return;

        const currentStudioId =
            currentRoom?.studio?.id ?? currentRoom?.studio_id ?? currentRoom?.studio;
        const currentStudio = studios.find(
            (item: any) => String(item.id) === String(currentStudioId)
        ) as any;

        if (currentStudio) {
            setStudio({ label: currentStudio.name, value: currentStudio.id });
        }
        setRoom({
            label: currentRoom.name || currentRoom.room_name || `Sala ${currentRoom.id}`,
            value: currentRoom.id,
        });
    }, [rooms, studios, product, room, studio]);

    const availableSlotOptions = React.useMemo(() => {
        if (!date || !room?.value) return [];

        const currentSlotId = product?.slot?.id;

        return slots
            .filter((slot: any) => {
                const slotRoomId = slot?.room?.id ?? slot?.room;
                const hasAvailability =
                    slot?.available_slots == null || Number(slot.available_slots) > 0;
                const isCurrentSlot = String(slot.id) === String(currentSlotId);

                return (
                    getSlotDateValue(slot) === date &&
                    String(slotRoomId) === String(room.value) &&
                    slot?.deleted == null &&
                    (hasAvailability || isCurrentSlot)
                );
            })
            .sort((a: any, b: any) =>
                String(getSlotTimeValue(a)).localeCompare(String(getSlotTimeValue(b)))
            )
            .map((slot: any) => ({
                label: String(getSlotTimeValue(slot)).slice(0, 5),
                value: slot.id,
            }));
    }, [date, room, slots, product]);


    return (
        <Box>
            {loading && (
                <LoadingOverlay />
            )}

            <Stack
                spacing={4}
                w={"full"}
                // Responsive padding
                p={{ base: 5, md: 6 }}
            >
                <Modal
                    onClose={onCloseModalCode}
                    isOpen={isAlertCodeOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w={"100%"} h={"100%"} />
                    <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }} mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}>
                        <ModalCloseButton />
                        <ModalCode
                            onClose={onCloseModalCode}
                            get={getTeachersTurn}
                            onCloseAlert={onClose}
                            entityType={"teacherTurnEdit"}
                            action={handleSubmitTeacherTurn}
                        />
                    </ModalContent>
                </Modal>

                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Editar turno profesora
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="teacher" isRequired>
                            <FormLabel>Profesora</FormLabel>
                            <Select2
                                w="100%"
                                value={teacher ? {
                                    label: `${teacher.name} ${teacher.last_name} - ${teacher.dni}`, // Muestra el mismo formato que en las opciones
                                    value: teacher.id // Asegúrate de pasar el ID como 'value'
                                } : null}
                                placeholder="Seleccionar"
                                onChange={(selectedOption) => {
                                    if (!selectedOption) return;
                                    // Asegúrate de actualizar el estado con el objeto completo, no solo el id
                                    const selectedTeacher = teachers.find((teacher: any) => teacher.id === selectedOption.value);
                                    if (selectedTeacher) setTeacher(selectedTeacher);
                                }}
                                options={teachers
                                    .filter((person) => person.deleted === null)  // Filtrar por deleted === null
                                    .map((person) => {
                                        const option = {
                                            label: `${person.name} ${person.last_name} - ${person.dni}`,
                                            value: person.id
                                        };
                                        return option;
                                    })
                                }
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="date" isRequired>
                            <FormLabel>Dia</FormLabel>
                            <Input
                                type="date"
                                value={date}
                                onChange={(event) => {
                                    setDate(event.target.value);
                                    setSelectedSlotId("");
                                }}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="hours" isRequired>
                            <FormLabel>Horario</FormLabel>
                            <Select2
                                placeholder={
                                    !date || !room
                                        ? "Seleccioná fecha y sala primero"
                                        : "Seleccionar"
                                }
                                value={
                                    availableSlotOptions.find(
                                        (option: any) =>
                                            String(option.value) === String(selectedSlotId)
                                    ) || null
                                }
                                isDisabled={!date || !studio || !room}
                                options={availableSlotOptions}
                                onChange={(selectedOption: any) => {
                                    setSelectedSlotId(selectedOption?.value ?? "");
                                }}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="isReceptionist" isRequired>
                            <FormLabel>Rol</FormLabel>
                            <Input
                                value={isReceptionist}
                                onChange={(event) => setIsReceptionist(event.target.value)}
                                placeholder="Escribir rol..."
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="studio" isRequired>
                            <FormLabel>Estudio</FormLabel>
                            <Select2
                                placeholder="Seleccionar"
                                value={studio}
                                onChange={(selectedOption) => {
                                    setStudio(selectedOption || null);
                                    setRoom(null);
                                    setSelectedSlotId("");
                                }}
                                options={studios
                                    .filter((item: any) => {
                                        if (item?.is_active === false) return false;

                                        return rooms.some((roomItem: any) => {
                                            const roomStudioId =
                                                roomItem?.studio?.id ??
                                                roomItem?.studio_id ??
                                                roomItem?.studio;

                                            return (
                                                roomItem?.is_active !== false &&
                                                roomItem?.deleted == null &&
                                                String(roomStudioId) === String(item.id)
                                            );
                                        });
                                    })
                                    .map((item: any) => ({
                                        label: item.name,
                                        value: item.id,
                                    }))}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="room" isRequired>
                            <FormLabel>Sala</FormLabel>
                            <Select2
                                placeholder={studio ? "Seleccionar" : "Seleccioná un estudio primero"}
                                value={room}
                                isDisabled={!studio}
                                onChange={(selectedOption) => {
                                    setRoom(selectedOption || null);
                                    setSelectedSlotId("");
                                }}
                                options={rooms
                                    .filter((item: any) => {
                                        const studioId =
                                            item?.studio?.id ?? item?.studio_id ?? item?.studio;
                                        return (
                                            item?.is_active !== false &&
                                            String(studioId) === String(studio?.value)
                                        );
                                    })
                                    .map((item: any) => ({
                                        label: item.name || item.room_name || `Sala ${item.id}`,
                                        value: item.id,
                                    }))}
                            />
                        </FormControl>
                    </Box>

                </SimpleGrid>

                <Stack spacing={4} direction={["column", "row"]} mt={8} justifyContent={"center"}>
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => (tipo !== "Consultor" ? handleSubmitTeacherTurn(code) : onOpenModalCode())}
                        w={["100%", "135px"]}
                        variant="primary"
                    >
                        Guardar
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default ModalTeacherTurnEdit;
