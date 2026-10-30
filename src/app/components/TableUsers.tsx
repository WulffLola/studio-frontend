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
    Badge,
    Stack,
    Flex,
    Spinner,
    Text,
    IconButton,
    AlertDialogHeader,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Input,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiMagnify, mdiClose, mdiArrowULeftBottom } from '@mdi/js';
import ModalStudentEdit from "./ModalStudentEdit";
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import ModalUserEdit from "./ModalUserEdit";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getUserType,
    getUsers,
} from '../stores/studioSlice';
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const TableUsers = ({ list, onOpen }: { list: Array<any>; onOpen: () => void; getUsers: () => void; }) => {
    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [code, setCode] = useState("admin");
    const { login, tipo, tokens, id } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);


    const { userType, users } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    /*     const [userType, setUserType] = useState([])
     */
    const sortByLastNameAndFirstName = (items) => {
        return [...items].sort((a, b) => {
            const lastNameComparison = a.last_name.localeCompare(b.last_name);

            if (lastNameComparison === 0) {
                return a.name.localeCompare(b.name);
            }
            return lastNameComparison;
        });
    };


    // Aplicar el ordenamiento al 'list'
    const sortedList = sortByLastNameAndFirstName(list);

    const isStudent = (tipo: string) =>
        tipo === "Estudiante" || tipo === "Student";


    const filteredItems = sortedList.filter(item =>
        !(tipo === "Administrador" && item.tipo === "Super") && // Mantener este filtro
        (
            // Buscar por nombre y apellido (nombre + apellido)
            `${item.name} ${item.last_name}`.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "")
                .includes(searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")) ||

            // Buscar por apellido y nombre (apellido + nombre)
            `${item.last_name} ${item.name}`.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "")
                .includes(searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")) ||

            // Buscar por email
            item.email.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "")
                .includes(searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")) ||

            // Buscar por tipo
            (isStudent(item.tipo) ? "Alumno" : item.tipo)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "")
                .includes(searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")) ||

            (item.deleted === null ? "activo" : "dado de baja")
                .toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .includes(searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||

            // Buscar por código
            item.code.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "")
                .includes(searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""))
        )
    );

    const studentItems = filteredItems.filter((item) => isStudent(item.tipo));

    const otherUsersItems = filteredItems.filter((item) => !isStudent(item.tipo));


    const [currentPageActive, setCurrentPageActive] = useState(1);
    const [currentPageInactive, setCurrentPageInactive] = useState(1);

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

    const handleRowDoubleClick = (index, item) => {
        setSelectedItem(item);
        onOpenModalEdit();
    };

    const handleClickReturn = (item) => {
        onOpenAlertDialogReturn(item);
        setSelectedItem(item)
    };

    const handleDelete = (code) => {
        setLoading(true);
        axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}${selectedItem.id}/`, {
            headers: {
                'Authorization': `Bearer ${tokens?.access}`, // Enviar el token en el encabezado
                'Content-Type': 'application/json',
            },
            data: {
                code: code,  // Enviar el código
            }
        })
            .then((data) => {
                toast({
                    title: "Usuario eliminado correctamente.",
                    description: "El usuario fue eliminado con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogDelete();
                dispatch(getUsers());  // Recarga la lista de usuarios
            })
            .catch((error) => {
                console.error("Error al eliminar el usuario:", error);
            }).finally(() => {
                setLoading(false); // Asegura que el estado de carga se desactive
            });
    };


    useEffect(() => {
        dispatch(getUserType());
    }, [dispatch]);

    const handleReturn = async () => {
        setLoading(true);

        // Si se encuentra el tipo, usa su id, si no, muestra un mensaje o realiza alguna acción
        const updatedItem = {
            deleted: null, // Aquí estamos actualizando el campo 'deleted'
        };

        axios.patch(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}${selectedItem.id}/`, updatedItem, {
            headers: {
                'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                'Content-Type': 'application/json',
            },
        })
            .then((data) => {
                toast({
                    title: "Usuario dado de alta correctamente.",
                    description: "El usuario fue dado de alta con éxito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogReturn();
                dispatch(getUsers());
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: "Error",
                    description: error.response?.data?.detail || "No se pudo reactivar el usuario.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }).finally(() => {
                setLoading(false); // Asegura que el estado de carga se desactive
            });
    };

    useEffect(() => {
        dispatch(getUserType());
        setLoadingTable(true)

        const timer = setTimeout(() => {
            setLoadingTable(false); // Desactiva loading después de 2 segundos
        }, 800); // Ajusta el tiempo en milisegundos

        return () => clearTimeout(timer);
    }, []);

    const renderTable = (items: any[]) => {
        const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
        const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
        const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

        return (
            <Box
                overflowX="auto"
                // borderWidth="1px"
                borderRadius="card"
                bg="bg.surface"
                mt={0}
                minH={"100%"}
                w={"100%"}
            >
                <Table size="sm" data-sticky-actions>
                    <Thead>
                        <Tr>
                            <Th>Nombre</Th>
                            <Th>Email</Th>
                            <Th>Tipo</Th>
                            <Th>Code</Th>
                            <Th>Estado</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={6} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr
                                    key={index}
                                    onDoubleClick={() => handleRowDoubleClick(index, item)}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                >
                                    <Td>
                                        {item.last_name} {item.name}
                                    </Td>
                                    <Td>{item.email}</Td>
                                    <Td>
                                        <Badge colorScheme={item.tipo === "Super" ? "brand" : "gray"}>
                                            {isStudent(item.tipo) ? "Alumno" : item.tipo}
                                        </Badge>
                                    </Td>
                                    <Td>{item.code}</Td>
                                    <Td>
                                        {item.deleted === null ? (
                                            <StatusBadge label="ACTIVO" />
                                        ) : (
                                            <StatusBadge label="DADO DE BAJA" />
                                        )}
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-start" spacing={1}>
                                            {tipo !== "Consultor" && (
                                                <>
                                                    {item.deleted === null  && (
                                                        <Tooltip hasArrow label="Editar">
                                                            <IconButton
                                                                aria-label="Editar"
                                                                icon={<Icon path={mdiPencilOutline} size={0.9} />}
                                                                size="sm"
                                                                onClick={() => handleClickEdit(item)}
                                                                variant="ghost"
                                                            />
                                                        </Tooltip>
                                                    )}

                                                    {item.deleted === null && (tipo === "Super" || item.id !== id) && (
                                                        <Tooltip hasArrow label="Eliminar">
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
                                                        <Tooltip hasArrow label="Reactivar">
                                                            <IconButton
                                                                aria-label="Reactivar"
                                                                icon={<Icon path={mdiArrowULeftBottom} size={0.9} />}
                                                                size="sm"
                                                                onClick={() => handleClickReturn(item)}
                                                                variant="ghost"
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        ) : (
                            <TableState kind="empty" colSpan={6} title="No se encontraron datos" />
                        )}
                    </Tbody>
                </Table>
            </Box>
        );
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
                    <ModalUserEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
                        getUsers={getUsers}
                        users={users}
                    />
                </ModalContent>
            </Modal>

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
                                Activar usuario
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>¿Desea volver a activar al usuario <span style={{ fontWeight: 600 }}>{selectedItem?.last_name} {selectedItem?.name}
                                    </span>?</>
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
                                    onClick={() => handleReturn()}
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
                                Eliminar usuario
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
                                    onClick={() => handleDelete(code)}
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
            {/* <HStack> */}
            <Stack
                /*  spacing={2}
                 direction={["column", "row"]}
                 mt={2}
                 justifyContent="space-between"
                 alignItems="center"
                 w="100%" */
                mt={6} mb={2} w="100%"
            >
                <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "flex-start", md: "center" }}
                    justify="space-between"
                    w="100%"
                    gap={4}
                >
                    {/* Izquierda: título + subtítulo */}
                    <Box flexShrink={0}>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de usuarios
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
                            Registrar Usuario
                        </Button>
                    </HStack>
                </Flex>
                {/*   <InputGroup mb={2} bg={"#FFFFFF"} justifyContent={"left"} w={{ base: "100%", md: "80%", lg: "80%", xl: "90%" }}>
                    <InputLeftElement pointerEvents="none">
                        <Icon path={mdiMagnify} size={1} />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && ( // Muestra la cruz solo si hay texto en el input
                        <InputRightElement>
                            <Icon
                                path={mdiClose}
                                size={1}
                                onClick={() => setSearchTerm("")} // Llama a la función para limpiar el input
                                style={{ cursor: 'pointer' }} // Cambia el cursor al pasar sobre el icono
                            />
                        </InputRightElement>
                    )}
                </InputGroup>
                <Button
                    w={{ base: "100%", md: "150px", xl: "150px" }}
                    bg="studio.muted"
                    onClick={onOpen}
                >
                    Registrar Usuario
                </Button> */}
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
                {/*             <Table size={"sm"} data-sticky-actions>
                    <Thead h={"50px"} fontSize={"16px"}>
                        <Tr>
                            <Th>Nombre</Th>
                            <Th >Email</Th>
                            <Th >Tipo</Th>
                            <Th >Code</Th>
                            <Th>Estado</Th>
                            <Th> Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? (
                            <TableState kind="loading" colSpan={7} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr key={index} onDoubleClick={() => handleRowDoubleClick(index, item)} onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer">
                                    <Td fontWeight={300}>{item.last_name} {item.name} </Td>
                                    <Td fontWeight={300}>{item.email}</Td>
                                    <Td fontWeight={300}>
                                        <Badge colorScheme={
                                            item.tipo === "Super" ? "green" :
                                                item.tipo === "Administrador" ? "yellow" :
                                                    item.tipo === "Consultor" ? "red" : "purple"
                                        }>
                                            {item.tipo}
                                        </Badge>
                                    </Td>
                                    <Td fontWeight={300}>{item.code}</Td>
                                    <Td fontWeight={300}>
                                        {item.deleted === null ? (
                                            <Badge colorScheme="green" borderRadius="999px" px={3} py={1}>ACTIVO</Badge>
                                        ) : (
                                            <Badge colorScheme="red" borderRadius="999px" px={3} py={1}>DADO DE BAJA</Badge>
                                        )}
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-start" spacing={1}>
                                            {(tipo !== "Consultor") && (
                                                <>
                                                    <Tooltip hasArrow label='Editar' bg='bg.inverted' borderRadius={4}>
                                                        <IconButton
                                                            aria-label="Eliminar"
                                                            icon={<Icon path={mdiPencilOutline} size={0.9} />}
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleClickEdit(item)}
                                                        >
                                                        </IconButton>
                                                    </Tooltip>
                                                    {(item.id !== id && item.deleted === null) && ( 
                                                        <Tooltip hasArrow label='Eliminar' bg='bg.inverted' borderRadius={4}>
                                                            <IconButton
                                                                aria-label="Eliminar"
                                                                icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleClickDelete(item)}
                                                            >

                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {item.deleted !== null && (
                                                        <Tooltip hasArrow label='Reactivar' bg='bg.inverted' borderRadius={4}>
                                                            <IconButton
                                                                aria-label="Reactivar"
                                                                icon={<Icon path={mdiArrowULeftBottom} size={0.9} />}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleClickReturn(item)}
                                                            >
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        ) : (!loadingTable && currentItems.length === 0) && (
                            <TableState kind="empty" colSpan={6} title="No se encontraron datos" />
                        )}
                    </Tbody>

                </Table> */}

                <Tabs variant="line" mt={4}>
                    <TabList>
                        <Tab
                        >
                            Usuarios internos
                        </Tab>

                        <Tab
                        >
                            Usuarios alumnos
                        </Tab>
                    </TabList>

                    <TabPanels>

                        {/* TAB OTROS USUARIOS */}
                        <TabPanel px={0}>
                            {renderTable(otherUsersItems)}

                            <Flex justify="center" mt={4}>
                                <Pagination
                                    count={Math.max(Math.ceil(otherUsersItems.length / ITEMS_PER_PAGE), 1)}
                                    pageSize={ITEMS_PER_PAGE}
                                    defaultPage={1}
                                    onPageChange={setCurrentPage}
                                />
                            </Flex>
                        </TabPanel>

                        {/* TAB STUDENTS */}
                        <TabPanel px={0}>
                            {renderTable(studentItems)}
                            <Flex justify="center" mt={4}>
                                <Pagination
                                    count={Math.max(Math.ceil(studentItems.length / ITEMS_PER_PAGE), 1)}
                                    pageSize={ITEMS_PER_PAGE}
                                    defaultPage={1}
                                    onPageChange={setCurrentPage}
                                />
                            </Flex>
                        </TabPanel>

                    </TabPanels>
                </Tabs>
            </Box >
        </>
    );
};

export default TableUsers;
