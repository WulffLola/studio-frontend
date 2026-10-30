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
    RadioGroup,
    Radio,
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
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getExtraHours,
    getTeachers,
    getSlots,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";

const ModalExtraHoursEdit = ({ product, onClose }: any) => {
    const [idExtraHours, setIdExtraHours] = useState(product.id)
    const [date, setDate] = useState(product.date)
    const [teacher, setTeacher] = useState(product.teacher.id)
    const [dateSlot, setDateSlot] = useState(product.slot.week_day.day)
    const [hours, setHours] = useState(product.slot.time_slot)
    const [code, setCode] = useState("admin")
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { extraHours, teachers, slots } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const [selectedSlotId, setSelectedSlotId] = useState(""); // Para almacenar el ID del slot

    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();


    const handleSubmitExtraHours = async (code) => {
        setLoading(true)

        const formData = new FormData();

        // Agrega los parámetros obligatorios
        formData.append('teacher_id', teacher);
        formData.append('slot_id', selectedSlotId);
        formData.append('date', date);
        formData.append('code', code);

        // Función para obtener el día de la semana en español
        const getDayOfWeek = (dateString) => {
            const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
            const date = new Date(dateString);
            return daysOfWeek[date.getDay()];
        };


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

        // Verifica que el día de la semana de 'date' coincida con 'dateslot'
      /*   const selectedDate = formData.get("date");
        const dayOfWeek = getDayOfWeek(selectedDate);

        if (dayOfWeek !== dateSlot) {
            isFormValid = false;
            toast({
                title: "Día de la semana incorrecto.",
                description: "La fecha seleccionada no coincide con el día de la semana.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        } */

        const isDuplicate = extraHours.some(extraHour =>
            extraHour.slot.id === selectedSlotId &&
            extraHour.teacher.id === Number(teacher) && // Convertir teacher a número para la comparación
            extraHour.date === date
        );

        if (isDuplicate) {
            toast({
                title: "Hora extra duplicada.",
                description: "Ya existe una hora extra para esta persona en la misma fecha.",
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
                `${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}${idExtraHours}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`, // Enviar el token como Bearer
                        'Content-Type': 'multipart/form-data', // Especifica que estás enviando FormData
                    }
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
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al editar la hora extra.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        dispatch(getTeachers())
        dispatch(getSlots())
    }, []);

    /* const handleDateChange = (event) => {
        const newDate = event.target.value;

        const getDayOfWeek = (dateString) => {
            const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
            const date = new Date(dateString);
            return daysOfWeek[date.getDay()];
        };

        const dayOfWeek = getDayOfWeek(newDate);

        if (dayOfWeek !== dateSlot) {
            toast({
                title: "Día de la semana incorrecto.",
                description: "La fecha seleccionada no coincide con el día de la semana.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setDate("No");
        } else {
            setDate(newDate);
        }
    };

    */

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
                {/* <Modal
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
                        get={getExtraHours}
                        onCloseAlert={onClose}
                        entityType={"extraHoursAdd"}
                        action={handleSubmitExtraHours}
                    />
                </ModalContent>
            </Modal> */}

                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Editar hora extra
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="teacher" isRequired>
                            <FormLabel>Profesora</FormLabel>
                            <Select
                                w="100%"
                                placeholder="Seleccionar"
                                value={teacher}
                                onChange={(event) => setTeacher(event.target.value)}
                            >
                                {teachers
                                    .filter((person) => person.deleted === null)  // Filtrar por deleted === null
                                    .map((person) => (
                                        <option key={person.dni} value={person.id}>
                                            {person.name} {person.last_name} - {person.dni}
                                            {/* Puedes mostrar más detalles si lo deseas */}
                                        </option>
                                    ))
                                }

                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="dateSlot" isRequired>
                            <FormLabel>Dia</FormLabel>
                            <Select
                                h={"40px"}
                                w="100%"
                                value={dateSlot}
                                placeholder="Seleccionar"
                                onChange={(event) => {
                                    setDateSlot(event.target.value);
                                    setHours("");
                                    setDate("");
                                }}
                            >
                                {[...new Set(slots.map((slot) => slot.week_day.day))].map((day) => (
                                    <option key={day} value={day}>
                                        {day}
                                    </option>
                                ))}

                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="hours" isRequired>
                            <FormLabel>Horario</FormLabel>
                            <Select
                                h={"40px"}
                                w="100%"
                                value={hours.slice(0, 5)}
                                placeholder="Seleccionar"
                                onChange={(e) => {
                                    const time = e.target.value;
                                    setHours(time);

                                    // Buscar el slot correspondiente que coincida con el día y el horario
                                    const matchingSlot = slots.find(
                                        (slot) =>
                                            slot.week_day.day === dateSlot &&
                                            slot.time_slot.slice(0, 5) === time
                                    );

                                    if (matchingSlot) {
                                        setSelectedSlotId(matchingSlot.id);  // Actualizar el ID del slot seleccionado
                                    }
                                }}
                                isDisabled={!dateSlot} // Deshabilita el Select si date no está seleccionado
                            >
                                {[...new Set(
                                    slots
                                        .filter((slot) => slot.week_day.day === dateSlot)
                                        .map((slot) => slot.time_slot.slice(0, 5))
                                )].map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}

                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="day" isRequired>
                            <FormLabel>Fecha</FormLabel>
                            <Input
                                h={"40px"}
                                w="100%"
                                value={date}
                                placeholder="Seleccionar"
                                type="date"
                                onChange={(event) => setDate(event.target.value)}
                            >
                            </Input>
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
                        onClick={handleSubmitExtraHours}
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

export default ModalExtraHoursEdit;
