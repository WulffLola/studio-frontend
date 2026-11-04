import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Heading,
    Stack,
    Input,
    useDisclosure,
    useToast,
    TableContainer,
    Tfoot,
    HStack,
    Text,
    SimpleGrid,
    Container,
    useFormControlStyles,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    Flex,
} from '@chakra-ui/react';
import Icon from '@mdi/react';
import { mdiAccountGroup, mdiAccountMultipleCheck, mdiBankOutline, mdiCancel, mdiCash } from '@mdi/js';
import axios from "axios";
import { FiPlus } from "react-icons/fi";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getPlanSubType,
    getStudios,
} from '../stores/studioSlice';
import { Select as Select2 } from "./ui/Select";
import { isSelectableStudio } from "../utils/studios";
import { formatAmount, formatCurrency } from "../utils/amount";
import { TableState } from "./ui/StateMessage";
import { useStudioStore } from "../stores/studio";

const getPlanSubTypeId = (item: any) => {
    if (!item) return "";

    if (item?.plan_subtype_id) return String(item.plan_subtype_id);
    if (item?.plans_subtype_id) return String(item.plans_subtype_id);

    if (typeof item?.plan_subtype === "number" || typeof item?.plan_subtype === "string") {
        return String(item.plan_subtype);
    }

    if (typeof item?.plans_subtype === "number" || typeof item?.plans_subtype === "string") {
        return String(item.plans_subtype);
    }

    if (item?.plan_subtype?.id) return String(item.plan_subtype.id);
    if (item?.plans_subtype?.id) return String(item.plans_subtype.id);

    if (typeof item?.plan === "number" || typeof item?.plan === "string") {
        return String(item.plan);
    }

    if (item?.plan?.id) return String(item.plan.id);

    return "";
};

const getPlanSubTypeName = (item: any, plansSubTypeMap: Map<string, any>) => {
    const planSubTypeId = getPlanSubTypeId(item);
    if (!planSubTypeId) return "";

    const planSubType = plansSubTypeMap.get(planSubTypeId);
    return planSubType?.name || planSubType?.days || "";
};

const getPaymentPlanOrComboName = (item: any, plansSubTypeMap = new Map<string, any>()): string => {
    if (item?.type !== "payments") return "-";

    const comboName = item?.combo_name || item?.combo?.name;
    if (comboName) return String(comboName);

    const itemNames = (Array.isArray(item?.items) ? item.items : [])
        .map((paymentItem: any) =>
            paymentItem?.plans_subtype?.name ||
            paymentItem?.plan_subtype?.name ||
            paymentItem?.plan_name ||
            paymentItem?.plan?.name ||
            paymentItem?.plan?.days ||
            getPlanSubTypeName(paymentItem, plansSubTypeMap)
        )
        .filter(Boolean);

    const uniqueItemNames = [...new Set(itemNames.map(String))];
    if (uniqueItemNames.length > 0) return uniqueItemNames.join(" + ");

    const explicitName =
        item?.plan_name ||
        item?.plan?.name ||
        item?.plan?.days;

    if (explicitName) return String(explicitName);

    const planSubTypeName = getPlanSubTypeName(item, plansSubTypeMap);
    if (planSubTypeName) return String(planSubTypeName);

    return item?.person?.plan?.name || item?.person?.plan?.days || "-";
};


