import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Badge,
    Box,
    Button,
    Collapse,
    Flex,
    HStack,
    IconButton,
    Input,
    Spinner,
    Stack,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiDeleteOutline, mdiChevronDown, mdiChevronUp } from "@mdi/js";
import Pagination from "./Pagination";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { getSlots } from "../stores/studioSlice";
import { FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const TableSlots = ({
    list,
}: {
    list: Array<any>;
}) => {
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { tipo, tokens } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);
    const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

    const { rooms, studios } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const formatDayAndDate = (dateString: string) => {
        if (!dateString) return "-";

        const date = new Date(`${dateString}T00:00:00`);

        const days = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
        ];

        const dayName = days[date.getDay()];
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${dayName} ${day}/${month}/${year}`;
    };

    const getDayName = (dateString: string) => {
        if (!dateString) return "-";

        const date = new Date(`${dateString}T00:00:00`);
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

    const getRoomData = (roomId: number | string) => {
        return rooms?.find((room: any) => String(room.id) === String(roomId)) || null;
    };

    const getRoomName = (roomId: number | string) => {
        const roomFound = getRoomData(roomId);
        return roomFound?.name || "-";
    };

    const getStudioNameByRoom = (roomId: number | string) => {
        const roomFound = getRoomData(roomId);

        if (!roomFound) return "-";
        if (roomFound?.studio_name) return roomFound.studio_name;
        if (typeof roomFound?.studio === "object") return roomFound.studio?.name || "-";

        const studioFound = studios?.find(
            (studio: any) => String(studio.id) === String(roomFound?.studio)
        );

        return studioFound?.name || "-";
    };

    const filteredItems = list.filter((item) => {
        const searchValue = searchTerm
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const dayName = formatDayAndDate(item.date)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const date = item.date
            ? item.date.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            : "";

        const timeRange =
            item.start_time && item.end_time
                ? `${item.start_time.slice(0, 5)} - ${item.end_time.slice(0, 5)}`
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()
                : "";

        const availability =
            typeof item.availability === "number"
                ? item.availability.toString()
                : "";

        const roomName = getRoomName(item.room)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const studioName = getStudioNameByRoom(item.room)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const status = item?.deleted ? "dado de baja" : "activo";

        return (
            dayName.includes(searchValue) ||
            date.includes(searchValue) ||
            timeRange.includes(searchValue) ||
            availability.includes(searchValue) ||
            roomName.includes(searchValue) ||
            studioName.includes(searchValue) ||
            status.includes(searchValue)
        );
    });

    const groupedAllItems = useMemo(() => {
        const grouped: Record<string, any[]> = {};

        filteredItems.forEach((item) => {
            const key = item.date || "Sin fecha";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        return Object.entries(grouped).sort(([dateA], [dateB]) => {
            if (dateA === "Sin fecha") return 1;
            if (dateB === "Sin fecha") return -1;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
    }, [filteredItems]);

    const countPagination = Math.max(
        Math.ceil(groupedAllItems.length / ITEMS_PER_PAGE),
        1
    );

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentGroupedItems = groupedAllItems.slice(indexOfFirstItem, indexOfLastItem);

    const {
        isOpen: isAlertDialogDeleteOpen,
        onOpen: onOpenAlertDialogDelete,
        onClose: onCloseAlertDialogDelete,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogNoExistsRangeOpen,
        onOpen: onOpenAlertDialogNoExistsRange,
        onClose: onCloseAlertDialogNoExistsRange,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogUndatedOpen,
        onOpen: onOpenAlertDialogUndated,
        onClose: onCloseAlertDialogUndated,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogDocumentOpen,
        onOpen: onOpenAlertDialogDocument,
        onClose: onCloseAlertDialogDocument,
    } = useDisclosure();

    const cancelRef = React.useRef<any>(null);
    const toast = useToast();

    const handleClickDelete = (item: any) => {
        setSelectedItem(item);
        onOpenAlertDialogDelete();
    };

    const handleDelete = () => {
        setLoading(true);

        axios
            .delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}${selectedItem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            )
            .then(() => {
                toast({
                    title: "Horario eliminado correctamente.",
                    description: "El horario fue eliminado con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogDelete();
                dispatch(getSlots());
            })
            .catch((error) => {
                console.error("Error al eliminar el horario:", error);

                if (
                    error.response?.data?.detail ===
                    "No se puede eliminar el slot porque ya está en uso en un appointment."
                ) {
                    toast({
                        title: "Error al eliminar el horario.",
                        description: "No se puede eliminar el horario porque tiene un turno.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                        position: "bottom-right",
                    });
                } else {
                    toast({
                        title: "Error inesperado.",
                        description: "Ocurrió un error al intentar eliminar el horario.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                        position: "bottom-right",
                    });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const toggleDay = (date: string) => {
        setOpenDays((prev) => ({
            ...prev,
            [date]: prev[date] === undefined ? false : !prev[date],
        }));
    };

    useEffect(() => {
        setLoadingTable(true);

        const timer = setTimeout(() => {
            setLoadingTable(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const initialState: Record<string, boolean> = {};
        groupedAllItems.forEach(([date]) => {
            if (openDays[date] === undefined) {
                initialState[date] = true;
            }
        });

        if (Object.keys(initialState).length > 0) {
            setOpenDays((prev) => ({ ...initialState, ...prev }));
        }
    }, [groupedAllItems]);

    return (
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
                            Eliminar horario
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Está seguro que quiere eliminar el horario del día{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {getDayName(selectedItem?.date)}
                                    </span>{" "}
                                    ({selectedItem?.date}) de{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {selectedItem?.start_time?.slice(0, 5)} a{" "}
                                        {selectedItem?.end_time?.slice(0, 5)}
                                    </span>
                                    ?
                                </>
                            ) : (
                                <>No se ha seleccionado ningún horario.</>
                            )}
                        </AlertDialogBody>

                        <AlertDialogFooter
                            gap={3}
                        >
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
                                ml={3}
                                w={["100%", "135px"]}
                                variant="danger"
                            >
                                Eliminar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <AlertDialog
                isOpen={isAlertDialogUndatedOpen}
                onClose={onCloseAlertDialogUndated}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            Seleccione una fecha de inicio y de fin.
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
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

            <AlertDialog
                isOpen={isAlertDialogDocumentOpen}
                onClose={onCloseAlertDialogDocument}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            El documento seleccionado no fue encontrado.
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={onCloseAlertDialogDocument}
                                w={["100%", "135px"]}
                                variant="primary"
                            >
                                Aceptar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <AlertDialog
                isOpen={isAlertDialogNoExistsRangeOpen}
                onClose={onCloseAlertDialogNoExistsRange}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            No se encontraron pagos en el rango seleccionado.
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={onCloseAlertDialogNoExistsRange}
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
                    <Box flexShrink={0}>
                        <Text as="h2" textStyle="sectionTitle">
                            Horarios
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de horarios
                        </Text>
                    </Box>

                    <HStack
                        spacing={3}
                        w={{ base: "100%", md: "auto" }}
                        justify={{ base: "flex-end", md: "flex-end" }}
                        flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
                        pl={{ md: "10px" }}
                    >
                        <SearchField
                            w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                    </HStack>
                </Flex>
            </Stack>

            <Box
                overflowX="auto"
                overflowY="hidden"
                mt={0}
                minH="100%"
                w="100%"
                maxW="100%"
                sx={{
                    WebkitOverflowScrolling: "touch",
                }}
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="card"
                boxShadow="card"
            >
                {loadingTable ? (
                    <Flex justify="center" align="center" minH="200px">
                        <Text>Cargando...</Text>
                    </Flex>
                ) : currentGroupedItems.length > 0 ? (
                    <Box w="100%">
                        {currentGroupedItems.map(([date, items], groupIndex) => (
                            <Box key={date} minW={{ base: "760px", md: "100%" }}>
                                <Flex
                                    px={4}
                                    py={3}
                                    bg="bg.subtle"
                                    borderBottom="1px solid"
                                    borderColor="border.subtle"
                                    align="center"
                                    justify="space-between"
                                    cursor="pointer"
                                    onClick={() => toggleDay(date)}
                                    _hover={{ bg: "bg.muted" }}
                                >
                                    <HStack spacing={3}>
                                        <Icon
                                            path={openDays[date] ? mdiChevronUp : mdiChevronDown}
                                            size={0.8}
                                        />
                                        <Text fontWeight="600" color="text.primary">
                                            {formatDayAndDate(date)}
                                        </Text>
                                        <Badge colorScheme="gray">
                                            {items.length}
                                        </Badge>
                                    </HStack>
                                </Flex>

                                <Collapse in={openDays[date]} animateOpacity>
                                    <Table
                                        colorScheme="gray"
                                        size="sm"
                                        sx={{ tableLayout: "fixed" }}
                                        minW={{ base: "760px", md: "100%" }} data-sticky-actions>
                                        <Thead>
                                            <Tr>
                                                <Th w="18%">Hora</Th>
                                                <Th w="17%">Disponibilidad</Th>
                                                <Th w="18%">Sala</Th>
                                                <Th w="22%">Estudio</Th>
                                                <Th w="15%">Estado</Th>
                                                <Th w="10%">Acciones</Th>
                                            </Tr>
                                        </Thead>

                                        <Tbody>
                                            {items.map((item: any, index: number) => (
                                                <Tr
                                                    key={item.id || index}
                                                    onClick={() => setSelectedRow(item)}
                                                    data-selected={selectedRow?.id === item.id || undefined}
                                                    cursor="pointer"
                                                >
                                                    <Td whiteSpace="nowrap">
                                                        {item?.start_time?.slice(0, 5) || "-"} -{" "}
                                                        {item?.end_time?.slice(0, 5) || "-"}
                                                    </Td>
                                                    <Td>
                                                        {item?.availability ?? "-"}
                                                    </Td>
                                                    <Td overflow="hidden" textOverflow="ellipsis">
                                                        {getRoomName(item?.room)}
                                                    </Td>
                                                    <Td overflow="hidden" textOverflow="ellipsis">
                                                        {getStudioNameByRoom(item?.room)}
                                                    </Td>
                                                    <Td>
                                                        <StatusBadge label={item?.deleted ? "DADO DE BAJA" : "ACTIVO"} />
                                                    </Td>
                                                    <Td>
                                                        {tipo !== "Consultor" && (
                                                            <Tooltip
                                                                hasArrow
                                                                label="Eliminar"
                                                            >
                                                                <IconButton
                                                                    aria-label="Eliminar"
                                                                    icon={
                                                                        <Icon
                                                                            path={mdiDeleteOutline}
                                                                            size={0.9}
                                                                        />
                                                                    }
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleClickDelete(item);
                                                                    }}
                                                                    variant="ghostDanger"
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Collapse>

                                {groupIndex < currentGroupedItems.length - 1 && (
                                    <Box borderBottom="1px solid" borderColor="border.subtle" />
                                )}
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Flex justify="center" align="center" minH="200px">
                        <Text>No se encontraron datos</Text>
                    </Flex>
                )}
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

export default TableSlots;
