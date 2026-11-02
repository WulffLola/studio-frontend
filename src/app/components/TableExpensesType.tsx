import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Box, Button, Flex, HStack, IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Modal, ModalCloseButton, ModalContent, ModalOverlay, Spinner, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useDisclosure, useToast } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiMagnify, mdiClose } from '@mdi/js';
import ModalPaymentEdit from "./ModalPaymentEdit";
import Pagination from "./Pagination";
import { useAuthStore } from "../stores/auth"
import ModalExpenseEdit from "./ModalExpenseEdit";
import ModalExpensesTypeEdit from "./ModalExpensesTypeEdit";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getExpenseType,
} from '../stores/studioSlice';
import { FiPlus, FiSearch } from "react-icons/fi";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";

const ITEMS_PER_PAGE = 10;

const TableExpensesType = ({ list, onOpen }: { list: Array<any>; onOpen: () => void }) => {
  const [payments, setPayments] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedRow, setSelectedRow] = useState([])
  const [currentPage, setCurrentPage] = useState(1);
  const [code, setCode] = useState("admin");
  const { logout, name, last_name, tipo, tokens } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);


  const { expense_type } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  // Ordena la lista alfabéticamente por 'name'
  const sortedList = [...list].sort((a, b) => {
  if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
  if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
  return 0;
});


  const filteredItems = sortedList.filter(item =>
    item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(
      searchTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    )
  );


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
    isOpen: isAlertDialogDeleteOpen,
    onOpen: onOpenAlertDialogDelete,
    onClose: onCloseAlertDialogDelete,
  } = useDisclosure();

  const cancelRef = React.useRef();
  const toast = useToast();


  useEffect(() => {
    // getPeoples()
    dispatch(getExpenseType());
    setLoadingTable(true)

    const timer = setTimeout(() => {
      setLoadingTable(false); // Desactiva loading después de 2 segundos
    }, 800); // Ajusta el tiempo en milisegundos

    return () => clearTimeout(timer);
  }, []);


  // Function delete student
  const handleClickDelete = (item) => {
    onOpenAlertDialogDelete(item);
    setSelectedItem(item)
    // setSelectedEstado(item.id)
  };

  const handleClickEdit = (item) => {
    onOpenModalEdit()
    setSelectedItem(item)
  };

  const handleRowDoubleClick = (index, item) => {
    setSelectedItem(item);
    onOpenModalEdit();
  };

  const handleDelete = () => {
    setLoading(true);

    axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES_TYPE}${selectedItem.id}/`, {
      headers: {
        'Authorization': `Bearer ${tokens?.access}`, // Enviar el token en el encabezado
        'Content-Type': 'application/json',

      },
      data: {
        code,  // Enviar el código
      }
    })
      .then((data) => {
        toast({
          title: "Gasto eliminado correctamente.",
          description: "El gasto fue eliminado con éxito.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom-right",
        });
        onCloseAlertDialogDelete();
        dispatch(getExpenseType());  // Recarga la lista de usuarios
      })
      .catch((error) => {
        console.error("Error al eliminar el gasto:", error);
      })
      .finally(() => {
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
        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "600px" }} 
        maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
          <ModalCloseButton />
          <ModalExpensesTypeEdit
            onClose={onCloseModalEdit}
            product={selectedItem}
            expensesType={list}
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
                Eliminar tipo de gasto
              </AlertDialogHeader>
              <AlertDialogBody fontStyle="Source Sans Pro">
                {selectedItem ? (
                  <AlertDialogBody>
                    ¿Está seguro que quiere eliminar el tipo de gasto <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>?
                  </AlertDialogBody>
                ) : (
                  <AlertDialogBody>No se ha seleccionado ninguna solicitud.</AlertDialogBody>
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
              Tipos de gastos
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Gestión de los tipos de gastos
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
                placeholder="Buscar por tipo de gasto…"
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
              Registrar Tipo de gasto
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
              <Th textAlign={"center"}>Tipo de gasto</Th>
              <Th textAlign={"center"} >Acciones</Th>
            </Tr>
          </Thead>

          <Tbody style={{ overflowY: "scroll" }}>
            {loadingTable ? ( // Mostrar "Cargando..." por defecto
              <TableState kind="loading" colSpan={4} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <Tr
                  onDoubleClick={() => {
                    if (item.name !== "Sueldo" && item.name !== "Gastos Chicos") {
                      handleRowDoubleClick(index, item)
                    }
                  }}
                  key={index}
                  onClick={() => setSelectedRow(item)}
                  data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                >
                  <Td textAlign={"center"}>{item.name}</Td>
                  <Td textAlign={"center"} isNumeric>
                    <HStack justify="center" spacing={1}>
                      <Tooltip hasArrow label="Editar">
                        <IconButton
                          aria-label="Editar"
                          icon={<Icon path={mdiPencilOutline} size={0.9} />}
                          size="sm"
                          onClick={() => handleClickEdit(item)}
                          isDisabled={((item.id < 1) || item.name === "Gastos Chicos")}
                          variant="ghost"
                        />
                      </Tooltip>

                      <Tooltip hasArrow label="Eliminar">
                        <IconButton
                          aria-label="Eliminar"
                          icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                          size="sm"
                          onClick={() => handleClickDelete(item)}
                          isDisabled={((item.id < 1) || item.name === "Gastos Chicos")}
                          variant="ghostDanger"
                        />

                      </Tooltip>
                    </HStack>
                  </Td>

                </Tr>
              ))
            ) : (!loadingTable && currentItems.length === 0) && (
              <TableState kind="empty" colSpan={6} title="No se encontraron datos" />
            )}
            {/* {emptyRowsCount > 0 && currentItems.length === 0 ? (
              <>
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
export default TableExpensesType;