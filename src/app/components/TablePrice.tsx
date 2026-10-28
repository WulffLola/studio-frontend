// import {
// AlertDialog,
// AlertDialogBody,
// AlertDialogCloseButton,
// AlertDialogContent,
// AlertDialogFooter,
// AlertDialogOverlay,
// Box,
// Button,
// HStack,
// Modal,
// ModalContent,
// ModalOverlay,
// Table,
// Tbody,
// Td,
// Th,
// Thead,
// useToast,
// Tooltip,
// Tr,
// useDisclosure,
// Stack,
// Input,
// Flex,
// Spinner,
// AlertDialogHeader,
// Text,
// IconButton,
// } from "@chakra-ui/react";
// import axios from "axios";
// import React, { useEffect, useMemo, useState } from "react";
// import Icon from "@mdi/react";
// import {
// mdiPencilOutline,
// mdiDeleteOutline,
// } from "@mdi/js";
// import ModalPaymentsAmountEdit from "./ModalPaymentsAmountEdit";
// import Pagination from "./Pagination";
// import { useAuthStore } from "../stores/auth";
// import { useAppDispatch } from "../stores/hooks";
// import { useSelector } from "react-redux";
// import {
// getPaymentAmount,
// } from "../stores/studioSlice";
// import { FiPlus, FiSearch } from "react-icons/fi";

// const ITEMS_PER_PAGE = 10;

// const TablePrice = ({
// list,
// onOpen,
// }: {
// list: Array<any>;
// onOpen: () => void;
// }) => {
// const [selectedRow, setSelectedRow] = useState<any>(null);
// const [selectedItem, setSelectedItem] = useState<any>(null);
// const [currentPage, setCurrentPage] = useState(1);
// const [searchTerm, setSearchTerm] = useState("");
// const { tokens } = useAuthStore();
// const [loading, setLoading] = useState(false);
// const [loadingTable, setLoadingTable] = useState(false);

// const { plans } = useSelector((state: any) => state.studio);
// const dispatch = useAppDispatch();
// const toast = useToast();
// const cancelRef = React.useRef<any>(null);

// const {
// isOpen: isAlertEditOpen,
// onOpen: onOpenModalEdit,
// onClose: onCloseModalEdit,
// } = useDisclosure();

// const {
// isOpen: isAlertDialogDeleteOpen,
// onOpen: onOpenAlertDialogDelete,
// onClose: onCloseAlertDialogDelete,
// } = useDisclosure();

// const {
// isOpen: isAlertDialogMethodDeleteOpen,
// onOpen: onOpenAlertDialogMethodDelete,
// onClose: onCloseAlertDialogMethodDelete,
// } = useDisclosure();

// const {
// isOpen: isAlertDialogMethodOpen,
// onOpen: onOpenAlertDialogMethod,
// onClose: onCloseAlertDialogMethod,
// } = useDisclosure();

// const {
// isOpen: isAlertDialogOpenNoExist,
// onOpen: onOpenAlertDialogNoExist,
// onClose: onCloseAlertDialogNoExist,
// } = useDisclosure();

// const normalizeText = (value: any) =>
// String(value ?? "")
// .toLowerCase()
// .normalize("NFD")
// .replace(/[\u0300-\u036f]/g, "");

// // 1) Primero agrupamos por plan como ya hacías
// const groupedItems = useMemo(() => {
// return (list ?? []).reduce((acc, item) => {
// if (!acc[item.plan]) {
// const planFound = plans.find(
// (plan: any) => Number(plan.id) === Number(item.plan)
// );

// // MOCKS VISUALES
// // Reemplazá esto con tus campos reales después
// const mockActivityType =
// planFound?.activity_type_name || "PILATES";
// const mockActivitySubType =
// planFound?.activity_subtype_name || "REFORMER";

// acc[item.plan] = {
// plan: item.plan,
// planDays:
// planFound?.days ||
// item.plan_days ||
// item.plan_name ||
// `Plan ${item.plan}`,
// efectivo: "",
// transferencia: "",
// ids: { efectivo: null, transferencia: null },
// activityType: mockActivityType,
// activitySubType: mockActivitySubType,
// };
// }

// if (item.method === "Efectivo") {
// acc[item.plan].efectivo = item.amount;
// acc[item.plan].ids.efectivo = item.id;
// } else if (item.method === "Transferencia") {
// acc[item.plan].transferencia = item.amount;
// acc[item.plan].ids.transferencia = item.id;
// }

// return acc;
// }, {} as any);
// }, [list, plans]);

// const groupedArray = useMemo(() => Object.values(groupedItems), [groupedItems]);

// // 2) Filtrado
// const filteredItems = useMemo(() => {
// const searchLower = normalizeText(searchTerm);

