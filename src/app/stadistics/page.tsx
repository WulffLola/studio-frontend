'use client'
import { Badge, Box, Button, Container, Flex, Heading, HStack, Input, Modal, ModalCloseButton, ModalContent, ModalOverlay, Select, SimpleGrid, Spinner, Stack, Text, useDisclosure } from "@chakra-ui/react";
import Icon from '@mdi/react';
import { mdiAccountGroup, mdiAccountMultipleCheck, mdiCancel } from '@mdi/js';
import { useEffect, useState } from "react";
import axios from "axios";
import CancellationRate from "../components/CancellationRate";
import DatePicker from 'react-datepicker';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuthStore } from "../stores/auth";
import ModalActiveMembers from "../components/ModalActiveMembers";
import ModalDebtor from "../components/ModalDebtor";
import ModalInactiveMembers from "../components/ModalInactiveMembers";
import ModalCompletedPayments from "../components/ModalCompletedPayments";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getPaymentsStatusCurrentMonth,
    getStatusClients,
    getAverageAge,
    getAverageAgeByHour,
    getClientsByPlan,
    getPeakHours,
    getRetentionRate,
    getClientsByMonth,
} from '../stores/studioSlice';
import { formatAmount, formatCurrency } from "../utils/amount";
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";
import { StateMessage } from "../components/ui/StateMessage";
import { brandChartPalette } from "../../theme/brand";

const months = [
    { id: 1, name: "Enero" },
    { id: 2, name: "Febrero" },
    { id: 3, name: "Marzo" },
    { id: 4, name: "Abril" },
    { id: 5, name: "Mayo" },
    { id: 6, name: "Junio" },
    { id: 7, name: "Julio" },
    { id: 8, name: "Agosto" },
    { id: 9, name: "Septiembre" },
    { id: 10, name: "Octubre" },
    { id: 11, name: "Noviembre" },
    { id: 12, name: "Diciembre" }
];

// Etiqueta de eje X en hasta dos líneas: los nombres de planes pueden ser largos
// y todas las barras deben quedar identificadas (el nombre completo va en el tooltip).
const WrappedAxisTick = ({ x, y, payload, width, visibleTicksCount }: any) => {
    const label = String(payload?.value ?? "");
    const slot = width / Math.max(visibleTicksCount || 1, 1);
    const fontSize = slot < 64 ? 11 : 12;
    const maxChars = Math.max(4, Math.floor((slot - 10) / (fontSize * 0.62)));
    const lines: string[] = [];
    let current = "";
    label.split(/\s+/).forEach((word) => {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxChars || !current) current = next;
        else {
            lines.push(current);
            current = word;
        }
    });
    if (current) lines.push(current);
    const shown = lines.slice(0, 2);
    if (lines.length > 2 || (shown[1] && shown[1].length > maxChars)) {
        shown[1] = `${(shown[1] ?? "").slice(0, Math.max(maxChars - 1, 1)).trimEnd()}…`;
    }
    return (
        <text x={x} y={y + 12} textAnchor="middle" fontSize={fontSize} fill={brandChartPalette.axis}>
            {shown.map((line, index) => (
                <tspan key={index} x={x} dy={index === 0 ? 0 : fontSize + 2}>
                    {line}
                </tspan>
            ))}
        </text>
    );
};

// Estilo común de tooltips en gráficos.
const chartTooltipProps = {
    cursor: { fill: "rgba(109, 91, 166, 0.06)" },
    contentStyle: {
        borderRadius: 8,
        border: `1px solid ${brandChartPalette.grid}`,
        boxShadow: "0 6px 16px rgba(58, 58, 64, 0.10)",
        fontSize: 13,
        fontFamily: "inherit",
    },
    labelStyle: { color: brandChartPalette.label, fontWeight: 600 },
};

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const SectionHeader = ({ eyebrow, title, description }: any) => (
    <Box w="100%" pt={2}>
        <Text textStyle="overline" color="text.brand" mb={1}>
            {eyebrow}
        </Text>
        <Heading as="h2" size="lg">
            {title}
        </Heading>
        {description && (
            <Text color="text.secondary" fontSize="sm" mt={1}>
                {description}
            </Text>
        )}
    </Box>
);

const Panel = ({ children, onClick, cursor, hoverable = false }: any) => (
    <Box
        {...(onClick ? { as: "button" as const, type: "button" as const } : {})}
        textAlign="left"
        display="block"
        bg="bg.surface"
        p={{ base: 4, md: 5 }}
        borderRadius="card"
        border="1px solid"
        borderColor="border.subtle"
        boxShadow="card"
        w="100%"
        minW={0}
        onClick={onClick}
        cursor={cursor}
        _hover={hoverable ? { borderColor: "brand.200", bg: "bg.subtle" } : undefined}
        _focusVisible={{ boxShadow: "focusRing", outline: "none" }}
        transition="border-color 120ms ease, background-color 120ms ease"
    >
        {children}
    </Box>
);

