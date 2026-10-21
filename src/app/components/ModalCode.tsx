import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, HStack, Modal, ModalCloseButton, ModalContent, ModalOverlay, Table, TableContainer, Tbody, Td, Th, Thead, useToast, Tooltip, Tr, useDisclosure, Badge, Stack, Heading, FormControl, FormLabel, Input } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../stores/auth";

const ModalCode = ({ onClose, get, onCloseAlert, action, entityType }: { onClose: () => void; get: () => void; onCloseAlert: () => void; action: (code: string) => void; entityType: () => string; }) => {

    const [code, setCode] = useState("admin")
    const [users, setUsers] = useState([])
    const { tipo, tokens } = useAuthStore();

    const toast = useToast();

    const handleSubmit = () => {
        onClose()
        onCloseAlert()
        action(code);
    };

    // Función para obtener los usuarios
    async function getUsers() {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setUsers(response.data);
        } catch (error) {
            console.log("Error al obtener usuarios:", error);
        }
    }


    useEffect(() => {
        if (tipo !== "Consultor") {
            getUsers();
        }
    }, [tipo]);



    const handleValidation = () => {
        // Validar si el código tiene al menos 4 dígitos y solo números
        if (!code || !/^\d{4,}$/.test(code)) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, ingresa un código válido (sin letras, sin espacios, y con al menos 4 números).",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        if (tipo !== "Consultor") {
            const userExists = users.some(user => user.code === code);

            if (!userExists) {
                toast({
                    title: "Código no encontrado.",
                    description: "El código ingresado no corresponde a ningún usuario.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
                return;
            }
        }

        // Si pasa la validación, se puede proceder con la siguiente acción
        handleSubmit();
    };

    return (
        <Stack
            spacing={4}
            w={"full"}
            // Responsive padding
            p={{ base: 5, md: 6 }}
        >
            <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                Código de aceptación
            </Heading>
            <Box>
                <FormControl id="amount" isRequired>
                    <Input
                        w="100%"
                        type="text"  // Usar tipo texto para evitar que Chrome lo reconozca como un campo de contraseña
                        placeholder="Escribir..."
                        min="0"
                        maxLength={4}
                        autoComplete="off"
                        h={"40px"}
                        onChange={(event) => setCode(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                handleValidation(); // Llama a la función de guardar
                            }
                        }}
                        style={{
                            WebkitTextSecurity: 'disc',  // Para hacer que el texto aparezca como puntos
                            MozTextSecurity: 'disc',  // Para Firefox
                            msTextSecurity: 'disc',  // Para Internet Explorer
                        }}
                    />
                </FormControl>
            </Box>

            <Stack spacing={4} direction={["column", "row"]} mt={5} justifyContent={"center"}>
                <Button
                    onClick={onClose}
                    w={["100%", "135px"]}
                    aria-label="Cancelar"
                    variant="secondary"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleValidation}
                    w={["100%", "135px"]}
                    variant="primary"
                >
                    Guardar
                </Button>
            </Stack>
        </Stack>
    )
};
export default ModalCode;
