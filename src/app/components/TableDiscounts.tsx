import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
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
    Text,
    IconButton,
    Badge,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom } from "@mdi/js";
import Pagination from "./Pagination";
import ModalDiscountEdit from "./ModalDiscountEdit";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { getDiscounts } from "../stores/studioSlice";
import { FiPlus, FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const TableDiscounts = ({
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
    const toast = useToast();
    const dispatch = useAppDispatch();

    const { discounts } = useSelector((state: any) => state.studio);

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

    const hasBackendName = (item: any) => {
        return Boolean(item?.name?.trim());
    };

    const flattenPlans = (plans: any[]): any[] => {
        const result: any[] = [];

        const visit = (plan: any) => {
            if (!plan) return;

            if (Array.isArray(plan)) {
                plan.forEach(visit);
                return;
            }

            if (Array.isArray(plan?.plans)) {
                plan.plans.forEach(visit);
                return;
            }

            result.push(plan);
        };

        visit(plans || []);

        return Array.from(
            new Map(result.map((plan: any) => [String(plan?.id ?? plan), plan])).values()
        );
    };

    const getPlanNames = (plans: any[]) => {
        const uniquePlans = flattenPlans(plans);

        if (uniquePlans.length === 0) return "-";

        return uniquePlans
            .map((plan) => {
                return plan?.name || plan?.days || "";
            })
            .filter(Boolean)
            .join(" + ");
    };

    const getDiscountName = (item: any) => {
        const backendName = item?.name?.trim();

        if (backendName) {
            return backendName;
        }

        const plans = flattenPlans(item?.plans || []);

        if (!plans.length) {
            return "-";
        }

        return plans
            .map((plan: any) => plan?.name || plan?.days || "")
            .filter(Boolean)
            .join(" + ");
    };

    const filteredItems = useMemo(() => {
        return (list || []).filter((item) => {
            const discountName = getDiscountName(item);
            const planNames = getPlanNames(item?.plans || []);
            const discount = item?.discount_pct || "";
            const status = item?.deleted ? "dado de baja" : "activo";

            const searchableText = `${discountName} ${planNames} ${discount} ${status}`
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const normalizedSearch = (searchTerm || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            return searchableText.includes(normalizedSearch);
        });
    }, [list, searchTerm]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);

    const handleClickDelete = (item: any) => {
        setSelectedItem(item);
        onOpenAlertDialogDelete();
    };

    const handleClickEdit = (item: any) => {
        if (item?.deleted) return;

        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleRowDoubleClick = (_index: number, item: any) => {
        if (item?.deleted) return;

        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleClickReturn = (item: any) => {
        setSelectedItem(item);
        onOpenAlertDialogReturn();
    };

    const handleReturn = async () => {
        if (!selectedItem?.id) return;

        setLoading(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_URL_BACKEND_COMBO_PLAN_DISCOUNT?.replace(/\/$/, "");
            const url = `${baseUrl}/${selectedItem.id}/`;

            await axios.patch(
                url,
                { deleted: null },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Descuento reactivado correctamente.",
                description: "El descuento fue reactivado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogReturn();
            dispatch(getDiscounts());
        } catch (error: any) {
            console.error("Error al reactivar descuento:", error?.response?.data || error);

            toast({
                title: "Error",
                description:
                    error?.response?.data?.detail ||
                    "Ocurrió un error al reactivar el descuento.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem?.id) return;

        setLoading(true);

        try {
            const baseUrl = process.env.NEXT_PUBLIC_URL_BACKEND_COMBO_PLAN_DISCOUNT?.replace(/\/$/, "");
            const url = `${baseUrl}/${selectedItem.id}/`;

            await axios.delete(url, {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                    "Content-Type": "application/json",
                },
            });

            toast({
                title: "Descuento eliminado correctamente.",
                description: "El descuento fue eliminado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogDelete();
            dispatch(getDiscounts());
        } catch (error: any) {
            console.error("Error al eliminar descuento:", error?.response?.data || error);

            toast({
                title: "Error",
                description:
                    error?.response?.data?.detail ||
                    "Ocurrió un error al eliminar el descuento.",
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
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                >
                    <ModalCloseButton />
                    <ModalDiscountEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
                        discount={discounts}
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
                            Eliminar descuento
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Está seguro que quiere eliminar el descuento{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {getDiscountName(selectedItem)}
                                    </span>
                                    ?
                                </>
                            ) : (
                                <>No se ha seleccionado ningún descuento.</>
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
                            Reactivar descuento
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Desea volver a activar el descuento{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {getDiscountName(selectedItem)}
                                    </span>
                                    ?
                                </>
                            ) : (
                                <>No se ha seleccionado ningún descuento.</>
                            )}
                        </AlertDialogBody>

                        <AlertDialogFooter gap={3}>
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
                            Descuentos
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de descuentos
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
                            Registrar descuento
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
                            <Th>Descuento</Th>
                            <Th>Estado</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={4} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr
                                    key={item.id || index}
                                    onDoubleClick={() => handleRowDoubleClick(index, item)}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                >
                                    <Td>
                                        <Text fontSize="sm">{getDiscountName(item)}</Text>

                                        {hasBackendName(item) && (
                                            <Text fontSize="xs" color="text.muted">
                                                {getPlanNames(item?.plans || [])}
                                            </Text>
                                        )}
                                    </Td>

                                    <Td>
                                        {item?.discount_pct ? `${item.discount_pct}%` : "-"}
                                    </Td>

                                    <Td>
                                        <StatusBadge label={item?.deleted ? "DADO DE BAJA" : "ACTIVO"} />
                                    </Td>

                                    <Td isNumeric>
                                        <HStack justify="flex-start" spacing={1}>
                                            {!item?.deleted && (
                                                <Tooltip hasArrow label="Editar">
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
                                            )}

                                            {!item?.deleted && (
                                                <Tooltip hasArrow label="Eliminar">
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
                                            )}

                                            {item?.deleted && (
                                                <Tooltip hasArrow label="Reactivar">
                                                    <IconButton
                                                        aria-label="Reactivar"
                                                        icon={<Icon path={mdiArrowULeftBottom} size={0.9} />}
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClickReturn(item);
                                                        }}
                                                        variant="ghost"
                                                    />
                                                </Tooltip>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        ) : !loadingTable && currentItems.length === 0 ? (
                            <TableState kind="empty" colSpan={4} title="No se encontraron datos" />
                        ) : null}
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

export default TableDiscounts;