// return groupedArray.filter((item: any) => {
// return (
// normalizeText(item.planDays).includes(searchLower) ||
// normalizeText(item.activityType).includes(searchLower) ||
// normalizeText(item.activitySubType).includes(searchLower) ||
// normalizeText(item.efectivo).includes(searchLower) ||
// normalizeText(item.transferencia).includes(searchLower)
// );
// });
// }, [groupedArray, searchTerm]);

// // 3) Agrupar para render por type/subtype
// const groupedForRender = useMemo(() => {
// const result: any[] = [];

// const map = filteredItems.reduce((acc: any, item: any) => {
// if (!acc[item.activityType]) {
// acc[item.activityType] = {};
// }

// if (!acc[item.activityType][item.activitySubType]) {
// acc[item.activityType][item.activitySubType] = [];
// }

// acc[item.activityType][item.activitySubType].push(item);
// return acc;
// }, {});

// Object.entries(map).forEach(([activityType, subtypes]: any) => {
// result.push({
// rowType: "activityType",
// label: activityType,
// });

// Object.entries(subtypes).forEach(([activitySubType, items]: any) => {
// result.push({
// rowType: "activitySubType",
// label: activitySubType,
// });

// items.forEach((item: any) => {
// result.push({
// rowType: "item",
// ...item,
// });
// });
// });
// });

// return result;
// }, [filteredItems]);

// // 4) Paginación sobre las filas finales
// const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
// const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
// const currentItems = groupedForRender.slice(indexOfFirstItem, indexOfLastItem);

// const countPagination = Math.max(
// Math.ceil(groupedForRender.length / ITEMS_PER_PAGE),
// 1
// );

// const handleClickDeleteMethod = (item: any) => {
// setSelectedItem(item);
// onOpenAlertDialogMethodDelete();
// };

// const handleRowDoubleClick = (itemId: number) => {
// const payment = list.find((payment: any) => payment.id === itemId);

// if (payment) {
// setSelectedItem(payment);
// onOpenModalEdit();
// onCloseAlertDialogMethod();
// } else {
// onOpenAlertDialogNoExist();
// onCloseAlertDialogMethod();
// }
// };

// const handleRowDoubleClickMethod = (item: any) => {
// setSelectedItem(item);
// onOpenAlertDialogMethod();
// };

// const handleRowDelete = (itemId: number) => {
// const payment = list.find((payment: any) => payment.id === itemId);

// if (payment) {
// setSelectedItem(payment);
// onOpenAlertDialogDelete();
// onCloseAlertDialogMethodDelete();
// } else {
// onOpenAlertDialogNoExist();
// onCloseAlertDialogMethodDelete();
// }
// };

// const handleDelete = () => {
// setLoading(true);

// axios
// .delete(
// `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}${selectedItem.id}/`,
// {
// headers: {
// Authorization: `Bearer ${tokens?.access}`,
// "Content-Type": "application/json",
// },
// }
// )
// .then(() => {
// toast({
// title: "Precio eliminado correctamente.",
// description: "El precio fue eliminado con éxito.",
// status: "success",
// duration: 3000,
// isClosable: true,
// position: "bottom-right",
// });
// onCloseAlertDialogDelete();
// dispatch(getPaymentAmount());
// })
// .catch((error) => {
// console.error(error);
// toast({
// title: "Error",
// description: "Ocurrió un error al eliminar un precio.",
// status: "error",
// duration: 5000,
// isClosable: true,
// position: "bottom-right",
// });
// })
// .finally(() => {
// setLoading(false);
// });
// };

// useEffect(() => {
// setLoadingTable(true);

// const timer = setTimeout(() => {
// setLoadingTable(false);
// }, 800);

// return () => clearTimeout(timer);
// }, []);

// useEffect(() => {
// dispatch(getPaymentAmount());
// }, [dispatch]);

// return (
// <>
// <Modal
// onClose={onCloseModalEdit}
// isOpen={isAlertEditOpen}
// isCentered
// size={{ base: "90%", md: "70%", lg: "80%" }}
// >
// <ModalOverlay w={"100%"} h={"100%"} />
// <ModalContent
// maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }}
// maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
// >
// <ModalPaymentsAmountEdit
// onClose={onCloseModalEdit}
// product={selectedItem}
// onCloseAlertDialogMethod={onCloseAlertDialogMethod}
// />
// </ModalContent>
// </Modal>

