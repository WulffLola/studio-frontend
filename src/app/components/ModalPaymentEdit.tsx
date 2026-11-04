import {
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Avatar,
    AvatarBadge,
    IconButton,
    Center,
    Switch,
    Select,
    Box,
    Text,
    RadioGroup,
    Radio,
    useToast,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
    SimpleGrid,
    Input,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Spinner,
    Divider,
    Badge,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { Select as Select2 } from "./ui/Select";
import { useAppDispatch } from "../stores/hooks";
import { getPaymentErrorMessage } from "../utils/paymentError";
import { useSelector } from "react-redux";
import {
    getPayments,
    getPeoples,
    getPaymentsLastMonth,
    getPaymentAmount,
    getPlanSubType,
    getStudios,
} from '../stores/studioSlice';
import { useStudioStore } from "../stores/studio";
import { formatAmount, isValidAmountInput, normalizeAmountInput, formatCurrency } from "../utils/amount";
import { LoadingOverlay } from "./ui/Loaders";
import { isSelectableStudio } from "../utils/studios";

const getPaymentPlanId = (item: any): string => {
    if (!item) return "";

    const sources = [
        item,
        Array.isArray(item?.items) ? item.items[0] : null,
        typeof item?.amount === "object" ? item.amount : null,
    ].filter(Boolean);

    for (const source of sources) {
        const directId = source?.plan_subtype_id ?? source?.plans_subtype_id;
        if (directId !== null && directId !== undefined && directId !== "") {
            return String(directId);
        }

        const planSubtype = source?.plan_subtype ?? source?.plans_subtype;
        if (typeof planSubtype === "number" || typeof planSubtype === "string") {
            return String(planSubtype);
        }
        if (planSubtype?.id) return String(planSubtype.id);

        const plan = source?.plan;
        if (typeof plan === "number" || typeof plan === "string") return String(plan);
        if (plan?.id) return String(plan.id);
    }

    return "";
};

const getPaymentAmountRecord = (item: any, amounts: any[]) => {
    if (!item) return null;
    const firstPaymentItem = Array.isArray(item?.items) ? item.items[0] : null;
    if (item?.amount && typeof item.amount === "object") return item.amount;
    if (firstPaymentItem?.amount && typeof firstPaymentItem.amount === "object") {
        return firstPaymentItem.amount;
    }

    const candidateIds = [
        item?.amount_id,
        item?.payment_amount_id,
        item?.amount,
        firstPaymentItem?.amount_id,
        firstPaymentItem?.payment_amount_id,
        firstPaymentItem?.amount,
    ];
    return (amounts || []).find((amountItem: any) =>
        candidateIds.some(
            (candidate) =>
                candidate !== null &&
                candidate !== undefined &&
                candidate !== "" &&
                String(amountItem.id) === String(candidate)
        )
    ) || null;
};

const normalizePaymentMethod = (value: any): string => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "efectivo") return "Efectivo";
    if (normalized === "transferencia") return "Transferencia";
    return value ? String(value) : "";
};

const getInitialPaymentItems = (payment: any) => {
    if (Array.isArray(payment?.items) && payment.items.length > 0) {
        return payment.items.map((item: any) => ({
            id: item?.id ?? null,
            plan: getPaymentPlanId(item),
            amountValue: item?.base_amount ?? item?.amount_value ?? item?.final_amount ?? item?.amount ?? "",
        }));
    }

    return [{
        id: null,
        plan: getPaymentPlanId(payment),
        amountValue: payment?.amount?.amount ?? payment?.amount ?? "",
    }];
};


