"use client";

import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Box,
    Input,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Spinner,
    Text,
    useToast,
    useDisclosure,
    SimpleGrid,
} from "@chakra-ui/react";
import { Select as Select2 } from "./ui/Select";
import React, { useEffect, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { useStudioStore } from "../stores/studio";
import { formatAmount, formatCurrency } from "../utils/amount";
import {
    getTeachers,
    getTeacherHours,
    getExpenseType,
    getExpenses,
    getExpensesTodayTeachers,
    getStudios,
} from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

const ModalExpenseEdit = ({ product, onClose }: any) => {
    const { tipo, tokens } = useAuthStore();
    const selectedStudioFromStore = useStudioStore((state: any) => state.selectedStudio);

    const dispatch = useAppDispatch();
    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    const { teachers, teacherHours, expenseType, studios } = useSelector((state: any) => state.studio);

    const [observation, setObservation] = useState(product?.observation || "");
    const [teacher, setTeacher] = useState({
        id: product?.teacher?.id || product?.teacher || "",
        name: product?.teacher
            ? `${product?.teacher?.name || ""} ${product?.teacher?.last_name || ""}`.trim()
            : "",
    });
    const [amount, setAmount] = useState(
        product?.amount ? formatAmount(product.amount, "").replace(",", ".") : ""
    );
    const [method, setMethod] = useState(product?.method || "");
    const [type, setType] = useState({
        id: product?.type?.id || "",
        name: product?.type?.name || "",
    });
    const [studio, setStudio] = useState({ id: "", name: "" });
    const [leftHours, setLeftHours] = useState<any>(null);
    const [code] = useState("admin");
    const [idExpense] = useState(product?.id);
    const [loading, setLoading] = useState(false);

    const paymentMethods = [
        { label: "Efectivo", value: "Efectivo" },
        { label: "Transferencia", value: "Transferencia" },
    ];

    const isSalaryType = type.name?.includes("Sueldo");

    const handleSelectChange = (selectedOption: any) => {
        if (selectedOption) {
            setType({ id: selectedOption.id, name: selectedOption.name });
        } else {
            setType({ id: "", name: "" });
        }
    };

    const handleTeacherChange = (selectedOption: any) => {
        const teacherId = selectedOption?.value || "";

        if (selectedOption) {
            setTeacher({
                id: selectedOption.value,
                name: selectedOption.label,
            });
        } else {
            setTeacher({ id: "", name: "" });
        }

        const teacherRecord = teacherHours.find(
            (record: any) => String(record.teacher?.id) === String(teacherId)
        );

        if (teacherRecord) {
            setLeftHours(teacherRecord.left);
        } else {
            setLeftHours(null);
        }
    };

    const handleValidation = () => {
        if (!type?.id) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, seleccioná un tipo.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        if (!method) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, seleccioná un método de pago.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        if (!studio?.id) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, seleccioná un estudio.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        if (isSalaryType && !teacher?.id) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, seleccioná una profesora.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        if (!isSalaryType && (!observation || !observation.trim())) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, ingresá una observación.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        const amountPattern = /^\d+$/;

        if (!amount || !amountPattern.test(amount)) {
            toast({
                title: "Formato de monto inválido.",
                description: "Por favor, ingresá un monto válido (número entero).",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        if (Number(amount) < 0 || Number(amount) > 1000000000) {
            toast({
                title: "Error en el campo 'amount'.",
                description: "El monto no puede ser menor a cero o mayor a 1.000.000.000",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return false;
        }

        return true;
    };

    const handleSubmitExpense = async (codeValue: string) => {
        if (!handleValidation()) return;

        setLoading(true);

        const formData = new FormData();
        formData.append("type_id", String(type.id));
        formData.append("amount", amount);
        formData.append("method", method);
        formData.append("observation", observation || "");
        formData.append("code", codeValue);
        formData.append("studio", String(studio.id));

        if (isSalaryType) {
            formData.append("teacher", String(teacher.id));
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES}${idExpense}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast({
                title: "Gasto editado correctamente.",
                description: "El gasto fue editado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();

            if (tipo === "Consultor") {
                dispatch(getExpensesTodayTeachers());
            } else {
                dispatch(getExpenses());
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.detail || "Ocurrió un error al editar el gasto.";

            if (errorMessage === "El código proporcionado no corresponde a ningún usuario.") {
                toast({
                    title: "Error en el código.",
                    description: "El código proporcionado no corresponde a ningún usuario.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (
                errorMessage === "No se encontró un registro de horas para esta profesora en el mes actual."
            ) {
                toast({
                    title: "Error.",
                    description: "Esta profesora no tiene horas cargadas en el mes actual.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (
                errorMessage === "El monto excede las horas disponibles para el sueldo de esa profesora."
            ) {
                toast({
                    title: "Error en el monto.",
                    description: "El monto excede las horas disponibles para el sueldo de esa profesora.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error.",
                    description: "Ocurrió un error al editar el gasto. Inténtalo de nuevo.",
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

    useEffect(() => {
        dispatch(getTeachers());
        dispatch(getTeacherHours());
        dispatch(getExpenseType());
        dispatch(getExpenses());
        dispatch(getExpensesTodayTeachers());
        dispatch(getStudios());
    }, [dispatch]);

    useEffect(() => {
        if (tipo === "Consultor" && expenseType.length > 0) {
            const gastosChicos = expenseType.find((expense: any) => expense.name === "Gastos Chicos");
            if (gastosChicos) {
                setType({ id: gastosChicos.id, name: gastosChicos.name });
            }
            return;
        }

        if (product?.type && expenseType.length > 0) {
            const selectedExpense = expenseType.find(
                (expense: any) => String(expense.id) === String(product.type.id)
            );

            if (selectedExpense) {
                setType({ id: selectedExpense.id, name: selectedExpense.name });
            }
        }
    }, [tipo, product, expenseType]);

    useEffect(() => {
        if (!studios?.length) return;

        // product.studio trae solo el id
        if (product?.studio) {
            const matchedStudio = studios.find(
                (s: any) => String(s.id) === String(product.studio)
            );

            if (matchedStudio) {
                setStudio({
                    id: matchedStudio.id,
                    name: matchedStudio.name,
                });
                return;
            }
        }

        // fallback al store si no vino en product o no matcheó
        if (selectedStudioFromStore) {
            const matchedStudioFromStore = studios.find(
                (s: any) => String(s.id) === String(selectedStudioFromStore.id)
            );

            if (matchedStudioFromStore) {
                setStudio({
                    id: matchedStudioFromStore.id,
                    name: matchedStudioFromStore.name,
                });
            }
        }
    }, [product, selectedStudioFromStore, studios]);

    useEffect(() => {
        if (product?.teacher) {
            const teacherRecord = teacherHours.find(
                (record: any) =>
                    String(record.teacher?.id) === String(product.teacher?.id)
            );

            if (teacherRecord) {
                setLeftHours(teacherRecord.left);
            }
        }
    }, [product, teacherHours]);

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
                <Modal
                    onClose={onCloseModalCode}
                    isOpen={isAlertCodeOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w="100%" h="100%" />
                    <ModalContent
                        maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }}
                        maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}
                        mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}
                    >
                        <ModalCloseButton />
                        <ModalCode
                            onClose={onCloseModalCode}
                            get={tipo === "Consultor" ? getExpensesTodayTeachers : getExpenses}
                            onCloseAlert={onClose}
                            entityType="expensesEdit"
                            action={handleSubmitExpense}
                        />
                    </ModalContent>
                </Modal>

                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Editar gasto
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="type" isRequired>
                            <FormLabel>Tipo</FormLabel>
                            <Select2
                                placeholder="Seleccionar..."
                                onChange={handleSelectChange}
                                isDisabled={tipo === "Consultor"}
                                options={
                                    tipo === "Consultor"
                                        ? expenseType.filter((expense: any) => expense.name === "Gastos Chicos")
                                        : expenseType
                                }
                                getOptionLabel={(e: any) => e.name}
                                getOptionValue={(e: any) => String(e.id)}
                                value={type?.id ? { id: type.id, name: type.name } : null}
                            />
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl id="payment-method" isRequired>
                            <FormLabel>Método de pago</FormLabel>
                            <Select2
                                placeholder="Seleccionar método de pago..."
                                onChange={(selectedOption: any) => setMethod(selectedOption?.value || "")}
                                options={paymentMethods}
                                getOptionLabel={(option: any) => option.label}
                                getOptionValue={(option: any) => option.value}
                                value={paymentMethods.find((option) => option.value === method) || null}
                            />
                        </FormControl>
                    </Box>

                    {isSalaryType && (
                        <Box>
                            <FormControl id="teacher" isRequired>
                                <FormLabel>Profesora</FormLabel>
                                <Select2
                                    placeholder="Seleccionar"
                                    onChange={handleTeacherChange}
                                    options={teachers
                                        .filter((teacherItem: any) => teacherItem.deleted === null)
                                        .map((teacherItem: any) => ({
                                            label: `${teacherItem.name} ${teacherItem.last_name} - ${teacherItem.dni}`,
                                            value: teacherItem.id,
                                        }))}
                                    value={
                                        teacher.id
                                            ? {
                                                label: teacher.name,
                                                value: teacher.id,
                                            }
                                            : null
                                    }
                                />
                            </FormControl>
                        </Box>
                    )}

                    {!isSalaryType && (
                        <Box>
                            <FormControl id="observation" isRequired>
                                <FormLabel>Observación</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    placeholder="Escribir..."
                                    h="40px"
                                    maxLength={100}
                                    value={observation}
                                    onChange={(event) => setObservation(event.target.value)}
                                />
                            </FormControl>
                        </Box>
                    )}

                    <Box>
                        <FormControl id="amount" isRequired>
                            <FormLabel>Monto</FormLabel>
                            <Input
                                w="100%"
                                type="number"
                                placeholder="Escribir..."
                                min="0"
                                h="40px"
                                value={amount}
                                onChange={(event) => setAmount(event.target.value)}
                            />
                        </FormControl>

                        {isSalaryType && leftHours !== null && (
                            <Text color="text.muted" fontSize="sm" mt="5px" pl="5px">
                                Restante a pagar: {formatCurrency(leftHours, "0")}
                            </Text>
                        )}
                    </Box>

                    <Box>
                        <FormControl id="studio" isRequired>
                            <FormLabel>Estudio</FormLabel>
                            <Select2
                                placeholder="Seleccionar estudio..."
                                options={studios
                                    .filter((s: any) => s.is_active)
                                    .map((s: any) => ({
                                        label: s.name,
                                        value: s.id,
                                    }))
                                }
                                value={
                                    studio.id
                                        ? {
                                            label: studio.name,
                                            value: studio.id,
                                        }
                                        : null
                                }
                                onChange={(selectedOption: any) =>
                                    setStudio({
                                        id: selectedOption?.value || "",
                                        name: selectedOption?.label || "",
                                    })
                                }
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
                        onClick={() =>
                            tipo !== "Consultor" ? handleSubmitExpense(code) : onOpenModalCode()
                        }
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

export default ModalExpenseEdit;
