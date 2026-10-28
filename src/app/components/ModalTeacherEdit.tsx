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
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getTeachers,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";

const ModalTeacherEdit = ({ product, onClose }: any) => {
    const [idTeachers, setIdTeachers] = useState(product.id)
    const [name, setName] = useState(product.name)
    const [lastName, setLastName] = useState(product.last_name)
    const [dni, setDni] = useState(product.dni)
    const [sex, setSex] = useState(product.sex)
    const [birthDate, setBirthDate] = useState(product.birth_date)
    const [phone, setPhone] = useState(product.phone)
    const [email, setEmail] = useState(product.email)
    const [hours, setHours] = useState("")
    const [lastPayment, setLastPayment] = useState("")
    const { tipo, tokens } = useAuthStore();
    const [dadoDeBaja, setDadoDeBaja] = useState("No")
    const [loading, setLoading] = useState(false);


    const [plans, setPlans] = useState([])

    const { teachers } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();


    const toast = useToast();

    async function getPlans() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN}`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setPlans(response.data)
        } catch (error) {
            console.log(error);
        }
    };



    const handleSubmitTeacher = async () => {
        setLoading(true)
        const formData = new FormData();

        formData.append('name', name);
        formData.append('last_name', lastName);
        formData.append('dni', dni);
        formData.append('sex', sex);
        formData.append('birth_date', birthDate);
        formData.append('phone', phone);
        formData.append('email', email);
        // formData.append('last_payment', lastPayment);
        formData.append('hours', hours);
        // formData.append('payment_day', "2024-03-23");

        let isFormValid = true;

        formData.forEach((value, key) => {
            if (key !== "last_payment" && key !== "hours" && value === "") {
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
                description: "El DNI ingresado ya existe.",
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
                description: "El número de teléfono debe contener entre 10 dígitos numéricos.",
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

        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS}${idTeachers}/`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            }
            )
            toast({
                title: "Profesora editado correctamente.",
                description: "La profesora fue editado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
          dispatch(getTeachers());
        } catch (error) {
            // console.error(error);
            // onOpenAlertDialogError();
            const errorMessage = error.response?.data?.error || "Ocurrió un error al editar la profesora.";

            if (errorMessage === "La persona con este DNI ya está registrada.") {
                toast({
                    title: "Error",
                    description: errorMessage, // Muestra el mensaje de código incorrecto
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al editar la profesora.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            };
        } finally {
            setLoading(false)
        }
    }

    const handleDateChange = (event) => {
        const date = event.target.value;

        // Verificar si la fecha está vacía
        if (!date) {
            setBirthDate(""); // O manejarlo como prefieras si no hay fecha
            return;
        }

        // Intentar crear un nuevo objeto Date y verificar si es válido
        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) { // Verificar si la fecha es inválida
            console.error("Fecha inválida: ", date);
            return; // Salir de la función si la fecha es inválida
        }

        // Si la fecha es válida, formatearla como yyyy-mm-dd
        const formattedDate = parsedDate.toISOString().split("T")[0];
        setBirthDate(formattedDate);
    };

    const handleDniChange = (event) => {
        const newDni = event.target.value;

        // Asegúrate de que `peoples` esté definido y sea un array
        const existingPerson = Array.isArray(teachers) && teachers.find(person => person.dni === newDni);

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


    const capitalizeFirstLetter = (text: string) => {
        return text.replace(/(^|\s)\w/g, match => match.toUpperCase());
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
                    Editar profesora
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="name" isRequired>
                            <FormLabel>Nombre</FormLabel>
                            <Input
                                w="100%"
                                type="text"
                                placeholder="Escribir..."
                                value={name}
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
                                placeholder="Escribir..."
                                value={lastName}
                                onChange={(event) => setLastName(capitalizeFirstLetter(event.target.value))}
                            />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="dni" isRequired>
                            <FormLabel>DNI</FormLabel>
                            <Input
                                type="number"
                                w="100%"
                                value={dni}
                                isDisabled
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
                                value={sex}
                                onChange={(event) => setSex(event.target.value)}
                            >
                                <option value='Femenino'>Femenino</option>
                                <option value='Masculino'>Masculino</option>
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
                                value={birthDate}
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
                                maxLength={10}
                                placeholder="Escribir..."
                                value={phone}
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
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                    {/* <Box>
                    <FormControl id="plan" isRequired>
                        <FormLabel>Plan</FormLabel>
                        <Select
                            h={"40px"}
                            w="100%"
                            placeholder="Seleccionar"
                            onChange={(event) => setPlan(event.target.value)}
                        >
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.days} 
                                </option>
                            ))}
                        </Select>

                    </FormControl>
                </Box> */}
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
                        onClick={handleSubmitTeacher}
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

export default ModalTeacherEdit;