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
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spacer,
  Spinner,
  Stack,
  Table,
  TableContainer,
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
import React, { useEffect, useMemo, useState } from "react";
import { isSelectableStudio } from "../utils/studios";
import Icon from "@mdi/react";
import {
  mdiPencilOutline,
  mdiDeleteOutline,
  mdiFilePdfBox,
  mdiFileDocumentOutline,
  mdiTrayArrowDown,
  mdiMagnify,
  mdiClose,
} from "@mdi/js";
import ModalPaymentEdit from "./ModalPaymentEdit";
import Pagination from "./Pagination";
import SearchField from "./ui/SearchField";
import { useAuthStore } from "../stores/auth";
import { start } from "repl";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getPayments,
  getPaymentsLastMonth,
  getPaymentAmount,
  getPlanSubType,
  getStudios,
} from "../stores/studioSlice";
import { FiPlus } from "react-icons/fi";
import { Select as Select2 } from "./ui/Select";
import { formatAmount, formatCurrency } from "../utils/amount";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import { useStudioStore } from "../stores/studio";

const ITEMS_PER_PAGE = 10;

const getPaymentPdfUrl = (pdfFile: string): string => {
  if (/^https?:\/\//i.test(pdfFile)) return pdfFile;

  const backendBase = process.env.NEXT_PUBLIC__URL_BACKEND
    ?.trim()
    .replace(/^["']|["']$/g, "");

  if (!backendBase) return pdfFile;

  try {
    const mediaPath = pdfFile.startsWith("/") ? pdfFile : `/${pdfFile}`;
    return new URL(mediaPath, backendBase).toString();
  } catch {
    return pdfFile;
  }
};

const getPlanSubTypeId = (item: any) => {
  if (!item) return "";

  if (item?.plan_subtype_id) return String(item.plan_subtype_id);
  if (item?.plans_subtype_id) return String(item.plans_subtype_id);

  if (typeof item?.plan_subtype === "number" || typeof item?.plan_subtype === "string") {
    return String(item.plan_subtype);
  }

  if (typeof item?.plans_subtype === "number" || typeof item?.plans_subtype === "string") {
    return String(item.plans_subtype);
  }

  if (item?.plan_subtype?.id) return String(item.plan_subtype.id);
  if (item?.plans_subtype?.id) return String(item.plans_subtype.id);

  if (typeof item?.plan === "number" || typeof item?.plan === "string") {
    return String(item.plan);
  }

  if (item?.plan?.id) return String(item.plan.id);

  return "";
};

const getPlanSubTypeName = (item: any, plansSubTypeMap: Map<string, any>) => {
  const planSubTypeId = getPlanSubTypeId(item);
  if (!planSubTypeId) return "";

  const planSubType = plansSubTypeMap.get(planSubTypeId);
  return planSubType?.name || planSubType?.days || "";
};

const getPaymentPlanOrComboName = (item: any, plansSubTypeMap = new Map<string, any>()): string => {
  const comboName = item?.combo_name || item?.combo?.name;
  if (comboName) return String(comboName);

  const itemNames = (Array.isArray(item?.items) ? item.items : [])
    .map(
      (paymentItem: any) =>
        paymentItem?.plans_subtype?.name ||
        paymentItem?.plan_subtype?.name ||
        paymentItem?.plan_name ||
        paymentItem?.plan?.name ||
        paymentItem?.plan?.days ||
        getPlanSubTypeName(paymentItem, plansSubTypeMap)
    )
    .filter(Boolean);

  const uniqueItemNames = [...new Set(itemNames.map(String))];
  if (uniqueItemNames.length > 0) return uniqueItemNames.join(" + ");

  const explicitName =
    item?.plan_name ||
    item?.plan?.name ||
    item?.plan?.days;

  if (explicitName) return String(explicitName);

  const planSubTypeName = getPlanSubTypeName(item, plansSubTypeMap);
  if (planSubTypeName) return String(planSubTypeName);

  return item?.person?.plan?.name || item?.person?.plan?.days || "-";
};

const TablePayments = ({
  list,
  onOpen,
}: {
  list: Array<any>;
  onOpen: () => void;
  getPayments?: any;
}) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [code, setCode] = useState("admin");
  const { logout, name, last_name, tipo, tokens } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentsByDateRange, setPaymentsByDateRange] = useState([]);
  const [isLoadingPaymentsByDateRange, setIsLoadingPaymentsByDateRange] =
    useState(false);
  const [errorPaymentsByDateRange, setErrorPaymentsByDateRange] = useState([]);
  const [isLoadingClean, setIsLoadingClean] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<any>({
    value: "all",
    label: "Todos los estudios",
  });
  const selectedStudioFromHeader = useStudioStore((state) => state.selectedStudio);
  const studioStoreHasHydrated = useStudioStore((state) => state.hasHydrated);
  const studioFilterInitialized = React.useRef(false);

  const { payments, amounts, studios, plansSubType } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  const [paymentsLastMonth, setPaymentsLastMonth] = useState([]);

  const studioOptions = [
    { value: "all", label: "Todos los estudios" },
    ...(studios || []).filter(isSelectableStudio).map((studio: any) => ({
      value: studio.id,
      label: studio.name,
    })),
  ];

  useEffect(() => {
    if (!studioStoreHasHydrated) return;

    if (tipo === "Consultor") {
      setSelectedStudio(
        selectedStudioFromHeader?.id
          ? {
              value: selectedStudioFromHeader.id,
              label: selectedStudioFromHeader.name,
            }
          : { value: "all", label: "Todos los estudios" }
      );
      return;
    }

    if (studioFilterInitialized.current) return;

    if (selectedStudioFromHeader?.id) {
      setSelectedStudio({
        value: selectedStudioFromHeader.id,
        label: selectedStudioFromHeader.name,
      });
    }

    studioFilterInitialized.current = true;
  }, [selectedStudioFromHeader, studioStoreHasHydrated, tipo]);

  const studiosMap = useMemo(() => {
    const map = new Map();

    (studios || []).forEach((studio: any) => {
      map.set(String(studio.id), studio);
    });

    return map;
  }, [studios]);

  const plansSubTypeMap = useMemo(() => {
    const map = new Map();

    (plansSubType || []).forEach((planSubType: any) => {
      map.set(String(planSubType.id), planSubType);
    });

    return map;
  }, [plansSubType]);

  const getStudioIdFromEntity = (entity: any): string => {
    if (!entity) return "";
    if (entity.studio_id !== undefined && entity.studio_id !== null) {
      return String(entity.studio_id);
    }
    if (typeof entity.studio === "number" || typeof entity.studio === "string") {
      return String(entity.studio);
    }
    if (entity.studio?.id !== undefined && entity.studio?.id !== null) {
      return String(entity.studio.id);
    }
    return "";
  };

  const getStudioNameFromEntity = (entity: any): string =>
    String(entity?.studio_name || entity?.studio?.name || "");

  const getPaymentStudioSources = (item: any): any[] => {
    const paymentItems = Array.isArray(item?.items) ? item.items : [];
    const planSources = [
      item?.plan,
      item?.plan_subtype,
      item?.plans_subtype,
      item?.person?.plan,
      ...paymentItems.flatMap((paymentItem: any) => [
        paymentItem,
        paymentItem?.plan,
        paymentItem?.plan_subtype,
        paymentItem?.plans_subtype,
      ]),
    ];

    // Algunas respuestas sólo incluyen el id del plan. En ese caso se usa el
    // catálogo para recuperar el estudio asociado al subtipo.
    const planFromCatalog = [item, ...paymentItems]
      .map((source: any) => plansSubTypeMap.get(getPlanSubTypeId(source)))
      .filter(Boolean);

    // La prioridad preserva el estudio explícito del pago y luego prueba las
    // relaciones que usan las distintas variantes del endpoint.
    return [
      item,
      item?.payment,
      item?.person,
      item?.type,
      ...planSources,
      ...planFromCatalog,
    ].filter(Boolean);
  };

  const getPaymentStudioId = (item: any) => {
    for (const source of getPaymentStudioSources(item)) {
      const studioId = getStudioIdFromEntity(source);
      if (studioId) return studioId;
    }
    return "";
  };

  const getPaymentStudioName = (item: any) => {
    for (const source of getPaymentStudioSources(item)) {
      const studioName = getStudioNameFromEntity(source);
      if (studioName) return studioName;
    }

    const studioId = getPaymentStudioId(item);
    if (!studioId) return "-";

    return studiosMap.get(String(studioId))?.name || "-";
  };

  // Ordena la lista por fecha de la más reciente a la más antigua
  // Los pagos dados de baja no se muestran (la caja tampoco los cuenta)
  const sortedList = [...(list || [])].filter((item) => !item?.deleted).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const filteredItems = sortedList.filter((item) => {
    const searchValue = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const paymentMethod = (
      amounts.find((a) => a.id === Number(item.amount))?.method ||
      item.method ||
      "No disponible"
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const paymentAmount = (
      amounts.find((a) => a.id === Number(item.amount))?.amount ||
      item.amount ||
      "No disponible"
    )
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const dni =
      item?.person?.dni
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const name =
      item?.person?.name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const lastName =
      item?.person?.last_name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";

    const dateStr = new Date(
      new Date(item.date).getTime() +
      new Date(item.date).getTimezoneOffset() * 60000
    ).toLocaleDateString("es-ES");
    const studioName = getPaymentStudioName(item)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const planOrComboName = getPaymentPlanOrComboName(item, plansSubTypeMap)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const fullName = `${name} ${lastName}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const fullNameReverse = `${lastName} ${name}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const matchesSearch =
      paymentMethod.includes(searchValue) ||
      paymentAmount.includes(searchValue) ||
      dni.includes(searchValue) ||
      fullName.includes(searchValue) ||
      fullNameReverse.includes(searchValue) ||
      name.includes(searchValue) ||
      lastName.includes(searchValue) ||
      dateStr.includes(searchValue) ||
      planOrComboName.includes(searchValue) ||
      studioName.includes(searchValue);

    const matchesStudio =
      selectedStudio?.value === "all" ||
      getPaymentStudioId(item) === String(selectedStudio?.value);

    return matchesSearch && matchesStudio;
  });

  const filteredItemsByRange = paymentsByDateRange.filter((item) => !item?.deleted).filter((item) => {
    const searchValue = searchTerm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const paymentMethod = (
      amounts.find((a) => a.id === Number(item.amount))?.method ||
      item.method ||
      "No disponible"
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const paymentAmount = (
      amounts.find((a) => a.id === Number(item.amount))?.amount ||
      item.amount ||
      "No disponible"
    )
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const dni =
      item?.person?.dni
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const name =
      item?.person?.name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const lastName =
      item?.person?.last_name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() || "";
    const dateStr = new Date(item.date).toLocaleDateString("es-ES");
    const studioName = getPaymentStudioName(item)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const planOrComboName = getPaymentPlanOrComboName(item, plansSubTypeMap)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const fullName = `${name} ${lastName}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const fullNameReverse = `${lastName} ${name}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const matchesSearch =
      paymentMethod.includes(searchValue) ||
      paymentAmount.includes(searchValue) ||
      dni.includes(searchValue) ||
      name.includes(searchValue) ||
      lastName.includes(searchValue) ||
      fullName.includes(searchValue) ||
      fullNameReverse.includes(searchValue) ||
      dateStr.includes(searchValue) ||
      planOrComboName.includes(searchValue) ||
      studioName.includes(searchValue);

    const matchesStudio =
      selectedStudio?.value === "all" ||
      getPaymentStudioId(item) === String(selectedStudio?.value);

    return matchesSearch && matchesStudio;
  });

  const indexOfLastItem = isFiltering
    ? currentPage * ITEMS_PER_PAGE
    : currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const currentItems = isFiltering
    ? filteredItemsByRange.slice(indexOfFirstItem, indexOfLastItem)
    : filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const countPagination = isFiltering
    ? Math.max(Math.ceil(filteredItemsByRange.length / ITEMS_PER_PAGE), 1)
    : Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);

  const totalFilteredItems = isFiltering
    ? filteredItemsByRange.length
    : filteredItems.length;

  const emptyRowsCount = ITEMS_PER_PAGE - currentItems.length;

  useEffect(() => {
    // Evita quedar en una página vacía al cambiar cualquiera de los filtros.
    setCurrentPage(1);
  }, [searchTerm, selectedStudio?.value, isFiltering, paymentsByDateRange]);

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
    isOpen: isAlertDialogDocumentOpen,
    onOpen: onOpenAlertDialogDocument,
    onClose: onCloseAlertDialogDocument,
  } = useDisclosure();

  const cancelRef = React.useRef();
  const toast = useToast();

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

  const handleClickDocument = async (item) => {
    if (!item.pdf_file) {
      onOpenAlertDialogDocument();
      return;
    }
    // El comprobante ya no es público: se descarga por la API con el token
    // (el interceptor agrega Authorization) y se abre como blob.
    const win = window.open("", "_blank");
    try {
      const pdfUrl = getPaymentPdfUrl(String(item.pdf_file));
      const res = await axios.get(pdfUrl, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      if (win) {
        win.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank");
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      win?.close();
      onOpenAlertDialogDocument();
    }
  };

  const handleDelete = (sendExpDate = false) => {
    if (!selectedItem?.id) {
      return;
    }

    setLoading(true);

    const data = sendExpDate
      ? {
        code: code,
        exp_date: selectedItem.person.exp_date,
      }
      : {
        code: code,
      };

    axios
      .delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS}${selectedItem.id}/`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "application/json",
          },
          data: data,
        }
      )
      .then((data) => {
        toast({
          title: "Pago eliminado correctamente.",
          description: "El Pago fue eliminado con éxito.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom-right",
        });
        onCloseAlertDialogDelete();
        setPaymentsByDateRange((currentPayments) =>
          currentPayments.filter((payment: any) => payment.id !== selectedItem.id)
        );
        dispatch(
          getPayments(
            selectedStudio?.value === "all" ? undefined : selectedStudio.value
          )
        );
        dispatch(getPaymentsLastMonth());
      })
      .catch((error) => {
        console.error("Error al eliminar el Pago:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmitPaymentsByDateRange = () => {
    setIsLoadingPaymentsByDateRange(true);
    setErrorPaymentsByDateRange(null);

    if (startDate && endDate) {
      axios
        .get(
          `${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_BY_DATE_RANGE}?start_date=${startDate}&end_date=${endDate}`,
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
            setPaymentsByDateRange([]);
            onOpenAlertDialogNoExistsRange();
          } else {
            setPaymentsByDateRange(data);
          }

          setIsFiltering(true);
        })
        .catch((error) => {
          if (error.response && error.response.data) {
            console.error("Error fetching payments:", error.response.data);
            setErrorPaymentsByDateRange("Error al obtener los pagos.");
            setIsFiltering(true);
            setPaymentsByDateRange([]);
          } else {
            console.error("Error fetching payments:", error);
            setErrorPaymentsByDateRange("Ocurrió un error al buscar los pagos.");
          }
        })
        .finally(() => {
          setIsLoadingPaymentsByDateRange(false);
        });
    } else {
      onOpenAlertDialogUndated();
    }
  };

  useEffect(() => {
    dispatch(getPaymentAmount());
    dispatch(getPlanSubType());
    dispatch(getStudios());

    setLoadingTable(true);

    const timer = setTimeout(() => {
      setLoadingTable(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [dispatch, tipo]);

  useEffect(() => {
    const studio =
      selectedStudio?.value === "all" ? undefined : selectedStudio?.value;

    dispatch(getPayments(studio))
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
  }, [dispatch, selectedStudio?.value, toast]);

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
          maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
        >
          <ModalCloseButton />
          <ModalPaymentEdit
            onClose={onCloseModalEdit}
            product={selectedItem}
            getPayments={getPayments}
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
                Eliminar pago
              </AlertDialogHeader>
              <AlertDialogBody
                fontStyle="Source Sans Pro"
              >
                {selectedItem ? (
                  <>
                    ¿Está seguro que quiere eliminar el pago del alumno{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.person.name} {selectedItem?.person.last_name}
                    </span>{" "}
                    con dni{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.person.dni}
                    </span>
                    ?
                  </>
                ) : (
                  <>No se ha seleccionado ninguna solicitud.</>
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
                  onClick={() => handleDelete(false)}
                  ml={3}
                  w={["100%", "135px"]}
                  isDisabled={loading}
                  variant="danger"
                >
                  Eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </>

      {/* <AlertDialog
        isOpen={isAlertDialogExpDate}
        onClose={onCloseAlertDialogExpDate}
        leastDestructiveRef={cancelRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent m={100} ml={10} mr={10}>
            <AlertDialogCloseButton />
            <AlertDialogHeader>
              Conservar fecha de vencimiento
            </AlertDialogHeader>
            <AlertDialogBody fontStyle="Source Sans Pro" textAlign={"center"}>
              ¿Desea conservar la fecha de vencimiento anterior al pago?
            </AlertDialogBody>
            <AlertDialogFooter
              display={"flex"}
              justifyContent={"center"}
              gap={"20px"}
            >
              <Button
                onClick={() => handleDelete(false)}
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
                onClick={() => handleDelete(true)}
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

      <AlertDialog
        isOpen={isAlertDialogUndatedOpen}
        onClose={onCloseAlertDialogUndated}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogCloseButton />
            <AlertDialogBody
              fontStyle="Source Sans Pro"
            >
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
        isOpen={isAlertDialogDocumentOpen}
        onClose={onCloseAlertDialogDocument}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              El documento seleccionado no fue encontrado.
            </AlertDialogBody>
            <AlertDialogFooter
              gap={3}
            >
              <Button
                onClick={onCloseAlertDialogDocument}
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
            <AlertDialogBody
              fontStyle="Source Sans Pro"
            >
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
              Pagos
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Gestión de pagos
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
              w={{ base: "100%", md: "50%", lg: "40%", xl: "20%" }}
              placeholder="Buscar por fecha, alumno, plan, método de pago, monto…"
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
                    onClick={handleSubmitPaymentsByDateRange}
                    isLoading={isLoadingPaymentsByDateRange}
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
              Registrar Pago
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
              <Th>
                Fecha
              </Th>
              <Th>
                Alumno
              </Th>
              <Th>
                DNI
              </Th>
              <Th>
                Plan
              </Th>
              <Th>
                Método de pago
              </Th>
              <Th>
                Monto
              </Th>
              <Th>
                Observación
              </Th>
              {tipo !== "Consultor" && (
                <Th>
                  Estudio
                </Th>
              )}
              <Th>
                Acciones
              </Th>
            </Tr>
          </Thead>

          <Tbody style={{ overflowY: "scroll" }}>
            {loadingTable ? (
              <TableState kind="loading" colSpan={tipo !== "Consultor" ? 9 : 8} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const foundAmount = amounts.find(
                  (a) => a.id === Number(item.amount)
                );

                const paymentMethod = foundAmount
                  ? foundAmount.method
                  : item.method || "No disponible";
                const paymentAmount = item.amount
                  ? item.amount
                  : foundAmount.amount || "No disponible";

                return (
                  <Tr
                    key={index}
                    onDoubleClick={() => handleRowDoubleClick(index, item)}
                    onClick={() => setSelectedRow(item)}
                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                  >
                    <Td>
                      {new Date(item.date).toLocaleDateString("es-ES")}
                    </Td>
                    <Td>
                      {item?.person.name} {item?.person.last_name}
                    </Td>
                    <Td>{item?.person.dni}</Td>
                    <Td>{getPaymentPlanOrComboName(item, plansSubTypeMap)}</Td>
                    <Td>{paymentMethod}</Td>
                    <Td>{formatCurrency(paymentAmount, "No disponible")}</Td>
                    <Td>
                      {item?.observation === null ? "" : item?.observation}
                    </Td>
                    {tipo !== "Consultor" && (
                      <Td>
                        {getPaymentStudioName(item)}
                      </Td>
                    )}
                    <Td isNumeric>
                      <HStack justify="flex-start" spacing={1}>
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
                        {tipo !== "Consultor" && (
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
                        <Tooltip
                          hasArrow
                          label="PDF"
                        >
                          <IconButton
                            aria-label="PDF"
                            icon={
                              <Icon path={mdiFileDocumentOutline} size={0.9} />
                            }
                            size="sm"
                            onClick={() => handleClickDocument(item)}
                            variant="ghost"
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              !loadingTable &&
              currentItems.length === 0 && (
                <TableState kind="empty" colSpan={tipo !== "Consultor" ? 9 : 8} title="No se encontraron datos" />
              )
            )}
          </Tbody>
        </Table>
      </Box>

      <Box mt={4} w="100%">
        <Pagination
          count={countPagination}
          pageSize={ITEMS_PER_PAGE}
          defaultPage={1}
          page={currentPage}
          totalItems={totalFilteredItems}
          onPageChange={setCurrentPage}
        />
      </Box>
    </>
  );
};

export default TablePayments;
