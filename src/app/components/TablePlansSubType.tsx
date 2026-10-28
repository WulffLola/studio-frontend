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
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
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
import {
  mdiPencilOutline,
  mdiDeleteOutline,
  mdiArrowULeftBottom,
} from "@mdi/js";
import Pagination from "./Pagination";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getActivitySubType,
  getActivityType,
  getPlanSubType,
} from "../stores/studioSlice";
import { FiChevronDown, FiChevronRight, FiPlus, FiSearch } from "react-icons/fi";
import ModalPlansSubTypeEdit from "./ModalPlansSubTypeEdit";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const TablePlansSubType = ({
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
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  const { tokens } = useAuthStore();
  const { activityType, activitySubType } = useSelector(
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

  const {
    isOpen: isAlertDialogOpenReturn,
    onOpen: onOpenAlertDialogReturn,
    onClose: onCloseAlertDialogReturn,
  } = useDisclosure();

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const resolvedItems = useMemo(() => (list || []).map((item) => {
    const activitySubtypeId =
      item?.activity_subtype?.id ?? item?.activity_subtype_id ?? item?.activity_subtype;
    const activity = (activitySubType || []).find(
      (candidate: any) => String(candidate.id) === String(activitySubtypeId)
    );
    const activityTypeId =
      activity?.activity_type?.id ??
      activity?.activity_type_id ??
      activity?.activity_type;
    const type = (activityType || []).find(
      (candidate: any) => String(candidate.id) === String(activityTypeId)
    );

    return {
      ...item,
      resolvedActivityName:
        activity?.name ||
        item?.activity_subtype_name ||
        item?.activity_subtype?.name ||
        "SIN ACTIVIDAD",
      resolvedActivityTypeName:
        type?.name ||
        activity?.activity_type_name ||
        activity?.activity_type?.name ||
        "SIN TIPO DE ACTIVIDAD",
    };
  }), [list, activitySubType, activityType]);

  const filteredItems = resolvedItems.filter((item: any) => {
    const normalizedName = normalizeText(item?.name || "");
    const normalizedTypeName = normalizeText(item.resolvedActivityTypeName);
    const normalizedSubtypeName = normalizeText(item.resolvedActivityName);
    const normalizedSearch = normalizeText(searchTerm || "");

    return (
      normalizedName.includes(normalizedSearch) ||
      normalizedTypeName.includes(normalizedSearch) ||
      normalizedSubtypeName.includes(normalizedSearch)
    );
  });

  const groupedForRender = useMemo(() => {
    const grouped = filteredItems.reduce((acc: any, item: any) => {
      const typeName = item.resolvedActivityTypeName;
      const activityName = item.resolvedActivityName;

      if (!acc[typeName]) {
        acc[typeName] = {};
      }

      if (!acc[typeName][activityName]) {
        acc[typeName][activityName] = [];
      }

      acc[typeName][activityName].push(item);
      return acc;
    }, {});

    const rows: any[] = [];

    Object.entries(grouped).forEach(([typeName, activities]: any) => {
      rows.push({
        rowType: "activityType",
        label: typeName,
        key: typeName,
        activityCount: Object.keys(activities).length,
        planCount: Object.values(activities).reduce(
          (total: number, items: any) => total + items.length,
          0
        ),
      });

      Object.entries(activities).forEach(([activityName, items]: any) => {
        rows.push({
          rowType: "activity",
          label: activityName,
          key: `${typeName}::${activityName}`,
          parentKey: typeName,
          planCount: items.length,
        });

        items.forEach((item: any) => {
          rows.push({
            rowType: "item",
            parentTypeKey: typeName,
            parentActivityKey: `${typeName}::${activityName}`,
            ...item,
          });
        });
      });
    });

    return rows;
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

  const handleClickDelete = (item: any) => {
    setSelectedItem(item);
    onOpenAlertDialogDelete();
  };

  const handleClickEdit = (item: any) => {
    if (item?.deleted !== null) return;

    setSelectedItem(item);
    onOpenModalEdit();
  };

  const handleClickRestore = (item: any) => {
    setSelectedItem(item);
    onOpenAlertDialogReturn();
  };

  const handleRowDoubleClick = (item: any) => {
    if (item?.deleted !== null) return;

    setSelectedItem(item);
    onOpenModalEdit();
  };

  const handleDelete = async () => {
    if (!selectedItem?.id) return;

    setLoading(true);

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN_SUB_TYPE}${selectedItem.id}/`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Plan eliminado correctamente.",
        description: "El plan fue dado de baja con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onCloseAlertDialogDelete();
      dispatch(getPlanSubType());
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el plan.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedItem?.id) return;

    setLoading(true);

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN_SUB_TYPE}${selectedItem.id}/`,
        { deleted: null },
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Plan reactivado.",
        description: "El plan volvió a estar activo.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onCloseAlertDialogReturn();
      dispatch(getPlanSubType());
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo reactivar el plan.",
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
        <ModalOverlay />
        <ModalContent
          maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }}
        >
          <ModalCloseButton />
          <ModalPlansSubTypeEdit
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
              Eliminar plan
            </AlertDialogHeader>
            <AlertDialogBody>
              {selectedItem ? (
                <>
                  ¿Está seguro que quiere eliminar el plan{" "}
                  <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>?
                </>
              ) : (
                <>No se ha seleccionado ningún plan.</>
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
              Reactivar plan
            </AlertDialogHeader>
            <AlertDialogBody>
              {selectedItem ? (
                <>
                  ¿Desea volver a activar el plan{" "}
                  <span style={{ fontWeight: 600 }}>{selectedItem?.name}</span>?
                </>
              ) : (
                <>No se ha seleccionado ningún plan.</>
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
                onClick={handleRestore}
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
              Planes
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Tipos de actividad, actividades y planes
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
              Registrar plan
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
              <Th>
                Nombre
              </Th>
              <Th>
                Veces
              </Th>
              <Th>
                Estado
              </Th>
              <Th>
                Acciones
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {loadingTable ? (
              <TableState kind="loading" colSpan={4} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                if (item.rowType === "activityType") {
                  const isCollapsed = collapsedTypes.has(item.key);
                  return (
                    <Tr
                      key={`type-${item.key}`}
                      bg="brand.50"
                      color="brand.800"
                      _hover={{ bg: "brand.100" }}
                      cursor="pointer"
                      onClick={() => toggleCollapsed(setCollapsedTypes, item.key)}
                    >
                      <Td colSpan={4} py={3.5} color="inherit">
                        <Flex align="center" justify="space-between" gap={3}>
                          <HStack spacing={2} minW={0}>
                            <Box as={isCollapsed ? FiChevronRight : FiChevronDown} flexShrink={0} />
                            <Text fontWeight={600} fontSize="14px" noOfLines={1}>
                              {item.label}
                            </Text>
                          </HStack>
                          <HStack spacing={2} flexShrink={0}>
                            <Badge bg="bg.surface" color="text.secondary" border="1px solid" borderColor="brand.100">
                              {item.activityCount} {item.activityCount === 1 ? "actividad" : "actividades"}
                            </Badge>
                            <Badge bg="bg.surface" color="text.secondary" border="1px solid" borderColor="brand.100">
                              {item.planCount} {item.planCount === 1 ? "plan" : "planes"}
                            </Badge>
                          </HStack>
                        </Flex>
                      </Td>
                    </Tr>
                  );
                }

                if (item.rowType === "activity") {
                  if (collapsedTypes.has(item.parentKey)) return null;
                  const isCollapsed = collapsedActivities.has(item.key);
                  return (
                    <Tr
                      key={`activity-${item.key}`}
                      bg="bg.subtle" _hover={{ bg: "bg.muted" }}
                      cursor="pointer"
                      onClick={() => toggleCollapsed(setCollapsedActivities, item.key)}
                    >
                      <Td colSpan={4} py={3} pl={{ base: 3, md: 8 }}>
                        <Flex align="center" justify="space-between" gap={3}>
                          <HStack spacing={2} minW={0}>
                            <Box as={isCollapsed ? FiChevronRight : FiChevronDown} flexShrink={0} />
                            <Text fontWeight={600} color="text.primary" noOfLines={1}>
                              {item.label}
                            </Text>
                          </HStack>
                          <Badge colorScheme="gray">
                            {item.planCount} {item.planCount === 1 ? "plan" : "planes"}
                          </Badge>
                        </Flex>
                      </Td>
                    </Tr>
                  );
                }

                if (
                  collapsedTypes.has(item.parentTypeKey) ||
                  collapsedActivities.has(item.parentActivityKey)
                ) return null;

                return (
                  <Tr
                    key={item.id || index}
                    onDoubleClick={() => handleRowDoubleClick(item)}
                    onClick={() => setSelectedRow(item)}
                    bg={selectedRow?.id === item.id ? "gray.100" : "transparent"}
                    cursor="pointer"
                  >
                    <Td fontWeight="600" pl={{ base: 3, md: 12 }}>
                      {item.name || "-"}
                    </Td>
                    <Td>
                      {item.sessions || "-"}
                    </Td>
                    <Td>
                      {item.deleted === null ? (
                        <StatusBadge label="ACTIVO" />
                      ) : (
                        <StatusBadge label="DADO DE BAJA" />
                      )}
                    </Td>

                    <Td>
                      <HStack justify="flex-start" spacing={1}>
                        {item.deleted === null && (
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

                        {item.deleted === null ? (
                          <Tooltip hasArrow label="Eliminar">
                            <IconButton
                              aria-label="Eliminar"
                              icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                              size="sm"
                              onClick={() => handleClickDelete(item)}
                              variant="ghostDanger"
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip hasArrow label="Reactivar">
                            <IconButton
                              aria-label="Reactivar"
                              icon={<Icon path={mdiArrowULeftBottom} size={0.9} />}
                              size="sm"
                              onClick={() => handleClickRestore(item)}
                              variant="ghost"
                            />
                          </Tooltip>
                        )}
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

export default TablePlansSubType;
