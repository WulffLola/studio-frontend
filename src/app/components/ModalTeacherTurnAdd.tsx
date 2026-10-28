import {
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Avatar,
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
import DatePicker from "react-datepicker";
import { Select as Select2 } from "./ui/Select";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { useStudioStore } from "../stores/studio";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getTeachers,
    getStudios,
    getRooms,
    getSlots,
} from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

const ModalTeacherTurnAdd = ({ product, onClose, getTeachersTurn, openTable, grillRoom }: any) => {
    // const [idAppointmet, setIdAppointmet] = useState("")
    // const [isReceptionist, setIsReceptionist] = useState(product?.isReceptionist ? "true" : "false" || "false");
    const [isReceptionist, setIsReceptionist] = useState("");
    const [teacher, setTeacher] = useState("");
    const [date, setDate] = useState({ value: "", label: "" })
    const [hours, setHours] = useState({ value: "", label: "" })
    const [code, setCode] = useState("admin")
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [studio, setStudio] = useState<any>(null);
    const [room, setRoom] = useState<any>(null);
    const { selectedStudio, setSelectedStudio } = useStudioStore();

    const [day, setDay] = useState({ value: product?.day || "", label: product?.day || "" });
    const [hour, setHour] = useState({ value: product?.time || "", label: product?.time || "" });
    const [isLoading, setIsLoading] = useState(false);

    const { teachers, studios, rooms, slots } = useSelector((state: any) => state.studio);

    const dispatch = useAppDispatch();

    // const [hour, setHour] = useState({
    // value: product?.time ? `${product.time}:00` : "00:00:00", // Asegura que siempre tenga el formato 00:00:00
    // label: product?.time ? `${product.time}:00` : "00:00:00", // Asegura que el label tenga el mismo formato
    // });
    // const [day, setDay] = useState({ value: product?.day, label: product?.day })


    const [selectedSlotId, setSelectedSlotId] = useState(""); // Para almacenar el ID del slot

    const toast = useToast();


    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();


    const handleSubmitAppointments = async (code) => {
        setLoading(true)
        const formData = new FormData();

        // Agrega los parámetros obligatorios
        formData.append('teacher_id', teacher);
        formData.append('slot_id', selectedSlotId);
        formData.append('rol', isReceptionist);
        formData.append('code', code);
        formData.append('studio', studio?.value || "");
        formData.append('room', room?.value || "");

        // Validar si algún campo está vacío
        const isFormValid =
            teacher &&
            selectedSlotId &&
            code &&
            studio?.value &&
            room?.value;

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
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_TURN}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`, // Enviar el token como Bearer
                        'Content-Type': 'multipart/form-data', // Especifica que estás enviando FormData
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
            getTeachersTurn();
        } catch (error) {
            console.log("Ocurrió un error al registrar el turno de la profesora.", error);

            // Manejar el error específico de "Ya existe un profesor con el campo 'is_receptionist' como False en este slot."
            if (error.response?.data?.non_field_errors?.includes("Ya hay dos profesores asignados a este slot.")) {
                toast({
                    title: "Turno no disponible.",
                    description: "Ya existe un profesor en ese turno.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
            } else if (error.response?.data?.detail.includes("ya está asignada al slot con otro rol.")) {
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
        const selectedDate = openTable ? day.value : date.value;
        const selectedHour = openTable ? hour.value : hours.value;

        if (!selectedDate || !selectedHour) {
            setSelectedSlotId("");
            return;
        }

        const matchingSlot = slots.find(
            (item) =>
                item.date === selectedDate &&
                item.start_time.slice(0, 5) === selectedHour
        );

        if (matchingSlot) {
            setSelectedSlotId(matchingSlot.id);
        } else {
            setSelectedSlotId("");
        }
    }, [slots, day.value, date.value, hour.value, hours.value, openTable]);

    useEffect(() => {
        async function fetchData() {
            try {
                await Promise.all([
                    dispatch(getTeachers()),
                    dispatch(getSlots()),
                    dispatch(getStudios()),
                    dispatch(getRooms()),
                ]);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false); // Finaliza el estado de carga
            }
        }
        fetchData();
    }, []);


    const parseLocalDate = (dateString?: string | null) => {
        if (!dateString) return null;
        const [year, month, day] = dateString.split("-").map(Number);
        console.log("dateString:", dateString);
        return new Date(year, month - 1, day);
    };

    const formatDateToISO = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const availableDates = [...new Set(slots.map((slot) => slot.date))];
    const enabledDates = availableDates.map((date) => parseLocalDate(date));
    const selectedDateObject = date.value ? parseLocalDate(date.value) : null;

    return (
        <>
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
                                entityType={"teacherTurnAdd"}
                                action={handleSubmitAppointments}
                            />
                        </ModalContent>
                    </Modal>

                    <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                        Nuevo turno profesora
                    </Heading>

                    <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                        <Box>
                            <FormControl id="teacher" isRequired>
                                <FormLabel>Profesora</FormLabel>
                                {/* <Select
                            w="100%"
                            placeholder="Seleccionar"
                            onChange={(event) => setTeacher(event.target.value)}
                        >
                            {teachers
                                .filter((person) => person.deleted === null) 
                                .map((person) => (
                                    <option key={person.dni} value={person.id}>
                                        {person.name} {person.last_name} - {person.dni}
                                    </option>
                                ))
                            }

                        </Select> */}
                                <Select2
                                    w="100%"
                                    placeholder="Seleccionar"
                                    onChange={(selectedOption) => setTeacher(selectedOption.value)} // Accede al valor de la opción seleccionada
                                    options={teachers
                                        .filter((person) => person.deleted === null)  // Filtrar por deleted === null
                                        .map((person) => ({
                                            label: `${person.name} ${person.last_name} - ${person.dni}`,
                                            value: person.id
                                        }))
                                    }
                                />
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl id="role" >
                                <FormLabel>Rol</FormLabel>
                                <Input
                                    h="40px"
                                    w="100%"
                                    placeholder="Seleccionar"
                                    value={isReceptionist || ""}
                                    onChange={(e) => setIsReceptionist(e.target.value)}
/*                                     isDisabled={openTable}
 */                                />
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl id="studio" isRequired>
                                <FormLabel>Estudio</FormLabel>
                                <Select2
                                    placeholder="Seleccionar"
                                    h="40px"
                                    w="100%"
                                    value={openTable ? selectedStudio : studio}
                                    isDisabled={openTable}
                                    onChange={(selectedOption) => {
                                        setStudio(selectedOption || null);
                                        setRoom(null);
                                    }}
                                    options={studios
                                        .filter((item) => item.is_active)
                                        .map((item) => ({
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
                                    placeholder={!studio ? "Seleccioná un estudio primero" : "Seleccionar"}
                                    h="40px"
                                    w="100%"
                                    value={openTable ? grillRoom : room}
                                    isDisabled={openTable || !studio}
                                    onChange={(selectedOption) => {
                                        setRoom(selectedOption || null);
                                    }}
                                    options={rooms
                                        .filter((item) =>
                                            item.is_active &&
                                            item.studio === Number(studio?.value)
                                        )
                                        .map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        }))}
                                />
                            </FormControl>
                        </Box>

                        <Box>
                            <FormControl id="date" isRequired>
                                <FormLabel>Día</FormLabel>

                                <Box
                                    border="1px solid"
                                    borderColor="border.default"
                                    borderRadius="control"
                                    px={3}
                                    py={2}
                                    h="40px"
                                    display="flex"
                                    alignItems="center"
                                    bg={openTable ? "bg.muted" : "bg.surface"}
                                    _focusWithin={{ borderColor: "border.focus", boxShadow: "focusRing" }}
                                >
                                    <DatePicker
                                        selected={openTable ? null : selectedDateObject}
                                        onChange={(selectedDate: Date | null) => {
                                            if (!selectedDate) {
                                                setDate({ value: "", label: "" });
                                                setHours({ value: "", label: "" });
                                                setSelectedSlotId("");
                                                return;
                                            }

                                            const isoDate = formatDateToISO(selectedDate);
                                            const [year, month, day] = isoDate.split("-");

                                            setDate({
                                                value: isoDate,
                                                label: `${day}/${month}/${year}`,
                                            });

                                            setHours({ value: "", label: "" });
                                            setSelectedSlotId("");
                                        }}
                                        includeDates={enabledDates}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Seleccionar"
                                        disabled={openTable}
                                        customInput={<input style={{
                                            border: "none",
                                            outline: "none",
                                            width: "100%",
                                            background: "transparent"
                                        }} />}
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
                                    value={
                                        openTable
                                            ? hour
                                            : hours.value
                                                ? hours
                                                : null
                                    }
                                    placeholder="Seleccionar"
                                    isDisabled={openTable || !date.value}
                                    onChange={(selectedOption) => {
                                        const time = selectedOption?.value || "";
                                        const label = selectedOption?.label || "";
                                        setHours({ value: time, label });

                                        const matchingSlot = slots.find(
                                            (slot) =>
                                                (openTable
                                                    ? slot.date === day.value
                                                    : slot.date === date.value) &&
                                                slot.start_time.slice(0, 5) === time
                                        );

                                        if (matchingSlot) {
                                            setSelectedSlotId(matchingSlot.id);
                                        } else {
                                            setSelectedSlotId("");
                                        }
                                    }}
                                    options={[
                                        ...new Set(
                                            slots
                                                .filter((slot) =>
                                                    openTable
                                                        ? slot.date === day.value
                                                        : slot.date === date.value
                                                )
                                                .map((slot) => slot.start_time.slice(0, 5))
                                        ),
                                    ].map((time) => ({
                                        label: time,
                                        value: time,
                                    }))}
                                />
                            </FormControl>
                        </Box>

                        {/* <Box>
                            <FormControl id="studio" isRequired>
                                <FormLabel>Estudio</FormLabel>
                                <Select2
                                    placeholder="Seleccionar"
                                    h="40px"
                                    w="100%"
                                    value={openTable ? selectedStudio : studio}
                                    isDisabled={openTable}
                                    onChange={(selectedOption) => {
                                        setStudio(selectedOption || null);
                                        setRoom(null);
                                    }}
                                    options={studios
                                        .filter((item) => item.is_active)
                                        .map((item) => ({
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
                                    placeholder={!studio ? "Seleccioná un estudio primero" : "Seleccionar"}
                                    h="40px"
                                    w="100%"
                                    value={openTable ? grillRoom : room}
                                    isDisabled={openTable || !studio}
                                    onChange={(selectedOption) => {
                                        setRoom(selectedOption || null);
                                    }}
                                    options={rooms
                                        .filter((item) =>
                                            item.is_active &&
                                            item.studio === Number(studio?.value)
                                        )
                                        .map((item) => ({
                                            label: item.name,
                                            value: item.id,
                                        }))}
                                />
                            </FormControl>
                        </Box> */}

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
                            onClick={() => (tipo !== "Consultor" ? handleSubmitAppointments(code) : onOpenModalCode())}
                            w={["100%", "135px"]}
                            variant="primary"
                        >
                            Guardar
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </>
    );
}

export default ModalTeacherTurnAdd;