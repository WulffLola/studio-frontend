import {
    Button,
    Stack,
    SimpleGrid,
    FormControl,
    FormLabel,
    Input,
    Heading,
    useToast,
    Box,
    Spinner,
    HStack,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { LoadingOverlay } from "./ui/Loaders";

type Studio = {
    id: number;
    name: string;
    address?: string;
    is_active?: boolean;
    created_at?: string;
};

const ModalStudioEdit = ({ product, onClose, getStudios, isCancel }: any) => {
    const [idStudio, setIdStudio] = useState(product.id);
    const [name, setName] = useState(product.name);
    const [address, setAddress] = useState(product.address);
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const toast = useToast();
    const dispatch = useAppDispatch();

    // const handleValidate = () => {
    // if (!days || days.trim() === "") {
    // toast({
    // title: "Faltan completar campos.",
    // description: "Por favor complete el campo 'Días'.",
    // status: "error",
    // position: "bottom-right",
    // duration: 5000,
    // isClosable: true,
    // });
    // setLoading(false);
    // return false;
    // }

    // // Validar si el campo "days" contiene solo palabras
    // const wordsRegex = /^[a-zA-Z\s]+$/;
    // if (!wordsRegex.test(days)) {
    // toast({
    // title: "Error en el campo Días",
    // description: "Por favor ingrese solo letras.",
    // status: "error",
    // position: "bottom-right",
    // duration: 5000,
    // isClosable: true,
    // });
    // setLoading(false);
    // return false;
    // }

    // return true;
    // };


    const handleEditStudio = async () => {
        setLoading(true);

        if (!name.trim() || !address.trim()) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("address", address);

        try {
            const res = await axios.put<Studio>(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_STUDIOS}${idStudio}/`,
                formData,
                { headers: { Authorization: `Bearer ${tokens?.access}` } }
            );

            const updatedStudio = res.data;

            await dispatch(getStudios()).unwrap();

            toast({
                title: "Estudio editado correctamente.",
                description: "El estudio fue editado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();
        } catch (error: any) {
            console.error("Error en la solicitud:", error);

            if (error.response?.data?.name?.[0] === "Ensure this field has no more than 120 characters.") {
                toast({
                    title: "Nombre demasiado largo",
                    description: "El nombre debe contener un máximo de 120 caracteres.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al editar el estudio.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }
        } finally {
            setLoading(false);
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
                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Editar estudio
                </Heading>

                <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
                    <Box display="flex" justifyContent="center" w="100%">
                        <FormControl id="studio" isRequired>
                            <FormLabel>Nombre</FormLabel>
                            <Input
                                type="text"
                                w="100%" // Puedes ajustar el tamaño aquí si es necesario
                                value={name}
                                placeholder="Escribir..."
                                onChange={(event) => setName(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                    <Box display="flex" justifyContent="center" w="100%">
                        <FormControl id="description" isRequired>
                            <FormLabel>Dirección</FormLabel>
                            <Input
                                type="text"
                                w="100%" // Puedes ajustar el tamaño aquí si es necesario
                                value={address}
                                placeholder="Escribir..."
                                onChange={(event) => setAddress(event.target.value)}
                            />
                        </FormControl>
                    </Box>
                </SimpleGrid>

                <HStack
                    spacing={3}
                    justify="flex-end"
                    mt={6}
                >
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        isDisabled={isCancel}
                        // Deshabilitamos el botón
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleEditStudio}
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

export default ModalStudioEdit;
