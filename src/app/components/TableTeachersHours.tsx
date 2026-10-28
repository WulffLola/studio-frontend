import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogOverlay,
    Box,
    Button,
    HStack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    useToast,
    Tooltip,
    Tr,
    useDisclosure,
    Badge,
    Stack,
    Tfoot,
    Select,
    Spinner,
    Flex,
    Text,
    FormControl,
    FormLabel,
    Input,
    SimpleGrid,
} from "@chakra-ui/react";
import { formatCurrency } from "../utils/amount";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom } from '@mdi/js';
import ModalStudentEdit from "./ModalStudentEdit";
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import ModalTeacherEdit from "./ModalTeacherEdit";
import ModalPaymentsAmountEdit from "./ModalPaymentsAmountEdit";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getTeachers,
    getTeachersTurn,
    getSlots,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";

const ITEMS_PER_PAGE = 10;

const orderDays = [
    "LUNES",
    "MARTES",
    "MIÉRCOLES",
    "JUEVES",
    "VIERNES",
    "SÁBADO",
    "DOMINGO",
];

const TableTeachersHours = ({ list, onOpen }: { list: Array<any>; onOpen: () => void; }) => {

    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [code, setCode] = useState("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState<number | string>("");
    const [selectedMes, setSelectedMes] = useState<string>((new Date().getMonth() + 1).toString()); // Mes actual como id
    const [priceHours, setPriceHours] = useState<string>("");
    const [hour, setHour] = useState<number | string>("");
    const [total, setTotal] = useState("");
    const [days, setDays] = useState<string[]>([]);
    const [countDaysMonth, setCountDaysMonth] = useState<number[]>([]);
    const [countTeacherWorkDay, setCountTeacherWorkDay] = useState<number[]>([]);
    const [totalGeneral, setTotalGeneral] = useState(0);
    const [totalPriceHours, setTotalPriceHours] = useState<number[]>([]);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingCalcular, setLoadingCalcular] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { teachers, slots, teachersTurn } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const { tipo, tokens } = useAuthStore();

    const meses = [
        { id: "1", month: "Enero" },
        { id: "2", month: "Febrero" },
        { id: "3", month: "Marzo" },
        { id: "4", month: "Abril" },
        { id: "5", month: "Mayo" },
        { id: "6", month: "Junio" },
        { id: "7", month: "Julio" },
        { id: "8", month: "Agosto" },
        { id: "9", month: "Septiembre" },
        { id: "10", month: "Octubre" },
        { id: "11", month: "Noviembre" },
        { id: "12", month: "Diciembre" },
    ];

    const handleGuardar = async () => {
        setLoading(true);
        const formData = new FormData();

        formData.append('teacher_id', String(selectedTeacher));
        formData.append('month', selectedMes);
        formData.append('hour', String(hour));
        formData.append('total', String(totalGeneral));

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_HOURS}`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`,
                    'Content-Type': 'application/json',
                },
            });

            toast({
                title: "Hora creada correctamente.",
                description: "La hora de la profesora fue creada con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            dispatch(getTeachers());

        } catch (error: any) {

            if (error.response && Array.isArray(error.response.data) && error.response.data[0] === "Ya existe un registro para este mes y profesor.") {
                toast({
                    title: "Error",
                    description: "Ya existe un registro para este mes y profesor.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar la hora de la profesora.",
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

    const filteredItems = list;

    // function getUniqueDays(data: any[]) {
    // const days = [...new Set(data.map(item => item.week_day ? item.week_day.day : null))];
    // return days.filter(day => day !== null) as string[];
    // }

    function countDaysInMonth(data: any[], selectedMesId: number, uniqueDays: string[]): number[] {
        if (selectedMesId < 1 || selectedMesId > 12) {
            console.error("ID del mes inválido:", selectedMesId);
            return [];
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        const selectedYear = selectedMesId >= currentMonth ? currentYear : currentYear + 1;
        const selectedMonthIndex = selectedMesId - 1;

        const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();

        const dayCount: { [key: string]: number } = {};
        const normalizedDays = uniqueDays.map(day => day.toLowerCase());

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonthIndex, day);
            const weekDayName = date.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

            const dayIndex = normalizedDays.indexOf(weekDayName);

            if (dayIndex !== -1) {
                const originalDayName = uniqueDays[dayIndex];
                dayCount[originalDayName] = (dayCount[originalDayName] || 0) + 1;
            }
        }

        const orderedDayCount = uniqueDays.map(day => (
            dayCount[day] || 0
        ));

        return orderedDayCount;
    }

    const resetCalculation = () => {
        setDays([]);
        setCountDaysMonth([]);
        setCountTeacherWorkDay([]);
        setTotalPriceHours([]);
        setTotalGeneral(0);
        setHour("");
        setIsSaveDisabled(true);
    };

    // Paginación calculada sobre list (aunque la tabla muestra days)
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
    const emptyRowsCount = ITEMS_PER_PAGE - currentItems.length;

    const {
        isOpen: isAlertEditOpen,
        onOpen: onOpenModalEdit,
        onClose: onCloseModalEdit,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogDeleteOpen,
        onOpen: onOpenAlertDialogDelete,
        onClose: onCloseAlertDialogDelete,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogMethodDeleteOpen,
        onOpen: onOpenAlertDialogMethodDelete,
        onClose: onCloseAlertDialogMethodDelete,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogMethodOpen,
        onOpen: onOpenAlertDialogMethod,
        onClose: onCloseAlertDialogMethod,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogOpenNoExist,
        onOpen: onOpenAlertDialogNoExist,
        onClose: onCloseAlertDialogNoExist,
    } = useDisclosure();

    const cancelRef = React.useRef<any>();
    const toast = useToast();

    const handleRowDoubleClick = (itemId: number) => {
        const payment = list.find(payment => payment.id === itemId);
        if (payment) {
            setSelectedItem(payment);
            onOpenModalEdit();
            onCloseAlertDialogMethod();
        } else {
            onOpenAlertDialogNoExist();
            onCloseAlertDialogMethod();
        }
    };

    const handleCalcular = () => {
        if (!selectedTeacher || !selectedMes || !priceHours || Number(priceHours) <= 0) {
            toast({
                title: "Completá los datos",
                description: "Seleccioná una profesora, un período y un valor por hora válido.",
                status: "warning",
                duration: 3500,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setLoadingCalcular(true);

        const teacherTurns = (teachersTurn || []).filter(
            (turn: any) => String(turn?.teacher?.id ?? turn?.teacher) === String(selectedTeacher)
        );
        const uniqueDays: string[] = Array.from(
            new Set<string>(
                teacherTurns
                    .map((turn: any) => turn?.slot?.week_day?.day ?? turn?.week_day?.day ?? turn?.week_day)
                    .filter(Boolean)
                    .map((day: any) => String(day).toUpperCase())
            )
        ).sort((a, b) => orderDays.indexOf(a) - orderDays.indexOf(b));

        const workByDay = uniqueDays.map(
            (day) =>
                teacherTurns.filter((turn: any) => {
                    const turnDay =
                        turn?.slot?.week_day?.day ?? turn?.week_day?.day ?? turn?.week_day;
                    return String(turnDay).toUpperCase() === day;
                }).length
        );
        const dayCount = countDaysInMonth(slots, parseInt(selectedMes, 10), uniqueDays);
        const totalHoursArr = dayCount.map((item, index) => item * workByDay[index]);
        const totalHoursSum = totalHoursArr.reduce((acc, curr) => acc + curr, 0);
        const totalPriceHoursArr = totalHoursArr.map((hours) => hours * Number(priceHours));
        const calculatedTotal = totalPriceHoursArr.reduce((acc, curr) => acc + curr, 0);

        setDays(uniqueDays);
        setCountDaysMonth(dayCount);
        setCountTeacherWorkDay(workByDay);
        setTotalPriceHours(totalPriceHoursArr);
        setTotalGeneral(calculatedTotal);
        setHour(totalHoursSum);
        setIsSaveDisabled(uniqueDays.length === 0);
        setLoadingCalcular(false);

        if (uniqueDays.length === 0) {
            toast({
                title: "Sin horarios asignados",
                description: "La profesora seleccionada no tiene horarios configurados.",
                status: "info",
                duration: 3500,
                isClosable: true,
                position: "bottom-right",
            });
        }
    };

    useEffect(() => {
        dispatch(getTeachers());
        dispatch(getSlots());
        dispatch(getTeachersTurn());
        setLoadingTable(true);

        const timer = setTimeout(() => {
            setLoadingTable(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [dispatch]);

    // useEffect(() => {
    // const days = getUniqueDays(slots);
    // setDays(days);
    // }, [slots]);

    return (
        <>
            {(loading || loadingCalcular) && (
                <LoadingOverlay />
            )}

            {/* AlertDialog: No existe precio */}
            <AlertDialog
                isOpen={isAlertDialogOpenNoExist}
                onClose={onCloseAlertDialogNoExist}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            No hay cargado un precio con ese método de pago.
                        </AlertDialogBody>

                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={onCloseAlertDialogNoExist}
                                w={["100%", "135px"]}
                                variant="primary"
                            >
                                Aceptar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* AlertDialog método de edición (efectivo / transferencia) */}
            <AlertDialog
                isOpen={isAlertDialogMethodOpen}
                onClose={onCloseAlertDialogMethod}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>¿Desea editar el precio en efectivo o transferencia?</>
                            ) : (
                                <>No se ha seleccionado ninguna solicitud.</>
                            )}
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={() => handleRowDoubleClick(selectedItem?.ids.efectivo)}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Efectivo
                            </Button>
                            <Button
                                onClick={() => handleRowDoubleClick(selectedItem?.ids.transferencia)}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Transferencia
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Stack mt={5} mb={5} w="100%" spacing={5}>
                <Box>
                    <Text fontSize="lg" fontWeight="bold" color="text.primary">
                        Horas docentes
                    </Text>
                    <Text fontSize="sm" color="text.secondary">
                        Calculá y registrá las horas trabajadas durante el período.
                    </Text>
                </Box>

                <Box bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="card" p={{ base: 4, md: 5 }}>
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4} alignItems="end">
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold">Profesora</FormLabel>
                            <Select
                                placeholder="Seleccionar profesora"
                                value={selectedTeacher}
                                onChange={(e) => {
                                    setSelectedTeacher(e.target.value);
                                    resetCalculation();
                                }}
                                bg="bg.surface"
                            >
                                {teachers.map((teacher: any) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name} {teacher.last_name} - {teacher.dni}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold">Período</FormLabel>
                            <Select
                                value={selectedMes}
                                bg="bg.surface"
                                onChange={(e) => {
                                    setSelectedMes(e.target.value);
                                    resetCalculation();
                                }}
                            >
                                {meses.map((mes) => (
                                    <option key={mes.id} value={mes.id}>{mes.month}</option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="semibold">Valor por hora</FormLabel>
                            <Input
                                placeholder="$ 0"
                                type="number"
                                min={0}
                                value={priceHours}
                                onChange={(e) => {
                                    setPriceHours(e.target.value);
                                    resetCalculation();
                                }}
                                bg="bg.surface"
                            />
                        </FormControl>

                        <Button
                            onClick={handleCalcular}
                            isLoading={loadingCalcular}
                            loadingText="Calculando"
                            variant="primary"
                        >
                            Calcular horas
                        </Button>
                    </SimpleGrid>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    {[
                        {
                            label: "Días trabajados",
                            value: countDaysMonth.reduce((sum, value) => sum + value, 0).toLocaleString("es-AR"),
                        },
                        {
                            label: "Total de horas",
                            value: `${Number(hour || 0).toLocaleString("es-AR")} h`,
                        },
                        {
                            label: "Total a pagar",
                            value: formatCurrency(totalGeneral),
                        },
                    ].map((item) => (
                        <Box key={item.label} bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="card" p={5}>
                            <Text fontSize="sm" color="text.muted">{item.label}</Text>
                            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="text.primary" mt={1}>
                                {item.value}
                            </Text>
                        </Box>
                    ))}
                </SimpleGrid>

                <Box>
                    <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} mb={3}
                        direction={{ base: "column", md: "row" }}>
                        <Box>
                            <Text fontWeight="bold" color="text.primary">Detalle del cálculo</Text>
                            <Text fontSize="sm" color="text.secondary">Desglose de horas e importe por día.</Text>
                        </Box>
                        <Button
                            onClick={handleGuardar}
                            isDisabled={isSaveDisabled}
                            isLoading={loading}
                            w={{ base: "100%", md: "auto" }}
                            variant="primary"
                        >
                            Guardar registro
                        </Button>
                    </Flex>

                    <Box overflowX="auto" bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card">
                        <Table size="sm">
                            <Thead bg="bg.subtle">
                                <Tr>
                                    <Th>Día</Th>
                                    <Th textAlign="center">Días trabajados</Th>
                                    <Th textAlign="center">Horas por día</Th>
                                    <Th textAlign="center">Horas del mes</Th>
                                    <Th textAlign="right">Importe</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {loadingTable ? (
                                    <Tr><Td colSpan={5} textAlign="center" py={10}><Spinner size="sm" /></Td></Tr>
                                ) : days.length > 0 ? (
                                    days.map((day, index) => {
                                        const workedDays = countDaysMonth[index] || 0;
                                        const hoursPerDay = countTeacherWorkDay[index] || 0;
                                        const monthlyHours = workedDays * hoursPerDay;
                                        return (
                                            <Tr key={day}>
                                                <Td fontWeight="semibold">{day}</Td>
                                                <Td textAlign="center">{workedDays}</Td>
                                                <Td textAlign="center">{hoursPerDay}</Td>
                                                <Td textAlign="center">{monthlyHours}</Td>
                                                <Td textAlign="right" fontWeight="medium">
                                                    {formatCurrency(totalPriceHours[index] || 0)}
                                                </Td>
                                            </Tr>
                                        );
                                    })
                                ) : (
                                    <Tr>
                                        <Td colSpan={5} textAlign="center" py={12} color="text.muted">
                                            <Text fontWeight="semibold" color="text.secondary">Todavía no hay un cálculo</Text>
                                            <Text fontSize="sm" mt={1}>
                                                Seleccioná una profesora, completá el valor por hora y presioná “Calcular horas”.
                                            </Text>
                                        </Td>
                                    </Tr>
                                )}
                            </Tbody>
                            {days.length > 0 && (
                                <Tfoot>
                                    <Tr bg="bg.subtle" _hover={{ bg: "bg.subtle" }}>
                                        <Td colSpan={3} fontWeight="bold">TOTAL</Td>
                                        <Td textAlign="center" fontWeight="bold">{Number(hour || 0)} h</Td>
                                        <Td textAlign="right" fontWeight="bold">
                                            {formatCurrency(totalGeneral)}
                                        </Td>
                                    </Tr>
                                </Tfoot>
                            )}
                        </Table>
                    </Box>
                </Box>
            </Stack>

            {/* Si querés la misma zona de paginación que en TableStudents, podés descomentar esto
            y adaptar si tiene sentido paginar esta tabla. */}

            {/* 
            <Flex
                w="100%"
                px={4}
                py={2}
                align="center"
                justify="center"
                direction={{ base: "column", md: "row", lg: "row" }}
                gap={{ base: 3, md: 4, lg: 0 }}
            >
                <Box
                    w={{ base: "100%", md: "100%", lg: "33%" }}
                    display={{ base: "none", md: "block" }}
                />
                <Box
                    w={{ base: "100%", md: "100%", lg: "33%" }}
                    display="flex"
                    justifyContent="center"
                >
                    <Pagination
                        count={countPagination}
                        pageSize={ITEMS_PER_PAGE}
                        defaultPage={1}
                        onPageChange={setCurrentPage}
                    />
                </Box>
                <Box
                    w={{ base: "100%", md: "100%", lg: "33%" }}
                    display={{ base: "none", md: "block" }}
                />
            </Flex>
            */}
        </>
    );
};

export default TableTeachersHours;
