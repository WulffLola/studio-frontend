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
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  IconButton,
  Text,
  Flex,
  Spinner,
  AlertDialogHeader,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { isSelectableStudio } from "../utils/studios";
import Icon from "@mdi/react";
import {
  mdiPencilOutline,
  mdiDeleteOutline,
  mdiMagnify,
  mdiClose,
} from "@mdi/js";
import Pagination from "./Pagination";
import SearchField from "./ui/SearchField";
import { useAuthStore } from "../stores/auth";
import ModalExpenseEdit from "./ModalExpenseEdit";
import ModalCode from "./ModalCode";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getExpenses,
  getExpensesTodayTeachers,
  getStudios,
} from "../stores/studioSlice";
import { FiPlus } from "react-icons/fi";
import { Select as Select2 } from "./ui/Select";
import { formatAmount, formatCurrency } from "../utils/amount";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";

const ITEMS_PER_PAGE = 10;

const TableExpenses = ({
  list,
  onOpen,
  selectedStudio,
  setSelectedStudio,
  refreshKey,
}: {
  list: Array<any>;
  onOpen: () => void;
  selectedStudio: any;
  setSelectedStudio: (studio: any) => void;
  refreshKey: number;
}) => {
  const [payments, setPayments] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRow, setSelectedRow] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [code, setCode] = useState("admin");
  const { logout, name, last_name, tipo, tokens } = useAuthStore();
  const isConsultant = tipo === "Consultor";
  const consultantStudioValue =
    selectedStudio?.value && selectedStudio.value !== "all"
      ? String(selectedStudio.value)
      : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expensesByDateRange, setExpensesByDateRange] = useState([]);
  const [isLoadingExpensesByDateRange, setIsLoadingExpensesByDateRange] =
    useState(false);
  const [errorExpensesByDateRange, setErrorExpensesByDateRange] = useState("");
  const [isLoadingClean, setIsLoadingClean] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const { expenses, studios } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  const studioOptions = [
    { value: "all", label: "Todos los estudios" },
    ...(studios || []).filter(isSelectableStudio).map((studio: any) => ({
      value: studio.id,
      label: studio.name,
    })),
  ];

  const studiosMap = React.useMemo(() => {
    const map = new Map();

    (studios || []).forEach((studio: any) => {
      map.set(String(studio.id), studio);
    });

    return map;
  }, [studios]);

  const getExpenseStudioId = (item: any) => {
    if (item?.studio_id) return String(item.studio_id);

    if (typeof item?.studio === "number" || typeof item?.studio === "string") {
      return String(item.studio);
    }

    if (item?.studio?.id) return String(item.studio.id);

    if (item?.type?.studio_id) return String(item.type.studio_id);

    if (
      typeof item?.type?.studio === "number" ||
      typeof item?.type?.studio === "string"
    ) {
      return String(item.type.studio);
    }

    if (item?.type?.studio?.id) return String(item.type.studio.id);

    return "";
  };

  const getExpenseStudioName = (item: any) => {
    const studioId = getExpenseStudioId(item);
    if (!studioId) return "-";

    const studio = studiosMap.get(String(studioId));
    return studio?.name || "-";
  };

  const sortedList = list.slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const isNotDeleted = (item: any) =>
    !item?.deleted && item?.is_active !== false;

  const filteredItems = sortedList.filter((item) => {
    if (!isNotDeleted(item)) return false;

    const searchValue = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const observation =
      item.observation
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const amount =
      item.amount
        ?.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const method =
      item.method
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const name =
      item.type.name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const dateStr = new Date(item.date).toLocaleDateString("es-ES");

    const matchesSearch =
      name.includes(searchValue) ||
      observation.includes(searchValue) ||
      method.includes(searchValue) ||
      amount.includes(searchValue) ||
      dateStr.includes(searchValue);

    const matchesStudio = isConsultant
      ? Boolean(consultantStudioValue) && getExpenseStudioId(item) === consultantStudioValue
      : selectedStudio?.value === "all" ||
        getExpenseStudioId(item) === String(selectedStudio?.value);

    return matchesSearch && matchesStudio;
  });

  const filteredItemsByRange = expensesByDateRange.filter((item) => {
    if (!isNotDeleted(item)) return false;

    const searchValue = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const observation =
      item.observation
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const amount =
      item.amount
        ?.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const method =
      item.method
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const name =
      item.type.name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const dateStr = new Date(item.date).toLocaleDateString("es-ES");

    const matchesSearch =
      name.includes(searchValue) ||
      observation.includes(searchValue) ||
      method.includes(searchValue) ||
      amount.includes(searchValue) ||
      dateStr.includes(searchValue);

    const matchesStudio = isConsultant
      ? Boolean(consultantStudioValue) && getExpenseStudioId(item) === consultantStudioValue
      : selectedStudio?.value === "all" ||
        getExpenseStudioId(item) === String(selectedStudio?.value);

    return matchesSearch && matchesStudio;
  });

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const currentItems = isFiltering
    ? filteredItemsByRange.slice(indexOfFirstItem, indexOfLastItem)
    : filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const countPagination = isFiltering
    ? Math.max(Math.ceil(filteredItemsByRange.length / ITEMS_PER_PAGE), 1)
    : Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);

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

  const {
    isOpen: isAlertDialogNoExistsRangeOpen,
    onOpen: onOpenAlertDialogNoExistsRange,
    onClose: onCloseAlertDialogNoExistsRange,
  } = useDisclosure();

  const {
    isOpen: isAlertDialogUndatedOpen,
    onOpen: onOpenAlertDialogUndated,
    onClose: onCloseAlertDialogUndated,
  } = useDisclosure();

  const {
    isOpen: isAlertCodeOpen,
    onOpen: onOpenModalCode,
    onClose: onCloseModalCode,
  } = useDisclosure();

  const cancelRef = React.useRef();
  const toast = useToast();

  const refreshExpenses = () => {
    if (isFiltering && startDate && endDate) {
      handleSubmitExpensesByDateRange();
      return;
    }

    dispatch(
      getExpenses(
        selectedStudio?.value === "all" ? undefined : selectedStudio?.value
      )
    );
  };

  useEffect(() => {
    dispatch(getExpensesTodayTeachers());
    dispatch(getStudios());

    setLoadingTable(true);

    const timer = setTimeout(() => {
      setLoadingTable(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [dispatch, tipo]);

  useEffect(() => {
    if (isConsultant && !consultantStudioValue) return;

    const studio =
      isConsultant
        ? consultantStudioValue
        : selectedStudio?.value === "all"
          ? undefined
          : selectedStudio?.value;

    dispatch(getExpenses(studio))
      .unwrap()
      .then((response) => {
        if (response?.detail) {
          toast({
            title: "Estudio dado de baja",
            description: response.detail,
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "bottom-right",
          });
        }
      })
      .catch(() => {
        // El estado global ya expone el error del request.
      });
  }, [consultantStudioValue, dispatch, isConsultant, selectedStudio?.value, toast]);

  useEffect(() => {
    if (refreshKey > 0 || localRefreshKey > 0) refreshExpenses();
    // Las claves cambian únicamente después de crear o editar un gasto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, localRefreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStudio?.value, isFiltering, expensesByDateRange]);

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

  const handleDeleteWithCode = (item) => {
    onOpenAlertDialogDelete(item);
    setSelectedItem(item);
  };

  const handleDelete = async (code: string) => {
    setLoading(true);

    try {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES}${selectedItem.id}/`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "application/json",
          },
          data: {
            code: code,
          },
        }
      );

      toast({
        title: "Gasto eliminado correctamente.",
        description: "El gasto fue eliminado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onCloseAlertDialogDelete();

      refreshExpenses();
    } catch (error) {
      console.error("Error al eliminar el gasto:", error);

      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el gasto.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpensesByDateRange = () => {
    setIsLoadingExpensesByDateRange(true);
    setErrorExpensesByDateRange("");

    if (startDate && endDate) {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES_BY_DATE_RANGE}?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${tokens?.access}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          const data = response.data;

          if (data.detail === "No payments found in the specified date range.") {
            setExpensesByDateRange([]);
            onOpenAlertDialogNoExistsRange();
          } else {
            setExpensesByDateRange(data);
          }

          setIsFiltering(true);
          setCurrentPage(1);
        })
        .catch((error) => {
          if (error.response && error.response.data) {
            console.error("Error fetching payments:", error.response.data);
            setErrorExpensesByDateRange("Error al obtener los pagos.");
            setIsFiltering(true);
            setExpensesByDateRange([]);
          } else {
            console.error("Error fetching payments:", error);
            setErrorExpensesByDateRange("Ocurrió un error al buscar los pagos.");
          }
        })
        .finally(() => {
          setIsLoadingExpensesByDateRange(false);
        });
    } else {
      onOpenAlertDialogUndated();
    }
  };

  return (
    <>
      <Modal
        onClose={onCloseModalCode}
        isOpen={isAlertCodeOpen}
        isCentered
        size={{ base: "90%", md: "70%", lg: "80%" }}
      >
        <ModalOverlay w={"100%"} h={"100%"} />
        <ModalContent
          maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}
          mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}
        >
          <ModalCloseButton />
          <ModalCode
            onClose={onCloseModalCode}
            get={tipo === "Consultor" ? getExpensesTodayTeachers : getExpenses}
            onCloseAlert={onCloseAlertDialogDelete}
            entityType={"expensesDelete"}
            action={handleDelete}
          />
        </ModalContent>
      </Modal>

      <Modal
        onClose={onCloseModalEdit}
        isOpen={isAlertEditOpen}
        isCentered
        size={{ base: "90%", md: "70%", lg: "80%" }}
      >
        <ModalOverlay w={"100%"} h={"100%"} />
        <ModalContent
          maxW={{ base: "90%", md: "90%", lg: "80%", xl: "800px" }}
          maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
        >
          <ModalCloseButton />
          <ModalExpenseEdit
            onClose={() => {
              onCloseModalEdit();
              setLocalRefreshKey((current) => current + 1);
            }}
            product={selectedItem}
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
                Eliminar gasto
              </AlertDialogHeader>
              <AlertDialogBody fontStyle="Source Sans Pro">
                {selectedItem ? (
                  <AlertDialogBody>
                    ¿Está seguro que quiere eliminar el gasto de{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.type?.name}
                    </span>{" "}
                    del día{" "}
                    <span style={{ fontWeight: 600 }}>
                      {new Date(selectedItem?.date).toLocaleDateString("es-ES")}
                    </span>{" "}
                    por{" "}
                    <span style={{ fontWeight: 600 }}>
                      {formatCurrency(selectedItem?.amount)}
                    </span>
                    ?
                  </AlertDialogBody>
                ) : (
                  <AlertDialogBody>
                    No se ha seleccionado ninguna solicitud.
                  </AlertDialogBody>
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
                  onClick={() =>
                    tipo === "Consultor" ? onOpenModalCode() : handleDelete(code)
                  }
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
        isOpen={isAlertDialogUndatedOpen}
        onClose={onCloseAlertDialogUndated}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogCloseButton />
            <AlertDialogBody fontStyle="Source Sans Pro">
              Seleccione una fecha de inicio y de fin.
            </AlertDialogBody>
            <AlertDialogFooter
              gap={3}
            >
              <Button
                onClick={onCloseAlertDialogUndated}
                w={["100%", "135px"]}
                variant="secondary"
              >
                Cerrar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={isAlertDialogNoExistsRangeOpen}
        onClose={onCloseAlertDialogNoExistsRange}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogCloseButton />
            <AlertDialogBody fontStyle="Source Sans Pro">
              No se encontraron pagos en el rango seleccionado.
            </AlertDialogBody>
            <AlertDialogFooter
              gap={3}
            >
              <Button
                onClick={onCloseAlertDialogNoExistsRange}
                w={["100%", "135px"]}
                variant="secondary"
              >
                Cerrar
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
              Gastos
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Gestión de gastos
            </Text>
          </Box>

          <HStack
            spacing={3}
            w={{ base: "100%", md: "auto" }}
            justify={{ base: "flex-end", md: "flex-end" }}
            flexWrap={{ base: "wrap", md: "wrap", lg: "wrap" }}
            pl={{ base: "", md: "10px" }}
          >
            {tipo !== "Consultor" && (
              <Box minW={{ base: "100%", md: "260px" }}>
                <Select2
                  options={studioOptions}
                  value={selectedStudio}
                  onChange={(option) =>
                    setSelectedStudio(
                      option || {
                        value: "all",
                        label: "Todos los estudios",
                      }
                    )
                  }
                  placeholder="Seleccionar estudio"
                  isClearable={false}
                  selectedOptionStyle="check"
                  appearance="filter"
                />
              </Box>
            )}

            <SearchField
              w={{ base: "100%", md: "360px" }}
              minW={{ md: "360px" }}
              placeholder="Buscar por fecha, tipo, método de pago, monto…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />

            {tipo !== "Consultor" && (
              <>
                <HStack spacing={3} w={{ base: "100%", md: "auto" }}>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    bg="bg.surface"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    bg="bg.surface"
                  />
                </HStack>

                <HStack spacing={3} w={{ base: "100%", md: "auto" }}>
                  <Button
                    w={{ base: "auto", md: "auto" }}
                    onClick={handleSubmitExpensesByDateRange}
                    isLoading={isLoadingExpensesByDateRange}
                    isDisabled={!startDate || !endDate}
                    variant="secondary"
                  >
                    Buscar
                  </Button>

                  <Button
                    w={{ base: "auto", md: "auto" }}
                    onClick={() => {
                      setIsFiltering(false);
                      setStartDate("");
                      setEndDate("");
                      setSelectedStudio({
                        value: "all",
                        label: "Todos los estudios",
                      });
                      setCurrentPage(1);
                    }}
                    isLoading={isLoadingClean}
                    variant="ghost"
                  >
                    Limpiar
                  </Button>
                </HStack>
              </>
            )}

            <Button
              leftIcon={<FiPlus />}
              w={{ base: "auto", md: "auto" }}
              onClick={onOpen}
              variant="primary"
            >
              Registrar Gasto
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
        <Table size={"sm"} data-sticky-actions>
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th>Tipo</Th>
              <Th>Método de pago</Th>
              <Th>Monto</Th>
              <Th>Observación</Th>
              {tipo !== "Consultor" && <Th>Estudio</Th>}
              <Th>Acciones</Th>
            </Tr>
          </Thead>

          <Tbody style={{ overflowY: "scroll" }}>
            {loadingTable ? (
              <TableState kind="loading" colSpan={tipo !== "Consultor" ? 7 : 6} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                <Tr
                  onDoubleClick={() => {
                    handleRowDoubleClick(index, item);
                  }}
                  key={index}
                  onClick={() => setSelectedRow(item)}
                  data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                >
                  <Td>
                    {new Date(item.date).toLocaleDateString("es-ES")}
                  </Td>
                  <Td>{item?.type.name}</Td>
                  <Td>{item.method}</Td>
                  <Td>{formatCurrency(item.amount)}</Td>
                  <Td>{item.observation}</Td>

                  {tipo !== "Consultor" && (
                    <Td>
                      {getExpenseStudioName(item)}
                    </Td>
                  )}

                  <Td isNumeric>
                    <HStack justify="flex-start" spacing={1}>
                      {item.type.name !== "Sueldo" && (
                        <Tooltip
                          hasArrow
                          label="Editar"
                        >
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
                        </Tooltip>
                      )}

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
                    </HStack>
                  </Td>
                </Tr>
              ))
            ) : (
              !loadingTable &&
              currentItems.length === 0 && (
                <TableState kind="empty" colSpan={tipo !== "Consultor" ? 7 : 6} title="No se encontraron datos" />
              )
            )}
          </Tbody>
        </Table>
      </Box>

      <Box display="flex" justifyContent="center" mt={4} w="100%">
        <Pagination
          count={countPagination}
          pageSize={ITEMS_PER_PAGE}
          totalItems={isFiltering ? filteredItemsByRange.length : filteredItems.length}
          defaultPage={1}
          page={currentPage}
          onPageChange={setCurrentPage}
        />
      </Box>
    </>
  );
};

export default TableExpenses;
