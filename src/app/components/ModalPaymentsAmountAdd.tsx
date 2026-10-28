import {
    AddIcon,
    DeleteIcon,
} from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    IconButton,
    Input,
    SimpleGrid,
    Spinner,
    Stack,
    Text,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Select as Select2 } from "./ui/Select";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import {
    getActivitySubType,
    getPaymentAmount,
    getPlanSubType,
} from "../stores/studioSlice";
import { formatAmount, isValidAmountInput, normalizeAmountInput } from "../utils/amount";
import { LoadingOverlay } from "./ui/Loaders";

type PriceItem = {
    method: string;
    amount: string;
};

const PAYMENT_METHODS = [
    { label: "Efectivo", value: "Efectivo" },
    { label: "Transferencia", value: "Transferencia" },
];

const getPlanActivityId = (plan: any) =>
    plan?.activity_subtype?.id ??
    plan?.activity_subtype_id ??
    plan?.activity_subtype ??
    plan?.subtype?.id ??
    plan?.subtype;

const ModalPaymentsAmountAdd = ({ onClose, isCancel }: any) => {
    const [plan, setPlan] = useState("");
    const [priceItems, setPriceItems] = useState<PriceItem[]>([
        { method: "", amount: "" },
    ]);
    const [loading, setLoading] = useState(false);

    const { plansSubType, activitySubType } = useSelector(
        (state: any) => state.studio
    );
    const { tokens } = useAuthStore();
    const dispatch = useAppDispatch();
    const toast = useToast();

    useEffect(() => {
        dispatch(getPlanSubType());
        dispatch(getActivitySubType());
    }, [dispatch]);

    const planOptions = useMemo(
        () =>
            (plansSubType || [])
                .filter(
                    (item: any) =>
                        item?.deleted == null && item?.is_active !== false
                )
                .map((item: any) => {
                    const activityId = getPlanActivityId(item);
                    const activity = (activitySubType || []).find(
                        (candidate: any) =>
                            String(candidate.id) === String(activityId)
                    );
                    const planName = item.name || item.days || `Plan ${item.id}`;
                    const activityName =
                        activity?.name ||
                        item?.activity_subtype_name ||
                        item?.activity_subtype?.name;

                    return {
                        label: activityName
                            ? `${planName} — ${activityName}`
                            : planName,
                        value: item.id,
                    };
                }),
        [plansSubType, activitySubType]
    );

    const getAvailableMethods = (currentIndex: number) => {
        const selectedByOtherRows = new Set(
            priceItems
                .filter((_, index) => index !== currentIndex)
                .map((item) => item.method)
                .filter(Boolean)
        );

        return PAYMENT_METHODS.filter(
            (method) => !selectedByOtherRows.has(method.value)
        );
    };

    const updatePriceItem = (
        index: number,
        field: keyof PriceItem,
        value: string
    ) => {
        setPriceItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addPriceItem = () => {
        if (priceItems.length < PAYMENT_METHODS.length) {
            setPriceItems((current) => [...current, { method: "", amount: "" }]);
        }
    };

    const removePriceItem = (index: number) => {
        setPriceItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };

    const handlePlanChange = (selectedPlan: string) => {
        setPlan(selectedPlan);
    };

    const handleSubmitPaymentsAmount = async () => {
        if (
            !plan ||
            priceItems.some((item) => !item.method || item.amount === "")
        ) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const hasInvalidPrice = priceItems.some((item) => {
            const value = Number(item.amount);
            return Number.isNaN(value) || value < 0 || value > 1000000000;
        });

        if (hasInvalidPrice) {
            toast({
                title: "Precio inválido.",
                description: "El precio debe estar entre 0 y 1.000.000.000.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);

        try {
            await Promise.all(
                priceItems.map((item) => {
                    const payload = {
                        amount: item.amount,
                        method: item.method,
                        plans_subtype: Number(plan),
                    };

                    return axios.post(
                        `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${tokens?.access}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                })
            );

            toast({
                title: priceItems.length > 1
                    ? "Precios registrados correctamente."
                    : "Precio registrado correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();

            if (!isCancel) {
                dispatch(getPaymentAmount());
            }
        } catch (error: any) {
            const alreadyExists =
                error?.response?.data?.detail ===
                "This combination of plan and payment method already exists.";

            toast({
                title: alreadyExists ? "El precio ya existe." : "Error",
                description: alreadyExists
                    ? "Ya existe un precio para el plan y método de pago seleccionados."
                    : "Ocurrió un error al registrar el precio.",
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
        <Box>
            {loading && (
                <LoadingOverlay />
            )}

            <Stack
                spacing={5}
                w="full"
                p={{ base: 5, md: 6 }}
            >
                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Nuevo precio
                </Heading>

                <SimpleGrid columns={1} spacing={4}>
                    <Box>
                        <FormControl isRequired>
                            <FormLabel>Plan</FormLabel>
                            <Select2
                                placeholder="Seleccionar plan"
                                options={planOptions}
                                value={planOptions.find((option) => String(option.value) === String(plan)) || null}
                                onChange={(option: any) => handlePlanChange(option?.value || "")}
                                menuPlacement="auto"
                                menuPosition="fixed"
                                maxMenuHeight={240}
                                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                                styles={{
                                    menuPortal: (base: any) => ({ ...base, zIndex: 1500 }),
                                }}
                            />
                        </FormControl>
                    </Box>

                </SimpleGrid>

                <Box>
                    <Flex justify="space-between" align="center" mb={3} gap={3}>
                        <Text fontWeight="600" fontSize="lg">
                            Métodos
                        </Text>
                        <Button
                            aria-label="Agregar método de pago"
                            size="sm"
                            onClick={addPriceItem}
                            isDisabled={priceItems.length >= PAYMENT_METHODS.length}
                            minW="40px"
                            w="40px"
                            p={0}
                            variant="secondary"
                        >
                            <AddIcon boxSize={3} />
                        </Button>
                    </Flex>

                    <Stack spacing={3}>
                        {priceItems.map((item, index) => {
                            const availableMethods = getAvailableMethods(index);

                            return (
                                <Box
                                    key={index}
                                    border="1px solid"
                                    borderColor="border.subtle"
                                    borderRadius="md"
                                    p={{ base: 3, md: 4 }}
                                >
                                    <Flex
                                        direction={{ base: "column", md: "row" }}
                                        gap={3}
                                        align={{ base: "stretch", md: "flex-start" }}
                                    >
                                        <Box flex="1">
                                            <FormControl isRequired>
                                                <FormLabel>Método de pago</FormLabel>
                                                <Select2
                                                    placeholder="Seleccionar método"
                                                    options={availableMethods}
                                                    value={PAYMENT_METHODS.find((option) => option.value === item.method) || null}
                                                    onChange={(option: any) => updatePriceItem(index, "method", option?.value || "")}
                                                    isSearchable={false}
                                                />
                                            </FormControl>
                                        </Box>

                                        <Box flex="1">
                                            <FormControl isRequired>
                                                <FormLabel>Precio</FormLabel>
                                                <Input
                                                    h="40px"
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Escribir..."
                                                    value={formatAmount(item.amount, "")}
                                                    onChange={(event) => {
                                                        const value = event.target.value;
                                                        if (isValidAmountInput(value)) {
                                                            updatePriceItem(index, "amount", normalizeAmountInput(value));
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                        </Box>

                                        <Box
                                            w={{ base: "100%", md: "40px" }}
                                            display="flex"
                                            justifyContent={{ base: "flex-end", md: "center" }}
                                            pt={{ base: 0, md: "32px" }}
                                            flexShrink={0}
                                        >
                                            <IconButton
                                                aria-label="Eliminar método de pago"
                                                icon={<DeleteIcon boxSize={3.5} />}
                                                onClick={() => removePriceItem(index)}
                                                isDisabled={priceItems.length === 1}
                                                w="40px"
                                                h="40px"
                                                minW="40px"
                                                variant="ghostDanger"
                                            />
                                        </Box>
                                    </Flex>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>

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
                        onClick={handleSubmitPaymentsAmount}
                        w={["100%", "135px"]}
                        isLoading={loading}
                        variant="primary"
                    >
                        Guardar
                    </Button>
                </HStack>
            </Stack>
        </Box>
    );
};

export default ModalPaymentsAmountAdd;
