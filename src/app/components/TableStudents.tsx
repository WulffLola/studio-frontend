import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, Checkbox, HStack, Modal, ModalCloseButton, ModalContent, ModalOverlay, Table, TableContainer, Tbody, Td, Th, Thead, useToast, Tooltip, Tr, useDisclosure, Badge, Stack, InputGroup, InputLeftElement, Input, InputRightElement, Spinner, Flex, Text, IconButton, Spacer, VStack, AlertDialogHeader } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom, mdiMagnify, mdiClose } from '@mdi/js';
import ModalStudentEdit from "./ModalStudentEdit";
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { FiGrid, FiList, FiPlus, FiSearch } from "react-icons/fi";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getAppointments,
    getPeoples,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const normalizeText = (value: unknown) =>
    String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const formatDate = (value: unknown) => {
    if (!value) return "";
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "Fecha inválida";
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getUTCFullYear()}`;
};

const hasSignedGeneralDeclaration = (student: any) =>
    student?.firmo_declaracion_general === true ||
    (student?.firmo_declaracion_general === undefined && student?.declaration_signed === true);

const TableStudents = ({ list, onOpen }: { list: Array<any>; onOpen: () => void; }) => {
    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
/*     const [appointments, setAppointments] = useState([]);
 */    const [existsAppointments, setExistsAppointments] = useState(false);
    const [code, setCode] = useState("admin");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { appointments } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const sortedList = useMemo(
        () => (Array.isArray(list) ? list.filter(Boolean) : []).sort((a, b) => {
            const last = String(a?.last_name ?? "").localeCompare(String(b?.last_name ?? ""), "es", { sensitivity: "base" });
            return last !== 0
                ? last
                : String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "es", { sensitivity: "base" });
        }),
        [list]
    );

    const filteredItems = sortedList.filter((item) => {
        // Determinar el estado del usuario
        const isActive = item.deleted === null ? "activo" : "dado de baja";

        // Fechas formateadas
        const expDate = formatDate(item.exp_date);
        const birthDate = formatDate(item.birth_date);

        // Días del plan (si existe)
        const weekDay = normalizeText(item.plan?.days);

        // Normalizar y verificar el término de búsqueda
        const normalizedSearchTerm = normalizeText(searchTerm);

        // Crear una cadena combinada con nombre y apellido
        const fullName = normalizeText(`${item.name ?? ""} ${item.last_name ?? ""}`);
        const fullNameReverse = normalizeText(`${item.last_name ?? ""} ${item.name ?? ""}`);

        // Filtrar según los campos
        return (
            normalizeText(isActive).includes(normalizedSearchTerm) ||
            fullName.includes(normalizedSearchTerm) || // Buscar en nombre + apellido (sin acento)
            fullNameReverse.includes(normalizedSearchTerm) || // Buscar en apellido + nombre (sin acento)
            normalizeText(item.name).includes(normalizedSearchTerm) ||
            normalizeText(item.last_name).includes(normalizedSearchTerm) ||
            normalizeText(item.dni).includes(normalizedSearchTerm) ||
            normalizeText(item.sex).includes(normalizedSearchTerm) ||
            birthDate.includes(normalizedSearchTerm) || // Fecha de nacimiento
            expDate.includes(normalizedSearchTerm) ||   // Última fecha de pago
            normalizeText(item.phone).includes(normalizedSearchTerm) ||
            normalizeText(item.email).includes(normalizedSearchTerm) ||
            weekDay.includes(normalizedSearchTerm)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);


    // Calcula el índice del primer y último elemento a mostrar
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
    const activeCount = filteredItems.filter(item => item.deleted === null).length;
    const inactiveCount = filteredItems.filter(item => item.deleted !== null).length;

    // Lógica para mantener siempre 8 filas
    const emptyRowsCount = ITEMS_PER_PAGE - currentItems.length;

    const {
        isOpen: isAlertEditOpen,
        onOpen: onOpenModalEdit,
        onClose: onCloseModalEdit,
    } = useDisclosure();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogDeleteOpen,
        onOpen: onOpenAlertDialogDelete,
        onClose: onCloseAlertDialogDelete,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogExistsAppointmentsOpen,
        onOpen: onOpenAlertDialogExistsAppointments,
        onClose: onCloseAlertDialogExistsAppointments,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogOpenReturn,
        onOpen: onOpenAlertDialogReturn,
        onClose: onCloseAlertDialogReturn,
    } = useDisclosure();

    const cancelRef = React.useRef();
    const toast = useToast();

    // Function delete student
    const handleClickDelete = (item) => {
        onOpenAlertDialogDelete(item);
        setSelectedItem(item);
    };

    const handleClickEdit = (item) => {
        onOpenModalEdit();
        setSelectedItem(item);
    };

    const handleClickReturn = (item) => {
        onOpenAlertDialogReturn(item);
        setSelectedItem(item)
    };

    const handleRowDoubleClick = (index, item) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };


    const checkIfAppointmentExists = (appointments, selectedItem) => {
        // Verifica si existe al menos una cita con el mismo id
        const exists = Array.isArray(appointments) && appointments.some((appointment) => {
            const personId = typeof appointment?.person === "object"
                ? appointment.person?.id
                : appointment?.person;
            return personId != null && personId === selectedItem?.id;
        });
        setExistsAppointments(exists); // Actualiza el estado
        return exists; // Devuelve el resultado
    };

    const handleClickExistsAppointments = () => {
        // Verifica si existe una cita con el id seleccionado
        if (checkIfAppointmentExists(appointments, selectedItem)) {
            onOpenAlertDialogExistsAppointments(); // Abre el diálogo de alerta si existe la cita
        } else {
            // Verifica el tipo antes de decidir qué acción tomar
            if (tipo === "Consultor") {
                onOpenModalCode(); // Abre el modal de código si el tipo es "Consultor"
            } else {
                handleDelete(code); // Ejecuta handleDelete si el tipo no es "Consultor"
            }
        }
    };

    useEffect(() => {
        dispatch(getAppointments());
        dispatch(getPeoples());
        setLoadingTable(true)

        const timer = setTimeout(() => {
            setLoadingTable(false); // Desactiva loading después de 2 segundos
        }, 800); // Ajusta el tiempo en milisegundos

        return () => clearTimeout(timer);
    }, [dispatch]);


    const handleDelete = async (code) => {
        setLoading(true);
        try {
            const { data } = await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}${selectedItem.id}/`,
                {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access}`, // Añade el token de autenticación
                        'Content-Type': 'application/json',
                    },
                    data: {
                        code: code  // Campo 'code' con su valor
                    }
                }
            );

            toast({
                title: "Alumno dado de baja correctamente.",
                description: "El alumno fue dado de baja con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            onCloseAlertDialogExistsAppointments();
            onCloseAlertDialogDelete();
            dispatch(getPeoples());

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al dar de baja al alumno.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false); // Asegura que el estado de carga se desactive
        };
    };


    const handleReturn = async () => {
        setLoading(true);

        const updatedItem = {
            deleted: null, // Aquí actualizamos el campo 'deleted' del alumno
        };

        axios.patch(`${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}${selectedItem.id}/`, updatedItem, {
            headers: {
                'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                'Content-Type': 'application/json',
            },
        })
            .then((data) => {
                toast({
                    title: "Alumno dado de alta correctamente.",
                    description: "El alumno fue dado de alta con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogReturn();
                dispatch(getPeoples());
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: "Error",
                    description: error.response?.data?.detail || "No se pudo reactivar el alumno.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }).finally(() => {
                setLoading(false); // Asegura que el estado de carga se desactive
            });
    };


    return (
        <>
            <Modal
                onClose={onCloseModalEdit}
                isOpen={isAlertEditOpen}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay w={"100%"} h={"100%"} />
                <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                    <ModalCloseButton />
                    <ModalStudentEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
                        getPeoples={getPeoples}
                        peoples={list}
                    />
                </ModalContent>
            </Modal>

            <Modal
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
            </Modal>

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
                                Dar de baja alumno
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>¿Está seguro que quiere dar de baja el alumno <span style={{ fontWeight: 600 }}>{selectedItem?.name} {selectedItem?.last_name}
                                    </span> con DNI <span style={{ fontWeight: 600 }}>{selectedItem?.dni}</span>?</>
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
                                    // onClick={handleDelete}
                                    onClick={handleClickExistsAppointments}
                                    ml={3}
                                    w={["100%", "135px"]}
                                    variant="danger"
                                >
                                    Dar de baja
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </>

            <>
                {loading && (
                    <LoadingOverlay />
                )}
                <AlertDialog
                    isOpen={isAlertDialogExistsAppointmentsOpen}
                    onClose={onCloseAlertDialogExistsAppointments}
                    leastDestructiveRef={cancelRef}
                    isCentered
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogCloseButton />
                            <AlertDialogHeader>
                                Eliminar alumno
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>El alumno <span style={{ fontWeight: 600 }}>{selectedItem?.name} {selectedItem?.last_name}
                                    </span> con DNI <span style={{ fontWeight: 600 }}>{selectedItem?.dni}</span> tiene turnos asociados. ¿Desea eliminarlo de todos modos?</>
                                ) : (
                                    <>No se ha seleccionado ninguna solicitud.</>
                                )}
                            </AlertDialogBody>
                            <AlertDialogFooter gap={3}>
                                <Button
                                    onClick={() => { onCloseAlertDialogExistsAppointments(); onCloseAlertDialogDelete(); }}
                                    w={["100%", "135px"]}
                                    aria-label="Cancelar"
                                    variant="secondary"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    // onClick={handleDelete}
                                    onClick={() => tipo === "Consultor" ? onOpenModalCode() : handleDelete(code)}
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
            </>

            <>
                {loading && (
                    <LoadingOverlay />
                )}
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
                                Activar alumno
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>¿Desea volver a activar a <span style={{ fontWeight: 600 }}>{selectedItem?.name} {selectedItem?.last_name}
                                    </span> con DNI <span style={{ fontWeight: 600 }}>{selectedItem?.dni}</span>?</>
                                ) : (
                                    <>No se ha seleccionado ninguna solicitud.</>
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
                    <Box>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de alumnos
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
                            Registrar Alumno
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
                <Table size="sm" data-sticky-actions>
                    <Thead>
                        <Tr>
                            <Th>
                                Apellido
                            </Th>
                            <Th>
                                Nombre
                            </Th>
                            <Th>
                                DNI
                            </Th>
                            <Th>
                                Género
                            </Th>
                            <Th>
                                Fecha de nacimiento
                            </Th>
                            <Th>
                                Teléfono
                            </Th>
                            <Th>
                                Email
                            </Th>
                            <Th>
                                Observación
                            </Th>
                            <Th>
                                Plan
                            </Th>
                            <Th>
                                Vencimiento pago
                            </Th>
                            <Th textAlign="center">
                                Declaración
                            </Th>
                            <Th>
                                Estado
                            </Th>
                            <Th isNumeric>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={13} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr
                                    key={index}
                                    onDoubleClick={() => {
                                        if (item.deleted === null) {
                                            handleRowDoubleClick(index, item);
                                        }
                                    }}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                >
                                    <Td>{item.last_name}</Td>
                                    <Td>{item.name}</Td>
                                    <Td>{item.dni}</Td>
                                    <Td>{item.sex}</Td>
                                    <Td>
                                        {formatDate(item.birth_date) || "-"}
                                    </Td>
                                    <Td>{item.phone}</Td>
                                    <Td>{item.email}</Td>
                                    <Td minW="180px" maxW="240px">
                                        <Tooltip
                                            label={item.observation}
                                            hasArrow
                                            placement="top"
                                            isDisabled={!item.observation || item.observation.length < 100}
                                        >
                                            <Text
                                                noOfLines={{ base: 5, md: 5, lg: 4 }}
                                                whiteSpace="normal"
                                                overflow="hidden"
                                                textOverflow="ellipsis"
                                                overflowWrap="break-word"
                                            >
                                                {item.observation || "-"}
                                            </Text>
                                        </Tooltip>
                                    </Td>
                                    <Td>
                                        {item.plan && item.plan.days}
                                    </Td>
                                    <Td>
                                        {formatDate(item.exp_date) || "-"}
                                    </Td>
                                    <Td textAlign="center">
                                        <Checkbox
                                            isChecked={hasSignedGeneralDeclaration(item)}
                                            isReadOnly
                                            aria-label={
                                                hasSignedGeneralDeclaration(item)
                                                    ? "Declaración firmada"
                                                    : "Declaración no firmada"
                                            }
                                        />
                                    </Td>
                                    <Td>
                                        {item.deleted === null ? (
                                            <StatusBadge label="ACTIVO" />
                                        ) : (
                                            <StatusBadge label="DADO DE BAJA" />
                                        )}
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-end" spacing={1}>
                                            {item.deleted === null && (
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
                                            )}

                                            {item.deleted === null && (
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
                            <TableState kind="empty" colSpan={13} title="No se encontraron datos" />
                        )}
                    </Tbody>
                </Table>
            </Box>

            <Flex
                w="100%"
                px={4}
                py={2}
                align="center"
                justify="space-between"
                direction={{ base: "column", md: "row", lg: "row" }}
                gap={{ base: 3, md: 4, lg: 0 }}
            >
                {/* ESPACIO IZQUIERDO SOLO EN DESKTOP */}
                <Box
                    w={{ base: "100%", md: "100%", lg: "33%" }}
                    display={{ base: "none", md: "block" }}
                />

                {/* 📌 CONTADOR */}
                <Box
                    w={{ base: "100%", md: "33%", lg: "33%" }}
                    order={{ base: 1, md: 3, lg: 3 }}
                    display="flex"
                    justifyContent={{ base: "center", md: "flex-end", lg: "flex-end" }}
                >
                    {/* AHORA: siempre en fila salvo en mobile */}
                    <HStack
                        spacing={4}
                        display="flex"
                    >
                        <Text fontSize="sm" whiteSpace="nowrap">
                            <Text as="span" color="green.500">🟢</Text> Activos: {activeCount}
                        </Text>
                        <Text fontSize="sm" whiteSpace="nowrap">
                            <Text as="span" color="error.fg">🔴</Text> De Baja: {inactiveCount}
                        </Text>
                    </HStack>
                </Box>

                {/* 📌 PAGINACIÓN */}
                <Box
                    w={{ base: "100%", md: "100%", lg: "33%" }}
                    order={{ base: 2, md: 2, lg: 2 }}
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
            </Flex>

        </>
    );
};

export default TableStudents;
