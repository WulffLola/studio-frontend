import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Box,
    Text,
    useToast,
    SimpleGrid,
    Input,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Spinner,
    Flex,
    IconButton,
    Divider,
    Badge,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { Select as Select2 } from "./ui/Select";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getPayments,
    getPeoples,
    getPaymentsLastMonth,
    getPaymentAmount,
    getPlanSubType,
    getStudios,
} from "../stores/studioSlice";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useStudioStore } from "../stores/studio";
import { isSelectableStudio } from "../utils/studios";
import { getPaymentErrorMessage } from "../utils/paymentError";
import { formatAmount, isValidAmountInput, normalizeAmountInput, formatCurrency } from "../utils/amount";
import { LoadingOverlay } from "./ui/Loaders";

const ModalPaymentAdd = ({ product, onClose, updatedAppointments, setUpdatedAppointments }: any) => {
    const [student, setStudent] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [date, setDate] = useState("");
    const [inputDate, setInputDate] = useState("");
    const [code, setCode] = useState("admin");
    const [loading, setLoading] = useState(false);
    const [isDifferentialPayment, setIsDifferentialPayment] = useState(0);

    const [differentialMethod, setDifferentialMethod] = useState("");
    const [differentialObservation, setDifferentialObservation] = useState("");

    const [paymentItems, setPaymentItems] = useState([
        { plan: "", amountValue: "" },
    ]);
    const [comboPreview, setComboPreview] = useState<any>(null);
    const [comboPreviewLoading, setComboPreviewLoading] = useState(false);
    const [comboPreviewError, setComboPreviewError] = useState("");
    const [lastComboToastKey, setLastComboToastKey] = useState("");
    const [paymentStudio, setPaymentStudio] = useState("");

    const [differentialItems, setDifferentialItems] = useState([
        { plan: "", amount: "" },
    ]);

    const { plansSubType, peoples, studios, amounts } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const { tipo, tokens } = useAuthStore();
    const selectedStudioFromHeader = useStudioStore((state: any) => state.selectedStudio);
    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosureLike();

    const paymentMethods = [
        { label: "Efectivo", value: "Efectivo" },
        { label: "Transferencia", value: "Transferencia" },
    ];

    const canSelectStudio = ["Administrador", "ADMIN", "Admin", "Super", "SUPER"].includes(String(tipo));

    const studioOptions =
        studios
            ?.filter(isSelectableStudio)
            .map((studio: any) => ({
                value: studio.id,
                label: studio.name,
            })) || [];

    const getPaymentStudioId = () => {
        if (canSelectStudio) return paymentStudio;

        if (tipo === "Consultor") {
            return selectedStudioFromHeader?.id ? String(selectedStudioFromHeader.id) : "";
        }

        return selectedStudioFromHeader?.id ? String(selectedStudioFromHeader.id) : paymentStudio;
    };

    const validatePaymentStudio = () => {
        const studioId = getPaymentStudioId();

        if (!studioId) {
            toast({
                title: "Falta seleccionar estudio.",
                description:
                    tipo === "Consultor"
                        ? "No hay un estudio seleccionado en el header."
                        : "Por favor seleccioná un estudio.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return false;
        }

        return true;
    };

    useEffect(() => {
        if (!canSelectStudio || paymentStudio || !selectedStudioFromHeader?.id) return;

        setPaymentStudio(String(selectedStudioFromHeader.id));
    }, [canSelectStudio, paymentStudio, selectedStudioFromHeader?.id]);

    function useDisclosureLike() {
        const [isOpen, setIsOpen] = useState(false);
        return {
            isOpen,
            onOpen: () => setIsOpen(true),
            onClose: () => setIsOpen(false),
        };
    }

    const activePricePlanIds = useMemo(
        () =>
            new Set(
                (amounts || [])
                    .filter((amountItem: any) => amountItem?.deleted == null)
                    .map((amountItem: any) =>
                        String(
                            amountItem?.plans_subtype?.id ??
                            amountItem?.plans_subtype ??
                            amountItem?.plan?.id ??
                            amountItem?.plan ??
                            ""
                        )
                    )
                    .filter(Boolean)
            ),
        [amounts]
    );

    const normalPlanOptions = useMemo(
        () =>
            (plansSubType || [])
                .filter(
                    (plan: any) =>
                        plan?.deleted == null &&
                        plan?.is_active !== false &&
                        activePricePlanIds.has(String(plan.id))
                )
                .map((plan: any) => ({
                    label: plan.name || plan.days || `Plan ${plan.id}`,
                    value: plan.id,
                })),
        [plansSubType, activePricePlanIds]
    );

    const getAvailablePlanOptions = (
        items: Array<{ plan: string }>,
        currentIndex: number
    ) => {
        const selectedByOtherRows = new Set(
            items
                .filter((_, index) => index !== currentIndex)
                .map((item) => String(item.plan || ""))
                .filter(Boolean)
        );

        return normalPlanOptions.filter(
            (option) => !selectedByOtherRows.has(String(option.value))
        );
    };

    const getPlanPriceByMethod = useCallback((planId: string, method: string) => {
        const normalizedMethod = String(method).trim().toLowerCase();
        const configuredAmount = (amounts || []).find(
            (amountItem: any) =>
                amountItem?.deleted == null &&
                String(
                    amountItem?.plans_subtype?.id ??
                    amountItem?.plans_subtype ??
                    amountItem?.plan?.id ??
                    amountItem?.plan
                ) === String(planId) &&
                String(amountItem?.method).trim().toLowerCase() === normalizedMethod
        );

        if (configuredAmount?.amount !== null && configuredAmount?.amount !== undefined) {
            return String(configuredAmount.amount);
        }

        const selectedPlan = (plansSubType || []).find(
            (plan: any) => String(plan.id) === String(planId)
        );

        if (!selectedPlan || !method) return "";

        const rawPrice =
            method === "Efectivo"
                ? selectedPlan.price_cash
                : selectedPlan.price_transfer;

        return rawPrice !== null && rawPrice !== undefined ? String(rawPrice) : "";
    }, [amounts, plansSubType]);

    const selectedNormalPlanIds = useMemo(() => {
        return Array.from(
            new Set(
                paymentItems
                    .map((item) => String(item.plan || ""))
                    .filter(Boolean)
            )
        );
    }, [paymentItems]);

    const selectedDifferentialPlanIds = useMemo(
        () =>
            Array.from(
                new Set(
                    differentialItems
                        .map((item) => String(item.plan || ""))
                        .filter(Boolean)
                )
            ),
        [differentialItems]
    );

    const hasAvailableNormalPlan = normalPlanOptions.some(
        (option) => !selectedNormalPlanIds.includes(String(option.value))
    );
    const hasAvailableDifferentialPlan = normalPlanOptions.some(
        (option) => !selectedDifferentialPlanIds.includes(String(option.value))
    );

    const getComboPreviewUrl = (planIds: string[]) => {
        const explicitBase = process.env.NEXT_PUBLIC_URL_BACKEND_COMBO_PREVIEW;
        const backendBase = process.env.NEXT_PUBLIC__URL_BACKEND?.trim().replace(/^["']|["']$/g, "");
        const baseUrl = explicitBase || `${backendBase || ""}prices/combo-preview/`;

        return `${baseUrl}?plans=${planIds.join(",")}`;
    };

    const getComboPreviewName = (preview: any) => {
        const appliedCombo = preview?.applied_combos?.[0];

        return (
            appliedCombo?.combo_name ||
            preview?.name ||
            preview?.discount?.name ||
            preview?.combo?.name ||
            preview?.combo_plan_discount?.name ||
            "Combo/descuento aplicable"
        );
    };

    const getComboPreviewPct = (preview: any) => {
        const appliedCombo = preview?.applied_combos?.[0];

        return (
            appliedCombo?.discount_pct ??
            preview?.discount_pct ??
            preview?.discount?.discount_pct ??
            preview?.combo?.discount_pct ??
            preview?.combo_plan_discount?.discount_pct ??
            null
        );
    };

    const hasComboPreview = (preview: any) => {
        if (!preview) return false;

        if (Array.isArray(preview?.applied_combos)) {
            return preview.applied_combos.length > 0;
        }

        if (preview?.exists === false || preview?.has_combo === false || preview?.found === false) {
            return false;
        }

        return Boolean(
            preview?.exists ||
            preview?.has_combo ||
            preview?.found ||
            preview?.id ||
            preview?.name ||
            preview?.discount ||
            preview?.combo ||
            preview?.combo_plan_discount ||
            preview?.discount_pct
        );
    };

    const comboApplies = hasComboPreview(comboPreview);

    const getFinalItemAmount = (item: any) => {
        if (!comboApplies || !Array.isArray(comboPreview?.plans)) {
            return Number(item.amountValue || 0);
        }

        const previewPlan = comboPreview.plans.find(
            (plan: any) => String(plan.id) === String(item.plan)
        );
        const finalPrice =
            paymentMethod === "Efectivo"
                ? previewPlan?.final_price_cash
                : previewPlan?.final_price_transfer;

        return finalPrice !== null && finalPrice !== undefined
            ? Number(finalPrice)
            : Number(item.amountValue || 0);
    };

    const finalTotalNormalPayment = paymentItems.reduce(
        (total, item) => total + getFinalItemAmount(item),
        0
    );
    const baseTotalNormalPayment = paymentItems.reduce(
        (total, item) => total + Number(item.amountValue || 0),
        0
    );
    const comboDiscountAmount = Math.max(
        0,
        baseTotalNormalPayment - finalTotalNormalPayment
    );

    const validateSubmitPayment = (student: string, paymentMethod: string, items: any[]) => {
        if (!student || !paymentMethod) {
            return {
                valid: false,
                message: {
                    title: "Faltan completar campos.",
                    description: "Por favor complete alumno y método de pago.",
                },
            };
        }

        if (!items.length) {
            return {
                valid: false,
                message: {
                    title: "Faltan planes.",
                    description: "Debes agregar al menos un plan.",
                },
            };
        }

        const hasEmptyPlan = items.some((item) => !item.plan);
        if (hasEmptyPlan) {
            return {
                valid: false,
                message: {
                    title: "Faltan completar campos.",
                    description: "Todos los planes deben estar seleccionados.",
                },
            };
        }

        const hasEmptyAmount = items.some((item) => !item.amountValue);
        if (hasEmptyAmount) {
            return {
                valid: false,
                message: {
                    title: "Información incompleta.",
                    description: "Falta cargar el monto de uno o más planes para este método de pago.",
                },
            };
        }

        const selectedPlans = items.map((item) => String(item.plan));
        const hasDuplicates = new Set(selectedPlans).size !== selectedPlans.length;

        if (hasDuplicates) {
            return {
                valid: false,
                message: {
                    title: "Planes repetidos.",
                    description: "No puedes agregar el mismo plan más de una vez.",
                },
            };
        }

        return { valid: true };
    };

    const validateDifferentialItems = (
        student: string,
        method: string,
        observation: string,
        items: any[]
    ) => {
        if (!student || !method || !observation) {
            return {
                valid: false,
                message: {
                    title: "Faltan completar campos.",
                    description: "Completa alumno, método de pago y observación.",
                },
            };
        }

        if (String(observation).trim() === "") {
            return {
                valid: false,
                message: {
                    title: "Error en observación.",
                    description: "La observación no puede estar vacía o contener solo espacios.",
                },
            };
        }

        if (!items.length) {
            return {
                valid: false,
                message: {
                    title: "Faltan planes.",
                    description: "Debes agregar al menos un plan diferencial.",
                },
            };
        }

        for (const item of items) {
            if (!item.plan || !item.amount) {
                return {
                    valid: false,
                    message: {
                        title: "Faltan completar campos.",
                        description: "Completa plan y monto en todos los ítems.",
                    },
                };
            }

            if (tipo !== "Consultor") {
                if (Number(item.amount) < 0 || Number(item.amount) > 1000000000) {
                    return {
                        valid: false,
                        message: {
                            title: "Error en el campo monto.",
                            description: "El monto no puede ser menor a cero o mayor a 1.000.000.000",
                        },
                    };
                }
            } else {
                if (Number(item.amount) < 1 || Number(item.amount) > 1000000000) {
                    return {
                        valid: false,
                        message: {
                            title: "Error en el campo monto.",
                            description: "El monto debe ser mayor a uno y no exceder 1.000.000.000",
                        },
                    };
                }
            }
        }

        return { valid: true };
    };
    const handleSubmitPayment = async (code: string) => {
        setLoading(true);

        try {
            const items = paymentItems.map((item) => ({
                plans_subtype_id: Number(item.plan),
                base_amount: Number(item.amountValue),
            }));

            const payload = {
                person_id: student,
                method: paymentMethod,
                items,
                date,
                code,
                studio: getPaymentStudioId(),
            };

            const response = await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS}`, payload, {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                    "Content-Type": "application/json",
                },
            });

            const warningMessage = response?.data?.warning;
            const hasWarning = Boolean(warningMessage) || response?.data?.code === "warning";

            if (hasWarning) {
                toast({
                    title: "Pago registrado con advertencia",
                    description: "El pago se registró correctamente, pero hubo un error al enviar el mensaje por WhatsApp.",
                    status: "warning",
                    duration: 7000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Pago creado correctamente.",
                    description: "El pago fue creado con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }

            handleAddPayment(student);
            dispatch(getPayments());
            dispatch(getPaymentsLastMonth());
            onClose();
        } catch (error: any) {
            console.error("Error al crear pago:", error);

            const errorMessage = getPaymentErrorMessage(
                error.response?.data,
                "Ocurrió un error al registrar el pago."
            );

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 7000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPaymentDifferential = async (code: string) => {
        setLoading(true);

        try {
            const items = differentialItems.map((item) => ({
                plans_subtype_id: Number(item.plan),
                base_amount: Number(item.amount),
            }));

            const payload = {
                person_id: student,
                method: differentialMethod,
                items,
                observation: differentialObservation,
                date,
                code,
                studio: getPaymentStudioId(),
            };

            const response = await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS}`, payload, {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                    "Content-Type": "application/json",
                },
            });

            const warningMessage = response?.data?.warning;
            const hasWarning = Boolean(warningMessage) || response?.data?.code === "warning";

            if (hasWarning) {
                toast({
                    title: "Pago registrado con advertencia",
                    description: "El pago se registró correctamente, pero hubo un error al enviar el mensaje por WhatsApp.",
                    status: "warning",
                    duration: 7000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Pago diferencial creado correctamente.",
                    description: "El pago diferencial fue creado con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }

            handleAddPayment(student);
            dispatch(getPayments());
            dispatch(getPaymentsLastMonth());
            onClose();
        } catch (error: any) {
            console.error("Error al crear pagos diferenciales:", error);
            const errorMessage = getPaymentErrorMessage(
                error.response?.data,
                "Ocurrió un error al registrar el pago."
            );

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 7000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(getPeoples());
        dispatch(getPlanSubType());
        dispatch(getPaymentAmount());
        dispatch(getPayments());
        dispatch(getStudios());
    }, [dispatch]);

    useEffect(() => {
        const planIds = selectedNormalPlanIds;

        if (isDifferentialPayment !== 0 || planIds.length < 2) {
            setComboPreview(null);
            setComboPreviewError("");
            setComboPreviewLoading(false);
            return;
        }

        const timeout = setTimeout(async () => {
            setComboPreviewLoading(true);
            setComboPreviewError("");

            try {
                const response = await axios.get(getComboPreviewUrl(planIds), {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                });

                const preview = response.data;
                setComboPreview(preview);

                if (hasComboPreview(preview)) {
                    const comboKey = planIds.join("-");

                    if (comboKey !== lastComboToastKey) {
                        const discountPct = getComboPreviewPct(preview);

                        toast({
                            title: "Combo/descuento disponible",
                            description: `${getComboPreviewName(preview)}${discountPct ? ` - ${discountPct}% de descuento` : ""}.`,
                            status: "info",
                            duration: 5000,
                            isClosable: true,
                            position: "bottom-right",
                        });

                        setLastComboToastKey(comboKey);
                    }
                }
            } catch (error: any) {
                setComboPreview(null);

                if (error?.response?.status !== 404) {
                    setComboPreviewError("No se pudo verificar si existe un combo para los planes seleccionados.");
                }
            } finally {
                setComboPreviewLoading(false);
            }
        }, 350);

        return () => clearTimeout(timeout);
    }, [selectedNormalPlanIds, isDifferentialPayment, tokens?.access, lastComboToastKey, toast]);

    const handleTabChange = (index: number) => {
        setIsDifferentialPayment(index);
    };

    const handleAddPayment = (student: string) => {
        if (typeof setUpdatedAppointments === "function") {
            setUpdatedAppointments((prev: any) => [...prev, student]);
        }
    };

    const handlePaymentClick = () => {
        if (tipo !== "Consultor") {
            if (isDifferentialPayment === 1) {
                const validation = validateDifferentialItems(student, differentialMethod, differentialObservation, differentialItems);
                if (validation.valid) {
                    if (!validatePaymentStudio()) return;
                    handleSubmitPaymentDifferential(code);
                } else {
                    toast({
                        title: validation.message.title,
                        description: validation.message.description,
                        status: "error",
                        position: "bottom-right",
                        duration: 5000,
                        isClosable: true,
                    });
                    setLoading(false);
                }
            } else {
                const validation = validateSubmitPayment(student, paymentMethod, paymentItems);
                if (validation.valid) {
                    if (!validatePaymentStudio()) return;
                    if (comboApplies) {
                        const discountPct = getComboPreviewPct(comboPreview);

                        toast({
                            title: "Combo/descuento aplicable",
                            description: `${getComboPreviewName(comboPreview)}${discountPct ? ` - ${discountPct}% de descuento` : ""}.`,
                            status: "info",
                            duration: 5000,
                            isClosable: true,
                            position: "bottom-right",
                        });
                    }
                    handleSubmitPayment(code);
                } else {
                    toast({
                        title: validation.message.title,
                        description: validation.message.description,
                        status: "error",
                        position: "bottom-right",
                        duration: 5000,
                        isClosable: true,
                    });
                    setLoading(false);
                }
            }
        } else {
            if (isDifferentialPayment === 1) {
                const validation = validateDifferentialItems(student, differentialMethod, differentialObservation, differentialItems);
                if (validation.valid) {
                    if (!validatePaymentStudio()) return;
                    onOpenModalCode();
                } else {
                    toast({
                        title: validation.message.title,
                        description: validation.message.description,
                        status: "error",
                        position: "bottom-right",
                        duration: 5000,
                        isClosable: true,
                    });
                    setLoading(false);
                }
            } else {
                const validation = validateSubmitPayment(student, paymentMethod, paymentItems);
                if (validation.valid) {
                    if (!validatePaymentStudio()) return;
                    if (comboApplies) {
                        const discountPct = getComboPreviewPct(comboPreview);

                        toast({
                            title: "Combo/descuento aplicable",
                            description: `${getComboPreviewName(comboPreview)}${discountPct ? ` - ${discountPct}% de descuento` : ""}.`,
                            status: "info",
                            duration: 5000,
                            isClosable: true,
                            position: "bottom-right",
                        });
                    }
                    onOpenModalCode();
                } else {
                    toast({
                        title: validation.message.title,
                        description: validation.message.description,
                        status: "error",
                        position: "bottom-right",
                        duration: 5000,
                        isClosable: true,
                    });
                    setLoading(false);
                }
            }
        }
    };

    useEffect(() => {
        const now = new Date();

        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");

        const hh = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");

        const yyyyMMdd = `${yyyy}-${mm}-${dd}`;
        const fullDate = `${yyyyMMdd}T${hh}:${min}:${ss}`;

        setInputDate(yyyyMMdd);
        setDate(fullDate);
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = event.target.value;

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");

        const fullDate = `${selectedDate}T${hh}:${mm}:${ss}`;
        setInputDate(selectedDate);
        setDate(fullDate);
    };

    const addPaymentItem = () => {
        if (!hasAvailableNormalPlan) return;
        setPaymentItems((prev) => [...prev, { plan: "", amountValue: "" }]);
    };

    const removePaymentItem = (index: number) => {
        setPaymentItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updatePaymentItemPlan = (index: number, selectedPlanId: string) => {
        const selectedAmount = getPlanPriceByMethod(selectedPlanId, paymentMethod);

        setPaymentItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        plan: selectedPlanId,
                        amountValue: selectedAmount,
                    }
                    : item
            )
        );
    };

    useEffect(() => {
        setPaymentItems((prev) =>
            prev.map((item) => {
                if (!item.plan || !paymentMethod) {
                    return { ...item, amountValue: "" };
                }

                const selectedAmount = getPlanPriceByMethod(item.plan, paymentMethod);

                return {
                    ...item,
                    amountValue: selectedAmount,
                };
            })
        );
    }, [paymentMethod, getPlanPriceByMethod]);

    const addDifferentialItem = () => {
        if (!hasAvailableDifferentialPlan) return;
        setDifferentialItems((prev) => [
            ...prev,
            { plan: "", amount: "" },
        ]);
    };

    const removeDifferentialItem = (index: number) => {
        setDifferentialItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updateDifferentialItem = (
        index: number,
        field: "plan" | "amount",
        value: string
    ) => {
        setDifferentialItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
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
                <Modal
                    onClose={onCloseModalCode}
                    isOpen={isAlertCodeOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w={"100%"} h={"100%"} />
                    <ModalContent
                        maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }}
                        maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}
                        mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}
                    >
                        <ModalCloseButton />
                        <ModalCode
                            onClose={onCloseModalCode}
                            get={getPeoples}
                            onCloseAlert={onClose}
                            entityType={"paymentsAdd"}
                            action={isDifferentialPayment === 1 ? handleSubmitPaymentDifferential : handleSubmitPayment}
                        />
                    </ModalContent>
                </Modal>

                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Nuevo pago
                </Heading>

                <Tabs variant="line" onChange={handleTabChange}>
                    <TabList>
                        <Tab>
                            Pago Normal
                        </Tab>
                        <Tab>
                            Pago Diferencial
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel h="auto" display="flex" alignItems="center" justifyContent="center">
                            <Stack w="100%" spacing={6} p={4}>
                                <SimpleGrid columns={[1, 1, 2]} spacing={4} w="100%">
                                    {tipo !== "Consultor" && (
                                        <Box>
                                            <FormControl id="date" isRequired>
                                                <FormLabel>Fecha</FormLabel>
                                                <Input
                                                    w="100%"
                                                    type="date"
                                                    h="40px"
                                                    value={inputDate}
                                                    onChange={handleChange}
                                                />
                                            </FormControl>
                                        </Box>
                                    )}

                                    <Box>
                                        <FormControl id="student" isRequired>
                                            <FormLabel>Alumno</FormLabel>
                                            <Select2
                                                w="100%"
                                                placeholder="Seleccionar"
                                                onChange={(selectedOption: any) => setStudent(selectedOption?.value || "")}
                                                options={peoples
                                                    .filter((person: any) => person.deleted === null)
                                                    .map((person: any) => ({
                                                        label: `${person.name} ${person.last_name} - ${person.dni}`,
                                                        value: person.id,
                                                    }))}
                                            />
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <FormControl id="payment-method" isRequired>
                                            <FormLabel>Método de pago</FormLabel>
                                            <Select2
                                                height="40px"
                                                width="100%"
                                                placeholder="Seleccionar método de pago..."
                                                options={paymentMethods}
                                                getOptionLabel={(option: any) => option.label}
                                                getOptionValue={(option: any) => option.value}
                                                onChange={(selectedOption: any) =>
                                                    setPaymentMethod(selectedOption?.value || "")
                                                }
                                                value={
                                                    paymentMethods.find(
                                                        (option) => option.value === paymentMethod
                                                    ) || null
                                                }
                                            />
                                        </FormControl>
                                    </Box>

                                    {canSelectStudio && (
                                        <Box>
                                            <FormControl id="studio" isRequired>
                                                <FormLabel>Estudio</FormLabel>
                                                <Select2
                                                    placeholder="Seleccionar estudio..."
                                                    options={studioOptions}
                                                    value={
                                                        studioOptions.find(
                                                            (option: any) => String(option.value) === String(paymentStudio)
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption: any) =>
                                                        setPaymentStudio(selectedOption?.value ? String(selectedOption.value) : "")
                                                    }
                                                />
                                            </FormControl>
                                        </Box>
                                    )}
                                </SimpleGrid>

                                <Box>
                                    <Flex justify="space-between" align="center" mb={3} gap={3}>
                                        <Text fontWeight="600" fontSize="lg">
                                            Planes a pagar
                                        </Text>
                                        <Button
                                            size="sm"
                                            onClick={addPaymentItem}
                                            isDisabled={!hasAvailableNormalPlan}
                                            minW="40px"
                                            w="40px"
                                            p={0}
                                            variant="secondary"
                                        >
                                            <AddIcon boxSize={3} />
                                        </Button>
                                    </Flex>

                                    <Stack spacing={3}>
                                        {paymentItems.map((item, index) => (
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
                                                    w="100%"
                                                >
                                                    <Box flex="1" w="100%">
                                                        <FormControl isRequired>
                                                            <FormLabel>Plan</FormLabel>
                                                            <Select2
                                                                placeholder="Seleccionar"
                                                                value={
                                                                    normalPlanOptions.find(
                                                                        (option) => String(option.value) === String(item.plan)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption: any) =>
                                                                    updatePaymentItemPlan(index, selectedOption?.value || "")
                                                                }
                                                                options={getAvailablePlanOptions(paymentItems, index)}
                                                            />
                                                        </FormControl>
                                                    </Box>

                                                    <Box flex="1" w="100%">
                                                        <FormControl isRequired>
                                                            <FormLabel>Monto</FormLabel>
                                                            <Input
                                                                w="100%"
                                                                type="text"
                                                                inputMode="decimal"
                                                                h="40px"
                                                                value={formatAmount(item.amountValue, "")}
                                                                isDisabled
                                                                placeholder="Monto automático"
                                                            />
                                                        </FormControl>
                                                    </Box>

                                                    <Box
                                                        w={{ base: "100%", md: "40px" }}
                                                        display="flex"
                                                        justifyContent={{ base: "flex-end", md: "center" }}
                                                        alignItems={{ base: "flex-end", md: "flex-start" }}
                                                        pt={{ base: 0, md: "32px" }}
                                                        flexShrink={0}
                                                    >
                                                        <IconButton
                                                            aria-label="Eliminar plan"
                                                            icon={<DeleteIcon boxSize={3.5} />}
                                                            onClick={() => removePaymentItem(index)}
                                                            isDisabled={paymentItems.length === 1}
                                                            w="40px"
                                                            h="40px"
                                                            minW="40px"
                                                            variant="ghostDanger"
                                                        />
                                                    </Box>
                                                </Flex>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <Divider my={4} />

                                    {selectedNormalPlanIds.length >= 2 && (
                                        <Box
                                            border="1px solid"
                                            borderColor={comboApplies ? "success.border" : "border.subtle"}
                                            bg={comboApplies ? "success.bg" : "bg.subtle"}
                                            borderRadius="card"
                                            boxShadow="none"
                                            p={4}
                                            mb={4}
                                        >
                                            {comboPreviewLoading ? (
                                                <HStack>
                                                    <Spinner size="sm" />
                                                    <Text fontSize="sm">Verificando combo/descuento...</Text>
                                                </HStack>
                                            ) : comboApplies ? (
                                                <Stack spacing={3}>
                                                    <Flex justify="space-between" align="center" gap={3}>
                                                        <Box>
                                                            <Text fontSize="xs" fontWeight="700" color="success.fg" textTransform="uppercase">
                                                                Combo aplicado
                                                            </Text>
                                                            <Text fontSize="md" fontWeight="700">
                                                                {getComboPreviewName(comboPreview)}
                                                            </Text>
                                                        </Box>
                                                        {getComboPreviewPct(comboPreview) && (
                                                            <Badge colorScheme="green" fontSize="13px" px={2.5}>
                                                                {getComboPreviewPct(comboPreview)}% OFF
                                                            </Badge>
                                                        )}
                                                    </Flex>
                                                    <Divider borderColor="success.border" />
                                                    <Stack spacing={1.5}>
                                                        <Flex justify="space-between">
                                                            <Text fontSize="sm" color="text.secondary">Subtotal</Text>
                                                            <Text fontSize="sm">{formatCurrency(baseTotalNormalPayment)}</Text>
                                                        </Flex>
                                                        <Flex justify="space-between">
                                                            <Text fontSize="sm" color="success.fg" fontWeight="600">Descuento del combo</Text>
                                                            <Text fontSize="sm" color="success.fg" fontWeight="700">
                                                                - {formatCurrency(comboDiscountAmount)}
                                                            </Text>
                                                        </Flex>
                                                        <Flex justify="space-between" align="baseline" pt={1}>
                                                            <Text fontSize="md" fontWeight="700">Total a pagar</Text>
                                                            <Text fontSize="xl" fontWeight={700} color="success.fg">
                                                                {formatCurrency(finalTotalNormalPayment)}
                                                            </Text>
                                                        </Flex>
                                                    </Stack>
                                                </Stack>
                                            ) : comboPreviewError ? (
                                                <Text fontSize="sm" color="warning.fg">
                                                    {comboPreviewError}
                                                </Text>
                                            ) : (
                                                <Text fontSize="sm" color="text.secondary">
                                                    No se encontró combo/descuento para los planes seleccionados.
                                                </Text>
                                            )}
                                        </Box>
                                    )}

                                    <Flex justify="flex-end" display={comboApplies ? "none" : "flex"}>
                                        <Text fontSize="lg" fontWeight="700">
                                            Total: {formatCurrency(finalTotalNormalPayment)}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Stack>
                        </TabPanel>

                        <TabPanel h="auto">
                            <Stack w="100%" spacing={6} p={4}>
                                <SimpleGrid columns={[1, 1, 2]} spacing={4} w="100%">
                                    {tipo !== "Consultor" && (
                                        <Box>
                                            <FormControl id="date" isRequired>
                                                <FormLabel>Fecha</FormLabel>
                                                <Input
                                                    w="100%"
                                                    type="date"
                                                    placeholder="Escribir..."
                                                    h="40px"
                                                    value={inputDate}
                                                    onChange={handleChange}
                                                />
                                            </FormControl>
                                        </Box>
                                    )}

                                    <Box>
                                        <FormControl id="student" isRequired>
                                            <FormLabel>Alumno</FormLabel>
                                            <Select2
                                                w="100%"
                                                placeholder="Seleccionar"
                                                onChange={(selectedOption: any) => setStudent(selectedOption?.value || "")}
                                                options={peoples
                                                    .filter((person: any) => person.deleted === null)
                                                    .map((person: any) => ({
                                                        label: `${person.name} ${person.last_name} - ${person.dni}`,
                                                        value: person.id,
                                                    }))}
                                            />
                                        </FormControl>
                                    </Box>

                                    <Box>
                                        <FormControl id="payment-method" isRequired>
                                            <FormLabel>Método de pago</FormLabel>
                                            <Select2
                                                placeholder="Seleccionar método de pago..."
                                                options={paymentMethods}
                                                value={
                                                    paymentMethods.find(
                                                        (option) => option.value === differentialMethod
                                                    ) || null
                                                }
                                                onChange={(selectedOption: any) =>
                                                    setDifferentialMethod(selectedOption?.value || "")
                                                }
                                            />
                                        </FormControl>
                                    </Box>

                                    {canSelectStudio && (
                                        <Box>
                                            <FormControl id="studio" isRequired>
                                                <FormLabel>Estudio</FormLabel>
                                                <Select2
                                                    placeholder="Seleccionar estudio..."
                                                    options={studioOptions}
                                                    value={
                                                        studioOptions.find(
                                                            (option: any) => String(option.value) === String(paymentStudio)
                                                        ) || null
                                                    }
                                                    onChange={(selectedOption: any) =>
                                                        setPaymentStudio(selectedOption?.value ? String(selectedOption.value) : "")
                                                    }
                                                />
                                            </FormControl>
                                        </Box>
                                    )}

                                    <Box>
                                        <FormControl id="observation" isRequired>
                                            <FormLabel>Observación</FormLabel>
                                            <Input
                                                w="100%"
                                                type="text"
                                                placeholder="Escribir..."
                                                h="40px"
                                                maxLength={100}
                                                value={differentialObservation}
                                                onChange={(event) => setDifferentialObservation(event.target.value)}
                                            />
                                        </FormControl>
                                    </Box>
                                </SimpleGrid>

                                <Box>
                                    <Flex justify="space-between" align="center" mb={3} gap={3}>
                                        <Text fontWeight="600" fontSize="lg">
                                            Planes diferenciales
                                        </Text>
                                        <Button
                                            size="sm"
                                            onClick={addDifferentialItem}
                                            isDisabled={!hasAvailableDifferentialPlan}
                                            minW="40px"
                                            w="40px"
                                            p={0}
                                            variant="secondary"
                                        >
                                            <AddIcon boxSize={3} />
                                        </Button>
                                    </Flex>

                                    <Stack spacing={3}>
                                        {differentialItems.map((item, index) => (
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
                                                    w="100%"
                                                >
                                                    <Box flex="1" w="100%">
                                                        <FormControl isRequired>
                                                            <FormLabel>Plan</FormLabel>
                                                            <Select2
                                                                placeholder="Seleccionar"
                                                                value={
                                                                    normalPlanOptions.find(
                                                                        (option) => String(option.value) === String(item.plan)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption: any) =>
                                                                    updateDifferentialItem(index, "plan", selectedOption?.value || "")
                                                                }
                                                                options={getAvailablePlanOptions(differentialItems, index)}
                                                            />
                                                        </FormControl>
                                                    </Box>

                                                    <Box flex="1" w="100%">
                                                        <FormControl isRequired>
                                                            <FormLabel>Monto</FormLabel>
                                                            <Input
                                                                w="100%"
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="Escribir..."
                                                                h="40px"
                                                                value={formatAmount(item.amount, "")}
                                                                onChange={(event) => {
                                                                    const value = event.target.value;
                                                                    if (isValidAmountInput(value)) {
                                                                        updateDifferentialItem(index, "amount", normalizeAmountInput(value));
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                    </Box>

                                                    <Box
                                                        w={{ base: "100%", md: "40px" }}
                                                        display="flex"
                                                        justifyContent={{ base: "flex-end", md: "center" }}
                                                        alignItems={{ base: "flex-end", md: "flex-start" }}
                                                        pt={{ base: 0, md: "32px" }}
                                                        flexShrink={0}
                                                    >
                                                        <IconButton
                                                            aria-label="Eliminar plan diferencial"
                                                            icon={<DeleteIcon boxSize={3.5} />}
                                                            onClick={() => removeDifferentialItem(index)}
                                                            isDisabled={differentialItems.length === 1}
                                                            w="40px"
                                                            h="40px"
                                                            minW="40px"
                                                            variant="ghostDanger"
                                                        />
                                                    </Box>
                                                </Flex>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                <HStack spacing={3} justify="flex-end">
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handlePaymentClick}
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

export default ModalPaymentAdd;