// <AlertDialog
// isOpen={isAlertDialogMethodDeleteOpen}
// onClose={onCloseAlertDialogMethodDelete}
// leastDestructiveRef={cancelRef}
// >
// <AlertDialogOverlay>
// <AlertDialogContent m={100} ml={10} mr={10}>
// <AlertDialogCloseButton />
// <AlertDialogHeader>
// Eliminar precio por método
// </AlertDialogHeader>
// <AlertDialogBody textAlign={"center"}>
// {selectedItem ? (
// <>¿Desea eliminar el precio en efectivo o transferencia?</>
// ) : (
// <>No se ha seleccionado ninguna solicitud.</>
// )}
// </AlertDialogBody>
// <AlertDialogFooter display={"flex"} justifyContent={"center"} gap={"20px"}>
// <Button
// onClick={() => handleRowDelete(selectedItem?.ids?.efectivo)}
// bg="bg.surface"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// border="1px solid black"
// borderRadius={4}
// fontWeight="medium"
// boxShadow="none"
// _hover={{ bg: "bg.hover" }}
// >
// Efectivo
// </Button>
// <Button
// onClick={() => handleRowDelete(selectedItem?.ids?.transferencia)}
// bg="studio.primary"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// borderRadius={4}
// fontWeight="medium"
//
// _hover={{ bg: "studio.primaryHover" }}
// >
// Transferencia
// </Button>
// </AlertDialogFooter>
// </AlertDialogContent>
// </AlertDialogOverlay>
// </AlertDialog>

// {loading && (
// <Flex
// position="fixed"
// top={0}
// left={0}
// width="100vw"
// height="100vh"
// bg="rgba(0, 0, 0, 0.5)"
// alignItems="center"
// justifyContent="center"
// zIndex={1000}
// >
// <Spinner size="xl" color="white" />
// </Flex>
// )}

// <AlertDialog
// isOpen={isAlertDialogDeleteOpen}
// onClose={onCloseAlertDialogDelete}
// leastDestructiveRef={cancelRef}
// >
// <AlertDialogOverlay>
// <AlertDialogContent m={100} ml={10} mr={10}>
// <AlertDialogCloseButton />
// <AlertDialogHeader>
// Eliminar precio
// </AlertDialogHeader>
// <AlertDialogBody textAlign={"center"}>
// {selectedItem ? (
// <>
// ¿Está seguro que quiere eliminar el plan{" "}
// <span style={{ fontWeight: 600 }}>
// {plans.find((plan: any) => plan.id === selectedItem?.plan)?.days ||
// selectedItem?.plan}
// </span>{" "}
// con método de pago{" "}
// <span style={{ fontWeight: 600 }}>{selectedItem?.method}</span> y precio{" "}
// <span style={{ fontWeight: 600 }}>${selectedItem?.amount}</span>?
// </>
// ) : (
// <>No se ha seleccionado ninguna solicitud.</>
// )}
// </AlertDialogBody>

// <AlertDialogFooter display={"flex"} justifyContent={"center"} gap={"20px"}>
// <Button
// onClick={onCloseAlertDialogDelete}
// bg="bg.surface"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// border="1px solid black"
// borderRadius={4}
// fontWeight="medium"
// boxShadow="none"
// _hover={{ bg: "bg.hover" }}
// >
// Cancelar
// </Button>
// <Button
// onClick={handleDelete}
// colorScheme="red"
// ml={3}
// w={["100%", "135px"]}
// h="40px"
// borderRadius={4}
// fontWeight="medium"
//
// >
// Eliminar
// </Button>
// </AlertDialogFooter>
// </AlertDialogContent>
// </AlertDialogOverlay>
// </AlertDialog>

// <AlertDialog
// isOpen={isAlertDialogOpenNoExist}
// onClose={onCloseAlertDialogNoExist}
// leastDestructiveRef={cancelRef}
// >
// <AlertDialogOverlay>
// <AlertDialogContent m={100} ml={10} mr={10}>
// <AlertDialogCloseButton />
// <AlertDialogBody textAlign={"center"} mt={55}>
// No hay cargado un precio con ese método de pago.
// </AlertDialogBody>
// <AlertDialogFooter mt={5} display={"flex"} justifyContent={"center"} gap={"20px"}>
// <Button
// onClick={onCloseAlertDialogNoExist}
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// border="1px solid black"
// borderRadius={4}
// fontWeight="medium"
// boxShadow="none"
// _hover={{ bg: "bg.hover" }}
// >
// Cerrar
// </Button>
// </AlertDialogFooter>
// </AlertDialogContent>
// </AlertDialogOverlay>
// </AlertDialog>

