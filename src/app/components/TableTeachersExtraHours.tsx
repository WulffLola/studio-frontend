import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, HStack, Modal, ModalCloseButton, ModalContent, ModalOverlay, Table, TableContainer, Tbody, Td, Th, Thead, useToast, Tooltip, Tr, useDisclosure, Badge, Stack, InputGroup, InputLeftElement, Input, InputRightElement, Flex, Spinner, AlertDialogHeader, Text, IconButton } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom, mdiMagnify, mdiClose } from '@mdi/js';
import Pagination from "./Pagination";
import ModalExtraHoursEdit from "./ModalExtraHoursEdit";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getExtraHours,
    getRooms,
} from '../stores/studioSlice';
import { FiPlus, FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";

const ITEMS_PER_PAGE = 10;

const TableTeachersExtraHours = ({ list, onOpen, }: { list: Array<any>; onOpen: () => void; }) => {

    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [code, setCode] = useState("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { extraHours, rooms } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const formatDayAndDate = (dateString: string) => {
        if (!dateString) return "-";

        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return "-";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const getDayName = (dateString: string) => {
        if (!dateString) return "-";

        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return "-";

        const days = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
        ];

        return days[date.getDay()];
    };

    // Ordenar por fecha (más reciente primero) SIN mutar `list`
    const sortedList = [...list].sort(
        (a, b) =>
            new Date(b?.slot?.date || 0).getTime() -
            new Date(a?.slot?.date || 0).getTime()
    );

    const filteredItems = sortedList.filter((item) => {
        const isActive = item.deleted === null ? "activo" : "dado de baja";

        const teacherName = `${item?.teacher?.name || ""} ${item?.teacher?.last_name || ""}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const teacherDni = (item?.teacher?.dni || "").toString().toLowerCase();

        const timeSlot = (item?.slot?.start_time || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const weekDay = getDayName(item?.slot?.date)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const formattedDate = formatDayAndDate(item?.slot?.date);

        const normalizedSearch = searchTerm
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        return (
            isActive.includes(normalizedSearch) ||
            teacherName.includes(normalizedSearch) ||
            teacherDni.includes(normalizedSearch) ||
            weekDay.includes(normalizedSearch) ||
            timeSlot.includes(normalizedSearch) ||
            formattedDate.includes(normalizedSearch)
        );
    });

    // Calcula el índice del primer y último elemento a mostrar
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);


    // Lógica para mantener siempre 8 filas
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
        isOpen: isAlertDialogOpenReturn,
        onOpen: onOpenAlertDialogReturn,
        onClose: onCloseAlertDialogReturn,
    } = useDisclosure();


    const cancelRef = React.useRef();
    const toast = useToast();

    // Function delete teacher
    const handleClickDelete = (item) => {
        onOpenAlertDialogDelete(item);
        setSelectedItem(item);
    };

    const handleClickEdit = (item) => {
        onOpenModalEdit();
        setSelectedItem(item);
    };

    const handleRowDoubleClick = (index, item) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleDelete = () => {
        setLoading(true);
        axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}${selectedItem.id}/`, {
            headers: {
                'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                'Content-Type': 'application/json',
            },
        })
            .then((data) => {
                toast({
                    title: "Hora extra dada de baja correctamente.",
                    description: "La hora extra fue eliminada con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogDelete();
                dispatch(getExtraHours());
            })
            .catch((error) => {
                console.error(error);
            }).finally(() => {
                setLoading(false); // Asegura que el estado de carga se desactive
            });
    };

    useEffect(() => {
        dispatch(getRooms());
        setLoadingTable(true);

        const timer = setTimeout(() => {
            setLoadingTable(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [dispatch]);

    const getStudioNameByRoom = (roomId: number | string) => {
        if (!rooms || !Array.isArray(rooms)) return "-";

        const roomFound = rooms.find(
            (room: any) => Number(room.id) === Number(roomId)
        );

        return roomFound?.studio_name || "-";
    };

    return (
        <>
            {/* <Modal
                onClose={onCloseModalEdit}
                isOpen={isAlertEditOpen}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                    <ModalCloseButton />
                    <ModalExtraHoursEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
                        extraHours={list}
                    />
                </ModalContent>
            </Modal> */}

            {/* <Modal
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
                        onCloseAlert={onCloseAlertDialogDelete}
                        entityType={"studentsDelete"}
                        action={handleDelete}
                    />
                </ModalContent>
            </Modal> */}

            <>
                {loading && (
                    <LoadingOverlay />
                )}
                <AlertDialog
                    isOpen={isAlertDialogDeleteOpen}
                    onClose={onCloseAlertDialogDelete}
                    leastDestructiveRef={cancelRef}
                    isCentered
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogCloseButton />
                            <AlertDialogHeader>
                                Eliminar hora extra
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>
                                        ¿Está seguro que quiere eliminar la hora extra de <span style={{ fontWeight: 600 }}>{selectedItem?.teacher?.name} {selectedItem?.teacher?.last_name}
                                        </span> con DNI <span style={{ fontWeight: 600 }}>{selectedItem?.teacher?.dni}</span> del <span style={{ fontWeight: 600 }}>{formatDayAndDate(selectedItem?.date)} {new Date(new Date(selectedItem.date).getTime() + new Date(selectedItem.date).getTimezoneOffset() * 60000).toLocaleDateString('es-ES')} </span> a las <span style={{ fontWeight: 600 }}>{selectedItem?.slot?.start_time?.slice(0, 5)}</span>
                                        ?</>
                                ) : (
                                    <>No se ha seleccionado ninguna solicitud.</>
                                )}
                            </AlertDialogBody>
                            <AlertDialogFooter gap={3}>
                                <Button
                                    onClick={onCloseAlertDialogDelete}
                                    w={["100%", "135px"]}
                                    aria-label="Cancelar"
                                    variant="secondary"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    // onClick={onOpenModalCode}
                                    ml={3}
                                    w={["100%", "135px"]}
                                    variant="danger"
                                >
                                    Aceptar
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </>

            {/* <HStack> */}
            <Stack mt={4} mb={2} w="100%">
                <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "flex-start", md: "center" }}
                    justify="space-between"
                    w="100%"
                    gap={4}
                >
                    {/* Izquierda: título + subtítulo */}
                    <Box flexShrink={0}>
                        <Text as="h2" textStyle="sectionTitle">
                            Horas extras
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de las horas extras de las profesoras
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

                        {/* Botón registrar */}
                        <Button
                            leftIcon={<FiPlus />}
                            onClick={onOpen}
                            w={{ base: "100%", md: "auto" }}
                            variant="primary"
                        >
                            Registrar Hora extra
                        </Button>
                    </HStack>
                </Flex>
            </Stack>

            {/* </HStack> */}
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
                <Table size={"sm"} data-sticky-actions>
                    <Thead>
                        <Tr>
                            <Th>Fecha</Th>
                            <Th>Profesora</Th>
                            <Th>Dni</Th>
                            <Th>Horario</Th>
                            <Th>Estudio</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? ( // Mostrar "Cargando..." por defecto
                            <TableState kind="loading" colSpan={6} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr key={index} onDoubleClick={() => handleRowDoubleClick(index, item)} onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer">
                                    <Td>
                                        {formatDayAndDate(item?.slot?.date)}
                                    </Td>
                                    <Td>{item.teacher.name} {item.teacher.last_name}</Td>
                                    <Td>{item.teacher.dni}</Td>
                                    <Td>{item.slot.start_time.slice(0, 5)}</Td>
                                    <Td>{getStudioNameByRoom(item.slot.room)}</Td>
                                    <Td isNumeric >
                                        {/* <Tooltip hasArrow label='Editar' bg='bg.inverted' borderRadius={4}>
                                            <Button
                                                bg={"transparent"}
                                                color="#2b2b2b"
                                                w={"55px"} p={"0px"} mr={"-15px"}
                                                onClick={() => handleClickEdit(item)}
                                            >
                                                <Icon path={mdiPencilOutline} size={1} />
                                            </Button>
                                        </Tooltip> */}
                                        <HStack justify="flex-start" spacing={1}>
                                            <Tooltip hasArrow label='Eliminar'>
                                                <IconButton
                                                    aria-label="Eliminar"
                                                    icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                                                    size="sm"
                                                    onClick={() => handleClickDelete(item)}
                                                    variant="ghostDanger"
                                                />
                                            </Tooltip>
                                        </HStack>
                                    </Td>
                                </Tr>

                            ))
                        ) : (!loadingTable && currentItems.length === 0) && (
                            <TableState kind="empty" colSpan={6} title="No se encontraron datos" />
                        )}
                    </Tbody>
                </Table>
            </Box >

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

export default TableTeachersExtraHours;
