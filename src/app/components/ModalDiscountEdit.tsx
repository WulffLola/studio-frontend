import {
    Button,
    Stack,
    FormControl,
    FormLabel,
    Input,
    Heading,
    useToast,
    Box,
    Spinner,
    HStack,
    Select,
    Text,
    VStack,
    IconButton,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { getDiscounts, getPlanSubType } from "../stores/studioSlice";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";

const ModalDiscountEdit = ({ onClose, isCancel, product }: any) => {
    const [name, setName] = useState("");
    const [selectedPlans, setSelectedPlans] = useState<string[]>(["", ""]);
    const [discountPct, setDiscountPct] = useState("");
    const [loading, setLoading] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);

    const { tokens } = useAuthStore();
    const toast = useToast();
    const dispatch = useAppDispatch();

    const { plansSubType, discounts } = useSelector((state: any) => state.studio);

    const getPlanId = (plan: any) => String(plan?.id ?? plan);

    const flattenPlans = (plans: any[]): any[] => {
        const result: any[] = [];

        const visit = (plan: any) => {
            if (!plan) return;

            if (Array.isArray(plan)) {
                plan.forEach(visit);
                return;
            }

            if (Array.isArray(plan?.plans)) {
                plan.plans.forEach(visit);
                return;
            }

            result.push(plan);
        };

        visit(plans || []);

        return Array.from(
            new Map(result.map((plan: any) => [getPlanId(plan), plan])).values()
        );
    };

    useEffect(() => {
        dispatch(getDiscounts());
        dispatch(getPlanSubType());
    }, [dispatch]);

    useEffect(() => {
        if (product) {
            setName(product?.name || "");
            setNameTouched(false);
            setDiscountPct(product?.discount_pct ? String(product.discount_pct) : "");

            const plansFromProduct =
                flattenPlans(product?.plans || []).map(getPlanId);

            setSelectedPlans(plansFromProduct.length >= 2 ? plansFromProduct : ["", ""]);
        }
    }, [product]);

    const handlePlanChange = (index: number, value: string) => {
        const currentGeneratedName = buildDiscountName(selectedPlans.filter((plan) => plan !== ""));
        const updated = [...selectedPlans];
        updated[index] = value;
        setSelectedPlans(updated);

        if (!name.trim() || name.trim() === currentGeneratedName) {
            setName(buildDiscountName(updated.filter((plan) => plan !== "")));
            setNameTouched(false);
        }
    };

    const handleAddPlan = () => {
        setSelectedPlans((prev) => [...prev, ""]);
    };

    const handleRemovePlan = (index: number) => {
        if (selectedPlans.length <= 2) return;
        const currentGeneratedName = buildDiscountName(selectedPlans.filter((plan) => plan !== ""));
        const updated = selectedPlans.filter((_, i) => i !== index);
        setSelectedPlans(updated);

        if (!name.trim() || name.trim() === currentGeneratedName) {
            setName(buildDiscountName(updated.filter((plan) => plan !== "")));
            setNameTouched(false);
        }
    };

    const activePlansSubType = useMemo(
        () => (plansSubType || []).filter((plan: any) => plan?.deleted === null),
        [plansSubType]
    );

    const getAvailablePlans = (currentIndex: number) => {
        return activePlansSubType.filter((plan: any) => {
            return !selectedPlans.some(
                (selected, index) =>
                    index !== currentIndex && String(selected) === String(plan.id)
            );
        });
    };

    const selectedNonEmptyPlans = useMemo(
        () => selectedPlans.filter((plan) => plan !== ""),
        [selectedPlans]
    );

    const allPlansSelected =
        activePlansSubType.length > 0 &&
        selectedNonEmptyPlans.length >= activePlansSubType.length;

    const buildDiscountName = (planIds: string[]) => {
        return planIds
            .map((planId) => {
                const planFound = plansSubType?.find(
                    (plan: any) => String(plan.id) === String(planId)
                );
                return planFound?.name || "";
            })
            .filter(Boolean)
            .join(" + ");
    };

    const normalizePlans = (plans: Array<string | number>) => {
        return [...plans].map(String).sort().join("-");
    };

    const handleSubmitDiscount = async () => {
        if (!product?.id) return;

        setLoading(true);

        const discountValue = discountPct.trim().replace(",", ".");
        const cleanPlans = selectedPlans.filter((plan) => plan !== "");
        const trimmedName = name.trim();
        const generatedName = buildDiscountName(cleanPlans);
        const originalGeneratedName = buildDiscountName(flattenPlans(product?.plans || []).map(getPlanId));
        const finalName =
            !trimmedName || trimmedName === originalGeneratedName
                ? generatedName
                : trimmedName;

        if (cleanPlans.length < 2) {
            toast({
                title: "Faltan planes.",
                description: "Debe seleccionar al menos dos planes.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        if (!discountValue) {
            toast({
                title: "Falta completar campos.",
                description: "Por favor completá el porcentaje de descuento.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        const hasDuplicates = new Set(cleanPlans).size !== cleanPlans.length;

        if (hasDuplicates) {
            toast({
                title: "Planes duplicados.",
                description: "No puede seleccionar el mismo plan más de una vez.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        const parsedDiscount = Number(discountValue);

        if (Number.isNaN(parsedDiscount) || parsedDiscount <= 0) {
            toast({
                title: "Descuento inválido.",
                description: "Ingresá un porcentaje mayor a 0.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        if (parsedDiscount > 100) {
            toast({
                title: "Descuento inválido.",
                description: "El porcentaje no puede ser mayor a 100.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        const currentPlansKey = normalizePlans(cleanPlans);

        const existingPlans = new Set(
            (discounts || [])
                .filter((discount: any) => Number(discount?.id) !== Number(product?.id))
                .map((discount: any) =>
                    normalizePlans(flattenPlans(discount?.plans || []).map(getPlanId))
                )
        );

        if (existingPlans.has(currentPlansKey)) {
            toast({
                title: "Descuento duplicado.",
                description: "Ya existe un descuento con esa combinación de planes.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_URL_BACKEND_COMBO_PLAN_DISCOUNT?.replace(/\/$/, "");
            const url = `${baseUrl}/${product.id}/`;

            await axios.put(
                url,
                {
                    name: finalName,
                    plans_ids: cleanPlans.map(Number),
                    discount_pct: discountValue,
                },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Descuento editado correctamente.",
                description: "El descuento fue actualizado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onClose();
            dispatch(getDiscounts());
        } catch (error: any) {
            console.error("Error en la solicitud:", error?.response?.data || error);

            toast({
                title: "Error",
                description:
                    error?.response?.data?.detail ||
                    "Ocurrió un error al editar el descuento.",
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
                    Editar descuento
                </Heading>

                <FormControl>
                    <FormLabel>Nombre</FormLabel>
                    <Input
                        type="text"
                        placeholder="Ej: Promo primavera"
                        value={name}
                        onChange={(e) => {
                            setNameTouched(true);
                            setName(e.target.value);
                        }}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Planes</FormLabel>

                    <Box border="1px solid" borderColor="border.subtle" borderRadius="md" p={4}>
                        <VStack spacing={3} align="stretch">
                            {selectedPlans.map((planValue, index) => (
                                <HStack key={index} align="center">
                                    <Select
                                        placeholder={`Seleccionar plan ${index + 1}...`}
                                        value={planValue}
                                        onChange={(e) => handlePlanChange(index, e.target.value)}
                                    >
                                        {getAvailablePlans(index).map((plan: any) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name}
                                            </option>
                                        ))}
                                    </Select>

                                    {index === selectedPlans.length - 1 && !allPlansSelected && (
                                        <IconButton
                                            aria-label="Agregar plan"
                                            icon={<FiPlus />}
                                            onClick={handleAddPlan}
                                            variant="secondary"
                                        />
                                    )}

                                    {selectedPlans.length > 2 && (
                                        <IconButton
                                            aria-label="Eliminar plan"
                                            icon={<FiTrash2 />}
                                            onClick={() => handleRemovePlan(index)}
                                            variant="ghostDanger"
                                        />
                                    )}
                                </HStack>
                            ))}
                        </VStack>
                    </Box>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Porcentaje de descuento</FormLabel>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Ej: 10"
                        value={discountPct}
                        onChange={(e) => setDiscountPct(e.target.value)}
                    />
                </FormControl>

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
                        onClick={handleSubmitDiscount}
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

export default ModalDiscountEdit;
