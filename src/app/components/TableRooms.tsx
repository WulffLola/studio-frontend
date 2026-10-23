"use client"

import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, HStack, Modal, ModalCloseButton, ModalContent, ModalOverlay, Table, TableContainer, Tbody, Td, Th, Thead, useToast, Tooltip, Tr, useDisclosure, Badge, Stack, Input, InputGroup, InputLeftElement, InputRightElement, Spinner, Flex, AlertDialogHeader, Text, IconButton } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiArrowULeftBottom, mdiMagnify, mdiClose } from '@mdi/js';
import ModalStudentEdit from "./ModalStudentEdit";
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import ModalTeacherEdit from "./ModalTeacherEdit";
import ModalPaymentsAmountEdit from "./ModalPaymentsAmountEdit";
import ModalPlansEdit from "./ModalPlansSubTypeEdit";
import { useAuthStore } from "../stores/auth";
import ModalStudioEdit from "./ModalStudioEdit";
import { getRooms } from "../stores/studioSlice";
import { useDispatch, useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import ModalRoomsEdit from "./ModalRoomsEdit";
import { FiPlus, FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const TableRooms = ({ onOpen }: { onOpen: () => void; }) => {

    const [selectedRow, setSelectedRow] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemPrice, setSelectedItemPrice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [code, setCode] = useState("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);

    const { rooms } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    // Filtrado robusto (name, studio_name, capacity, deleted)
    const filteredItems = (rooms ?? []).filter((item: any) => {
        const status =
            item?.deleted === null
                ? "ACTIVO"
                : "INACTIVO DADO DE BAJA";

        const combined = `${item?.name ?? ""} ${item?.studio_name ?? ""} ${item?.capacity ?? ""} ${status}`;

        const normalized = combined
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const normalizedSearch = (searchTerm ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        return normalized.includes(normalizedSearch);
    });

    // Reset de página cuando cambia la lista o el filtro (evita “no lo veo” en otra página)
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredItems.length, searchTerm]);

    // Paginado
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
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
        isOpen: isAlertDialogAssociatedOpen,
        onOpen: onOpenAlertDialogAssociated,
        onClose: onCloseAlertDialogAssociated,
    } = useDisclosure();


    const {
        isOpen: isAlertDialogDeleteOpen,
        onOpen: onOpenAlertDialogDelete,
        onClose: onCloseAlertDialogDelete,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogPriceOpen,
        onOpen: onOpenAlertDialogPrice,
        onClose: onCloseAlertDialogPrice,
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

    // const handleDeletePlanAndPrice = (item) => {
    // setSelectedItem(item);
    // handleDelete();

    // const foundPayment = paymentsAmount.find((payment) => String(payment.plan) === String(item.id));

    // if (foundPayment) {
    // setSelectedItemPrice(foundPayment.id); // Guardamos el id en SelectedItemPrice
    // handleDeletePrice(); // Finalmente, ejecutamos la eliminación del precio
    // }
    // };

    /*   const handleDelete = () => {
          setLoading(true);
          axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_ROOMS}${selectedItem.id}/`, {
              headers: {
                  'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                  'Content-Type': 'application/json',
              },
          })
              .then((data) => {
                  toast({
                      title: "Sala eliminada correctamente.",
                      description: "La Sala fue eliminada con éxito.",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                      position: "bottom-right",
                  });
                  onCloseAlertDialogDelete();
                  // onCloseAlertDialogPrice();
                  dispatch(getRooms())
              })
              .catch((error) => {
                  toast({
                      title: "Error",
                      description: "Ocurrió un error al eliminar una sala.",
                      status: "error",
                      duration: 5000,
                      isClosable: true,
                      position: "bottom-right",
                  });
                  // }
              }).finally(() => {
                  setLoading(false); // Asegura que el estado de carga se desactive
              });
      }; */

    const handleDelete = async () => {
        setLoading(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_ROOMS}${selectedItem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            toast({
                title: "Sala dada de baja correctamente.",
                description: "La sala fue dada de baja con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onCloseAlertDialogDelete();
            dispatch(getRooms());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al dar de baja la sala.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClickReturn = (item) => {
        onOpenAlertDialogReturn(item);
        setSelectedItem(item)
    };

    const handleReturn = async () => {
        setLoading(true);

        axios
            .patch(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_ROOMS}${selectedItem.id}/`,
                { deleted: null },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            )
            .then(() => {
                toast({
                    title: "Sala dada de alta correctamente.",
                    description: "La sala fue dada de alta con exito.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "bottom-right",
                });
                onCloseAlertDialogReturn();
                dispatch(getRooms())
            })
            .catch((error) => {
                console.error(error);
                toast({
                    title: "Error",
                    description: "Ocurrio un error al dar de alta la sala.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        dispatch(getRooms());
    }, [dispatch]);

    useEffect(() => {
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
                <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                    <ModalCloseButton />
                    <ModalRoomsEdit
                        onClose={onCloseModalEdit}
                        product={selectedItem}
                    /*  getRs={getRooms}
                     room={rooms} */
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
                                Eliminar sala
                            </AlertDialogHeader>
                            <AlertDialogBody>
                                {selectedItem ? (
                                    <>
                                        ¿Está seguro que quiere eliminar la sala <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span> ?
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
                                    onClick={() => handleDelete()}
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
                            Activar sala
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>¿Desea volver a activar la sala <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>?</>
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

            {/* <AlertDialog
                isOpen={isAlertDialogAssociatedOpen}
                onClose={onCloseAlertDialogAssociated}
                leastDestructiveRef={cancelRef}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent m={100}>
                        <AlertDialogCloseButton />
                        <AlertDialogBody textAlign={"center"} mt={55}>
                            {selectedItem ? (
                                <>
                                    No es posible eliminar el estudio <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>, ya que se encuentra asociado a una o mas personas.
                                </>
                            ) : (
                                <>No se ha seleccionado ninguna solicitud.</>
                            )}

                        </AlertDialogBody>
                        <AlertDialogFooter mt={5} display={"flex"} justifyContent={"center"} gap={"20px"}>
                            <Button
                                onClick={() => {
                                    onCloseAlertDialogAssociated();
                                    onCloseAlertDialogPrice();
                                    onCloseAlertDialogDelete();
                                }}
                                bg="bg.surface"
                                color="text.primary"
                                w={["100%", "135px"]}
                                h="40px"
                                border="1px solid black"
                                borderRadius={4}
                                fontWeight="medium"
                                boxShadow="none"
                                _hover={{ bg: "bg.hover" }}
                            >
                                Cerrar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog> */}

            {/* <AlertDialog
                isOpen={isAlertDialogStudioOpen}
                onClose={onCloseAlertDialogStudio}
                leastDestructiveRef={cancelRef}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent m={100}>
                        <AlertDialogCloseButton />
                        <AlertDialogBody textAlign={"center"} mt={55}>
                            {selectedItem ? (
                                <>
                                    El estudio <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span> contiene turnos asociados. ¿Desea eliminarlo de igual manera?
                                </>
                            ) : (
                                <>No se ha seleccionado ninguna solicitud.</>
                            )}

                        </AlertDialogBody>
                        <AlertDialogFooter mt={5} display={"flex"} justifyContent={"center"} gap={"20px"}>
                            <Button
                                onClick={onCloseAlertDialogStudio}
                                bg="bg.surface"
                                color="text.primary"
                                w={["100%", "135px"]}
                                h="40px"
                                border="1px solid black"
                                borderRadius={4}
                                fontWeight="medium"
                                boxShadow="none"
                                _hover={{ bg: "bg.hover" }}
                             aria-label="Cancelar">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleDelete}
                                bg="studio.primary"
                                color="text.primary"
                                w={["100%", "135px"]}
                                h="40px"
                                borderRadius={4}
                                fontWeight="medium"
                                _hover={{ bg: "studio.primaryHover" }}
                            >
                                Aceptar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog> */}

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
                            Salas
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                            Gestión de las salas de los estudios
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
                            Registrar Sala
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
                            <Th>Sala</Th>
                            <Th>Estudio</Th>
                            <Th>Capacidad</Th>
                            <Th>Estado</Th>
                            <Th isNumeric>Acciones</Th>
                        </Tr>
                    </Thead>

                    <Tbody>
                        {loadingTable ? ( // Mostrar "Cargando..." por defecto
                            <TableState kind="loading" colSpan={6} />
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => (
                                <Tr
                                    key={item.id}
                                    onDoubleClick={() => handleRowDoubleClick(item.id, item)}
                                    onClick={() => setSelectedRow(item)}
                                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                                >
                                    <Td>{item.name}</Td>
                                    <Td>{item.studio_name}</Td>
                                    <Td>{item.capacity}</Td>
                                    <Td>
                                        <StatusBadge label={item.deleted === null ? "ACTIVO" : "DADO DE BAJA"} />
                                    </Td>
                                    <Td isNumeric>
                                        <HStack justify="flex-end" spacing={1}>
                                            {item.deleted === null && (
                                                <Tooltip hasArrow label='Editar'>
                                                    <IconButton
                                                        aria-label="Editar"
                                                        icon={<Icon path={mdiPencilOutline} size={0.9} />}
                                                        size="sm"
                                                        onClick={() => handleClickEdit(item)}
                                                        variant="ghost"
                                                    >

                                                    </IconButton>
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
                                                    >
                                                    </IconButton>
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
                                                    >
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        ) : (!loadingTable && currentItems.length === 0) && (
                            <TableState kind="empty" colSpan={6} title="No se encontraron datos" />
                        )}
                        {/*  {emptyRowsCount > 0 && currentItems.length === 0 ? (
                            <>
                                <Tr>
                                    <Td colSpan={10} style={{ height: "40px" }}></Td>
                                </Tr>
                                <TableState kind="empty" colSpan={10} title="No se encontraron datos" />
                                {Array.from({ length: 7 }).map((_, index) => (
                                    <Tr key={`empty-${index}`}>
                                        <Td colSpan={10} style={{ height: "40px" }}></Td>
                                    </Tr>
                                ))}
                            </>
                        ) : (
                            Array.from({ length: emptyRowsCount }).map((_, index) => (
                                <Tr key={`empty-${index}`}>
                                    <Td colSpan={10} style={{ height: "40px" }}></Td>
                                </Tr>
                            ))
                        )} */}
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

export default TableRooms;
