import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    List,
    ListItem,
    ListIcon,
    Flex,
    Heading,
    Text,
    Stack,
    Button,
    SimpleGrid,
    Box,
    FormControl,
    FormLabel,
    Input,
    useToast,
    Spinner,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { Select as Select2 } from "./ui/Select";
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { LoadingOverlay } from "./ui/Loaders";

const formatDateInSpanish = (dateString?: string) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("-").map(Number);
    if (!year || !month || !day) return dateString;

    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
};

const ModalWaitingListAdd = ({ onClose, product, getWaitingList, day, hour }) => {
    const [idStudent, setIdStudent] = useState("");
    const [student, setStudent] = useState("");
    const [date, setDate] = useState({
        value: day.date,
        label: formatDateInSpanish(day.date),
    });
    const [hours, setHours] = useState({ value: hour, label: hour }); // Inicializa con el valor de hour
    const [code, setCode] = useState("admin");
    const { tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);


    const [peoples, setPeoples] = useState([]);
    const [slots, setSlots] = useState([]);

    const [selectedSlotId, setSelectedSlotId] = useState(product); // Para almacenar el ID del slot

    const toast = useToast();

    // Obtener Peoples
    async function getPeoples() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setPeoples(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    // Obtener Slots
    async function getSlots() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setSlots(response.data);

            // Buscar el slot correspondiente basado en fecha y hora
            const matchingSlot = response.data.find(
                (slot) =>
                    slot.date === day.date &&
                    slot.start_time?.slice(0, 5) === hour?.slice(0, 5)
            );

            if (matchingSlot) {
                setSelectedSlotId(matchingSlot.id); // Actualizar el ID del slot seleccionado
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleSubmitWaitingList = async () => {
        setLoading(true)
        const formData = new FormData();

        formData.append('person_id', student);
        formData.append('slot_id', selectedSlotId);
        formData.append('code', code);

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
        try {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_WAITING_LIST}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        'Content-Type': 'multipart/form-data',
                    }
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
            getWaitingList();
        } catch (error) {
            console.error("Error fetching data:", error);

            // Si el error es una respuesta de Axios, intenta acceder al mensaje de error del backend
            const errorMessage = error.response?.data?.detail || "Ocurrió un error al registrar el turno en la lista de espera. Inténtalo de nuevo.";

            toast({
                title: "Error",
                description: errorMessage, // Mostrar el mensaje de error del backend
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });

            // setCashRegister(""); // Limpiar los datos si hubo un error
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        getPeoples();
        getSlots();
    }, []);


    return (
        <Box>
            {loading && (
                <LoadingOverlay />
            )}

            <Stack
                spacing={4}
                w={"full"}
                p={{ base: 5, md: 6 }}
            >
                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Nuevo turno en espera
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="student" isRequired>
                            <FormLabel>Alumno</FormLabel>
                            <Select2
                                w="100%"
                                placeholder="Seleccionar"
                                chakraStyles={{
                                    menu: (provided) => ({ ...provided, zIndex: 10 }),
                                    menuList: (provided) => ({ ...provided, maxH: "240px" }),
                                }}
                                onChange={(selectedOption) =>
                                    setStudent(selectedOption.value)
                                }
                                options={peoples
                                    .filter((person) => person.deleted === null)
                                    .map((person) => ({
                                        label: `${person.name} ${person.last_name} - ${person.dni}`,
                                        value: person.id,
                                    }))}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="date" isRequired>
                            <FormLabel>Día</FormLabel>
                            <Select2
                                h="40px"
                                w="100%"
                                value={day ? date : undefined}
                                isDisabled={Boolean(day)}
                                placeholder="Seleccionar"
                                onChange={(selectedOption) =>
                                    setDate({
                                        value: selectedOption.value,
                                        label: selectedOption.label,
                                    })
                                }
                                options={[...new Set(slots.map((slot) => slot.date))].map(
                                    (slotDate) => ({
                                        label: formatDateInSpanish(slotDate),
                                        value: slotDate,
                                    })
                                )}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="hours" isRequired>
                            <FormLabel>Horario</FormLabel>
                            <Select2
                                h="40px"
                                w="100%"
                                value={hour ? hours : undefined}
                                isDisabled={Boolean(hour) || !date.value}
                                placeholder="Seleccionar"
                                onChange={(selectedOption) => {
                                    const time = selectedOption.value;
                                    const label = selectedOption.label;
                                    setHours({ value: time, label: label });

                                    // Buscar el slot correspondiente
                                    const matchingSlot = slots.find(
                                        (slot) =>
                                            slot.date === date.value &&
                                            slot.start_time?.slice(0, 5) === time
                                    );

                                    if (matchingSlot) {
                                        setSelectedSlotId(matchingSlot.id);
                                    }
                                }}
                                options={[...new Set(
                                    slots
                                        .filter((slot) => slot.date === date.value)
                                        .map((slot) => slot.start_time?.slice(0, 5))
                                        .filter(Boolean)
                                )].map((time) => ({
                                    label: time,
                                    value: time,
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
                        onClick={handleSubmitWaitingList}
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

export default ModalWaitingListAdd;