// <AlertDialog
// isOpen={isAlertDialogMethodOpen}
// onClose={onCloseAlertDialogMethod}
// leastDestructiveRef={cancelRef}
// >
// <AlertDialogOverlay>
// <AlertDialogContent m={100} ml={10} mr={10}>
// <AlertDialogCloseButton />
// <AlertDialogHeader>
// Editar precio por método
// </AlertDialogHeader>
// <AlertDialogBody textAlign={"center"}>
// {selectedItem ? (
// <>¿Desea editar el precio en efectivo o transferencia?</>
// ) : (
// <>No se ha seleccionado ninguna solicitud.</>
// )}
// </AlertDialogBody>
// <AlertDialogFooter display={"flex"} justifyContent={"center"} gap={"20px"}>
// <Button
// onClick={() => handleRowDoubleClick(selectedItem?.ids?.efectivo)}
// bg="bg.surface"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// border="1px solid black"
// borderRadius={4}
// fontWeight="medium"
// boxShadow="none"
// _hover={{ bg: "bg.hover" }}
// >
// Efectivo
// </Button>
// <Button
// onClick={() => handleRowDoubleClick(selectedItem?.ids?.transferencia)}
// bg="studio.primary"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// borderRadius={4}
// fontWeight="medium"
//
// _hover={{ bg: "studio.primaryHover" }}
// >
// Transferencia
// </Button>
// </AlertDialogFooter>
// </AlertDialogContent>
// </AlertDialogOverlay>
// </AlertDialog>

// <Stack mt={4} mb={2} w="100%">
// <Flex
// direction={{ base: "column", md: "row" }}
// align={{ base: "flex-start", md: "center" }}
// justify="space-between"
// w="100%"
// gap={4}
// >
// <Box>
// <Text fontSize="lg" fontWeight="bold">
// Precios
// </Text>
// <Text fontSize="sm" color="text.muted">
// Gestión de precios
// </Text>
// </Box>

// <HStack
// spacing={3}
// w={{ base: "100%", md: "auto" }}
// justify={{ base: "flex-end", md: "flex-end" }}
// flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
// >
// <HStack
// bg="bg.subtle"
// _dark={{ bg: "gray.800" }}
// px={3}
// py={1.5}
// rounded="full"
// borderWidth="1px"
// w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
// >
// <FiSearch />
// <Input
// variant="unstyled"
// placeholder="Buscar…"
// value={searchTerm}
// onChange={(e) => setSearchTerm(e.target.value)}
// />
// </HStack>

// <Button
// leftIcon={<FiPlus />}
// bg="studio.muted"
// size="sm"
// onClick={onOpen}
// w={{ base: "auto", md: "auto" }}
// >
// Registrar Precio
// </Button>
// </HStack>
// </Flex>
// </Stack>

// <Box
// overflowX="auto"
// borderWidth="1px"
// rounded="xl"
// bg="bg.surface"
// mt={0}
// minH={"100%"}
// w={"100%"}
// >
// <Table size="sm" data-sticky-actions>
// <Thead h={"50px"} fontSize={"16px"}>
// <Tr>
// <Th textTransform="uppercase">Plan</Th>
// <Th textTransform="uppercase">Efectivo</Th>
// <Th textTransform="uppercase">Transferencia</Th>
// <Th textTransform="uppercase">Acciones</Th>
// </Tr>
// </Thead>

// <Tbody>
// {loadingTable ? (
// <Tr>
// <Td colSpan={4} textAlign="center">
// Cargando...
// </Td>
// </Tr>
// ) : currentItems.length > 0 ? (
// currentItems.map((row: any, index: number) => {
// if (row.rowType === "activityType") {
// return (
// <Tr key={`type-${index}`} bg="studio.primary">
// <Td colSpan={4} fontWeight="700" color="text.primary" py={3}>
// {row.label}
// </Td>
// </Tr>
// );
// }

// if (row.rowType === "activitySubType") {
// return (
// <Tr key={`subtype-${index}`} bg="black">
// <Td colSpan={4} fontWeight="700" color="white" py={3}>
// {row.label}
// </Td>
// </Tr>
// );
// }

// return (
// <Tr
// key={`item-${index}`}
// onDoubleClick={() => handleRowDoubleClickMethod(row)}
// onClick={() => setSelectedRow(row)}
// bg={selectedRow?.plan === row.plan ? "gray.100" : "transparent"}
// cursor="pointer"
// >
// <Td fontWeight={300}>{row.planDays}</Td>
// <Td fontWeight={300}>{row.efectivo || "-"}</Td>
// <Td fontWeight={300}>{row.transferencia || "-"}</Td>
// <Td>
// <HStack justify="flex-start" spacing={1}>
// <Tooltip hasArrow label="Editar" bg="bg.inverted" borderRadius={4}>
// <IconButton
// aria-label="Editar"
// icon={<Icon path={mdiPencilOutline} size={0.9} />}
// variant="outline"
// size="sm"
// onClick={() => handleRowDoubleClickMethod(row)}
// />
// </Tooltip>

