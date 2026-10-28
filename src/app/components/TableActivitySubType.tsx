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
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    useToast,
    Tooltip,
    Tr,
    useDisclosure,
    Stack,
    Input,
    Spinner,
    Flex,
    AlertDialogHeader,
    Text,
    IconButton,
    Badge,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from "@mdi/react";
import {
    mdiPencilOutline,
    mdiDeleteOutline,
    mdiArrowULeftBottom,
} from "@mdi/js";
import Pagination from "./Pagination";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { getActivitySubType } from "../stores/studioSlice";
import { FiPlus, FiSearch } from "react-icons/fi";
import ModalActivitySubTypeEdit from "./ModalActivitySubTypeEdit";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const normalizeText = (text: string = "") =>
    text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const TableActivitySubType = ({
    list,
    onOpen,
}: {
    list: Array<any>;
    onOpen: () => void;
}) => {
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { tokens } = useAuthStore();
    const dispatch = useAppDispatch();
    const toast = useToast();
    const cancelRef = React.useRef<any>(null);

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

    const filteredItems = (list || []).filter((item) => {
        const normalizedSearch = normalizeText(searchTerm);

        const valuesToSearch = [
            item?.name,
            item?.activity_type_name,
        ]
            .filter(Boolean)
            .map((value) => normalizeText(String(value)));

        return valuesToSearch.some((value) => value.includes(normalizedSearch));
    });

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(
        Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
        1
    );

    const handleClickDelete = (item: any) => {
        setSelectedItem(item);
        onOpenAlertDialogDelete();
    };

    const handleClickEdit = (item: any) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleRowDoubleClick = (item: any) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleClickReturn = (item: any) => {
        setSelectedItem(item);
        onOpenAlertDialogReturn();
    };

    const handleDelete = async () => {
        if (!selectedItem?.id) return;

        setLoading(true);

        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIVITY_SUB_TYPE}${selectedItem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Subtipo de actividad eliminado correctamente.",
                description: "El subtipo de actividad fue eliminado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogDelete();
            dispatch(getActivitySubType());
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al eliminar el subtipo de actividad.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (item: any) => {
        if (!item?.id) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("deleted", "");

            await axios.patch(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIVITY_SUB_TYPE}${item.id}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                    },
                }
            );

            toast({
                title: "Subtipo de actividad reactivado.",
                description: "El subtipo de actividad volvió a estar activo.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogReturn();
            dispatch(getActivitySubType());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo reactivar el subtipo de actividad.",
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
        setLoadingTable(true);

        const timer = setTimeout(() => {
            setLoadingTable(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <>
            <Modal
                onClose={onCloseModalEdit}
                isOpen={isAlertEditOpen}
                isCentered
                size={{ base: "95%", md: "80%", lg: "70%" }}
            >
                <ModalOverlay />
                <ModalContent
                    maxW={{ base: "90%", md: "90%", lg: "70%", xl: "800px" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                >
                    <ModalCloseButton />
                    <ModalActivitySubTypeEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
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
                            Eliminar subtipo de actividad
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Está seguro que quiere eliminar la actividad{" "}
                                    <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>?
                                </>
                            ) : (
                                <>No se ha seleccionado ninguna actividad.</>
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
                            Reactivar actividad
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Desea volver a activar la actividad{" "}
                                    <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>?
                                </>
                            ) : (
                                <>No se ha seleccionado ninguna actividad.</>
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
                                onClick={() => handleReturn(selectedItem)}
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
                            Actividades
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de las actividades
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
                            Registrar actividad
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
                            <Th textAlign="center">
                                Nombre
                            </Th>
                            <Th textAlign="center">
                                Tipo de actividad
                            </Th>
                            <Th textAlign="center">
                                Estado
                            </Th>
                            <Th textAlign="center">
                                Acciones
                            </Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={4} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr
                                    key={item.id || index}
                                    onDoubleClick={() => handleRowDoubleClick(item)}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                >
                                    <Td textAlign="center">
                                        {item.name || "-"}
                                    </Td>

                                    <Td textAlign="center">
                                        {item.activity_type_name || "-"}
                                    </Td>

                                    <Td textAlign="center">
                                        {item.deleted === null ? (
                                            <StatusBadge label="ACTIVO" />
                                        ) : (
                                            <StatusBadge label="DADO DE BAJA" />
                                        )}
                                    </Td>

                                    <Td textAlign="center">
                                        <HStack justify="center" spacing={1}>
                                            {item.deleted === null && (
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
                                            )}

                                            {item.deleted !== null && (
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
                            <TableState kind="empty" colSpan={4} title="No se encontraron datos" />
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

export default TableActivitySubType;
