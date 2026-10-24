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
import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@mdi/react";
import { mdiDeleteOutline, mdiPencilOutline } from "@mdi/js";
import { FiPlus, FiSearch } from "react-icons/fi";
import axios from "axios";
import { LoadingOverlay } from "./ui/Loaders";
import Pagination from "./Pagination";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getRooms,
    getActivitySubType,
} from '../stores/studioSlice';
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

type DayOfWeek = {
    id?: number;
    day?: string;
    deleted?: string | null;
};

type SlotTemplate = {
    id: number;
    days_of_week?: DayOfWeek[] | string[] | string;
    start_time?: string;
    end_time?: string;
    availability?: number | string;
    is_active?: boolean | string | number;
    deleted?: string | null;
    room?: number | string;
    activity_subtype?: number | string;
};

type TableSlotTemplatesProps = {
    list: SlotTemplate[];
    onOpen: () => void;
    getSlotTemplates: () => void;
    onEdit?: (item: SlotTemplate) => void;
    rooms?: Array<{ id: number; name: string }>;
    activitySubtypes?: Array<{ id: number; name: string; activity_type_name?: string }>;
};

const TableSlotTemplates: React.FC<TableSlotTemplatesProps> = ({
    list,
    onOpen,
    getSlotTemplates,
    onEdit,
}) => {
    const [selectedRow, setSelectedRow] = useState<SlotTemplate | null>(null);
    const [selectedItem, setSelectedItem] = useState<SlotTemplate | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const toast = useToast();
    const cancelRef = useRef<HTMLButtonElement | null>(null);
    const { tokens } = useAuthStore();

    const { rooms, studios, activitySubType } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();


    const {
        isOpen: isAlertDialogDeleteOpen,
        onOpen: onOpenAlertDialogDelete,
        onClose: onCloseAlertDialogDelete,
    } = useDisclosure();

    const roomMap = useMemo(() => {
        return (rooms || []).reduce((acc: Record<number, string>, room: any) => {
            acc[Number(room.id)] = room.name;
            return acc;
        }, {});
    }, [rooms]);

    const activitySubtypeMap = useMemo(() => {
        return (activitySubType || []).reduce((acc: Record<number, string>, subtype: any) => {
            acc[Number(subtype.id)] = subtype.name;
            return acc;
        }, {});
    }, [activitySubType]);


    const getRoomName = (roomId: any) => {
        const id = Number(roomId);
        if (!id) return "-";
        return roomMap[id] || `Sala #${roomId}`;
    };

    const getRoomData = (roomId: any) => {
        return rooms?.find((room: any) => String(room.id) === String(roomId)) || null;
    };

    const getStudioNameByRoom = (roomId: any) => {
        const roomFound = getRoomData(roomId);

        if (!roomFound) return "-";
        if (roomFound?.studio_name) return roomFound.studio_name;
        if (typeof roomFound?.studio === "object") return roomFound.studio?.name || "-";

        const studioFound = studios?.find(
            (studio: any) => String(studio.id) === String(roomFound?.studio)
        );

        return studioFound?.name || "-";
    };

    const getActivitySubtypeName = (subtypeId: any) => {
        const id = Number(subtypeId);
        if (!id) return "-";
        return activitySubtypeMap[id] || `Subtipo #${subtypeId}`;
    };

    const formatTime = (time?: string) => {
        if (!time) return "-";
        return String(time).slice(0, 5);
    };

    const normalizeText = (value: any) =>
        String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const getDaysArray = (days: any): string[] => {
        if (!days) return [];

        if (Array.isArray(days)) {
            return days
                .map((d) => {
                    if (typeof d === "string") return d;
                    if (typeof d === "object" && d !== null) return d.day || "";
                    return "";
                })
                .filter(Boolean);
        }

        if (typeof days === "string") {
            return days
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean);
        }

        return [];
    };

    const formatDays = (days: any) => {
        const parsedDays = getDaysArray(days);
        if (!parsedDays.length) return "-";
        return parsedDays.join(", ");
    };

    const getIsActive = (item: SlotTemplate) => {
        const value = item?.is_active;

        if (value === true || value === "true" || value === 1 || value === "1") {
            return true;
        }

        if (value === false || value === "false" || value === 0 || value === "0") {
            return false;
        }

        return false;
    };

    const sortedList = [...(list || [])].sort((a, b) => a.id - b.id);

    const filteredItems = sortedList.filter((item) => {
        const normalizedSearchTerm = normalizeText(searchTerm);

        const daysText = formatDays(item.days_of_week);
        const roomName = getRoomName(item.room);
        const studioName = getStudioNameByRoom(item.room);
        const subtypeName = getActivitySubtypeName(item.activity_subtype);
        const statusText = getIsActive(item) ? "activo" : "inactivo";

        return (
            normalizeText(daysText).includes(normalizedSearchTerm) ||
            normalizeText(formatTime(item.start_time)).includes(normalizedSearchTerm) ||
            normalizeText(formatTime(item.end_time)).includes(normalizedSearchTerm) ||
            normalizeText(item.availability).includes(normalizedSearchTerm) ||
            normalizeText(studioName).includes(normalizedSearchTerm) ||
            normalizeText(roomName).includes(normalizedSearchTerm) ||
            normalizeText(subtypeName).includes(normalizedSearchTerm) ||
            normalizeText(statusText).includes(normalizedSearchTerm)
        );
    });

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);

    useEffect(() => {
        setLoadingTable(true);

        const timer = setTimeout(() => {
            setLoadingTable(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [list]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    useEffect(() => {
        if (!loading) {
            dispatch(getRooms());
            dispatch(getActivitySubType());
        }
    }, [loading]);

    const handleClickDelete = (item: SlotTemplate) => {
        setSelectedItem(item);
        onOpenAlertDialogDelete();
    };

    const handleClickEdit = (item: SlotTemplate) => {
        setSelectedItem(item);
        onEdit?.(item);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setLoading(true);

        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_SLOT_TEMPLATES}${selectedItem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Template eliminado correctamente.",
                description: "El template de horario fue eliminado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogDelete();
            getSlotTemplates();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al eliminar el template.",
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
                            Eliminar template
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Está seguro que quiere eliminar el template de{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {formatDays(selectedItem.days_of_week)}
                                    </span>{" "}
                                    de{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {formatTime(selectedItem.start_time)} a{" "}
                                        {formatTime(selectedItem.end_time)}
                                    </span>
                                    ?
                                </>
                            ) : (
                                <>No se ha seleccionado ningún template.</>
                            )}
                        </AlertDialogBody>

                        <AlertDialogFooter gap={3}>
                            <Button
                                ref={cancelRef}
                                onClick={onCloseAlertDialogDelete}
                                w={["100%", "135px"]}
                                aria-label="Cancelar"
                                variant="secondary"
                            >
                                Cancelar
                            </Button>

                            <Button
                                onClick={handleDelete}
                                w={["100%", "135px"]}
                                variant="danger"
                            >
                                Eliminar
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
                            Plantilla de horarios
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de templates de recurrencia
                        </Text>
                    </Box>

                    <HStack
                        spacing={3}
                        w={{ base: "100%", md: "auto" }}
                        justify={{ base: "flex-end", md: "flex-end" }}
                        flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
                    >
                        <SearchField
                            w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
                            placeholder="Buscar…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <Button
                            leftIcon={<FiPlus />}
                            onClick={onOpen}
                            w={{ base: "100%", md: "auto" }}
                            variant="primary"
                        >
                            Registrar plantilla
                        </Button>
                    </HStack>
                </Flex>
            </Stack>

            <Box
                overflowX="auto"
                mt={0}
                minH="100%"
                w="100%"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="card"
                boxShadow="card"
            >
                <Table size="sm" data-sticky-actions>
                    <Thead>
                        <Tr>
                            <Th>Días</Th>
                            <Th>Hora inicio</Th>
                            <Th>Hora fin</Th>
                            <Th>Cupos</Th>
                            <Th>Actividad</Th>
                            <Th>Sala</Th>
                            <Th>Estudio</Th>
                            <Th>Estado</Th>
                            <Th isNumeric>
                                Acciones
                            </Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={9} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => {
                                const isActive = getIsActive(item);

                                return (
                                    <Tr
                                        key={item.id}
                                        onClick={() => setSelectedRow(item)}
                                        data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                    >
                                        <Td>
                                            <Text whiteSpace="normal">
                                                {formatDays(item.days_of_week)}
                                            </Text>
                                        </Td>

                                        <Td>{formatTime(item.start_time)}</Td>
                                        <Td>{formatTime(item.end_time)}</Td>
                                        <Td>{item.availability ?? "-"}</Td>

                                        <Td>
                                            {activitySubtypeMap[Number(item.activity_subtype)] ||
                                                `Subtipo #${item.activity_subtype}`}
                                        </Td>

                                        <Td>
                                            {roomMap[Number(item.room)] || `Sala #${item.room}`}
                                        </Td>

                                        <Td>
                                            {getStudioNameByRoom(item.room)}
                                        </Td>

                                        <Td>
                                            {item.is_active ? (
                                                <StatusBadge label="ACTIVO" />
                                            ) : (
                                                <StatusBadge label="INACTIVO" />
                                            )}
                                        </Td>

                                        <Td isNumeric>
                                            <HStack justify="flex-end" spacing={1}>
                                                <Tooltip
                                                    hasArrow
                                                    label="Editar"
                                                >
                                                    <IconButton
                                                        aria-label="Editar"
                                                        icon={<Icon path={mdiPencilOutline} size={0.9} />}
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClickEdit(item);
                                                        }}
                                                        variant="ghost"
                                                    />
                                                </Tooltip>

                                                <Tooltip
                                                    hasArrow
                                                    label="Eliminar"
                                                >
                                                    <IconButton
                                                        aria-label="Eliminar"
                                                        icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClickDelete(item);
                                                        }}
                                                        variant="ghostDanger"
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                );
                            })
                        ) : (
                            <TableState kind="empty" colSpan={9} title="No se encontraron templates" />
                        )}
                    </Tbody>
                </Table>
            </Box>

            <Flex w="100%" mt={4} justify="center" align="center">
                <Pagination
                    count={countPagination}
                    pageSize={ITEMS_PER_PAGE}
                    defaultPage={1}
                    onPageChange={setCurrentPage}
                />
            </Flex>
        </>
    );
};

export default TableSlotTemplates;