// <Tooltip hasArrow label="Eliminar" bg="bg.inverted" borderRadius={4}>
// <IconButton
// aria-label="Eliminar"
// icon={<Icon path={mdiDeleteOutline} size={0.9} />}
// variant="outline"
// size="sm"
// onClick={() => handleClickDeleteMethod(row)}
// />
// </Tooltip>
// </HStack>
// </Td>
// </Tr>
// );
// })
// ) : (
// <Tr>
// <Td colSpan={4} textAlign="center">
// No se encontraron datos
// </Td>
// </Tr>
// )}
// </Tbody>
// </Table>
// </Box>

// <Box display="flex" justifyContent="center" mt={4}>
// <Pagination
// count={countPagination}
// pageSize={ITEMS_PER_PAGE}
// defaultPage={1}
// onPageChange={setCurrentPage}
// />
// </Box>
// </>
// );
// };

// export default TablePrice;


import { formatCurrency } from "../utils/amount";
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
    Flex,
    Spinner,
    AlertDialogHeader,
    Text,
    IconButton,
    Badge,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Icon from "@mdi/react";
import {
    mdiPencilOutline,
    mdiDeleteOutline,
} from "@mdi/js";
import ModalPaymentsAmountEdit from "./ModalPaymentsAmountEdit";
import Pagination from "./Pagination";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getActivitySubType,
    getActivityType,
    getPaymentAmount,
    getPlanSubType,
} from "../stores/studioSlice";
import { FiChevronDown, FiChevronRight, FiPlus, FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";

const ITEMS_PER_PAGE = 10;

const MOCK_PLANS = [
    {
        id: 1,
        days: "2 veces a la semana",
        activity_type_name: "PILATES",
        activity_subtype_name: "REFORMER",
    },
    {
        id: 2,
        days: "3 veces a la semana",
        activity_type_name: "PILATES",
        activity_subtype_name: "REFORMER",
    },
    {
        id: 3,
        days: "4 veces a la semana",
        activity_type_name: "PILATES",
        activity_subtype_name: "MAT",
    },
    {
        id: 4,
        days: "8 veces al mes",
        activity_type_name: "PILATES",
        activity_subtype_name: "MAT",
    },
    {
        id: 5,
        days: "12 veces al mes",
        activity_type_name: "YOGA",
        activity_subtype_name: "AERO YOGA",
    },
    {
        id: 6,
        days: "20 veces al mes",
        activity_type_name: "YOGA",
        activity_subtype_name: "HATHA",
    },
    {
        id: 7,
        days: "Pase libre",
        activity_type_name: "YOGA",
        activity_subtype_name: "VINYASA",
    },
    {
        id: 8,
        days: "2 veces a la semana",
        activity_type_name: "DANZA",
        activity_subtype_name: "BACHATA",
    },
    {
        id: 9,
        days: "3 veces a la semana",
        activity_type_name: "DANZA",
        activity_subtype_name: "SALSA",
    },
    {
        id: 10,
        days: "4 veces a la semana",
        activity_type_name: "DANZA",
        activity_subtype_name: "MAMBO",
    },
    {
        id: 11,
        days: "8 veces al mes",
        activity_type_name: "FUNCIONAL",
        activity_subtype_name: "HIIT",
    },
    {
        id: 12,
        days: "12 veces al mes",
        activity_type_name: "FUNCIONAL",
        activity_subtype_name: "STRETCHING",
    },
    {
        id: 13,
        days: "20 veces al mes",
        activity_type_name: "FUNCIONAL",
        activity_subtype_name: "GAP",
    },
    {
        id: 14,
        days: "Pase libre",
        activity_type_name: "MEDITACIÓN",
        activity_subtype_name: "GUIADA",
    },
    {
        id: 15,
        days: "8 veces al mes",
        activity_type_name: "MEDITACIÓN",
        activity_subtype_name: "SONORA",
    },
];

const MOCK_LIST = [
    { id: 101, plan: 1, method: "Efectivo", amount: "18000" },
    { id: 102, plan: 1, method: "Transferencia", amount: "19000" },

    { id: 103, plan: 2, method: "Efectivo", amount: "22000" },
    { id: 104, plan: 2, method: "Transferencia", amount: "23000" },

    { id: 105, plan: 3, method: "Efectivo", amount: "26000" },
    { id: 106, plan: 3, method: "Transferencia", amount: "27000" },

    { id: 107, plan: 4, method: "Efectivo", amount: "28000" },
    { id: 108, plan: 4, method: "Transferencia", amount: "29500" },

    { id: 109, plan: 5, method: "Efectivo", amount: "24000" },
    { id: 110, plan: 5, method: "Transferencia", amount: "25500" },

    { id: 111, plan: 6, method: "Efectivo", amount: "30000" },
    { id: 112, plan: 6, method: "Transferencia", amount: "31500" },

    { id: 113, plan: 7, method: "Efectivo", amount: "35000" },
    { id: 114, plan: 7, method: "Transferencia", amount: "36500" },

    { id: 115, plan: 8, method: "Efectivo", amount: "21000" },
    { id: 116, plan: 8, method: "Transferencia", amount: "22500" },

    { id: 117, plan: 9, method: "Efectivo", amount: "23000" },
    { id: 118, plan: 9, method: "Transferencia", amount: "24500" },

    { id: 119, plan: 10, method: "Efectivo", amount: "25000" },
    { id: 120, plan: 10, method: "Transferencia", amount: "26500" },

    { id: 121, plan: 11, method: "Efectivo", amount: "27000" },
    { id: 122, plan: 11, method: "Transferencia", amount: "28500" },

    { id: 123, plan: 12, method: "Efectivo", amount: "19000" },
    { id: 124, plan: 12, method: "Transferencia", amount: "20500" },

    { id: 125, plan: 13, method: "Efectivo", amount: "26000" },
    { id: 126, plan: 13, method: "Transferencia", amount: "27500" },

    { id: 127, plan: 14, method: "Efectivo", amount: "16000" },
    { id: 128, plan: 14, method: "Transferencia", amount: "17500" },

    { id: 129, plan: 15, method: "Efectivo", amount: "20000" },
    { id: 130, plan: 15, method: "Transferencia", amount: "21500" },
];

const TablePrice = ({
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
    const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
    const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());
    const { tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { amounts, plansSubType, activityType, activitySubType } = useSelector(
        (state: any) => state.studio
    );
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

    const normalizeText = (value: any) =>
        String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

    const groupedItems = useMemo(() => {
        return (amounts || [])
            .filter((price: any) => price?.deleted == null)
            .reduce((acc: any, price: any) => {
            const planId =
                price?.plans_subtype?.id ??
                price?.plans_subtype ??
                price?.plan?.id ??
                price?.plan;

            const planData = (plansSubType || []).find(
                (item: any) => String(item.id) === String(planId)
            );
            const subtypeId =
                price?.subtype?.id ??
                price?.activity_subtype?.id ??
                price?.activity_subtype_id ??
                price?.subtype ??
                price?.activity_subtype ??
                planData?.subtype?.id ??
                planData?.activity_subtype?.id ??
                planData?.activity_subtype_id ??
                planData?.subtype ??
                planData?.activity_subtype;
            const subtypeData = (activitySubType || []).find(
                (item: any) => String(item.id) === String(subtypeId)
            );
            const activityTypeId =
                price?.activity_type?.id ??
                price?.activity_type_id ??
                price?.activity_type ??
                subtypeData?.activity_type?.id ??
                subtypeData?.activity_type_id ??
                subtypeData?.activity_type ??
                planData?.activity_type?.id ??
                planData?.activity_type_id ??
                planData?.activity_type;
            const activityTypeData = (activityType || []).find(
                (item: any) => String(item.id) === String(activityTypeId)
            );

            const planName =
                price?.plans_subtype?.name ||
                price?.plan_name ||
                price?.plan?.name ||
                planData?.name ||
                planData?.days ||
                `Plan ${planId}`;
            const activityTypeName =
                price?.activity_type_name ||
                price?.activity_type?.name ||
                activityTypeData?.name ||
                subtypeData?.activity_type_name ||
                subtypeData?.activity_type?.name ||
                planData?.activity_type_name ||
                planData?.activity_type?.name ||
                "SIN TIPO DE ACTIVIDAD";
            const subtypeName =
                price?.subtype_name ||
                price?.subtype?.name ||
                price?.activity_subtype_name ||
                price?.activity_subtype?.name ||
                subtypeData?.name ||
                planData?.subtype_name ||
                planData?.subtype?.name ||
                planData?.activity_subtype_name ||
                planData?.activity_subtype?.name ||
                "SIN ACTIVIDAD";
            const key = [planId, activityTypeId, subtypeId].map(String).join("-");

            if (!acc[key]) {
                acc[key] = {
                    plan: planId,
                    plans_subtype: planId,
                    activity_type: activityTypeId,
                    subtype: subtypeId,
                    planDays: planName,
                    efectivo: "",
                    transferencia: "",
                    ids: { efectivo: null, transferencia: null },
                    activityType: activityTypeName,
                    activitySubType: subtypeName,
                };
            }

            if (String(price.method).toLowerCase() === "efectivo") {
                acc[key].efectivo = price.amount;
                acc[key].ids.efectivo = price.id;
            }
            if (String(price.method).toLowerCase() === "transferencia") {
                acc[key].transferencia = price.amount;
                acc[key].ids.transferencia = price.id;
            }

            return acc;
            }, {} as any);
    }, [amounts, plansSubType, activityType, activitySubType]);

    const groupedArray = useMemo(() => Object.values(groupedItems), [groupedItems]);

    const filteredItems = useMemo(() => {
        const searchLower = normalizeText(searchTerm);

        return groupedArray.filter((item: any) => {
            return (
                normalizeText(item.planDays).includes(searchLower) ||
                normalizeText(item.activityType).includes(searchLower) ||
                normalizeText(item.activitySubType).includes(searchLower) ||
                normalizeText(item.efectivo).includes(searchLower) ||
                normalizeText(item.transferencia).includes(searchLower)
            );
        });
    }, [groupedArray, searchTerm]);

    const groupedForRender = useMemo(() => {
        const result: any[] = [];

        const map = filteredItems.reduce((acc: any, item: any) => {
            if (!acc[item.activityType]) {
                acc[item.activityType] = {};
            }

            if (!acc[item.activityType][item.activitySubType]) {
                acc[item.activityType][item.activitySubType] = [];
            }

            acc[item.activityType][item.activitySubType].push(item);
            return acc;
        }, {});

        Object.entries(map).forEach(([activityType, subtypes]: any) => {
            result.push({
                rowType: "activityType",
                label: activityType,
                key: activityType,
                activityCount: Object.keys(subtypes).length,
                planCount: Object.values(subtypes).reduce(
                    (total: number, items: any) => total + items.length,
                    0
                ),
            });

            Object.entries(subtypes).forEach(([activitySubType, items]: any) => {
                result.push({
                    rowType: "activitySubType",
                    label: activitySubType,
                    key: `${activityType}::${activitySubType}`,
                    parentKey: activityType,
                    planCount: items.length,
                });

                items.forEach((item: any) => {
                    result.push({
                        rowType: "item",
                        parentTypeKey: activityType,
                        parentActivityKey: `${activityType}::${activitySubType}`,
                        ...item,
                    });
                });
            });
        });

        return result;
    }, [filteredItems]);

    const groupedPages = useMemo(() => {
        const blocks = groupedForRender.reduce((result: any[][], row: any) => {
            if (row.rowType === "activityType" || result.length === 0) {
                result.push([]);
            }
            result[result.length - 1].push(row);
            return result;
        }, []);

        return blocks.reduce((pages: any[][], block: any[]) => {
            const currentPageRows = pages[pages.length - 1];
            if (!currentPageRows || currentPageRows.length + block.length > ITEMS_PER_PAGE) {
                pages.push([...block]);
            } else {
                currentPageRows.push(...block);
            }
            return pages;
        }, []);
    }, [groupedForRender]);

    const currentItems = groupedPages[currentPage - 1] || [];
    const countPagination = Math.max(groupedPages.length, 1);

    const toggleCollapsed = (
        setter: React.Dispatch<React.SetStateAction<Set<string>>>,
        key: string
    ) => {
        setter((current) => {
            const next = new Set(current);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const handleClickDeleteMethod = (item: any) => {
        setSelectedItem(item);
        onOpenAlertDialogDelete();
    };

    const handleRowDoubleClickMethod = (item: any) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleDelete = async () => {
        const ids = [
            selectedItem?.ids?.efectivo,
            selectedItem?.ids?.transferencia,
            selectedItem?.id,
        ].filter((id, index, values) => id && values.indexOf(id) === index);

        if (!ids.length) return;

        setLoading(true);

        try {
            await Promise.all(
                ids.map((id) =>
                    axios.delete(
                        `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENT_AMOUNT}${id}/`,
                        {
                            headers: {
                                Authorization: `Bearer ${tokens?.access}`,
                                "Content-Type": "application/json",
                            },
                        }
                    )
                )
            );

            toast({
                title: "Precio eliminado correctamente.",
                description: "Se eliminaron todos los métodos asociados al precio.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onCloseAlertDialogDelete();
            dispatch(getPaymentAmount());
        } catch {
            toast({
                title: "Error",
                description: "Ocurrió un error al eliminar el precio.",
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
        dispatch(getPaymentAmount());
        dispatch(getPlanSubType());
        dispatch(getActivityType());
        dispatch(getActivitySubType());
    }, [dispatch]);

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
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent
                    maxW={{ base: "90%", md: "720px" }}
                    maxH="calc(100dvh - 32px)"
                >
                    <ModalPaymentsAmountEdit
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
                            Eliminar precio
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Está seguro que quiere eliminar todos los precios del plan{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {(plansSubType || []).find(
                                            (plan: any) =>
                                                String(plan.id) === String(
                                                    selectedItem?.plans_subtype?.id ??
                                                    selectedItem?.plans_subtype ??
                                                    selectedItem?.plan?.id ??
                                                    selectedItem?.plan
                                                )
                                        )?.name || selectedItem?.plan_name || selectedItem?.plan?.name || selectedItem?.plan}
                                    </span>?
                                </>
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
                            Precios
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Tipos de actividad, actividades, planes y precios
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
                            Registrar Precio
                        </Button>
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
                <Table size="sm" data-sticky-actions>
                    <Thead>
                        <Tr>
                            <Th>Plan</Th>
                            <Th>Efectivo</Th>
                            <Th>Transferencia</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={4} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((row: any, index: number) => {
                                if (row.rowType === "activityType") {
                                    const isCollapsed = collapsedTypes.has(row.key);
                                    return (
                                        <Tr
                                            key={`type-${row.key}`}
                                            bg="brand.50"
                                            color="brand.800"
                                            _hover={{ bg: "brand.100" }}
                                            cursor="pointer"
                                            onClick={() => toggleCollapsed(setCollapsedTypes, row.key)}
                                        >
                                            <Td colSpan={4} py={3.5} color="inherit">
                                                <Flex align="center" justify="space-between" gap={3}>
                                                    <HStack spacing={2} minW={0}>
                                                        <Box as={isCollapsed ? FiChevronRight : FiChevronDown} flexShrink={0} />
                                                        <Text fontWeight={600} fontSize="14px" noOfLines={1}>
                                                            {row.label}
                                                        </Text>
                                                    </HStack>
                                                    <HStack spacing={2} flexShrink={0}>
                                                        <Badge bg="bg.surface" color="text.secondary" border="1px solid" borderColor="brand.100">
                                                            {row.activityCount} {row.activityCount === 1 ? "actividad" : "actividades"}
                                                        </Badge>
                                                        <Badge bg="bg.surface" color="text.secondary" border="1px solid" borderColor="brand.100">
                                                            {row.planCount} {row.planCount === 1 ? "plan" : "planes"}
                                                        </Badge>
                                                    </HStack>
                                                </Flex>
                                            </Td>
                                        </Tr>
                                    );
                                }

                                if (row.rowType === "activitySubType") {
                                    if (collapsedTypes.has(row.parentKey)) return null;
                                    const isCollapsed = collapsedActivities.has(row.key);
                                    return (
                                        <Tr
                                            key={`subtype-${row.key}`}
                                            bg="bg.subtle" _hover={{ bg: "bg.muted" }}
                                            cursor="pointer"
                                            onClick={() => toggleCollapsed(setCollapsedActivities, row.key)}
                                        >
                                            <Td colSpan={4} py={3} pl={{ base: 3, md: 8 }}>
                                                <Flex align="center" justify="space-between" gap={3}>
                                                    <HStack spacing={2} minW={0}>
                                                        <Box as={isCollapsed ? FiChevronRight : FiChevronDown} flexShrink={0} />
                                                        <Text fontWeight={600} color="text.primary" noOfLines={1}>
                                                            {row.label}
                                                        </Text>
                                                    </HStack>
                                                    <Badge colorScheme="gray">
                                                        {row.planCount} {row.planCount === 1 ? "plan" : "planes"}
                                                    </Badge>
                                                </Flex>
                                            </Td>
                                        </Tr>
                                    );
                                }

                                if (
                                    collapsedTypes.has(row.parentTypeKey) ||
                                    collapsedActivities.has(row.parentActivityKey)
                                ) return null;

                                return (
                                    <Tr
                                        key={`item-${index}`}
                                        onDoubleClick={() => handleRowDoubleClickMethod(row)}
                                        onClick={() => setSelectedRow(row)}
                                        bg={selectedRow?.plan === row.plan ? "gray.100" : "transparent"}
                                        cursor="pointer"
                                    >
                                        <Td fontWeight="600" pl={{ base: 3, md: 12 }}>{row.planDays}</Td>
                                        <Td fontWeight="700" whiteSpace="nowrap">
                                            {formatCurrency(row.efectivo)}
                                        </Td>
                                        <Td fontWeight="700" whiteSpace="nowrap">
                                            {formatCurrency(row.transferencia)}
                                        </Td>
                                        <Td>
                                            <HStack justify="flex-start" spacing={1}>
                                                <Tooltip hasArrow label="Editar">
                                                    <IconButton
                                                        aria-label="Editar"
                                                        icon={<Icon path={mdiPencilOutline} size={0.9} />}
                                                        size="sm"
                                                        onClick={() => handleRowDoubleClickMethod(row)}
                                                        variant="ghost"
                                                    />
                                                </Tooltip>

                                                <Tooltip hasArrow label="Eliminar">
                                                    <IconButton
                                                        aria-label="Eliminar"
                                                        icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                                                        size="sm"
                                                        onClick={() => handleClickDeleteMethod(row)}
                                                        variant="ghostDanger"
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                );
                            })
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

export default TablePrice;
