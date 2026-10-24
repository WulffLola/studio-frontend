"use client";

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
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
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
import React, { useEffect, useState } from "react";
import Icon from "@mdi/react";
import {
    mdiArrowULeftBottom,
    mdiDeleteOutline,
    mdiPencilOutline,
} from "@mdi/js";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { useAuthStore } from "../stores/auth";
import Pagination from "./Pagination";
import { getHolidays } from "../stores/studioSlice";
import ModalHolidayEdit from "./ModalHolidayEdit";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

type Holiday = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    deleted: string | null;
};

const TableHolidays = ({ onOpen }: { onOpen: () => void }) => {
    const [selectedRow, setSelectedRow] = useState<Holiday | null>(null);
    const [selectedItem, setSelectedItem] = useState<Holiday | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { tokens } = useAuthStore();
    const toast = useToast();
    const dispatch = useAppDispatch();

    const { holidays } = useSelector((state: any) => state.studio);

    const filteredItems = (holidays ?? []).filter((item: Holiday) => {
        const combined = `${item.name ?? ""} ${item.start_date ?? ""} ${item.end_date ?? ""} ${item.deleted ? "DADO DE BAJA" : "ACTIVO"
            }`;

        const normalized = combined
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const normalizedSearch = searchTerm
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        return normalized.includes(normalizedSearch);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredItems.length, searchTerm]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const countPagination = Math.max(
        Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
        1
    );
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

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

    const cancelRef = React.useRef<any>(null);

    const handleClickEdit = (item: Holiday) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleClickDelete = (item: Holiday) => {
        setSelectedItem(item);
        onOpenAlertDialogDelete();
    };

    const handleClickReturn = (item: Holiday) => {
        setSelectedItem(item);
        onOpenAlertDialogReturn();
    };

    const handleRowDoubleClick = (item: Holiday) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setLoading(true);

        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_HOLIDAYS}${selectedItem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Feriado eliminado correctamente.",
                description: "El feriado fue eliminado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogDelete();
            dispatch(getHolidays());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al dar de baja el feriado.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async () => {
        if (!selectedItem) return;

        setLoading(true);

        try {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_HOLIDAYS}${selectedItem.id}/`,
                { deleted: null },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Feriado reactivado correctamente.",
                description: "El feriado volvió a estar activo.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogReturn();
            dispatch(getHolidays());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al reactivar el feriado.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(getHolidays());
    }, [dispatch]);

    useEffect(() => {
        setLoadingTable(true);

        const timer = setTimeout(() => {
            setLoadingTable(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };

    return (
        <>
            <Modal
                onClose={onCloseModalEdit}
                isOpen={isAlertEditOpen}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                >
                    <ModalCloseButton />
                    <ModalHolidayEdit
                        onClose={onCloseModalEdit}
                        holiday={selectedItem}
                    />
                </ModalContent>
            </Modal>

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
                            Eliminar feriado
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Está seguro que quiere eliminar el feriado{" "}
                                    <span style={{ fontWeight: 600 }}>{selectedItem.name}</span>?
                                </>
                            ) : (
                                <>No se ha seleccionado ningún feriado.</>
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
                isOpen={isAlertDialogOpenReturn}
                onClose={onCloseAlertDialogReturn}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogHeader>
                            Activar feriado
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Desea volver a activar el feriado{" "}
                                    <span style={{ fontWeight: 600 }}>{selectedItem.name}</span>?
                                </>
                            ) : (
                                <>No se ha seleccionado ningún feriado.</>
                            )}
                        </AlertDialogBody>
                        <AlertDialogFooter
                            gap={3}
                        >
                            <Button
                                onClick={onCloseAlertDialogReturn}
                                w={["100%", "135px"]}
                                aria-label="Cancelar"
                                variant="secondary"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleReturn}
                                ml={3}
                                w={["100%", "135px"]}
                                variant="primary"
                            >
                                Activar
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
                            Feriados
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de feriados
                        </Text>
                    </Box>

                    <HStack
                        spacing={3}
                        w={{ base: "100%", md: "auto" }}
                        justify={{ base: "flex-end", md: "flex-end" }}
                        flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
                        pl={{ base: "", md: "10px" }}
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
                            Registrar Feriado
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
                            <Th>Nombre</Th>
                            <Th>Fecha inicio</Th>
                            <Th>Fecha fin</Th>
                            <Th>Estado</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={5} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item: Holiday) => (
                                <Tr
                                    key={item.id}
                                    onDoubleClick={() => handleRowDoubleClick(item)}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                >
                                    <Td>{item.name}</Td>
                                    <Td>{formatDate(item.start_date)}</Td>
                                    <Td>
                                        {item.end_date && item.start_date === item.end_date
                                            ? "-"
                                            : item.end_date
                                                ? formatDate(item.end_date)
                                                : "-"}
                                    </Td>
                                    <Td>
                                        <StatusBadge label={item.deleted ? "DADO DE BAJA" : "ACTIVO"} />
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-start" spacing={1}>
                                            {!item.deleted ? (
                                                <>
                                                    <Tooltip
                                                        hasArrow
                                                        label="Editar"
                                                    >
                                                        <IconButton
                                                            aria-label="Editar"
                                                            icon={<Icon path={mdiPencilOutline} size={0.9} />}
                                                            size="sm"
                                                            onClick={() => handleClickEdit(item)}
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
                                                            onClick={() => handleClickDelete(item)}
                                                            variant="ghostDanger"
                                                        />
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Tooltip
                                                    hasArrow
                                                    label="Reactivar"
                                                >
                                                    <IconButton
                                                        aria-label="Reactivar"
                                                        icon={<Icon path={mdiArrowULeftBottom} size={0.9} />}
                                                        size="sm"
                                                        onClick={() => handleClickReturn(item)}
                                                        variant="ghost"
                                                    />
                                                </Tooltip>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        ) : (
                            <TableState kind="empty" colSpan={5} title="No se encontraron datos" />
                        )}
                    </Tbody>
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

export default TableHolidays;