const ModalPaymentEdit = ({ product, onClose }: any) => {
    const [idPayment, setIdPayment] = useState(product.id)
    const [idStudent, setIdStudent] = useState({
        id: product?.person?.id,
        name: product?.person?.name,
        last_name: product?.person?.last_name,
        dni: product?.person?.dni
    });
    const [student, setStudent] = useState(product.person.dni)
    const [paymentMethod, setPaymentMethod] = useState(normalizePaymentMethod(product?.method))
    const [amount, setAmount] = useState(product?.amount)
    const [plan, setPlan] = useState({ id: "", name: "" }); // Estado inicial    
    const [observation, setObservation] = useState(product.observation)
    const [amountId, setAmountId] = useState("");
    const [amountValue, setAmountValue] = useState("");
    const [code, setCode] = useState("admin")
    const [isDeletedStudent, setIsDeletedStudent] = useState((product.person.deleted === null) ? false : true);
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState((product.date));
    const [inputDate, setInputDate] = useState('');
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [paymentItems, setPaymentItems] = useState(() => getInitialPaymentItems(product));
    const [comboPreview, setComboPreview] = useState<any>(null);
    const [comboPreviewLoading, setComboPreviewLoading] = useState(false);
    const [comboPreviewError, setComboPreviewError] = useState("");
    const [paymentStudio, setPaymentStudio] = useState(
        product?.studio_id ||
        (typeof product?.studio === "number" || typeof product?.studio === "string" ? product.studio : product?.studio?.id) ||
        product?.type?.studio_id ||
        (typeof product?.type?.studio === "number" || typeof product?.type?.studio === "string" ? product.type.studio : product?.type?.studio?.id) ||
        product?.person?.studio_id ||
        (typeof product?.person?.studio === "number" || typeof product?.person?.studio === "string" ? product.person.studio : product?.person?.studio?.id) ||
        ""
    );

    const { appointments, plansSubType, peoples, amounts, studios } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    // const [peoples, setPeoples] = useState([])
    // const [paymentAmount, setPaymentAmount] = useState([])

    const toast = useToast();
    const selectedStudioFromHeader = useStudioStore((state: any) => state.selectedStudio);

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    // // get Peoples for table
    // async function getPeoples() {
    // try {
    // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}`, {
    // headers: {
    // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
    // 'Content-Type': 'application/json',
    // },
    // });
    // setPeoples(response.data)
    // } catch (error) {
    // console.log(error);
    // }
    // };


    // // get Payment-Amount for table
    // async function getPaymentAmount() {
    // try {
    // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}`, {
    // headers: {
    // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
    // 'Content-Type': 'application/json',
    // },
    // });
    // setPaymentAmount(response.data)
    // } catch (error) {
    // console.log(error);
    // }
    // };

    const paymentMethods = [
        { label: "Efectivo", value: "Efectivo" },
        { label: "Transferencia", value: "Transferencia" },
    ];

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

    const originalPaymentPlanIds = useMemo(
        () =>
            new Set(
                getInitialPaymentItems(product)
                    .map((item: any) => String(item.plan || ""))
                    .filter(Boolean)
            ),
        [product]
    );

    const hasInactiveOriginalPricePlan = useMemo(
        () =>
            Array.from(originalPaymentPlanIds).some(
                (planId) => !activePricePlanIds.has(planId)
            ),
        [originalPaymentPlanIds, activePricePlanIds]
    );

    const normalPlanOptions = useMemo(
        () =>
            (plansSubType || [])
                .filter(
                    (matchedPlan: any) =>
                        originalPaymentPlanIds.has(String(matchedPlan.id)) ||
                        (matchedPlan?.deleted == null &&
                            matchedPlan?.is_active !== false &&
                            activePricePlanIds.has(String(matchedPlan.id)))
                )
                .map((matchedPlan: any) => ({
                    name: matchedPlan.name || matchedPlan.days || `Plan ${matchedPlan.id}`,
                    id: matchedPlan.id,
                })),
        [plansSubType, activePricePlanIds, originalPaymentPlanIds]
    );

    const getAvailablePlanOptions = (currentIndex: number) => {
        const selectedByOtherRows = new Set(
            paymentItems
                .filter((_, index) => index !== currentIndex)
                .map((item) => String(item.plan || ""))
                .filter(Boolean)
        );

        return normalPlanOptions.filter(
            (option) => !selectedByOtherRows.has(String(option.id))
        );
    };

    const selectedPlanIds = useMemo(
        () => Array.from(new Set(paymentItems.map((item) => String(item.plan || "")).filter(Boolean))),
        [paymentItems]
    );
    const hasAvailablePlan = normalPlanOptions.some(
        (option) => !selectedPlanIds.includes(String(option.id))
    );
    const appliedCombo = comboPreview?.applied_combos?.[0];
    const comboApplies = Array.isArray(comboPreview?.applied_combos) && comboPreview.applied_combos.length > 0;
    const comboDiscountPct = appliedCombo?.discount_pct ?? null;
    const comboName = appliedCombo?.combo_name || "Combo/descuento aplicable";
    const baseTotal = paymentItems.reduce(
        (total, item) => total + Number(item.amountValue || 0),
        0
    );
    const comboDiscountAmount = comboApplies
        ? paymentItems.reduce((total, item) => {
            const previewPlan = comboPreview?.plans?.find(
                (previewItem: any) => String(previewItem.id) === String(item.plan)
            );
            return total + Number(item.amountValue || 0) * Number(previewPlan?.discount_pct || 0) / 100;
        }, 0)
        : 0;
    const finalTotal = Math.max(0, baseTotal - comboDiscountAmount);

    const canSelectStudio = ["Administrador", "ADMIN", "Admin", "Super", "SUPER"].includes(String(tipo));

    const originalPaymentStudioId =
        product?.studio_id ||
        (typeof product?.studio === "number" || typeof product?.studio === "string" ? product.studio : product?.studio?.id) ||
        product?.type?.studio_id ||
        (typeof product?.type?.studio === "number" || typeof product?.type?.studio === "string" ? product.type.studio : product?.type?.studio?.id) ||
        product?.person?.studio_id ||
        (typeof product?.person?.studio === "number" || typeof product?.person?.studio === "string" ? product.person.studio : product?.person?.studio?.id);
    const originalPaymentStudio = studios?.find(
        (studio: any) => String(studio.id) === String(originalPaymentStudioId)
    );
    const isHistoricalStudioLocked =
        Boolean(originalPaymentStudio) && !isSelectableStudio(originalPaymentStudio);

    const studioOptions =
        studios
            ?.filter((studio: any) =>
                isSelectableStudio(studio) ||
                String(studio.id) === String(originalPaymentStudioId)
            )
            .map((studio: any) => ({
                value: studio.id,
                label: studio.name,
            })) || [];

    const getPaymentStudioId = () => {
        if (canSelectStudio) return paymentStudio ? String(paymentStudio) : "";

        if (tipo === "Consultor") {
            return selectedStudioFromHeader?.id ? String(selectedStudioFromHeader.id) : "";
        }

        return selectedStudioFromHeader?.id ? String(selectedStudioFromHeader.id) : paymentStudio ? String(paymentStudio) : "";
    };

    const validatePaymentStudio = () => {
        if (getPaymentStudioId()) return true;

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
    };

    const formatLocalDateTime = (value: string | Date) => {
        const d = new Date(value);

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    };

    const handleSubmitPayment = async (code) => {
        setLoading(true)
        if (!validatePaymentStudio()) return;

        const fechaSinZona = formatLocalDateTime(date);

        const hasInvalidItem = paymentItems.some((item) => !item.plan || !item.amountValue);
        const hasDuplicates = new Set(paymentItems.map((item) => String(item.plan))).size !== paymentItems.length;

        if (!idStudent?.id || !paymentMethod || hasInvalidItem) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (hasDuplicates) {
            toast({
                title: "Planes repetidos.",
                description: "No puedes agregar el mismo plan más de una vez.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        try {
            const items = paymentItems.map((item) => ({
                ...(item.id ? { id: item.id } : {}),
                plans_subtype_id: Number(item.plan),
                base_amount: Number(item.amountValue),
            }));

            const payload = {
                person_id: idStudent.id,
                method: paymentMethod,
                items,
                observation,
                date: inputDate || fechaSinZona,
                code,
                studio: getPaymentStudioId(),
            };

            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS}${idPayment}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // onOpenAlertDialog();
            toast({
                title: "Pago editado correctamente.",
                description: "El pago y sus planes fueron editados con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            // getPeoples();
            dispatch(getPayments());
            dispatch(getPaymentsLastMonth())

        } catch (error: any) {

            const errorMessage = getPaymentErrorMessage(
                error.response?.data,
                "Ocurrió un error al editar el pago."
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
            setLoading(false)
        }
    }

    useEffect(() => {
        dispatch(getPeoples())
        dispatch(getPaymentAmount())
        dispatch(getPlanSubType())
        dispatch(getPayments())
        dispatch(getPaymentsLastMonth())
        dispatch(getStudios())

    }, [dispatch]);

    const handleSelectChange = (selectedOption) => {
        setHasUserInteracted(true);
        if (selectedOption) {
            // Actualizamos el estado con el `id` y `name` del plan seleccionado
            setPlan({ id: selectedOption.id, name: selectedOption.name });
        } else {
            // Si no se selecciona nada, se limpia el estado
            setPlan({ id: "", name: "" });
        }
    };

    const addPaymentItem = () => {
        if (!hasAvailablePlan || hasInactiveOriginalPricePlan) return;
        setPaymentItems((prev) => [...prev, { id: null, plan: "", amountValue: "" }]);
    };

    const removePaymentItem = (index: number) => {
        setPaymentItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const getPlanPriceByMethod = (planId: string, method: string) => {
        const normalizedMethod = String(method || "").trim().toLowerCase();
        const configuredAmount = (amounts || []).find(
            (item: any) =>
                item?.deleted == null &&
                String(
                    item?.plans_subtype?.id ??
                    item?.plans_subtype ??
                    item?.plan?.id ??
                    item?.plan
                ) === String(planId) &&
                String(item?.method || "").trim().toLowerCase() === normalizedMethod
        );

        if (configuredAmount?.amount !== null && configuredAmount?.amount !== undefined) {
            return String(configuredAmount.amount);
        }

        const selectedPlan = (plansSubType || []).find(
            (item: any) => String(item.id) === String(planId)
        );
        if (!selectedPlan || !method) return "";

        const planPrice = normalizedMethod === "efectivo"
            ? selectedPlan.price_cash
            : selectedPlan.price_transfer;

        return planPrice !== null && planPrice !== undefined ? String(planPrice) : "";
    };

    const updatePaymentItemPlan = (index: number, selectedPlanId: string) => {
        setHasUserInteracted(true);

        const selectedAmount = getPlanPriceByMethod(selectedPlanId, paymentMethod);

        setPaymentItems((prev) =>
            prev.map((item, currentIndex) =>
                currentIndex === index
                    ? {
                        ...item,
                        plan: selectedPlanId,
                        amountValue: selectedAmount,
                    }
                    : item
            )
        );
    };

    const updatePaymentItemAmount = (index: number, value: string) => {
        setPaymentItems((prev) =>
            prev.map((item, currentIndex) =>
                currentIndex === index ? { ...item, amountValue: value } : item
            )
        );
    };

    const updatePaymentMethod = (nextMethod: string) => {
        setHasUserInteracted(true);
        setPaymentMethod(nextMethod);
        setPaymentItems((prev) =>
            prev.map((item) => {
                if (!item.plan || !nextMethod) return item;

                const nextAmount = getPlanPriceByMethod(item.plan, nextMethod);
                return {
                    ...item,
                    // Un pago histórico puede no tener un precio vigente configurado.
                    // En ese caso conservamos el monto que ya tenía cargado.
                    amountValue: nextAmount || item.amountValue,
                };
            })
        );
    };


    useEffect(() => {
        if (!product || hasUserInteracted) return;

        if (Array.isArray(product?.items) && product.items.length > 0) {
            setPaymentMethod(normalizePaymentMethod(product?.method));
            setPaymentItems(getInitialPaymentItems(product));
            return;
        }

        const amountRecord = getPaymentAmountRecord(product, amounts);
        const firstPaymentItem = Array.isArray(product?.items) ? product.items[0] : null;
        const resolvedPlanId = getPaymentPlanId(product) || getPaymentPlanId(amountRecord);
        const resolvedMethod = normalizePaymentMethod(
            product?.method ||
            product?.amount?.method ||
            firstPaymentItem?.method ||
            firstPaymentItem?.amount?.method ||
            amountRecord?.method
        );
        const resolvedAmount =
            product?.amount_value ??
            product?.amount?.amount ??
            firstPaymentItem?.amount_value ??
            firstPaymentItem?.amount?.amount ??
            amountRecord?.amount ??
            (firstPaymentItem ? firstPaymentItem.amount : product?.amount) ??
            "";

        const selectedPlan = (plansSubType || []).find(
            (planItem: any) => String(planItem.id) === String(resolvedPlanId)
        );

        setPaymentMethod(resolvedMethod);
        setAmount(resolvedAmount);
        setPlan({
            id: resolvedPlanId,
            name: selectedPlan?.name || selectedPlan?.days || "",
        });
        setPaymentItems([{ id: null, plan: resolvedPlanId, amountValue: resolvedAmount }]);
    }, [product, amounts, plansSubType, hasUserInteracted]);

    useEffect(() => {
        if (selectedPlanIds.length < 2) {
            setComboPreview(null);
            setComboPreviewError("");
            setComboPreviewLoading(false);
            return;
        }

        const timeout = setTimeout(async () => {
            setComboPreviewLoading(true);
            setComboPreviewError("");

            try {
                const explicitBase = process.env.NEXT_PUBLIC_URL_BACKEND_COMBO_PREVIEW;
                const backendBase = process.env.NEXT_PUBLIC__URL_BACKEND?.trim().replace(/^["']|["']$/g, "");
                const baseUrl = explicitBase || `${backendBase || ""}prices/combo-preview/`;
                const response = await axios.get(
                    `${baseUrl}?plans=${selectedPlanIds.join(",")}`,
                    { headers: { Authorization: `Bearer ${tokens?.access}` } }
                );
                setComboPreview(response.data);
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
    }, [selectedPlanIds, tokens?.access]);



    // // useEffect para manejar los cambios de `plan` y `paymentMethod`
    // useEffect(() => {
    // const selectedAmount = paymentAmount.find(
    // (item) => String(item.plan) === String(plan.id) && item.method === paymentMethod
    // );

    // if (selectedAmount) {
    // setAmountId(selectedAmount.id);
    // setAmountValue(selectedAmount.amount);
    // } else {
    // setAmountId("");
    // setAmountValue("");
    // }
    // }, [plan, paymentMethod]);

    useEffect(() => {
        if (amount && amountValue === "") {
            setAmountValue(amount); // amount = "12000"
        }
    }, [amount, amountValue]);



    // Al cambiar la fecha: conserva la hora actual
    const handleChange = (event) => {
        const selectedDate = event.target.value;

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        const fullDate = `${selectedDate}T${hh}:${mm}:${ss}`;
        setDate(selectedDate);
        setInputDate(fullDate);
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

                <Modal
                    onClose={onCloseModalCode}
                    isOpen={isAlertCodeOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w={"100%"} h={"100%"} />
                    <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }} mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}>
                        <ModalCloseButton />
                        <ModalCode
                            onClose={onCloseModalCode}
                            get={getPeoples}
                            onCloseAlert={onClose}
                            entityType={"paymentEdit"}
                            action={handleSubmitPayment}
                        />
                    </ModalContent>
                </Modal>

                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Editar pago
                </Heading>

                {hasInactiveOriginalPricePlan && (
                    <Box
                        border="1px solid"
                        borderColor="orange.300"
                        bg="orange.50"
                        color="orange.800"
                        borderRadius="md"
                        px={4}
                        py={3}
                        mb={4}
                    >
                        <Text fontWeight="700">Datos económicos protegidos</Text>
                        <Text fontSize="sm">
                            Este pago contiene un plan sin precios activos. El método, los planes y los montos no pueden modificarse.
                        </Text>
                    </Box>
                )}

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    {tipo !== "Consultor" && (
                        <Box>
                            <FormControl id="date" isRequired>
                                <FormLabel>Fecha</FormLabel>
                                <Input
                                    w="100%"
                                    type="date"
                                    h="40px"
                                    value={date.split("T")[0].split("/").reverse().join("-")}
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
                                value={idStudent ? {
                                    label: `${idStudent.name} ${idStudent.last_name} - ${idStudent.dni}`, // Muestra el mismo formato que en las opciones
                                    value: idStudent.id // Asegúrate de pasar el ID como 'value'
                                } : null}
                                options={peoples
                                    .filter((person) => person.deleted === null)
                                    .map((person) => ({
                                        label: `${person.name} ${person.last_name} - ${person.dni}`,
                                        value: person.id,
                                        name: person.name,
                                        last_name: person.last_name,
                                        dni: person.dni,
                                    }))
                                }
                                onChange={(selectedOption: any) =>
                                    setIdStudent({
                                        id: selectedOption.value,
                                        name: selectedOption.name,
                                        last_name: selectedOption.last_name,
                                        dni: selectedOption.dni,
                                    })
                                }
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
                                    updatePaymentMethod(selectedOption?.value || "")
                                }
                                value={paymentMethods.find((option) => option.value === paymentMethod) || null}
                                isDisabled={hasInactiveOriginalPricePlan}
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
                                    isDisabled={isHistoricalStudioLocked}
                                    value={
                                        studioOptions.find(
                                            (option: any) => String(option.value) === String(paymentStudio)
                                        ) || null
                                    }
                                    onChange={(selectedOption: any) =>
                                        setPaymentStudio(selectedOption?.value ? String(selectedOption.value) : "")
                                    }
                                />
                                {isHistoricalStudioLocked && (
                                    <Text mt={1} fontSize="xs" color="orange.600">
                                        El estudio histórico no está habilitado y no puede cambiarse.
                                    </Text>
                                )}
                            </FormControl>
                        </Box>
                    )}

                    {observation !== null &&
                        <Box>
                            <FormControl id="observation" isRequired>
                                <FormLabel>Observación</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    placeholder="Escribir..."
                                    min="0"
                                    h={"40px"}
                                    value={observation}
                                    maxLength={100} // Limita la entrada a 30 caracteres
                                    onChange={(event) => setObservation(event.target.value)}
                                // value={
                                // paymentAmount.find(
                                // (item) => item.plan === plan && item.method === paymentMethod
                                // )?.amount || ''
                                // }
                                // value={amountValue}
                                // isDisabled
                                />
                            </FormControl>
                        </Box>
                    }
                </SimpleGrid>

                <Box>
                    <Flex justify="space-between" align="center" mb={3} gap={3}>
                        <Text fontWeight="600" fontSize="lg">
                            Planes a pagar
                        </Text>
                        <Button
                            size="sm"
                            onClick={addPaymentItem}
                            isDisabled={hasInactiveOriginalPricePlan || !hasAvailablePlan}
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
                                        <FormControl id={`plan-${index}`} isRequired>
                                            <FormLabel>Plan</FormLabel>
                                            <Select2
                                                h="40px"
                                                w="100%"
                                                placeholder="Seleccionar"
                                                value={
                                                    normalPlanOptions.find(
                                                        (option: any) => String(option.id) === String(item.plan)
                                                    ) || null
                                                }
                                                onChange={(selectedOption: any) =>
                                                    updatePaymentItemPlan(index, selectedOption?.id || "")
                                                }
                                                isDisabled={hasInactiveOriginalPricePlan}
                                                options={getAvailablePlanOptions(index)}
                                                getOptionLabel={(e: any) => e.name}
                                                getOptionValue={(e: any) => e.id}
                                            />
                                        </FormControl>
                                    </Box>

                                    <Box flex="1" w="100%">
                                        <FormControl id={`amount-${index}`} isRequired>
                                            <FormLabel>Monto</FormLabel>
                                            <Input
                                                w="100%"
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Escribir..."
                                                h="40px"
                                                value={formatAmount(item.amountValue, "")}
                                                isDisabled={observation === null || hasInactiveOriginalPricePlan}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    if (isValidAmountInput(value)) {
                                                        updatePaymentItemAmount(index, normalizeAmountInput(value));
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
                                            aria-label="Eliminar plan"
                                            icon={<DeleteIcon boxSize={3.5} />}
                                            onClick={() => removePaymentItem(index)}
                                            isDisabled={paymentItems.length === 1 || hasInactiveOriginalPricePlan}
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

                    {selectedPlanIds.length >= 2 && (
                        <Box
                            border="1px solid"
                            borderColor={comboApplies ? "success.border" : "border.subtle"}
                            bg={comboApplies ? "success.bg" : "bg.subtle"}
                            borderRadius="card"
                            boxShadow="none"
                            p={4}
                            mt={4}
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
                                            <Text fontSize="md" fontWeight="700">{comboName}</Text>
                                        </Box>
                                        {comboDiscountPct !== null && (
                                            <Badge colorScheme="green" fontSize="13px" px={2.5}>
                                                {comboDiscountPct}% OFF
                                            </Badge>
                                        )}
                                    </Flex>
                                    <Divider borderColor="success.border" />
                                    <Stack spacing={1.5}>
                                        <Flex justify="space-between">
                                            <Text fontSize="sm" color="text.secondary">Subtotal</Text>
                                            <Text fontSize="sm">{formatCurrency(baseTotal)}</Text>
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
                                                {formatCurrency(finalTotal)}
                                            </Text>
                                        </Flex>
                                    </Stack>
                                </Stack>
                            ) : comboPreviewError ? (
                                <Text fontSize="sm" color="warning.fg">{comboPreviewError}</Text>
                            ) : (
                                <Text fontSize="sm" color="text.secondary">
                                    No se encontró combo/descuento para los planes seleccionados.
                                </Text>
                            )}
                        </Box>
                    )}

                    <Divider my={4} />
                </Box>

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
                        // onClick={handleSubmitPayment}
                        onClick={() => (tipo !== "Consultor" ? handleSubmitPayment(code) : onOpenModalCode())}
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

export default ModalPaymentEdit;
