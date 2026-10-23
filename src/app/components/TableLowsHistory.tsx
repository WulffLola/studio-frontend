import React, { useEffect, useState } from "react";
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
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Flex,
} from '@chakra-ui/react';
import Icon from '@mdi/react';
import { mdiAccountGroup, mdiAccountMultipleCheck, mdiBankOutline, mdiCancel, mdiCash, mdiMagnify } from '@mdi/js';
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom, mdiClose } from '@mdi/js';
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import Pagination from "./Pagination";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getDeletedPeople,
    getSlots,
} from '../stores/studioSlice';
import { FiSearch } from "react-icons/fi";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";

type LowHistoryPerson = {
    id: number;
    name: string;
    last_name: string;
    dni: string;
    appointments: Array<any>;
};

type LowHistoryList = Record<string, LowHistoryPerson[]>;

const TableLowsHistory = ({ list }: { list: LowHistoryList }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    // const { isOpen, onOpen, onClose } = useDisclosure();
    const [isLoading, setIsLoading] = useState(false);
    const [errorPaymentsByDateRange, setErrorPaymentsByDateRange] = useState([]);
    const [isLoadingClean, setIsLoadingClean] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false); // Controla si se está filtrando por fecha
    const [cashRegister, setCashRegister] = useState("");
    // const [sortedData, setSortedData] = useState([]);

    const [totalEntradas, setTotalEntradas] = useState("0.00");
    const [totalSalidas, setTotalSalidas] = useState("0.00");
    const [totalSaldo, setTotalSaldo] = useState("0.00");
    const [totalEntradasEfectivo, setTotalEntradasEfectivo] = useState("0.00");
    const [totalEntradasTransferencia, setTotalEntradasTransferencia] = useState("0.00");
    const [totalSalidasEfectivo, setTotalSalidasEfectivo] = useState("0.00");
    const [totalSalidasTransferencia, setTotalSalidasTransferencia] = useState("0.00");
    const [calcularTotalEfectivo, setCalcularTotalEfectivo] = useState("0.00");
    const [calcularTotalTransferencia, setCalcularTotalTransferencia] = useState("0.00");
    const [isFiltered, setIsFiltered] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const { slots } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const ITEMS_PER_PAGE = 10;

    // const [shouldRefetch, setShouldRefetch] = useState(false);
    const [dateInTable, setDateInTable] = useState(false);
    const { tipo, tokens } = useAuthStore();
    const [loadingTable, setLoadingTable] = useState(false);


    const cancelRef = React.useRef();

    const {
        isOpen: isAlertDialogUndatedOpen,
        onOpen: onOpenAlertDialogUndated,
        onClose: onCloseAlertDialogUndated,
    } = useDisclosure();


    // const handleSubmitCashRegister = () => {
    // setDateInTable(true);
    // setIsLoading(true);
    // setErrorPaymentsByDateRange("");

    // if (startDate && endDate) {
    // axios
    // .get(
    // `${process.env.NEXT_PUBLIC_URL_BACKEND_CASH_REGISTER}?start_date=${startDate}&end_date=${endDate}`, {
    // headers: {
    // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
    // 'Content-Type': 'application/json',
    // },
    // }
    // )
    // .then((response) => {
    // setCashRegister(response.data);
    // setIsFiltered(true); // Activar el filtrado
    // })
    // .catch((error) => {
    // console.log(error);
    // setCashRegister("")
    // })
    // .finally(() => {
    // setIsLoading(false); // Desactivar el estado de carga
    // });
    // } else {
    // onOpenAlertDialogUndated();
    // }
    // };



    // useEffect(() => {
    // if (!cashRegister || cashRegister.length === 0) {
    // setSortedData([]); // Si cashRegister está vacío, limpia sortedData
    // return;
    // }

    // // Combina y ordena los datos basados en `cashRegister`
    // let combinedData = [];
    // if (tipo === "Consultor") {
    // combinedData = [
    // ...(cashRegister.payments || []).map(payment => ({
    // ...payment,
    // type: 'payments',
    // })),
    // ...(cashRegister.expenses_chicos || []).map(expense => ({
    // ...expense,
    // type: 'expenses_chicos',
    // })),
    // ];
    // } else {
    // combinedData = [
    // ...(cashRegister.payments || []).map(payment => ({
    // ...payment,
    // type: 'payments',
    // })),
    // ...(cashRegister.expenses || []).map(expense => ({
    // ...expense,
    // type: 'expenses',
    // })),
    // ];
    // }


