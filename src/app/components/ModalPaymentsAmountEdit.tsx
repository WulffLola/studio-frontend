import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
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
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Select as Select2 } from "./ui/Select";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { formatAmount, isValidAmountInput, normalizeAmountInput } from "../utils/amount";
import {
    getActivitySubType,
    getPaymentAmount,
    getPlanSubType,
} from "../stores/studioSlice";
import { LoadingOverlay } from "./ui/Loaders";

const PAYMENT_METHODS = [
    { label: "Efectivo", value: "Efectivo" },
    { label: "Transferencia", value: "Transferencia" },
];

type PriceItem = {
    id: number | string | null;
    method: string;
    amount: string;
};

const getId = (value: any) => value?.id ?? value ?? "";

const getPlanActivityId = (plan: any) =>
    plan?.activity_subtype?.id ??
    plan?.activity_subtype_id ??
    plan?.activity_subtype ??
    plan?.subtype?.id ??
    plan?.subtype;

const ModalPaymentsAmountEdit = ({
    product,
    onClose,
    onCloseAlertDialogMethod,
}: any) => {
    const [plan, setPlan] = useState(
        String(getId(product?.plans_subtype ?? product?.plan))
    );
    const [priceItems, setPriceItems] = useState<PriceItem[]>(() => {
        if (product?.ids || product?.efectivo !== undefined || product?.transferencia !== undefined) {
            return [
                {
                    id: product?.ids?.efectivo ?? null,
                    method: "Efectivo",
                    amount: String(product?.efectivo ?? ""),
                },
                {
                    id: product?.ids?.transferencia ?? null,
                    method: "Transferencia",
                    amount: String(product?.transferencia ?? ""),
                },
            ].filter((item) => item.id || item.amount !== "");
        }

        return PAYMENT_METHODS.map((paymentMethod) => ({
            id: paymentMethod.value === product?.method ? product?.id ?? null : null,
            method: paymentMethod.value,
            amount: paymentMethod.value === product?.method ? String(product?.amount ?? "") : "",
        })).filter((item) => item.id || item.amount !== "");
    });
    const [loading, setLoading] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const { plansSubType, activitySubType } = useSelector(
        (state: any) => state.studio
    );
    const { tokens } = useAuthStore();
    const dispatch = useAppDispatch();
    const toast = useToast();
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    const {
        isOpen: isDeleteOpen,
        onOpen: onOpenDelete,
        onClose: onCloseDelete,
    } = useDisclosure();

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

    const updatePriceItem = (
        index: number,
        field: "method" | "amount",
        value: string
    ) => {
        setPriceItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item
            )
        );
    };

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

    const addPriceItem = () => {
        if (priceItems.length < PAYMENT_METHODS.length) {
            setPriceItems((current) => [
                ...current,
                { id: null, method: "", amount: "" },
            ]);
        }
    };

    const requestDeletePriceItem = (index: number) => {
        if (priceItems.length === 1) {
            setPriceItems((current) =>
                current.map((item, itemIndex) =>
                    itemIndex === index
                        ? { ...item, method: "", amount: "" }
                        : item
                )
            );
            return;
        }

        if (!priceItems[index]?.id) {
            setPriceItems((current) =>
                current.filter((_, itemIndex) => itemIndex !== index)
            );
            return;
        }

        setDeleteIndex(index);
        onOpenDelete();
    };

    const handleDeletePriceItem = async () => {
        if (deleteIndex === null) return;

        const item = priceItems[deleteIndex];
        if (!item?.id) return;

        if (priceItems.length === 1) return;

        setLoading(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}${item.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            setPriceItems((current) =>
                current.filter((_, itemIndex) => itemIndex !== deleteIndex)
            );
            onCloseDelete();
            setDeleteIndex(null);
            dispatch(getPaymentAmount());
            toast({
                title: "Método eliminado correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
        } catch {
            toast({
                title: "Error",
                description: "No se pudo eliminar el método de pago.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (
            !plan ||
            !priceItems.length ||
            priceItems.some((item) => !item.method) ||
            priceItems.some((item) => item.amount === "")
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

        const hasInvalidAmount = priceItems.some((item) => {
            const numericAmount = Number(item.amount);
            return Number.isNaN(numericAmount) || numericAmount < 0 || numericAmount > 1000000000;
        });
        if (hasInvalidAmount) {
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
                    const formData = new FormData();
                    formData.append("plans_subtype", plan);
                    formData.append("method", item.method);
                    formData.append("amount", item.amount);

                    const url = item.id
                        ? `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}${item.id}/`
                        : `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}`;
                    const request = item.id ? axios.put : axios.post;

                    return request(url, formData, {
                        headers: {
                            Authorization: `Bearer ${tokens?.access}`,
                            "Content-Type": "multipart/form-data",
                        },
                    });
                })
            );

            toast({
                title: "Precio editado correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            onCloseAlertDialogMethod?.();
            dispatch(getPaymentAmount());
        } catch (error: any) {
            const alreadyExists =
                error?.response?.data?.detail ===
                "This combination of plan and payment method already exists.";

            toast({
                title: alreadyExists ? "El precio ya existe." : "Error",
                description: alreadyExists
                    ? "Ya existe un precio para el plan y método seleccionados."
                    : "Ocurrió un error al editar el precio.",
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
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={onCloseDelete}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent mx={4}>
                        <AlertDialogHeader>Eliminar método de pago</AlertDialogHeader>
                        <AlertDialogBody>
                            ¿Está seguro que quiere eliminar el precio en{" "}
                            <strong>
                                {deleteIndex !== null
                                    ? priceItems[deleteIndex]?.method
                                    : "este método"}
                            </strong>?
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                ref={cancelRef}
                                aria-label="Cancelar eliminación"
                                onClick={onCloseDelete}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Cancelar
                            </Button>
                            <Button
                                aria-label="Eliminar método de pago"
                                onClick={handleDeletePriceItem}
                                w={["100%", "135px"]}
                                variant="danger"
                            >
                                Eliminar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

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
                    Editar precio
                </Heading>

                <SimpleGrid columns={1} spacing={4}>
                    <Box>
                        <FormControl isRequired>
                            <FormLabel>Plan</FormLabel>
                            <Select2
                                placeholder="Seleccionar plan"
                                options={planOptions}
                                value={planOptions.find((option) => String(option.value) === String(plan)) || null}
                                onChange={(option: any) => setPlan(option?.value || "")}
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
                    {priceItems.map((item, index) => (
                        <Box
                            key={`${item.id ?? "new"}-${index}`}
                            border="1px solid"
                            borderColor="border.subtle"
                            borderRadius="md"
                            p={{ base: 3, md: 4 }}
                        >
                            <Flex direction={{ base: "column", md: "row" }} gap={3} align={{ base: "stretch", md: "flex-start" }}>
                                <Box flex="1">
                                    <FormControl isRequired>
                                        <FormLabel>Método de pago</FormLabel>
                                        <Select2
                                            placeholder="Seleccionar método"
                                            options={getAvailableMethods(index)}
                                            value={PAYMENT_METHODS.find((option) => option.value === item.method) || null}
                                            onChange={(option: any) =>
                                                updatePriceItem(index, "method", option?.value || "")
                                            }
                                            isDisabled={Boolean(item.id && item.method)}
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
                                        aria-label={`Eliminar ${item.method || "método"}`}
                                        icon={<DeleteIcon boxSize={3.5} />}
                                        variant="ghostDanger"
                                        colorScheme="red"
                                        onClick={() => requestDeletePriceItem(index)}
                                        w="40px"
                                        h="40px"
                                        minW="40px"
                                    />
                                </Box>
                            </Flex>
                        </Box>
                    ))}
                </Stack>
                </Box>

                <HStack spacing={3} justify="flex-end" mt={6}>
                    <Button
                        onClick={() => {
                            onClose();
                            onCloseAlertDialogMethod?.();
                        }}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        w={["100%", "135px"]}
                        isLoading={loading}
                        isDisabled={
                            !plan ||
                            !priceItems.length ||
                            priceItems.some(
                                (item) => !item.method || item.amount === ""
                            )
                        }
                        variant="primary"
                    >
                        Guardar
                    </Button>
                </HStack>
            </Stack>
        </Box>
    );
};

export default ModalPaymentsAmountEdit;
