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
import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSelector, useStore } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { getStudios } from "../stores/studioSlice";
import { useStudioStore } from "../stores/studio";
import { LoadingOverlay } from "./ui/Loaders";

type Studio = {
    id: number;
    name: string;
    address?: string;
    is_active?: boolean;
    created_at?: string;
};

const ModalStudioAdd = (
    { onClose, isCancel = false, onCreated }:
        { onClose: () => void; isCancel?: boolean; onCreated?: (studio: Studio) => void }
) => {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const { tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { studios } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();
    const toast = useToast();

    const setSelectedStudio = useStudioStore((s) => s.setSelectedStudio);

    const handleSubmitStudio = async () => {
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

        const isFirstStudio = !Array.isArray(studios) || studios.length === 0;

        try {
            const res = await axios.post<Studio>(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_STUDIOS}`,
                formData,
                { headers: { Authorization: `Bearer ${tokens?.access}` } }
            );

            const createdStudio = res.data;

            if (isFirstStudio && createdStudio) {
                // Primer estudio -> se selecciona automáticamente
                setSelectedStudio({
                    id: createdStudio.id,
                    name: createdStudio.name,
                    address: createdStudio.address,
                    is_active: createdStudio.is_active,
                    created_at: createdStudio.created_at,
                });
            }
            // opcional: si el padre pasó onCreated, lo llamamos
            if (onCreated) onCreated(createdStudio);

            await dispatch(getStudios()).unwrap();

            toast({
                title: "Estudio creado correctamente.",
                description: "El estudio fue creado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            // dispatch(getStudios());
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
                    description: "Ocurrió un error al registrar el estudio.",
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
                p={{ base: 5, md: 6 }}
            >
                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Nuevo estudio
                </Heading>

                <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
                    <Box display="flex" justifyContent="center" w="100%">
                        <FormControl id="studio" isRequired>
                            <FormLabel>Nombre</FormLabel>
                            <Input
                                type="text"
                                w="100%"
                                placeholder="Escribir..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </FormControl>
                    </Box>
                    <Box display="flex" justifyContent="center" w="100%">
                        <FormControl id="description" isRequired>
                            <FormLabel>Dirección</FormLabel>
                            <Input
                                type="text"
                                w="100%"
                                placeholder="Escribir..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </FormControl>
                    </Box>
                </SimpleGrid>

                <HStack spacing={3} justify="flex-end" mt={6}>
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        isDisabled={isCancel}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmitStudio}
                        w={["100%", "135px"]}
                        isLoading={loading}
                        loadingText="Guardando..."
                        variant="primary"
                    >
                        Guardar
                    </Button>
                </HStack>
            </Stack>
        </Box>
    );
};

export default ModalStudioAdd;
