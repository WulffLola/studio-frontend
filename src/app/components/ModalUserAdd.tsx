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
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Spinner,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getUsers,
    getUserType,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";

const ModalUserAdd = ({ product, onClose }: any) => {
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [dni, setDni] = useState("")
    const [tipoUser, setTipoUser] = useState("")
    // const [codeUser, setCodeUser] = useState("")
    const [loading, setLoading] = useState(false);

    const { userType, users } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const [code, setCode] = useState("admin")
    const { tipo, tokens } = useAuthStore();

    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();


    const handleSubmitUser = async () => {
        setLoading(true)
        const formData = new FormData();
        formData.append('password', password);
        formData.append('name', name);
        formData.append('last_name', lastName);
        formData.append('email', email);
        formData.append('dni', dni);
        formData.append('tipo_usuario', tipoUser);
        // formData.append('code', "");

        let isFormValid = true;
        formData.forEach((value) => {
            if (value === "") {
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
        // Validar duplicados
        const dniExists = users.some((user) => user.dni === dni);

        if (dniExists) {
            toast({
                title: "DNI ya registrado.",
                description: "El DNI ingresado ya está en uso. Por favor, ingrese un DNI diferente.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
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

        const emailExists = users.some((user) => user.email === email);

        if (emailExists) {
            toast({
                title: "Email ya registrado.",
                description: "El email ingresado ya está en uso. Por favor, ingrese un email diferente.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }


        // Validar password
        if (password.length < 8) {
            toast({
                title: "Contraseña inválida.",
                description: "La contraseña debe contener al menos 8 caracteres.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast({
                title: "Usuario creado correctamente.",
                description: "El Usuario fue creado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            dispatch(getUsers());

        } catch (error) {
            // Captura y maneja errores del servidor
            if (error.response && error.response.data) {
                const { data } = error.response;

                // Verifica si el error está relacionado con el DNI
                if (data.dni && Array.isArray(data.dni) && data.dni.includes("Este DNI ya está registrado.")) {
                    toast({
                        title: "DNI ya registrado.",
                        description: "El DNI ingresado ya está en uso. Por favor, ingrese un DNI diferente.",
                        status: "error",
                        position: "bottom-right",
                        duration: 5000,
                        isClosable: true,
                    });
                }
                // Verifica si el error está relacionado con el código
                else if (data.code && Array.isArray(data.code) && data.code.includes("user with this code already exists.")) {
                    toast({
                        title: "Código ya existe.",
                        description: "El código ingresado ya está en uso. Por favor, ingrese un código diferente.",
                        status: "error",
                        position: "bottom-right",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } else {
                // Maneja errores genéricos
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar el usuario. Inténtalo de nuevo.",
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
        dispatch(getUserType());
    }, []);


    const capitalizeFirstLetter = (text: string) => {
        return text.replace(/(^|\s)\w/g, match => match.toUpperCase());
    };

    const isAlumno = tipo === "Estudiante" || tipo === "Student";

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
                        get={getPeoples}
                        onCloseAlert={onClose}
                        entityType={"paymentsAdd"}
                        action={handleSubmitPayment}
                    />
                </ModalContent>
            </Modal> */}

                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Nuevo usuario
                </Heading>

                <form autoComplete="off">
                    <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                        <Box>
                            <FormControl id="name" isRequired>
                                <FormLabel>Nombre</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    placeholder="Escribir..."
                                    autoComplete="off"
                                    onChange={(event) => setName(capitalizeFirstLetter(event.target.value))}
                                >
                                </Input>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl id="lastName" isRequired>
                                <FormLabel>Apellido</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    placeholder="Escribir..."
                                    autoComplete="off"
                                    onChange={(event) => setLastName(capitalizeFirstLetter(event.target.value))}
                                >
                                </Input>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl id="dni" isRequired>
                                <FormLabel>Dni</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    maxLength={8}
                                    placeholder="Escribir..."
                                    autoComplete="off"
                                    onChange={(event) => setDni(event.target.value)}
                                >
                                </Input>
                            </FormControl>
                        </Box>
                        <Box>
                            <FormControl id="email" isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    placeholder="Escribir..."
                                    autoComplete="off"
                                    onChange={(event) => setEmail(event.target.value)}
                                >
                                </Input>
                            </FormControl>
                        </Box>

                        <Box>
                            <FormControl id="password" isRequired>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    w="100%"
                                    type="password"
                                    placeholder="Escribir..."
                                    min="0"
                                    h={"40px"}
                                    name="new-password"
                                    autoComplete="new-password"
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                            </FormControl>
                        </Box>

                        <Box>
                            <FormControl id="tipoUser" isRequired>
                                <FormLabel>Tipo</FormLabel>
                                <Select
                                    w="100%"
                                    placeholder="Seleccionar"
                                    autoComplete="off"
                                    value={isAlumno ? "Alumno" : tipoUser}
                                    onChange={(event) => setTipoUser(event.target.value)}
                                    isDisabled={isAlumno}
                                >
                                    {isAlumno ? (
                                        <option value="Alumno">Alumno</option>
                                    ) : (
                                        userType
                                            .filter((type) => {
                                                // 🟣 SUPER → ve todo
                                                if (tipo === "Super") return true;

                                                // 🔵 ADMIN → solo Student/Estudiante y Consultor
                                                if (tipo === "Administrador") {
                                                    return (
                                                        type.user_type_name === "Consultor" ||
                                                        type.user_type_name === "Estudiante" ||
                                                        type.user_type_name === "Student"
                                                    );
                                                }

                                                return true;
                                            })
                                            .map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.user_type_name === "Estudiante" ||
                                                        type.user_type_name === "Student"
                                                        ? "Alumno"
                                                        : type.user_type_name}
                                                </option>
                                            ))
                                    )}
                                </Select>
                            </FormControl>
                        </Box>
                        {/* <Box>
                    <FormControl id="code" isRequired>
                        <FormLabel>Código</FormLabel>
                        <Input
                            w="100%"
                            type="text"
                            placeholder="Seleccionar"
                            min="0"
                            maxLength={4}
                            h={"40px"}
                            onChange={(event) => setCodeUser(event.target.value)}
                        />
                    </FormControl>
                </Box> */}

                    </SimpleGrid>
                </form>

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
                        onClick={handleSubmitUser}
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

export default ModalUserAdd;