const PanelTitle = ({ icon, title, subtitle }: any) => (
    <HStack spacing={3} align="flex-start" mb={4}>
        {icon && (
            <Flex
                align="center"
                justify="center"
                w="36px"
                h="36px"
                borderRadius="8px"
                bg="brand.50"
                color="brand.600"
                flexShrink={0}
            >
                <Icon path={icon} size={0.8} />
            </Flex>
        )}
        <Box textAlign="left">
            <Text textStyle="cardTitle" lineHeight="1.3">
                {title}
            </Text>
            {subtitle && (
                <Text color="text.muted" fontSize="13px" mt={0.5}>
                    {subtitle}
                </Text>
            )}
        </Box>
    </HStack>
);

const MetricLine = ({ label, value }: any) => (
    <HStack spacing={3} justify="space-between" align="center" bg="bg.subtle" px={3} py={2.5} borderRadius="control">
        <Text fontSize="13px" color="text.secondary" fontWeight={500}>
            {label}
        </Text>
        <Text fontSize="16px" color="text.primary" fontWeight={600}>
            {value}
        </Text>
    </HStack>
);

export default function Stadistics() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    // const [statusClients, setStatusClients] = useState([]);
    // const [paymentsStatusCurrentMonth, setPaymentsStatusCurrentMonth] = useState([]);
    // const [averageAge, setAverageAge] = useState([]);
    // const [averageAgeByHour, setAverageAgeByHour] = useState([]);
    // const [clientsByPlan, setClientsByPlan] = useState([]);
    const [mostProfitablePlan, setMostProfitablePlan] = useState([]);
    // const [peakHours, setPeakHours] = useState([]);
    // const [retentionRate, setRetentionRate] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState("");
    const [totalExpensesByType, setTotalExpensesByType] = useState([]);
    // const [clientsByMonth, setClientsByMonth] = useState([]);
    const [cancellationRateByMonth, setCancellationRateByMonth] = useState([]);
    const [marginBruto, setMarginBruto] = useState("");
    const [marginNeto, setMarginNeto] = useState("");
    const [selectedMonthCancellation, setSelectedMonthCancellation] = useState('');
    const [selectedYearCancellation, setSelectedYearCancellation] = useState('');
    const [isLoadingTotalExpensesByType, setIsLoadingTotalExpensesByType] = useState(false);
    const [errorTotalExpensesByType, setErrorTotalExpensesByType] = useState(null);
    const [isLoadingMostProfitablePlan, setIsLoadingMostProfitablePlan] = useState(false);
    const [errorMostProfitablePlan, setErrorMostProfitablePlan] = useState(null);
    const [isLoadingCancellationRate, setIsLoadingCancellationRate] = useState(false);
    const [errorCancellationRate, setErrorCancellationRate] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [startDateTotalExpensesByType, setStartDateTotalExpensesByType] = useState<string | null>(null);
    const [endDateTotalExpensesByType, setEndDateTotalExpensesByType] = useState<string | null>(null);
    const [startDateTotalExpenses, setStartDateTotalExpenses] = useState<string | null>(null);
    const [endDateTotalExpenses, setEndDateTotalExpenses] = useState<string | null>(null);
    const [isLoadingTotalExpenses, setIsLoadingTotalExpenses] = useState(false);
    const [errorTotalExpenses, setErrorTotalExpenses] = useState(null);
    const [startDateMarginBruto, setStartDateMarginBruto] = useState<string | null>(null);
    const [endDateMarginBruto, setEndDateMarginBruto] = useState<string | null>(null);
    const [isLoadingMarginBruto, setIsLoadingMarginBruto] = useState(false);
    const [errorMarginBruto, setErrorMarginBruto] = useState(null);
    const [startDateMarginNeto, setStartDateMarginNeto] = useState<string | null>(null);
    const [endDateMarginNeto, setEndDateMarginNeto] = useState<string | null>(null);
    const [isLoadingMarginNeto, setIsLoadingMarginNeto] = useState(false);
    const [errorMarginNeto, setErrorMarginNeto] = useState(null);
    const [isLoadingClientsByMonth, setIsLoadingClientsByMonth] = useState(false);
    const [errorClientsByMonth, setErrorClientsByMonth] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(true);

    const { paymentsStatusCurrentMonth, statusClients, averageAge, averageAgeByHour, clientsByPlan, peakHours, retentionRate, clientsByMonth } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();


    const {
        isOpen: isAlertOpenActiveMembers,
        onOpen: onOpenModalActiveMembers,
        onClose: onCloseModalActiveMembers,
    } = useDisclosure();

    const {
        isOpen: isAlertOpenInactiveMembers,
        onOpen: onOpenModalInactiveMembers,
        onClose: onCloseModalInactiveMembers,
    } = useDisclosure();

    const {
        isOpen: isAlertOpenCompletedPayments,
        onOpen: onOpenModalCompletedPayments,
        onClose: onCloseModalCompletedPayments,
    } = useDisclosure();


    const {
        isOpen: isAlertOpenDebtor,
        onOpen: onOpenModalDebtor,
        onClose: onCloseModalDebtor,
    } = useDisclosure();

    useEffect(() => {
        // Simulamos una carga de datos o componentes
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000); // Cambia este tiempo según tus necesidades

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchCancellationRate = async () => {
            if (selectedMonthCancellation && selectedYearCancellation) {
                setIsLoadingCancellationRate(true);
                setErrorCancellationRate(null);

                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_URL_BACKEND_CANCELLATION_RATE_BY_MONTH}${selectedYearCancellation}-${selectedMonthCancellation}`, {
                        headers: {
                            'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                            'Content-Type': 'application/json',
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Error al obtener los datos');
                    }
                    const result = await response.json();
                    setCancellationRateByMonth(result);
                } catch (error: any) {
                    setErrorCancellationRate(error?.message ?? "Error al obtener los datos");
                } finally {
                    setIsLoadingCancellationRate(false);
                }
            }
        };

        fetchCancellationRate();
    }, [selectedMonthCancellation, selectedYearCancellation, tokens?.access]);

    useEffect(() => {
        const fetchMostProfitablePlan = async () => {
            if (selectedYear) {
                setIsLoadingMostProfitablePlan(true);
                setErrorMostProfitablePlan(null);
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_URL_BACKEND_MOST_PROFITABLE_PLAN}${selectedYear}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    if (!response.ok) {
                        throw new Error('Error al obtener los datos');
                    }
                    const result = await response.json();

                    // Asegúrate de que el resultado es un array
                    if ((result)) {
                        setMostProfitablePlan(result.most_profitable_plan);
                    } else {
                        setMostProfitablePlan([]); // En caso de que no sea un array
                        console.error("La respuesta no es un array:", result);
                    }

                } catch (error) {
                    setErrorMostProfitablePlan(error.message);
                } finally {
                    setIsLoadingMostProfitablePlan(false);
                }
            }
        };

        fetchMostProfitablePlan();
    }, [selectedYear, tokens?.access]);


    useEffect(() => {
        if (!loading) {
            dispatch(getStatusClients());
            dispatch(getPaymentsStatusCurrentMonth());
            dispatch(getAverageAge());
            dispatch(getAverageAgeByHour());
            dispatch(getClientsByPlan());
            dispatch(getPeakHours());
            dispatch(getRetentionRate());
            dispatch(getClientsByMonth());
        }
    }, [dispatch, loading]);


    if (loading) {
        return (
            <FullPageLoader />
        );
    }

    const handleMonthCancallationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMonthCancellation(e.target.value);
    };

    const handleYearCancallationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYearCancellation(e.target.value);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMonth(e.target.value);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(e.target.value);
    };


    // // Función para formatear la fecha como yyyy.mm.dd
    // const formatDate = (date: Date | null) => {
    // if (!date) return null;
    // const year = date.getFullYear();
    // const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses van de 0 a 11, sumamos 1
    // const day = String(date.getDate()).padStart(2, '0');
    // return `${year}-${month}-${day}`;
    // };

    const handleDateChange = (setDateFunction) => (event) => {
        const date = event.target.value;

        // Verificar si la fecha está vacía
        if (!date) {
            setDateFunction(""); // Manejar el caso cuando no hay fecha
            setErrorMessage(""); // Limpiar el mensaje de error
            return;
        }

        // Comprobar si el formato de la fecha es válido (año debe tener 4 dígitos)
        const year = date.split("-")[0]; // Suponiendo que el formato es yyyy-mm-dd
        if (year.length !== 4 || isNaN(year)) {
            setErrorMessage("El año debe tener exactamente 4 dígitos."); // Establecer mensaje de error
            return; // Salir de la función si el año no es válido
        } else {
            setErrorMessage(""); // Limpiar el mensaje de error si el año es válido
        }

        // Intentar crear un nuevo objeto Date y verificar si es válido
        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) { // Verificar si la fecha es inválida
            console.error("Fecha inválida: ", date);
            return; // Salir de la función si la fecha es inválida
        }

        // Si la fecha es válida, formatearla como yyyy-mm-dd
        const formattedDate = parsedDate.toISOString().split("T")[0];
        setDateFunction(formattedDate);
    };

    // Funciones específicas de cambio de fecha..
    const handleStartDateMarginBrutoChange = handleDateChange(setStartDateMarginBruto);
    const handleEndDateMarginBrutoChange = handleDateChange(setEndDateMarginBruto);
    const handleStartDateMarginNetoChange = handleDateChange(setStartDateMarginNeto);
    const handleEndDateMarginNetoChange = handleDateChange(setEndDateMarginNeto);
    const handleStartDateTotalExpensesByTypeChange = handleDateChange(setStartDateTotalExpensesByType);
    const handleEndDateTotalExpensesByTypeChange = handleDateChange(setEndDateTotalExpensesByType);
    const handleStartDateTotalExpensesChange = handleDateChange(setStartDateTotalExpenses);
    const handleEndDateTotalExpensesChange = handleDateChange(setEndDateTotalExpenses);

    const handleSubmitTotalExpensesByType = async () => {
        setIsLoadingTotalExpensesByType(true);
        setErrorTotalExpensesByType(null);

        if (startDateTotalExpensesByType && endDateTotalExpensesByType) {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_URL_BACKEND_TOTAL_EXPENSES_BY_TYPE}?start_date=${startDateTotalExpensesByType}&end_date=${endDateTotalExpensesByType}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${tokens?.access}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                setTotalExpensesByType(response.data);
            } catch (error: any) {
                setErrorTotalExpensesByType(error?.message ?? "Error al obtener los gastos por tipo");
            } finally {
                setIsLoadingTotalExpensesByType(false);
            }
        } else {
            setErrorTotalExpensesByType("Seleccioná fecha de inicio y fin");
            setIsLoadingTotalExpensesByType(false);
        }
    };

    const handleSubmitTotalExpenses = async () => {
        setIsLoadingTotalExpenses(true);
        setErrorTotalExpenses(null);

        if (startDateTotalExpenses && endDateTotalExpenses) {
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_URL_BACKEND_TOTAL_EXPENSES}?start_date=${startDateTotalExpenses}&end_date=${endDateTotalExpenses}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${tokens?.access}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                setTotalExpenses(response.data);
            } catch (error: any) {
                setErrorTotalExpenses(error?.message ?? "Error al obtener el total de gastos");
            } finally {
                setIsLoadingTotalExpenses(false);
            }
        } else {
            setErrorTotalExpenses("Seleccioná fecha de inicio y fin");
            setIsLoadingTotalExpenses(false);
        }
    };

    const handleSubmitMarginBruto = async () => {
        setIsLoadingMarginBruto(true);
        setErrorMarginBruto(null);

        if (startDateMarginBruto && endDateMarginBruto) {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_MARGEN_BRUTO}?start_date=${startDateMarginBruto}&end_date=${endDateMarginBruto}`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                        'Content-Type': 'application/json',
                    },
                },
                    // {
                    // start_date: startDateTotalExpensesByType,
                    // end_date: endDateTotalExpensesByType,
                    // }
                );
                setMarginBruto(response.data);
            } catch (error) {
                console.error('Error fetching expenses:', errorMarginBruto);
            } finally {
                setIsLoadingMarginBruto(false);
            }
        } else {
            alert('Please select both start and end dates');
        }
    };

    const handleSubmitMarginNeto = async () => {
        setIsLoadingMarginNeto(true);
        setErrorMarginNeto(null);

        if (startDateMarginNeto && endDateMarginNeto) {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_MARGEN_NETO}?start_date=${startDateMarginNeto}&end_date=${endDateMarginNeto}`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                        'Content-Type': 'application/json',
                    },
                },
                    // {
                    // start_date: startDateTotalExpensesByType,
                    // end_date: endDateTotalExpensesByType,
                    // }
                );
                setMarginNeto(response.data);
            } catch (error) {
                console.error('Error fetching expenses:', errorMarginNeto);
            } finally {
                setIsLoadingMarginNeto(false);
            }
        } else {
            alert('Please select both start and end dates');
        }
    };

    const chartData =
        clientsByMonth?.new_clients_by_month?.map((client) => {
            const monthIndex =
                clientsByMonth?.new_clients_by_month?.findIndex(c => c.month === client.month) ?? -1;

            return {
                month: client.month.split('-').reverse().join('-'),
                cancellations: monthIndex !== -1
                    ? (clientsByMonth?.cancellations_by_month?.[monthIndex]?.total_cancellations ?? 0)
                    : 0,
                renewals: monthIndex !== -1
                    ? (clientsByMonth?.remained_active_by_month?.[monthIndex]?.total_remained_active ?? 0)
                    : 0,
                new_clients: client?.total_new_clients ?? 0,
            };
        }) ?? [];


    // Devuelve un array vacío si clientsByMonth es undefined

    // Mapea averageAgeByHour para estructurar el chartData
    const chartDataAverageAgeByHour = (averageAgeByHour ?? []).map((item) => ({
        timeSlot: item.appointments__slot__time_slot.slice(0, 5),
        averageAge: Math.round(Number(item.average_age)) || 0,
    }));

    const chartDataClientsByPlan = (clientsByPlan ?? []).map((item) => ({
        planName: item.plans_subtype__name,
        totalClients: item.total_clients,
    }));

    return (
        <>
            <Modal onClose={onCloseModalActiveMembers} isOpen={isAlertOpenActiveMembers} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}
            >
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent
                    maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
                    mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}  // Ajuste de margen superior
                >
                    <ModalCloseButton />
                    <ModalActiveMembers product={statusClients.active_clients} onClose={onCloseModalActiveMembers} />
                </ModalContent>
            </Modal>

            <Modal onClose={onCloseModalInactiveMembers} isOpen={isAlertOpenInactiveMembers} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}
            >
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent
                    maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
                    mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}  // Ajuste de margen superior
                >
                    <ModalCloseButton />
                    <ModalInactiveMembers product={statusClients.inactive_clients} onClose={onCloseModalInactiveMembers} />
                </ModalContent>
            </Modal>

            <Modal onClose={onCloseModalCompletedPayments} isOpen={isAlertOpenCompletedPayments} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}
            >
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent
                    maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
                    mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}  // Ajuste de margen superior
                >
                    <ModalCloseButton />
                    <ModalCompletedPayments product={paymentsStatusCurrentMonth.people_who_paid} onClose={onCloseModalCompletedPayments} />
                </ModalContent>
            </Modal>

            <Modal onClose={onCloseModalDebtor} isOpen={isAlertOpenDebtor} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}
            >
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent
                    maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
                    mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}  // Ajuste de margen superior
                >
                    <ModalCloseButton />
                    <ModalDebtor product={paymentsStatusCurrentMonth.people_who_didnt_pay} onClose={onCloseModalDebtor} />
                </ModalContent>
            </Modal>

            <PageContainer>
                <Stack spacing={4} w="100%" align="stretch">
                    <Flex
                        w="100%"
                        direction={{ base: "column", md: "row" }}
                        justify="space-between"
                        align={{ base: "flex-start", md: "flex-end" }}
                        gap={4}
                    >
                        <Text color="text.secondary" fontSize="sm">
                            Indicadores de alumnos, pagos, gastos y rendimiento del estudio.
                        </Text>
                        <HStack spacing={2} flexWrap="wrap">
                            <Badge bg="bg.surface" border="1px solid" borderColor="border.default" color="text.secondary">
                                Datos al cargar
                            </Badge>
                            {tipo && (
                                <Badge bg="brand.50" color="brand.700">
                                    {tipo}
                                </Badge>
                            )}
                        </HStack>
                    </Flex>

                    <SectionHeader
                        eyebrow="Resumen"
                        title="Estado general"
                        description="Lectura rápida de actividad, pagos y alumnos del mes."
                    />

                    <SimpleGrid columns={[1, 1, 3, 4, 5]} spacing={6} w={"100%"}>
                        {/* Miembros activos */}
                        <Panel onClick={onOpenModalActiveMembers} cursor="pointer" hoverable>
                            <PanelTitle icon={mdiAccountGroup} title="Miembros activos" subtitle="Alumnos vigentes" />
                            <Text fontSize="28px" fontWeight={600} lineHeight="1.1" color="text.primary">
                                {statusClients.total_active_clients || 0}
                            </Text>
                        </Panel>

                        {/* Miembros inactivos */}
                        <Panel onClick={onOpenModalInactiveMembers} cursor="pointer" hoverable>
                            <PanelTitle icon={mdiAccountGroup} title="Miembros inactivos" subtitle="Bajas o pausados" />
                            <Text fontSize="28px" fontWeight={600} lineHeight="1.1" color="text.primary">
                                {statusClients.total_inactive_clients || 0}
                            </Text>
                        </Panel>

                        {/* Registros pagos */}
                        <Panel onClick={onOpenModalCompletedPayments} cursor="pointer" hoverable>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Pagos realizados" subtitle="Mes actual" />
                            <Text fontSize="28px" fontWeight={600} lineHeight="1.1" color="text.primary">
                                {paymentsStatusCurrentMonth.people_who_paid_count || 0}
                            </Text>
                        </Panel>

                        {/* Deudores */}
                        <Panel onClick={onOpenModalDebtor} cursor="pointer" hoverable>
                            <PanelTitle icon={mdiCancel} title="Deudores" subtitle="Pendientes del mes" />
                            <Text fontSize="28px" fontWeight={600} lineHeight="1.1" color="text.primary">
                                {paymentsStatusCurrentMonth.people_who_didnt_pay_count || 0}
                            </Text>
                        </Panel>

                        {/* AVERAGE AVE  */}
                        <Panel>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Edad media" subtitle="Promedio general" />
                            <Text fontSize="28px" fontWeight={600} lineHeight="1.1" color="text.primary">
                                {averageAge ? Math.round(Number(averageAge.average_age)).toString() : "0"}
                            </Text>
                        </Panel>
                    </SimpleGrid>

                    {tipo !== "Consultor" && (
                        <>
                            <SectionHeader
                                eyebrow="Finanzas"
                                title="Gastos y márgenes"
                                description="Controlá egresos por período y revisá resultados económicos."
                            />

                            <SimpleGrid columns={[1, 1, 2]} spacing={6} w="100%">
                                <Panel>
                                    <PanelTitle
                                        icon={mdiAccountMultipleCheck}
                                        title="Total gastos por tipo"
                                        subtitle="Distribución de egresos en un rango de fechas"
                                    />

                                <Stack spacing={3}>
                                    <Text fontSize="sm" color="text.muted">Rango de fechas</Text>
                                    <HStack spacing={3} flexWrap={{ base: "wrap", md: "nowrap" }}>
                                        <Input
                                            type="date"
                                            value={startDateTotalExpensesByType ?? ""}
                                            bg="bg.surface"
                                            h="40px"
                                            onChange={handleStartDateTotalExpensesByTypeChange}
                                        />
                                        <Input
                                            type="date"
                                            value={endDateTotalExpensesByType ?? ""}
                                            bg="bg.surface"
                                            h="40px"
                                            onChange={handleEndDateTotalExpensesByTypeChange}
                                        />
                                    </HStack>

                                    <HStack spacing={3} justify="flex-end">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                setStartDateTotalExpensesByType("");
                                                setEndDateTotalExpensesByType("");
                                                setTotalExpensesByType([]);
                                                setErrorTotalExpensesByType(null);
                                            }}
                                        >
                                            Limpiar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmitTotalExpensesByType}
                                            isLoading={isLoadingTotalExpensesByType}
                                            isDisabled={!startDateTotalExpensesByType || !endDateTotalExpensesByType}
                                            variant="primary"
                                        >
                                            Buscar
                                        </Button>
                                    </HStack>

                                    {errorTotalExpensesByType && (
                                        <Text fontSize="13px" color="error.fg" mt={2}>{errorTotalExpensesByType}</Text>
                                    )}

                                    <Stack spacing={2}>
                                        {totalExpensesByType.length > 0 ? (
                                            totalExpensesByType.map((item: any, index) => (
                                                <Box key={index} bg="bg.subtle" px={3} py={2.5} borderRadius="control">
                                                    <HStack spacing={3} justify="space-between">
                                                        <Text fontSize="13px" fontWeight={500} color="text.secondary">{item.expense_type}</Text>
                                                        <Text fontWeight={600} color="text.primary">{formatCurrency(item.total_expenses, "0")}</Text>
                                                    </HStack>
                                                </Box>
                                            ))
                                        ) : (
                                            <Text color="text.muted">No hay datos cargados.</Text>
                                        )}
                                    </Stack>
                                </Stack>
                                </Panel>

                                <Panel>
                                    <PanelTitle
                                        icon={mdiAccountMultipleCheck}
                                        title="Total gastos"
                                        subtitle="Suma total de egresos para el período seleccionado"
                                    />

                                <Stack spacing={3}>
                                    <Text fontSize="sm" color="text.muted">Rango de fechas</Text>
                                    <HStack spacing={3} flexWrap={{ base: "wrap", md: "nowrap" }}>
                                        <Input
                                            type="date"
                                            value={startDateTotalExpenses ?? ""}
                                            bg="bg.surface"
                                            h="40px"
                                            onChange={handleStartDateTotalExpensesChange}
                                        />
                                        <Input
                                            type="date"
                                            value={endDateTotalExpenses ?? ""}
                                            bg="bg.surface"
                                            h="40px"
                                            onChange={handleEndDateTotalExpensesChange}
                                        />
                                    </HStack>

                                    <HStack spacing={3} justify="flex-end">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                setStartDateTotalExpenses("");
                                                setEndDateTotalExpenses("");
                                                setTotalExpenses("");
                                                setErrorTotalExpenses(null);
                                            }}
                                        >
                                            Limpiar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmitTotalExpenses}
                                            isLoading={isLoadingTotalExpenses}
                                            isDisabled={!startDateTotalExpenses || !endDateTotalExpenses}
                                            variant="primary"
                                        >
                                            Buscar
                                        </Button>
                                    </HStack>

                                    {errorTotalExpenses && (
                                        <Text fontSize="13px" color="error.fg" mt={2}>{errorTotalExpenses}</Text>
                                    )}

                                    <MetricLine
                                        label="Gastos totales"
                                        value={formatCurrency(totalExpenses?.total_expenses, "0")}
                                    />
                                </Stack>
                                </Panel>
                            </SimpleGrid>
                        </>
                    )}

                    <SectionHeader
                        eyebrow="Gráficos"
                        title="Comportamiento de alumnos"
                        description="Visualizá edad, planes y movimientos mensuales."
                    />

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} w="100%">
                        {/* AVERAGE AGE BY HOUR */}
                        <Panel>
                            <PanelTitle
                                icon={mdiAccountMultipleCheck}
                                title="Edad media por horario"
                                subtitle="Promedio de edad según franja horaria"
                            />
                            <Box h={{ base: "280px", md: "330px" }} w="100%" minW={0} display="flex" justifyContent="center" alignItems="center">
                                {chartDataAverageAgeByHour.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartDataAverageAgeByHour}
                                            margin={{ top: 24, right: 12, left: -12, bottom: 8 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={brandChartPalette.grid} />
                                            <XAxis dataKey="timeSlot" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: brandChartPalette.axis }} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: brandChartPalette.axis }}
                                                allowDecimals={false}
                                                domain={[
                                                    0,
                                                    Math.max(...chartDataAverageAgeByHour.map(data => data.averageAge)) + 10,
                                                ]}
                                            />
                                            <Tooltip {...chartTooltipProps} />
                                            <Bar dataKey="averageAge" fill={brandChartPalette.primary} name="Edad media" radius={[6, 6, 0, 0]} maxBarSize={52}>
                                                <LabelList dataKey="averageAge" position="top" fill={brandChartPalette.label} fontSize={12} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <StateMessage kind="empty" title="No hay datos" compact />
                                )}
                            </Box>
                        </Panel>

                        {/* CLIENTS BY PLAN */}
                        <Panel>
                            <PanelTitle
                                icon={mdiAccountMultipleCheck}
                                title="Clientes por plan"
                                subtitle="Distribución de alumnos por tipo de plan"
                            />
                            <Box h={{ base: "280px", md: "330px" }} w="100%" minW={0} display="flex" justifyContent="center" alignItems="center">
                                {chartDataClientsByPlan.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartDataClientsByPlan}
                                            margin={{ top: 24, right: 12, left: -12, bottom: 8 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={brandChartPalette.grid} />
                                            <XAxis dataKey="planName" axisLine={false} tickLine={false} interval={0} height={44} tick={<WrappedAxisTick />} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: brandChartPalette.axis }}
                                                allowDecimals={false}
                                            />
                                            <Tooltip {...chartTooltipProps} />
                                            <Bar dataKey="totalClients" fill={brandChartPalette.primary} name="Total de clientes" radius={[6, 6, 0, 0]} maxBarSize={52}>
                                                <LabelList dataKey="totalClients" position="top" fill={brandChartPalette.label} fontSize={12} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <StateMessage kind="empty" title="No hay datos" compact />
                                )}
                            </Box>
                        </Panel>

                        {/* CANCELATIONS, RENEWALS AND NEW CLIENTS */}
                        <Box gridColumn={{ base: "auto", lg: "span 2" }}>
                        <Panel>
                            <PanelTitle
                                icon={mdiAccountMultipleCheck}
                                title="Altas, bajas y renovaciones"
                                subtitle="Evolución mensual de movimientos"
                            />
                            <Box h={{ base: "320px", md: "380px" }} w="100%" minW={0} display="flex" justifyContent="center" alignItems="center">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 18, right: 12, left: -12, bottom: 8 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={brandChartPalette.grid} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: brandChartPalette.axis }} />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: brandChartPalette.axis }}
                                                allowDecimals={false}
                                                domain={[
                                                    0,
                                                    Math.max(...chartData.map(data =>
                                                        Math.max(data.cancellations, data.renewals, data.new_clients)
                                                    )) + 10,
                                                ]}
                                            />
                                            <Tooltip {...chartTooltipProps} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "13px", paddingTop: "12px", color: brandChartPalette.label }} />
                                            <Bar dataKey="cancellations" fill={brandChartPalette.negative} name="Bajas" radius={[4, 4, 0, 0]} maxBarSize={42} />
                                            <Bar dataKey="renewals" fill={brandChartPalette.secondary} name="Renovaciones" radius={[4, 4, 0, 0]} maxBarSize={42} />
                                            <Bar dataKey="new_clients" fill={brandChartPalette.primary} name="Altas" radius={[4, 4, 0, 0]} maxBarSize={42} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <StateMessage kind="empty" title="No hay datos" compact />
                                )}
                            </Box>
                        </Panel>
                        </Box>
                    </SimpleGrid>

                    <SectionHeader
                        eyebrow="Retención"
                        title="Seguimiento comercial"
                        description="Cancelaciones, renovaciones y planes con mejor rendimiento."
                    />

                    <SimpleGrid columns={[1, 1, 3]} spacing={6} w={"100%"}>
                        {/* RENOVACIONES */}
                        <Panel>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Renovaciones" subtitle="Clientes que permanecen activos" />
                            <Stack spacing={3}>
                                <MetricLine label="Total" value={retentionRate.retained_clients || 0} />
                                <MetricLine
                                    label="Porcentaje"
                                    value={`${retentionRate ? parseFloat(Number(retentionRate.retention_rate).toFixed(2)).toString() : "0"}%`}
                                />
                            </Stack>
                        </Panel>

                        {/* CANCELLATION RATE */}
                        <Panel>
                            <PanelTitle icon={mdiCancel} title="Cancelaciones" subtitle="Tasa mensual por período" />
                            <Box>
                                <Box mb={4}>
                                    <Select placeholder="Selecciona mes" onChange={handleMonthCancallationChange}>
                                        {months.map((month, index) => (
                                            <option key={index} value={month.id}>{month.name}</option>
                                        ))}
                                    </Select>
                                </Box>
                                <Box mb={4}>
                                    <Select placeholder="Selecciona año" onChange={handleYearCancallationChange}>
                                        {years.map((year, index) => (
                                            <option key={index} value={year}>{year}</option>
                                        ))}
                                    </Select>
                                </Box>
                                {isLoadingCancellationRate && <Text fontSize="13px" color="text.muted" mt={2}>Cargando datos...</Text>}
                                {errorCancellationRate && <Text fontSize="13px" color="error.fg" mt={2}>{errorCancellationRate}</Text>}

                                <Stack spacing={3}>
                                    <MetricLine label="Total de clientes" value={cancellationRateByMonth.total_clients || "0"} />
                                    <MetricLine label="Clientes cancelados" value={cancellationRateByMonth.cancelled_clients || "0"} />
                                    <MetricLine
                                        label="Tasa de cancelación"
                                        value={`${cancellationRateByMonth && !isNaN(cancellationRateByMonth.cancellation_rate)
                                            ? parseFloat(Number(cancellationRateByMonth.cancellation_rate).toFixed(2)).toString()
                                            : "0"}%`}
                                    />
                                </Stack>

                            </Box>
                        </Panel>
                        {/* Most profitable plan */}
                        <Panel>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Plan más rentable" subtitle="Ingreso por plan según año" />
                            <Box p={5}>
                                {/* <Box mb={4}>
                                    <Select placeholder="Selecciona mes" onChange={handleMonthChange}>
                                        {months.map((month, index) => (
                                            <option key={index} value={month.id}>
                                                {month.name}
                                            </option>
                                        ))}
                                    </Select>
                                </Box> */}

                                <Box mb={4}>
                                    <Select placeholder="Selecciona año" onChange={handleYearChange}>
                                        {years.map((year, index) => (
                                            <option key={index} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </Select>
                                </Box>

                                {isLoadingMostProfitablePlan && <Text fontSize="13px" color="text.muted" mt={2}>Cargando datos...</Text>}
                                {errorMostProfitablePlan && <Text fontSize="13px" color="error.fg" mt={2}>{errorMostProfitablePlan}</Text>}

                                <Flex wrap="wrap" justifyContent="flex-start" gap={4}>
                                    <Flex wrap="wrap" justifyContent="flex-start" gap={4}>
                                        {[mostProfitablePlan].map((item, index) => (
                                            <Box key={index} bg="bg.subtle" px={4} py={3} borderRadius="control" width="100%">
                                                <Text width="100%" fontSize="13px" color="text.secondary">{item.plans_subtype__name}</Text>
                                                <Text fontWeight={600} width="100%">
                                                    Total ingreso: {formatCurrency(item.total_income, "0")}
                                                </Text>
                                            </Box>
                                        ))}
                                    </Flex>
                                </Flex>

                            </Box>
                        </Panel>
                    </SimpleGrid>

                    <SectionHeader
                        eyebrow="Operación"
                        title="Rentabilidad y demanda"
                        description="Márgenes económicos y horarios con mayor movimiento."
                    />

                    <SimpleGrid columns={[1, 1, 3]} spacing={6} w="100%">
                        {/* Margin Bruto */}
                        <Panel>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Margen bruto" subtitle="Ingresos menos gastos operativos" />

                            {/* Selector de Fecha de Inicio */}
                            <Box mb={4}>
                                <Text fontSize="13px" color="text.primary" fontWeight={500} mb={1.5}>Fecha de inicio</Text>
                                <Input type="date" w="100%" h="40px" onChange={handleStartDateMarginBrutoChange} />
                            </Box>

                            {/* Selector de Fecha de Fin */}
                            <Box mb={4}>
                                <Text fontSize="13px" color="text.primary" fontWeight={500} mb={1.5}>Fecha de fin</Text>
                                <Input type="date" onChange={handleEndDateMarginBrutoChange} />
                            </Box>

                            {/* Botón para Enviar las Fechas */}
                            <Button w={["100%", "135px", "100%"]} onClick={handleSubmitMarginBruto} isLoading={isLoadingMarginBruto} variant="primary">
                                Buscar
                            </Button>

                            {isLoadingMarginBruto && <Text fontSize="13px" color="text.muted" mt={2}>Cargando datos...</Text>}
                            {errorMarginBruto && <Text fontSize="13px" color="error.fg" mt={2}>{errorMarginBruto}</Text>}

                            <Stack spacing={3} mt={5}>
                                <MetricLine label="Total ingresos" value={formatCurrency(marginBruto?.total_income, "0")} />
                                <MetricLine label="Total gastos" value={formatCurrency(marginBruto?.total_expenses, "0")} />
                                <MetricLine label="Margen bruto" value={formatCurrency(marginBruto?.gross_margin, "0")} />
                            </Stack>
                        </Panel>

                        {/* Margin Neto */}
                        <Panel>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Margen neto" subtitle="Resultado luego de salarios" />

                            <Box mb={4}>
                                <Text fontSize="13px" color="text.primary" fontWeight={500} mb={1.5}>Fecha de inicio</Text>
                                <Input type="date" w="100%" h="40px" onChange={handleStartDateMarginNetoChange} />
                            </Box>
                            <Box mb={4}>
                                <Text fontSize="13px" color="text.primary" fontWeight={500} mb={1.5}>Fecha de fin</Text>
                                <Input type="date" onChange={handleEndDateMarginNetoChange} />
                            </Box>

                            <Button w={["100%", "135px", "100%"]} onClick={handleSubmitMarginNeto} isLoading={isLoadingMarginNeto} variant="primary">
                                Buscar
                            </Button>

                            {isLoadingMarginNeto && <Text fontSize="13px" color="text.muted" mt={2}>Cargando datos...</Text>}
                            {errorMarginNeto && <Text fontSize="13px" color="error.fg" mt={2}>{errorMarginNeto}</Text>}

                            <Stack spacing={3} mt={5}>
                                <MetricLine label="Total ingresos" value={formatCurrency(marginNeto?.total_income, "0")} />
                                <MetricLine label="Total salarios" value={formatCurrency(marginNeto?.total_salaries, "0")} />
                                <MetricLine label="Margen neto" value={formatCurrency(marginNeto?.net_margin, "0")} />
                            </Stack>
                        </Panel>

                        {/* Peak Hours */}
                        <Panel>
                            <PanelTitle icon={mdiAccountMultipleCheck} title="Horas pico" subtitle="Horarios con más demanda" />
                            <Stack spacing={3}>
                                {peakHours && peakHours.length > 0 ? (
                                    peakHours.map((item, index) => (
                                        <MetricLine
                                            key={index}
                                            label={item.slot__time_slot.slice(0, 5)}
                                            value={`${item.total_waiting} clientes`}
                                        />
                                    ))
                                ) : (
                                    <Flex justifyContent="center" alignItems="center" width="100%" minH="100px">
                                        <Text>No hay horas pico disponibles.</Text>
                                    </Flex>)}
                            </Stack>

                        </Panel>
                    </SimpleGrid>

                </Stack>
            </PageContainer>


        </>
    );
}