const TableCashRegister = ({ onOpenExpense, onOpenPayment, shouldRefetch }: { onOpenExpense: () => void; onOpenPayment: () => void; shouldRefetch: boolean; }) => {

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    // const { isOpen, onOpen, onClose } = useDisclosure();
    const [isLoading, setIsLoading] = useState(false);
    const [errorPaymentsByDateRange, setErrorPaymentsByDateRange] = useState([]);
    const [isLoadingClean, setIsLoadingClean] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false); // Controla si se está filtrando por fecha
    const [cashRegister, setCashRegister] = useState("");
    const [sortedData, setSortedData] = useState([]);
    const [selectedStudio, setSelectedStudio] = useState<any>({
        value: "all",
        label: "Todos los estudios",
    });
    const selectedStudioFromHeader = useStudioStore((state) => state.selectedStudio);
    const studioStoreHasHydrated = useStudioStore((state) => state.hasHydrated);
    const studioFilterInitialized = React.useRef(false);

    const [isFiltered, setIsFiltered] = useState(false);

    // const [shouldRefetch, setShouldRefetch] = useState(false);
    const [dateInTable, setDateInTable] = useState(false);
    const { tipo, tokens } = useAuthStore();
    const isConsultant = tipo === "Consultor";
    const headerStudioValue = selectedStudioFromHeader?.id
        ? String(selectedStudioFromHeader.id)
        : "";
    const toast = useToast();
    const [loadingTable, setLoadingTable] = useState(false);
    const dispatch = useAppDispatch();
    const { plansSubType, studios } = useSelector((state: any) => state.studio);

    const studioOptions = [
        { value: "all", label: "Todos los estudios" },
        ...(studios || []).filter(isSelectableStudio).map((studio: any) => ({
            value: String(studio.id),
            label: studio.name,
        })),
    ];

    const studiosMap = useMemo(() => {
        const map = new Map<string, any>();
        (studios || []).forEach((studio: any) => {
            map.set(String(studio.id), studio);
        });
        return map;
    }, [studios]);

    const getTransactionStudioId = (item: any) => {
        if (item?.studio_id) return String(item.studio_id);
        if (typeof item?.studio === "number" || typeof item?.studio === "string") return String(item.studio);
        if (item?.studio?.id) return String(item.studio.id);
        if (item?.type?.studio_id) return String(item.type.studio_id);
        if (typeof item?.type?.studio === "number" || typeof item?.type?.studio === "string") return String(item.type.studio);
        if (item?.type?.studio?.id) return String(item.type.studio.id);
        if (item?.person?.studio_id) return String(item.person.studio_id);
        if (typeof item?.person?.studio === "number" || typeof item?.person?.studio === "string") return String(item.person.studio);
        if (item?.person?.studio?.id) return String(item.person.studio.id);
        if (item?.sourceType?.studio_id) return String(item.sourceType.studio_id);
        if (typeof item?.sourceType?.studio === "number" || typeof item?.sourceType?.studio === "string") return String(item.sourceType.studio);
        if (item?.sourceType?.studio?.id) return String(item.sourceType.studio.id);
        return "";
    };

    const getTransactionStudioName = (item: any) => {
        const explicitName =
            item?.studio_name ||
            item?.studio?.name ||
            item?.person?.studio_name ||
            item?.person?.studio?.name ||
            item?.sourceType?.studio_name ||
            item?.sourceType?.studio?.name;

        if (explicitName) return String(explicitName);

        const studioId = getTransactionStudioId(item);
        return studioId ? studiosMap.get(studioId)?.name || "-" : "-";
    };

    const plansSubTypeMap = useMemo(() => {
        const map = new Map();

        (plansSubType || []).forEach((planSubType: any) => {
            map.set(String(planSubType.id), planSubType);
        });

        return map;
    }, [plansSubType]);


    const cancelRef = React.useRef();

    const {
        isOpen: isAlertDialogUndatedOpen,
        onOpen: onOpenAlertDialogUndated,
        onClose: onCloseAlertDialogUndated,
    } = useDisclosure();


    const handleSubmitCashRegister = (studioValue = selectedStudio.value) => {
        setDateInTable(true);
        setIsLoading(true);
        setErrorPaymentsByDateRange("");

        if (startDate && endDate) {
            axios
                .get(
                    `${process.env.NEXT_PUBLIC_URL_BACKEND_CASH_REGISTER}`, {
                    params: {
                        start_date: startDate,
                        end_date: endDate,
                        ...(studioValue !== "all" ? { studio: studioValue } : {}),
                    },
                    headers: {
                        'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                        'Content-Type': 'application/json',
                    },
                }
                )
                .then((response) => {
                    setCashRegister(response.data);
                    setIsFiltered(true); // Activar el filtrado
                    if (response.data?.detail) {
                        toast({
                            title: "Estudio dado de baja",
                            description: response.data.detail,
                            status: "warning",
                            duration: 5000,
                            isClosable: true,
                            position: "bottom-right",
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                    setCashRegister("")
                })
                .finally(() => {
                    setIsLoading(false); // Desactivar el estado de carga
                });
        } else {
            onOpenAlertDialogUndated();
        }
    };



    useEffect(() => {
        if (!cashRegister || cashRegister.length === 0) {
            setSortedData([]); // Si cashRegister está vacío, limpia sortedData
            return;
        }

        // Combina y ordena los datos basados en `cashRegister`
        let combinedData = [];
        if (tipo === "Consultor") {
            combinedData = [
                ...(cashRegister.payments || []).map(payment => ({
                    ...payment,
                    sourceType: payment.type,
                    type: 'payments',
                })),
                // ...(cashRegister.expenses_chicos || []).map(expense => ({
                // ...expense,
                // type: 'expenses_chicos',
                // })),
            ];
        } else {
            combinedData = [
                ...(cashRegister.payments || []).map(payment => ({
                    ...payment,
                    sourceType: payment.type,
                    type: 'payments',
                })),
                ...(cashRegister.expenses || []).map(expense => ({
                    ...expense,
                    sourceType: expense.type,
                    type: 'expenses',
                })),
            ];
        }

        if (isConsultant && headerStudioValue) {
            combinedData = combinedData.filter(
                (item) => getTransactionStudioId(item) === headerStudioValue
            );
        }

        // Ordena la data por fecha
        const sortedCombinedData = [...combinedData].sort((a, b) => new Date(a.date || a.fecha) - new Date(b.date || b.fecha));
        setSortedData(sortedCombinedData);

    }, [cashRegister, headerStudioValue, isConsultant, tipo]);


    const fetchCashRegister = useCallback(async (studioValue: string = "all") => {
        const effectiveStudioValue = isConsultant ? headerStudioValue : studioValue;

        if (isConsultant && !effectiveStudioValue) {
            setCashRegister("");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const url = process.env.NEXT_PUBLIC_URL_BACKEND_CASH_REGISTER_TODAY;

            const response = await axios.get(url, {
                params: effectiveStudioValue !== "all" ? { studio: effectiveStudioValue } : undefined,
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                    'Content-Type': 'application/json',
                },
            });
            setCashRegister(response.data || "");
            if (response.data?.detail) {
                toast({
                    title: "Estudio dado de baja",
                    description: response.data.detail,
                    status: "warning",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            setErrorPaymentsByDateRange("Ocurrió un error al buscar los pagos.");
            setCashRegister(""); // Asegura que esté vacío en caso de error
        } finally {
            setIsLoading(false);
        }
    }, [headerStudioValue, isConsultant, toast, tokens?.access]);

    useEffect(() => {
        if (!studioStoreHasHydrated) return;

        if (studioFilterInitialized.current && !isConsultant) return;

        if (selectedStudioFromHeader?.id) {
            const initialStudio = {
                value: String(selectedStudioFromHeader.id),
                label: selectedStudioFromHeader.name,
            };
            setSelectedStudio(initialStudio);
            fetchCashRegister(initialStudio.value);
        }

        studioFilterInitialized.current = true;
    }, [fetchCashRegister, isConsultant, selectedStudioFromHeader, studioStoreHasHydrated]);

    const handleStudioChange = (option: any) => {
        const nextStudio = option || studioOptions[0];
        setSelectedStudio(nextStudio);

        if (isFiltering && startDate && endDate && tipo !== "Consultor") {
            handleSubmitCashRegister(nextStudio.value);
        } else {
            fetchCashRegister(nextStudio.value);
        }
    };


    // Función para limpiar y recargar los datos
    const handleClearAndFetch = () => {
        setStartDate("");
        setEndDate("");
        fetchCashRegister(selectedStudio.value);
        setDateInTable(false);
        setIsFiltered(false); // Restablece el filtro

        // Resetea los movimientos mientras se obtiene nuevamente la caja diaria.
        setCashRegister("");
        setSortedData([]);

        // Llama a fetchCashRegister para cargar datos iniciales

    };

    useEffect(() => {
        if (isFiltering && startDate && endDate && tipo !== "Consultor") {
            handleSubmitCashRegister(selectedStudio.value);
        } else {
            fetchCashRegister(selectedStudio.value);
        }
        // Los cambios de estudio se atienden en handleStudioChange.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchCashRegister, shouldRefetch]);

    useEffect(() => {
        dispatch(getPlanSubType());
        dispatch(getStudios());
    }, [dispatch]);

    function formatDate(dateString) {
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Ajusta para la zona horaria local
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`; // Formato DD-MM-YYYY
    }


    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0'); // Horas
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutos
        return `${hours}:${minutes}`; // Formato hh:mm
    };

    useEffect(() => {
        setLoadingTable(true)

        const timer = setTimeout(() => {
            setLoadingTable(false); // Desactiva loading después de 2 segundos
        }, 800); // Ajusta el tiempo en milisegundos

        return () => clearTimeout(timer);
    }, []);


    return (
        <>
            <AlertDialog
                isOpen={isAlertDialogUndatedOpen}
                onClose={onCloseAlertDialogUndated}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody fontStyle="Source Sans Pro">
                            Seleccione una fecha de inicio y de fin.

                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            {/* <Button
                onClick={onCloseAlertDialogDelete}
                w={"135px"}
                h={"40px"}
                bg={"#FFFFFF"}
                color="text.disabled"
                border={"1px solid #9FA5D8"}
                fontWeight={800}
               aria-label="Cancelar">
                Cancelar
              </Button> */}
                            <Button
                                onClick={onCloseAlertDialogUndated}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Cerrar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Stack spacing={4} mb={4} w="100%">
                {/* Título + acciones principales */}
                <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "stretch", md: "center" }}
                    justify="space-between"
                    w="100%"
                    gap={3}
                >
                    <Box flexShrink={0}>
                        <Text as="h2" textStyle="sectionTitle">
                            Caja
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de ingresos y egresos
                        </Text>
                    </Box>

                    <HStack spacing={2} justify={{ base: "stretch", md: "flex-end" }}>
                        {tipo !== "Consultor" && (
                            <Button
                                flex={{ base: 1, md: "initial" }}
                                leftIcon={<FiPlus />}
                                onClick={onOpenExpense}
                                variant="secondary"
                            >
                                Registrar Gasto
                            </Button>
                        )}

                        <Button
                            flex={{ base: 1, md: "initial" }}
                            leftIcon={<FiPlus />}
                            onClick={onOpenPayment}
                            variant="primary"
                        >
                            Registrar Pago
                        </Button>
                    </HStack>
                </Flex>

                {/* Filtros */}
                {tipo !== "Consultor" && (
                    <Flex gap={2} w="100%" wrap="wrap" align="center">
                        <Box w={{ base: "100%", md: "240px" }}>
                            <Select2
                                options={studioOptions}
                                value={selectedStudio}
                                onChange={handleStudioChange}
                                isClearable={false}
                                selectedOptionStyle="check"
                                appearance="filter"
                            />
                        </Box>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            aria-label="Fecha desde"
                            h="38px"
                            w={{ base: "calc(50% - 4px)", md: "170px" }}
                        />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            aria-label="Fecha hasta"
                            h="38px"
                            w={{ base: "calc(50% - 4px)", md: "170px" }}
                        />

                        <Button
                            flex={{ base: 1, md: "initial" }}
                            onClick={() => handleSubmitCashRegister()}
                            isLoading={isLoading}
                            isDisabled={!startDate || !endDate}
                            variant="secondary"
                        >
                            Buscar
                        </Button>

                        <Button
                            flex={{ base: 1, md: "initial" }}
                            onClick={handleClearAndFetch}
                            isLoading={isLoadingClean}
                            variant="ghost"
                        >
                            Limpiar
                        </Button>
                    </Flex>
                )}
            </Stack>




            {/* Tabla */}
            <Box
                overflowX="auto"
                mt={0}
                minH={"100%"}
                w={"100%"}
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="card"
                boxShadow="card"
            >
                <Table size={"sm"}>
                    <Thead>
                        <Tr>
                            {dateInTable && (
                                <Th color="text.primary">
                                    Fecha
                                </Th>
                            )}
                            {/* {dateInTable && <Th color="#FFFFFF">Hora</Th>} */}
                            <Th color="text.primary">
                                Descripción
                            </Th>
                            <Th color="text.primary">
                                Plan
                            </Th>
                            <Th color="text.primary">
                                Estudio
                            </Th>
                            <Th color="text.primary">
                                Tipo
                            </Th>
                            <Th color="text.primary">
                                Entradas
                            </Th>
                            {tipo !== "Consultor" && (
                                <Th color="text.primary">
                                    Salidas
                                </Th>
                            )}
                            <Th color="text.primary">
                                Saldo
                            </Th>
                        </Tr>
                    </Thead>

                    <Tbody style={{ overflowY: "scroll" }}>
                        {loadingTable ? ( // Mostrar "Cargando..." por defecto
                            <TableState kind="loading" colSpan={(dateInTable ? 1 : 0) + (tipo !== "Consultor" ? 7 : 6)} />
                        ) : sortedData.length > 0 ? (
                            sortedData.map((item) => {
                                let descripcion;
                                let plan = "-";
                                let entradas: number | string = "-";
                                let salidas: number | string = "-";

                                // Ajustar lógica según el tipo
                                if (item.type === "payments") {
                                    plan = getPaymentPlanOrComboName(item, plansSubTypeMap);
                                    descripcion = `Pago de ${item.person.name} ${item.person.last_name}`;
                                    entradas = !isNaN(parseFloat(item.amount))
                                        ? parseFloat(item.amount).toFixed(2)
                                        : "-"; // Handle potential NaN
                                } else if (item.type === "expenses" || item.type === "expenses_chicos") {
                                    descripcion = item.observation || "Sin observación";
                                    salidas = !isNaN(parseFloat(item.amount))
                                        ? parseFloat(item.amount).toFixed(2)
                                        : "-"; // Handle potential NaN
                                }

                                // Determina el color de fondo según el tipo
                                const bgColor = item.type === "payments" ? "success.bg" : "error.bg"; // Cambia el color aquí si deseas otro tono

                                return (
                                    <Tr key={item.id} bg={bgColor}>
                                        {dateInTable && (
                                            <Td>{formatDate(item.date)}</Td>
                                        )}
                                        {/* {dateInTable && <Td>{formatTime(item.date)}</Td>} */}
                                        <Td>{descripcion}</Td>
                                        <Td>{plan}</Td>
                                        <Td>{getTransactionStudioName(item)}</Td>
                                        <Td>{item.method}</Td>
                                        <Td>
                                            {entradas !== "-" ? formatCurrency(entradas) : entradas}
                                        </Td>
                                        {tipo !== "Consultor" && (
                                            <Td>
                                                {salidas !== "-" ? formatCurrency(salidas) : salidas}
                                            </Td>
                                        )}
                                        <Td></Td>
                                    </Tr>
                                );
                            })
                        ) : (
                            !loadingTable &&
                            sortedData.length === 0 && (
                                <TableState kind="empty" colSpan={(dateInTable ? 1 : 0) + (tipo !== "Consultor" ? 7 : 6)} title="No se encontraron datos" />
                            )
                        )}
                        {/* Aquí podrías agregar la lógica para mostrar filas vacías, si es necesario */}
                    </Tbody>

                    <Tfoot h={"50px"} fontSize={"16px"} >
                        <Tr>
                            {dateInTable && <Th></Th>}
                            <Th color="text.primary">
                                Totales
                            </Th>
                            <Th></Th>
                            <Th></Th>
                            <Th></Th>
                            <Th color="text.primary">
                                    {formatCurrency(cashRegister ? (cashRegister.total_ingresos_transferencia || 0) + (cashRegister.total_ingresos_efectivo || 0) : 0)}
                            </Th>
                            {tipo !== "Consultor" && (
                                <Th color="text.primary">
                                    {formatCurrency(cashRegister ? (cashRegister.total_gastos_transferencia || 0) + (cashRegister.total_gastos_efectivo || 0) : 0)}
                                </Th>
                            )}
                            <Th color="text.primary">
                                {formatCurrency(cashRegister?.caja_total || 0)}
                            </Th>
                        </Tr>
                    </Tfoot>
                </Table>
            </Box>



            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={{ base: 3, md: 4 }} mt={6} w={"100%"}>
                {/* Aquí se muestran las estadísticas de fetchCashRegister */}
                {tipo !== "Consultor" && (
                    <Box bg="bg.surface" p={4} border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" width="100%">
                        <Stack spacing={1.5}>
                            <HStack spacing={2} color="text.muted">
                                <Icon path={mdiCash} size={0.75} />
                                <Text fontSize="13px" fontWeight={500} color="text.secondary">Entradas Efectivo</Text>
                            </HStack>
                            <Text fontSize={{ base: "17px", md: "20px" }} fontWeight={600} color="text.primary" overflowWrap="anywhere" lineHeight="1.2">{formatCurrency(cashRegister?.total_ingresos_efectivo || 0)}</Text>
                        </Stack>
                    </Box>
                )}
                {tipo !== "Consultor" && (
                    <Box bg="bg.surface" p={4} border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" width="100%">
                        <Stack spacing={1.5}>
                            <HStack spacing={2} color="text.muted">
                                <Icon path={mdiCash} size={0.75} />
                                <Text fontSize="13px" fontWeight={500} color="text.secondary">Salidas Efectivo</Text>
                            </HStack>
                            <Text fontSize={{ base: "17px", md: "20px" }} fontWeight={600} color="text.primary" overflowWrap="anywhere" lineHeight="1.2">{formatCurrency(cashRegister?.total_gastos_efectivo || 0)}</Text>
                        </Stack>
                    </Box>
                )}

                <Box bg="bg.surface" p={4} border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" width="100%">
                    <Stack spacing={1.5}>
                            <HStack spacing={2} color="text.muted">
                                <Icon path={mdiCash} size={0.75} />
                                <Text fontSize="13px" fontWeight={500} color="text.secondary">Total Efectivo</Text>
                            </HStack>
                            <Text fontSize={{ base: "17px", md: "20px" }} fontWeight={600} color="text.brand" overflowWrap="anywhere" lineHeight="1.2">{formatCurrency(cashRegister?.diferencia_efectivo || 0)}</Text>
                        </Stack>
                </Box>

                {tipo !== "Consultor" && (
                    <Box bg="bg.surface" p={4} border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" width="100%">
                        <Stack spacing={1.5}>
                            <HStack spacing={2} color="text.muted">
                                <Icon path={mdiBankOutline} size={0.75} />
                                <Text fontSize="13px" fontWeight={500} color="text.secondary">Entradas Transferencia</Text>
                            </HStack>
                            <Text fontSize={{ base: "17px", md: "20px" }} fontWeight={600} color="text.primary" overflowWrap="anywhere" lineHeight="1.2">{formatCurrency(cashRegister?.total_ingresos_transferencia || 0)}</Text>
                        </Stack>
                    </Box>
                )}
                {tipo !== "Consultor" && (
                    <Box bg="bg.surface" p={4} border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" width="100%">
                        <Stack spacing={1.5}>
                            <HStack spacing={2} color="text.muted">
                                <Icon path={mdiBankOutline} size={0.75} />
                                <Text fontSize="13px" fontWeight={500} color="text.secondary">Salidas Transferencia</Text>
                            </HStack>
                            <Text fontSize={{ base: "17px", md: "20px" }} fontWeight={600} color="text.primary" overflowWrap="anywhere" lineHeight="1.2">{formatCurrency(cashRegister?.total_gastos_transferencia || 0)}</Text>
                        </Stack>
                    </Box>
                )}

                <Box bg="bg.surface" p={4} border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card" width="100%">
                    <Stack spacing={1.5}>
                            <HStack spacing={2} color="text.muted">
                                <Icon path={mdiBankOutline} size={0.75} />
                                <Text fontSize="13px" fontWeight={500} color="text.secondary">Total Transferencia</Text>
                            </HStack>
                            <Text fontSize={{ base: "17px", md: "20px" }} fontWeight={600} color="text.brand" overflowWrap="anywhere" lineHeight="1.2">{formatCurrency(cashRegister?.diferencia_transferencia || 0)}</Text>
                        </Stack>
                </Box>
            </SimpleGrid>

            {isFiltered &&
                cashRegister &&
                Array.isArray(cashRegister.detalles_por_dia) && (
                    <Box mt={8} w="100%">
                        {/* Título de bloque */}
                        <Text as="h2" textStyle="sectionTitle">
                            Resumen por día
                        </Text>
                        <Text fontSize="sm" color="text.secondary" mb={3}>
                            Totales de ingresos y egresos dentro del rango seleccionado
                        </Text>

                        {/* Contenedor de tabla con mismo estilo que la de arriba */}
                        <Box
                            overflowX="auto"
                            mt={0}
                            w="100%"
                            bg="bg.surface"
                            border="1px solid"
                            borderColor="border.subtle"
                            borderRadius="card"
                            boxShadow="card"
                        >
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr>
                                        <Th color="text.primary">
                                            Fecha
                                        </Th>
                                        <Th color="text.primary">
                                            Total ingresos
                                        </Th>
                                        <Th color="text.primary">
                                            Total gastos
                                        </Th>
                                        <Th color="text.primary">
                                            Total del día
                                        </Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {cashRegister.detalles_por_dia.length > 0 ? (
                                        cashRegister.detalles_por_dia.map((item) => (
                                            <Tr key={item.fecha}>
                                                <Td>{formatDate(item.fecha)}</Td>
                                                <Td>
                                                    {formatCurrency(item.total_ingresos)}
                                                </Td>
                                                <Td>
                                                    {formatCurrency(item.total_gastos)}
                                                </Td>
                                                <Td>
                                                    {formatCurrency(item.diferencia_dia)}
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <TableState kind="empty" colSpan={4} title="No hay datos disponibles" />
                                    )}
                                </Tbody>
                            </Table>
                        </Box>
                    </Box>
                )}

        </>
    );
};

export default TableCashRegister;