const sortedData = Object.entries(list || {})
    .flatMap(([date, people]) =>
        (people || []).flatMap((person) => {
            if (person.appointments?.length > 0) {
                return person.appointments.map((appointment: any) => ({
                    id: `${date}-${person.id}-${appointment.id}`,
                    name: person.name,
                    last_name: person.last_name,
                    dni: person.dni,
                    slotId: appointment.slot,
                    deletedDate: date,
                }));
            }

            return [
                {
                    id: `${date}-${person.id}`,
                    name: person.name,
                    last_name: person.last_name,
                    dni: person.dni,
                    slotId: null,
                    deletedDate: date,
                },
            ];
        })
    )
    .sort(
        (a, b) =>
            new Date(b.deletedDate).getTime() - new Date(a.deletedDate).getTime()
    );


    const slotMap = new Map(
        slots.map((slot: any) => [
            slot.id,
            {
                time: slot.time_slot,
                day: slot.date,
            },
        ])
    );

    const filteredData = sortedData.filter((item) => {
        const slotInfo = slotMap.get(item.slotId);

        const fullName = `${item.name} ${item.last_name}`.toLowerCase();
        const name = `${item.name}`.toLowerCase();
        const last_name = `${item.last_name}`.toLowerCase();
        const fullNameReversed = `${item.last_name} ${item.name}`.toLowerCase();
        const dni = item.dni?.toString().toLowerCase() || "";
        const day = slotInfo?.day?.toLowerCase() || "";
        const time = slotInfo?.time?.toLowerCase() || "";

        // Convertimos fecha de baja a formato "DD/MM/YYYY"
        const formattedDeletedDate = formatDate(item.deletedDate).toLowerCase();

        const search = searchTerm.toLowerCase();

        return (
            fullName.includes(search) ||
            name.includes(search) ||
            last_name.includes(search) ||
            fullNameReversed.includes(search) ||
            dni.includes(search) ||
            day.includes(search) ||
            time.includes(search) ||
            formattedDeletedDate.includes(search)
        );
    });

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredData.length / ITEMS_PER_PAGE), 1);


    function formatDate(dateString) {
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Ajusta para la zona horaria local
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`; // Formato DD-MM-YYYY
    }

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


            <Stack mt={4} mb={2} w="100%">
                <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "flex-start", md: "center" }}
                    justify="space-between"
                    w="100%"
                    gap={4}
                >
                    {/* Izquierda: título + subtítulo */}
                    <Box>
                        <Text fontSize="sm" color="text.secondary">
                            Visualizá todas las cancelaciones de turnos realizadas
                        </Text>
                    </Box>

                    {/* Derecha: buscador + botón */}
                    <HStack
                        spacing={3}
                        w={{ base: "100%", md: "auto" }}
                        justify={{ base: "flex-end", md: "flex-end" }}
                        flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
                        pl={{ base: "", md: "10px" }}

                    >
                        {/* Buscador */}
                        <SearchField
                            w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
                            placeholder="Buscar…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </HStack>
                </Flex>
            </Stack>


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
                            {/* {dateInTable && <Th color="#FFFFFF">Fecha</Th>} */}
                            {/* {dateInTable && <Th color="#FFFFFF">Hora</Th>} */}
                            <Th color="text.primary" textAlign="center">Fecha de baja</Th>
                            <Th color="text.primary" textAlign="center">Alumno</Th>
                            <Th color="text.primary" textAlign="center">Turno</Th>
                            {/* <Th color="#FFFFFF">Horario</Th> */}
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={4} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => {
                                const slotInfo = slotMap.get(item.slotId);

                                return (
                                    <Tr key={item.id}>
                                        <Td textAlign="center">{formatDate(item.deletedDate)}</Td>
                                        <Td textAlign="center"><span>
                                            <strong>Nombre:</strong> {item.name}
                                            <br />
                                        </span>
                                            <span>
                                                <strong>Apellido:</strong> {item.last_name}
                                                <br />
                                            </span>
                                            <span>
                                                <strong>DNI:</strong> {item.dni}
                                                <br />
                                            </span></Td>
                                        {/* <Td>{slotInfo?.day || "-"}</Td> */}
                                        {/* <Td>{slotInfo?.time || "-"}</Td> */}
                                        <Td textAlign="center">
                                            <span>
                                                <strong>Día:</strong> {slotInfo?.day || "-"}
                                                <br />
                                            </span>
                                            <span>
                                                <strong>Horario:</strong> {slotInfo?.time || "-"}
                                                <br />
                                            </span>
                                        </Td>
                                    </Tr>
                                );
                            })
                        ) : (
                            <TableState kind="empty" colSpan={6} title="No se encontraron datos" />
                        )}
                    </Tbody>

                    {/*   <Tfoot h={"50px"} fontSize={"16px"}>
                        <Tr>
                            <Th color="text.primary"></Th>
                            <Th color="text.primary"></Th>
                            <Th color="text.primary"></Th>
                        </Tr>
                    </Tfoot> */}

                </Table>
            </Box>

            <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                    count={countPagination}
                    pageSize={ITEMS_PER_PAGE}
                    defaultPage={1}
                    onPageChange={setCurrentPage}
                />
            </Box>
        </>
    );
};

export default TableLowsHistory;
