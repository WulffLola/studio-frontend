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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Text,
} from "@chakra-ui/react";
import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { getHolidays } from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

type Holiday = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    deleted?: string | null;
};

const ModalHolidayAdd = ({
    onClose,
    isCancel = false,
    onCreated,
}: {
    onClose: () => void;
    isCancel?: boolean;
    onCreated?: (holiday: Holiday) => void;
}) => {
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [tabIndex, setTabIndex] = useState(0);

    const { tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const dispatch = useAppDispatch();
    const toast = useToast();

    const formatDateEs = (dateString: string) => {
        if (!dateString) return "";

        const [year, month, day] = dateString.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, Number(day));

        return dateObj.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const createHoliday = async (
        holidayName: string,
        holidayStartDate: string,
        holidayEndDate: string
    ) => {
        const formData = new FormData();
        formData.append("name", holidayName.trim());
        formData.append("start_date", holidayStartDate);
        formData.append("end_date", holidayEndDate);

        const res = await axios.post<Holiday>(
            `${process.env.NEXT_PUBLIC_URL_BACKEND_HOLIDAYS}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                },
            }
        );

        return res.data;
    };

    const handleSubmitHoliday = async () => {
        const isSingleMode = tabIndex === 0;

        setLoading(true);

        if (!name.trim()) {
            toast({
                title: "Falta el nombre.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        if (isSingleMode && !date.trim()) {
            toast({
                title: "Falta la fecha.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        if (!isSingleMode && (!startDate.trim() || !endDate.trim())) {
            toast({
                title: "Faltan fechas.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        if (!isSingleMode && startDate > endDate) {
            toast({
                title: "Rango inválido.",
                description: "La fecha desde no puede ser mayor que la fecha hasta.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        try {
            if (isSingleMode) {
                const createdHoliday = await createHoliday(name, date, date);

                if (onCreated) onCreated(createdHoliday);

                toast({
                    title: "Feriado creado correctamente.",
                    description: "El feriado fue creado con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                const createdHoliday = await createHoliday(name, startDate, endDate);

                if (onCreated) onCreated(createdHoliday);

                toast({
                    title: "Feriado creado correctamente.",
                    description: "El rango de fechas fue creado con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }

            await dispatch(getHolidays()).unwrap();
            onClose();
        } catch (error: any) {
            console.error("Error en la solicitud:", error);

            if (
                error.response?.data?.name?.[0] ===
                "Ensure this field has no more than 120 characters."
            ) {
                toast({
                    title: "Nombre demasiado largo",
                    description: "El nombre debe contener un máximo de 120 caracteres.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (error.response?.data?.start_date?.length > 0) {
                toast({
                    title: "Fecha de inicio inválida",
                    description: error.response.data.start_date[0],
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (error.response?.data?.end_date?.length > 0) {
                toast({
                    title: "Fecha de fin inválida",
                    description: error.response.data.end_date[0],
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar el feriado.",
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
                w="full"
                p={{ base: 5, md: 6 }}
            >
                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Nuevo feriado
                </Heading>

                <Tabs index={tabIndex} onChange={setTabIndex} variant="unstyled">
                    <TabList mb={4}>
                        <Tab
                            borderTopRadius="md"
                        >
                            Única fecha
                        </Tab>

                        <Tab
                            borderTopRadius="md"
                        >
                            Rango de fechas
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0}>
                            <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
                                <Box display="flex" justifyContent="center" w="100%">
                                    <FormControl id="holiday-name-single" isRequired>
                                        <FormLabel>Nombre</FormLabel>
                                        <Input
                                            type="text"
                                            w="100%"
                                            placeholder="Ej: Día del Trabajador"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </FormControl>
                                </Box>

                                <Box display="flex" justifyContent="center" w="100%">
                                    <FormControl id="holiday-date" isRequired>
                                        <FormLabel>Fecha</FormLabel>
                                        <Input
                                            type="date"
                                            w="100%"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </FormControl>
                                </Box>
                            </SimpleGrid>
                        </TabPanel>

                        <TabPanel px={0}>
                            <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
                                <Box display="flex" justifyContent="center" w="100%">
                                    <FormControl id="holiday-name-range" isRequired>
                                        <FormLabel>Nombre</FormLabel>
                                        <Input
                                            type="text"
                                            w="100%"
                                            placeholder="Ej: Vacaciones de invierno"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </FormControl>
                                </Box>

                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <Box display="flex" justifyContent="center" w="100%">
                                        <FormControl id="holiday-start-date" isRequired>
                                            <FormLabel>Fecha desde</FormLabel>
                                            <Input
                                                type="date"
                                                w="100%"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </FormControl>
                                    </Box>

                                    <Box display="flex" justifyContent="center" w="100%">
                                        <FormControl id="holiday-end-date" isRequired>
                                            <FormLabel>Fecha hasta</FormLabel>
                                            <Input
                                                type="date"
                                                w="100%"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </FormControl>
                                    </Box>
                                </SimpleGrid>

                                {startDate && endDate && startDate <= endDate && (
                                    <Text fontSize="sm" color="text.muted">
                                        Se cargarán todas las fechas comprendidas entre{" "}
                                        {formatDateEs(startDate)} y {formatDateEs(endDate)}.
                                    </Text>
                                )}
                            </SimpleGrid>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

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
                        onClick={handleSubmitHoliday}
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

export default ModalHolidayAdd;
