import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, HStack, Modal, ModalCloseButton, ModalContent, ModalOverlay, Table, TableContainer, Tbody, Td, Th, Thead, useToast, Tooltip, Tr, useDisclosure, Badge, InputGroup, Stack, InputLeftElement, Input, InputRightElement, Flex, Spinner, AlertDialogHeader, Text, IconButton } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom, mdiMagnify, mdiClose } from '@mdi/js';
import ModalStudentEdit from "./ModalStudentEdit";
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import ModalTeacherEdit from "./ModalTeacherEdit";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getTeachers,
} from '../stores/studioSlice';
import { FiPlus, FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const TableTeachers = ({ list, onOpen }: { list: Array<any>; onOpen: () => void; }) => {

    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [code, setCode] = useState("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { teachers } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    // Ordena la lista alfabéticamente por 'last_name'
    const sortedList = [...list].sort((a, b) => {
        const lastNameComparison = a.last_name
            .toLowerCase()
            .localeCompare(b.last_name.toLowerCase());

        if (lastNameComparison === 0) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }

        return lastNameComparison;
    });


    const filteredItems = sortedList.filter((item) => {
        const isActive = item.deleted === null ? "activo" : "dado de baja";

        const formatDate = (dateString) => {
            if (!dateString) return ' '; // Retorna un espacio vacío si la fecha es null o una cadena vacía

            const date = new Date(dateString);
            // Asegúrate de que la fecha se interprete correctamente
            if (isNaN(date.getTime())) {
                return 'Fecha inválida'; // Manejo de fechas inválidas
            }
            const day = String(date.getUTCDate()).padStart(2, '0'); // Usa getUTCDate para obtener el día en UTC
            const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth es 0-indexado, por eso sumamos 1
            const year = date.getUTCFullYear();
            return `${day}/${month}/${year}`; // Formato dd-mm-yyyy
        };

        // Formatear la fecha de último pago y la fecha de nacimiento
        const lastPayment = item.last_payment
            ? formatDate(item.last_payment) : ' ';
        const birthDate = formatDate(item.birth_date);

        // Crear una cadena combinada con nombre y apellido
        const fullName = (item.name + " " + item.last_name).toLowerCase();
        const fullNameReverse = (item.last_name + " " + item.name).toLowerCase(); // Inversa

        // Normalización de búsqueda sin acento
        const normalizedSearchTerm = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

        return (
            isActive.toLowerCase().includes(normalizedSearchTerm) ||
            fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, "").includes(normalizedSearchTerm) ||
            fullNameReverse.normalize('NFD').replace(/[\u0300-\u036f]/g, "").includes(normalizedSearchTerm) ||
            item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").includes(normalizedSearchTerm) ||
            item.last_name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").includes(normalizedSearchTerm) ||
            item.dni.toLowerCase().includes(normalizedSearchTerm) ||
            item.sex.toLowerCase().includes(normalizedSearchTerm) ||
            birthDate.includes(normalizedSearchTerm) ||        // Filtrar por fecha de nacimiento
            lastPayment.includes(normalizedSearchTerm) ||      // Filtrar por fecha de último pago
            item.phone.includes(searchTerm) ||
            item.email.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").includes(normalizedSearchTerm) ||
            item.hours.toString().includes(searchTerm)
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

    // const {
    // isOpen: isAlertCodeOpen,
    // onOpen: onOpenModalCode,
    // onClose: onCloseModalCode,
    // } = useDisclosure();

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

    const handleClickReturn = (item) => {
        onOpenAlertDialogReturn(item);
        setSelectedItem(item)
    };

    const handleRowDoubleClick = (index, item) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleDelete = () => {
        setLoading(true);

        axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS}${selectedItem.id}/`, {
            headers: {
                'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                'Content-Type': 'application/json',
            },
        })
            .then((data) => {
                toast({
                    title: "Profesora dada de baja correctamente.",
                    description: "La profesora fue dada de baja con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogDelete();
                dispatch(getTeachers());
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false); // Asegura que el estado de carga se desactive
            });
    };

    const handleReturn = async () => {
        setLoading(true);

        const updatedItem = {
            deleted: null, // Aquí estamos actualizando el campo 'deleted'
        };

        axios.patch(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS}${selectedItem.id}/`, updatedItem, {
            headers: {
                'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                'Content-Type': 'application/json',
            },
        })
            .then((data) => {
                toast({
                    title: "Profesora dada de alta correctamente.",
                    description: "La profesora fue dada de alta con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogReturn();
                dispatch(getTeachers());
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: "Error",
                    description: error.response?.data?.detail || "No se pudo reactivar la profesora.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            })
            .finally(() => {
                setLoading(false); // Asegura que el estado de carga se desactive
            });
    };

    useEffect(() => {
        dispatch(getTeachers())
        setLoadingTable(true)

        const timer = setTimeout(() => {
            setLoadingTable(false); // Desactiva loading después de 2 segundos
        }, 800); // Ajusta el tiempo en milisegundos

        return () => clearTimeout(timer);
    }, []);



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
                    <ModalTeacherEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
                        getTeachers={getTeachers}
                        teachers={list}
                    />
                </ModalContent>
            </Modal>

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
                                Dar de baja profesora
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>¿Está seguro que quiere dar de baja la profesora <span style={{ fontWeight: 600 }}>{selectedItem?.name} {selectedItem?.last_name}
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
                                Activar profesora
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
                            Profesoras
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de profesoras
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
                            Registrar Profesora
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
                            <Th>Apellido</Th>
                            <Th>Nombre</Th>
                            <Th >DNI</Th>
                            <Th >Género</Th>
                            <Th >Fecha de nacimiento</Th>
                            <Th >Teléfono</Th>
                            <Th >Email</Th>
                            <Th >Horas</Th>
                            <Th >Próximo pago</Th>
                            {/* <Th textTransform={"capitalize"} color="#FFFFFF" textAlign={"center"}>Turno</Th>
                            <Th textTransform={"capitalize"} color="#FFFFFF" textAlign={"center"}>Horario</Th> */}
                            <Th >Estado</Th>
                            <Th >Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? ( // Mostrar "Cargando..." por defecto
                            <TableState kind="loading" colSpan={11} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr key={index}
                                    onDoubleClick={() => {
                                        if (item.deleted === null) {
                                            handleRowDoubleClick(index, item)
                                        }
                                    }}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer">
                                    <Td>{item.last_name}</Td>
                                    <Td>{item.name}</Td>
                                    <Td>{item.dni}</Td>
                                    <Td>{item.sex}</Td>
                                    <Td>
                                        {(() => {
                                            const date = new Date(item.birth_date);
                                            // Asegúrate de que la fecha se interprete correctamente
                                            if (isNaN(date.getTime())) {
                                                return 'Fecha inválida'; // Manejo de fechas inválidas
                                            }
                                            const day = String(date.getUTCDate()).padStart(2, '0'); // Usa getUTCDate para obtener el día en UTC
                                            const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth es 0-indexado, por eso sumamos 1
                                            const year = date.getUTCFullYear();
                                            return `${day}/${month}/${year}`; // Formato dd-mm-yyyy
                                        })()}
                                    </Td>
                                    <Td>{item.phone}</Td>
                                    <Td>{item.email}</Td>
                                    <Td>
                                        {item?.hours}
                                    </Td>
                                    <Td>
                                        {(() => {
                                            if (!item?.last_payment) { // Verifica si exp_date es null o una cadena vacía
                                                return ' '; // Retorna un espacio vacío
                                            }

                                            const date = new Date(item.last_payment);
                                            // Asegúrate de que la fecha se interprete correctamente
                                            if (isNaN(date.getTime())) {
                                                return 'Fecha inválida'; // Manejo de fechas inválidas
                                            }
                                            const day = String(date.getUTCDate()).padStart(2, '0'); // Usa getUTCDate para obtener el día en UTC
                                            const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth es 0-indexado, por eso sumamos 1
                                            const year = date.getUTCFullYear();
                                            return `${day}/${month}/${year}`; // Formato dd-mm-yyyy
                                        })()}
                                    </Td>


                                    {/* <Td fontWeight={300}>
                                    {item?.slot.week_day.day}
                                </Td>
                                <Td fontWeight={300}>
                                    {item?.slot.time_slot.slice(0, 5)}
                                </Td> */}
                                    <Td>
                                        {item.deleted === null ? (
                                            <StatusBadge label="ACTIVO" />
                                        ) : (
                                            <StatusBadge label="DADO DE BAJA" />
                                        )}
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-start" spacing={1}>
                                            {item.deleted === null && (
                                                <Tooltip hasArrow label='Editar'>
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
                                                <Tooltip hasArrow label='Eliminar'>
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
                                                <Tooltip hasArrow label='Reactivar'>
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
                        ) : (!loadingTable && currentItems.length === 0) && (
                            <TableState kind="empty" colSpan={12} title="No se encontraron datos" />
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

export default TableTeachers;
