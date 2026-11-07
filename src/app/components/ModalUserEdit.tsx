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
    Link,
    Spinner,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import ModalPassword from "./ModalPassword";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getUsers,
    getUserType,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";


const ModalUserEdit = ({ product, onClose }: any) => {
    const [idUser, setIdUser] = useState(product.id)
    const [password, setPassword] = useState("")
    // product.password
    const [name, setName] = useState(product.name)
    const [lastName, setLastName] = useState(product.last_name)
    const [email, setEmail] = useState(product.email)
    const [dni, setDni] = useState(product.dni)
    const [tipoUser, setTipoUser] = useState(product.tipo)
    const { tipo, tokens, id, edit } = useAuthStore();
    const [code, setCode] = useState(product?.code || "admin");
    const [codeUser, setCodeUser] = useState(product?.code || "")
    const [selectedUserTypeId, setSelectedUserTypeId] = useState();
    const [loading, setLoading] = useState(false);

    const { userType, users } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const toast = useToast();

    const {
        isOpen: isAlertPasswordOpen,
        onOpen: onOpenModalPassword,
        onClose: onCloseModalPassword,
    } = useDisclosure();

    const handleSubmitUser = async (password = null, fromModalPassword = false) => {
        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('last_name', lastName);
        formData.append('email', email);
        formData.append('dni', dni);
        formData.append('tipo_usuario', selectedUserTypeId);
        formData.append('code', codeUser);

        // Solo agregar el password si viene desde ModalPassword y no es nulo o vacío
        if (fromModalPassword && password && String(password).trim() !== "") {
            formData.append('password', String(password).trim());
        }


        // Validar si algún campo está vacío
        let isFormValid = true;
        formData.forEach((value) => {
            if (value === "") {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            // isAlertDialogOpen();
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

        if (/\d/.test(name) || name.length >= 30) {  // Comprobaciones combinadas
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

        if (/\d/.test(lastName) || lastName.length >= 30) {  // Comprobaciones combinadas
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


        if (isNaN(Number(codeUser)) || (codeUser.length < 4)) {
            toast({
                title: "Código inválido.",
                description: "El código debe contener 4 números.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}${idUser}/`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
                    'Content-Type': 'multipart/form-data', // Si estás usando FormData
                },
            });

            const selectedType = userType.find(
                (type) => Number(type.id) === Number(selectedUserTypeId)
            );

            if (Number(idUser) === Number(id)) {
                edit({
                    name: name,
                    last_name: lastName,
                    tipo: selectedType?.user_type_name ?? tipo,
                    email,
                    code: codeUser,
                });
            }

            toast({
                title: "Usuario editado correctamente.",
                description: "El usuario fue editado con éxito.",
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

    useEffect(() => {
        // Compara user_type_name con tipoUser y guarda el id
        const matchedType = userType.find(type => type.user_type_name === tipoUser);
        if (matchedType) {
            setSelectedUserTypeId(matchedType.id); // Almacena el id si hay coincidencia
        } else {
            setSelectedUserTypeId(null); // Si no hay coincidencia, restablece a null
        }
    }, [tipoUser, userType]);



    const capitalizeFirstLetter = (text: string) => {
        return text.replace(/(^|\s)\w/g, match => match.toUpperCase());
    };

    const isAlumno =
        tipoUser === "Estudiante" || tipoUser === "Student";


    const selectedType = userType?.find(
        (type: any) => String(type.id) === String(selectedUserTypeId)
    );

    const selectedUserTypeName = selectedType?.user_type_name || "";

    const isAlumnoSeleccionado =
        selectedUserTypeName === "Estudiante" ||
        selectedUserTypeName === "Student" ||
        selectedUserTypeName === "Alumno";

    const canSeeComponentPassword =
        tipo === "Super" ||
        (tipo === "Administrador" && !isAlumnoSeleccionado);

    const canSeeComponentCode =
        tipo === "Super" ||
        (tipo === "Administrador" && !isAlumnoSeleccionado);

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
                    onClose={onCloseModalPassword}
                    isOpen={isAlertPasswordOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w={"100%"} h={"100%"} />
                    <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }} mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}>
                        <ModalCloseButton />
                        <ModalPassword
                            onClose={onCloseModalPassword}
                            product={product}
                            // get={getPeoples}
                            // onCloseAlert={onClose}
                            // entityType={"paymentsAdd"}
                            action={(password) => handleSubmitUser(password, true)} />
                    </ModalContent>
                </Modal>

                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Editar usuario
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="name" isRequired>
                            <FormLabel>Nombre</FormLabel>
                            <Input
                                w="100%"
                                type="text"
                                value={name}
                                placeholder="Escribir..."
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
                                value={lastName}
                                placeholder="Escribir..."
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
                                value={dni}
                                isDisabled
                                maxLength={8}
                                placeholder="Escribir..."
                                onChange={(event) => setDni(event.target.value)}
                            >
                            </Input>
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl id="email" isRequired>
                            <FormLabel>Email</FormLabel>
                            <Input
                                isDisabled
                                w="100%"
                                type="text"
                                value={email}
                                placeholder="Escribir..."
                                onChange={(event) => setEmail(event.target.value)}
                            >
                            </Input>
                        </FormControl>
                    </Box>

                    {/* <Box>
                    <FormControl id="password" isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                            w="100%"
                            type="password"
                            placeholder="Seleccionar"
                            min="0"
                            value={password}
                            h={"40px"}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </FormControl>
                </Box> */}
                    <Box>
                        <FormControl id="tipoUser" isRequired>
                            <FormLabel>Tipo</FormLabel>
                            <Select
                                w="100%"
                                isDisabled={isAlumno || product.id === id} // 🔒 se deshabilita si es alumno
                                placeholder="Seleccionar"
                                value={selectedUserTypeId}
                                onChange={(event) => setSelectedUserTypeId(event.target.value)}
                            >
                                {userType
                                    .filter((type) => {
                                        // 🟣 SUPER → ve todo
                                        if (type === "Super") return true;

                                        // 🔵 ADMIN → todos menos Super
                                        if (type === "Administrador") {
                                            return type.user_type_name !== "Super";
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
                                    ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {canSeeComponentCode && (
                        <Box>
                            <FormControl id="code" isRequired>
                                <FormLabel>Código</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    value={codeUser}
                                    placeholder="Escribir..."
                                    min="0"
                                    maxLength={4}
                                    h={"40px"}
                                    onChange={(event) => setCodeUser(event.target.value)}
                                />
                            </FormControl>
                        </Box>
                    )}

                    {canSeeComponentPassword && (
                        <Link
                            href="#"
                            color="text.muted"
                            fontSize="sm"
                            mt="5px"
                            pl="5px"
                            textDecoration="underline"
                            _hover={{
                                color: "text.link",
                                textDecoration: "underline",
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                onOpenModalPassword();
                            }}
                        >
                            Cambiar contraseña
                        </Link>
                    )}
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
                        onClick={handleSubmitUser}
                        w={["100%", "135px"]}
                        variant="primary"
                    >
                        Guardar
                    </Button>
                </HStack>
            </Stack>
        </Box >
    );
};

export default ModalUserEdit;