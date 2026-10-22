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
    Spinner,
    Textarea,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getPeoples,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";

const ModalStudentAdd = ({ product, onClose }: any) => {
    const [name, setName] = useState("")
    const [lastName, setLastName] = useState("")
    const [dni, setDni] = useState("")
    const [sex, setSex] = useState("")
    const [birthDate, setBirthDate] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [observation, setObservation] = useState("")
    const [dadoDeBaja, setDadoDeBaja] = useState("No")
    const [loading, setLoading] = useState(false);

    const { peoples } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();


    const [plans, setPlans] = useState([])
    const { tipo, tokens } = useAuthStore();

    const toast = useToast();

    const handleSubmitStudent = async () => {
        setLoading(true)

        const formData = new FormData();

        formData.append('name', name);
        formData.append('last_name', lastName);
        formData.append('dni', dni);
        formData.append('sex', sex);
        formData.append('birth_date', birthDate);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('observation', observation);
        // formData.append('plan_id', plan);
        // formData.append('payment_day', "2024-03-23");

        let isFormValid = true;

        const optionalFields = ["observation", "email"];

        formData.forEach((value, key) => {
            if (!optionalFields.includes(key) && value === "") {
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

        // Validaciones adicionales de nombre, apellido, DNI, email, código
        if (/\d/.test(name) || name.length >= 30) {
            let errorMessage = "El nombre no puede contener números.";
            if (name.length >= 30) {
                errorMessage = "El nombre debe tener menos de 30 caracteres.";
            }

            toast({
                title: "Nombre inválido.",
                description: errorMessage,
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (!name.trim()) {
            toast({
                title: "Nombre no válido.",
                description: "El campo de nombre no puede estar vacío o contener solo espacios.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (/\d/.test(lastName) || lastName.length >= 30) {
            let errorMessage = "El apellido no puede contener números.";
            if (lastName.length >= 30) {
                errorMessage = "El apellido debe tener menos de 30 caracteres.";
            }

            toast({
                title: "Apellido inválido.",
                description: errorMessage,
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (!lastName.trim()) {
            toast({
                title: "Apellido no válido.",
                description: "El campo de apellido no puede estar vacío o contener solo espacios.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (dni === "No" && dadoDeBaja === "Si") {
            toast({
                title: "DNI ya registrado y dado de baja",
                description: "La persona con este DNI está registrada y dada de baja",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
            setLoading(false)
            return false;
        }

        if (dni === "No") {
            toast({
                title: "Error en el campo DNI",
                description: "La persona con este DNI ya está registrada.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return false;
        }

        if (isNaN(dni) || dni.toString().includes('.') || dni.toString().length < 7) {
            toast({
                title: "Error en el campo DNI",
                description: "El campo DNI solo puede contener números y debe tener al menos 7 dígitos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return false;
        }

        const dateOfBirth = new Date(birthDate);
        const minDate = new Date("1925-01-01");
        const maxDate = new Date(); // fecha actual

        if (dateOfBirth < minDate || dateOfBirth > maxDate) {
            toast({
                title: "Fecha de nacimiento no válida.",
                description: "La fecha de nacimiento debe estar entre el 01/01/1925 y la fecha actual.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            toast({
                title: "Número de teléfono no válido.",
                description: "El número de teléfono debe contener 10 dígitos numéricos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email || "")) {
            toast({
                title: "Error en el campo Email",
                description: "Por favor ingrese un email válido.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return false;
        }

        if (observation && observation.length > 250) {
            toast({
                title: "Observación inválida.",
                description: "La observación no puede tener más de 250 caracteres.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            }
            )
            toast({
                title: "Alumno creado correctamente.",
                description: "El alumno fue creado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            dispatch(getPeoples());
        } catch (error: any) {
            console.error(error);

            const backendErrors = error.response?.data;

            const errorMessage =
                backendErrors?.error ||
                backendErrors?.observation?.[0] ||
                "Ocurrió un error al registrar el alumno.";

            if (errorMessage.includes("La persona con este DNI ya está registrada")) {
                toast({
                    title: "Error",
                    description: "La persona con este DNI ya está registrada.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (errorMessage.includes("Ensure this field has no more than 250 characters")) {
                toast({
                    title: "Error en observación",
                    description: "La observación no puede tener más de 250 caracteres.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar el alumno.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }
        } finally {
            setLoading(false)
        }

    };

    const handleDateChange = (event) => {
        const date = event.target.value;

        // Verificar si la fecha está vacía o no es un formato válido
        if (!date) {
            setBirthDate(""); // O manejarlo como prefieras si no hay fecha
            return;
        }

        const parsedDate = new Date(date);

        // Comprobar si la fecha es válida
        if (isNaN(parsedDate)) {
            console.error("Fecha inválida"); // Para depurar si es necesario
            return;
        }

        const formattedDate = parsedDate.toISOString().split("T")[0]; // Formatear la fecha como yyyy-mm-dd
        setBirthDate(formattedDate);
    };

    const capitalizeFirstLetter = (text: string) => {
        return text.replace(/(^|\s)\w/g, match => match.toUpperCase());
    };



    // useEffect(() => {
    // getPlans()
    // }, []);

    const handleDniChange = (event) => {
        const newDni = event.target.value;

        // Asegúrate de que `peoples` esté definido y sea un array
        const existingPerson = Array.isArray(peoples) && peoples.find(person => person.dni === newDni);

        if (existingPerson) {
            // Verifica si el item está marcado como eliminado
            if (existingPerson.deleted !== null) {
                toast({
                    title: "DNI ya registrado y dado de baja",
                    description: "La persona con este DNI está registrada y dada de baja",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
                setDadoDeBaja("Si");
                setDni("No");
            } else {
                // Si no está eliminado, muestra el mensaje de DNI ya registrado
                toast({
                    title: "DNI ya registrado",
                    description: "La persona con este DNI ya está registrada.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
                setDni("No");
            }
            // setDni("No"); // Resetea el DNI o puedes ajustarlo según lo necesites
        } else {
            // Si no existe el DNI, actualiza el estado con el nuevo DNI
            setDni(newDni);
        }
    };


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
                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Nuevo alumno
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="name" isRequired>
                            <FormLabel>Nombre</FormLabel>
                            <Input
                                w="100%"
                                type="text"
                                maxLength={30}
                                placeholder="Escribir..."
                                onChange={(event) => setName(capitalizeFirstLetter(event.target.value))}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="last-name" isRequired>
                            <FormLabel>Apellido</FormLabel>
                            <Input
                                type="text"
                                w="100%"
                                maxLength={30}
                                placeholder="Escribir..."
                                onChange={(event) => setLastName(capitalizeFirstLetter(event.target.value))}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="dni" isRequired>
                            <FormLabel>DNI</FormLabel>
                            <Input
                                type="text"
                                w="100%"
                                maxLength={8}
                                placeholder="Escribir..."
                                onChange={handleDniChange}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="sex" isRequired>
                            <FormLabel>Género</FormLabel>
                            <Select
                                w="100%"
                                placeholder="Seleccionar"
                                onChange={(event) => setSex(event.target.value)}
                            >
                                <option value='Femenino'>Femenino</option>
                                <option value='Masculino'>Masculino</option>
                                <option value='Otro'>Otro</option>
                                <option value='Prefiero no decir'>Prefiero no decir</option>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="birth_date" isRequired>
                            <FormLabel>Fecha de nacimiento</FormLabel>
                            <Input
                                w="100%"
                                h={"40px"}
                                type="date"
                                // icon={<FaRegClock />}
                                // placeholder="Seleccionar"
                                onChange={handleDateChange}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="phone" isRequired>
                            <FormLabel>Teléfono</FormLabel>
                            <Input
                                type="text"
                                w="100%"
                                h={"40px"}
                                maxLength={10}  // Limita la cantidad de caracteres a 10
                                placeholder="Escribir..."
                                onChange={(event) => setPhone(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="email" isRequired>
                            <FormLabel>Email</FormLabel>
                            <Input
                                type="text"
                                w="100%"
                                placeholder="Escribir..."
                                // options={choferesOptions}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="observation" >
                            <FormLabel>Observación</FormLabel>
                            <Textarea
                                h={"40px"}
                                w="100%"
                                placeholder="Seleccionar"
                                onChange={(event) => setObservation(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                </SimpleGrid>

                <HStack spacing={3} justify="flex-end" mt={6}>
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleSubmitStudent}
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

export default ModalStudentAdd;
