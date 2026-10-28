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
    Select,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getActivitySubType,
    getActivityType,
} from "../stores/studioSlice";

const ModalActivitySubTypeEdit = ({ onClose, product }: any) => {
    const [activityType, setActivityType] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const { tokens } = useAuthStore();
    const toast = useToast();
    const dispatch = useAppDispatch();

    const { activityType: activityTypes } = useSelector(
        (state: any) => state.studio
    );

    useEffect(() => {
        dispatch(getActivityType());
    }, [dispatch]);

    useEffect(() => {
        if (product) {
            setActivityType(
                product?.activity_type?.id
                    ? String(product.activity_type.id)
                    : product?.activity_type
                        ? String(product.activity_type)
                        : ""
            );
            setName(product?.name || "");
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activityType || !name.trim()) {
            toast({
                title: "Campos incompletos",
                description: "Completá el nombre y tipo de actividad.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (!product?.id) {
            toast({
                title: "Error",
                description: "No se encontró el registro a editar.",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setLoading(true);

        try {
            const payload: any = {
                activity_type: Number(activityType),
                name: name.trim(),
            };

            await axios.patch(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIVITY_SUB_TYPE}${product.id}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Actividad editada.",
                description: "La actividad se actualizó correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            dispatch(getActivitySubType());
            onClose();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description:
                    error?.response?.data?.detail ||
                    "Ocurrió un error al editar la actividad.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={{ base: 5, md: 6 }}>
            <Stack spacing={4} as="form" onSubmit={handleSubmit}>
                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Editar actividad
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isRequired>
                        <FormLabel>Nombre</FormLabel>
                        <Input
                            placeholder="Escribir..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>Tipo de actividad</FormLabel>
                        <Select
                            placeholder="Seleccionar"
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                        >
                            {activityTypes?.map((item: any) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </Select>
                    </FormControl>

                </SimpleGrid>

                <Stack
                    direction={{ base: "column", sm: "row" }}
                    spacing={4}
                    pt={4}
                    justify="center"
                >
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        w={["100%", "135px"]}
                        isDisabled={loading}
                        variant="primary"
                    >
                        {loading ? <Spinner size="sm" /> : "Guardar"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default ModalActivitySubTypeEdit;
