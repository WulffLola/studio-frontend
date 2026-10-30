'use client'
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
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  Stack,
  Table,
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
import React, { useEffect, useState } from "react";
import { isSelectableStudio } from "../utils/studios";
import Icon from "@mdi/react";
import { mdiPencilOutline, mdiDeleteOutline } from "@mdi/js";
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import ModalAppointmentsEdit from "./ModalAppointmentsEdit";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getActivitySubType,
  getAppointments,
  getRooms,
  getSlots,
  getStudios,
} from "../stores/studioSlice";
import { FiPlus, FiSearch } from "react-icons/fi";
import { Select as Select2 } from "./ui/Select";
import { LoadingOverlay } from "./ui/Loaders";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";

const ITEMS_PER_PAGE = 10;

const hasSignedClassDeclaration = (appointment: any) =>
  appointment?.firmo_declaracion_clase === true ||
  (appointment?.firmo_declaracion_clase === undefined && appointment?.declaration_signed === true);

const TableAppointments = ({
  list,
  onOpen,
}: {
  list: Array<any>;
  onOpen: () => void;
}) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudio, setSelectedStudio] = useState<any>({
    value: "all",
    label: "Todos los estudios",
  });
  const [code, setCode] = useState("admin");
  const { tipo, tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  const { appointments, activitySubType, rooms, slots, studios } = useSelector(
    (state: any) => state.studio
  );
  const dispatch = useAppDispatch();

  const sortByLastNameAndFirstName = (items = []) => {
    return [...items].sort((a: any, b: any) => {
      const lastNameComparison = (a.person?.last_name || "").localeCompare(
        b.person?.last_name || ""
      );

      if (lastNameComparison === 0) {
        return (a.person?.name || "").localeCompare(b.person?.name || "");
      }

      return lastNameComparison;
    });
  };

  const formatHour = (value?: string) => {
    if (!value) return "";
    return value.slice(0, 5);
  };

  const formatDate = (value?: string) => {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  const getDayName = (item: any) => {
    if (item?.slot?.week_day?.day) return item.slot.week_day.day;
    if (item?.week_day?.day) return item.week_day.day;

    if (Array.isArray(item?.slot?.days_week) && item.slot.days_week.length > 0) {
      return item.slot.days_week.map((d: any) => d.day).join(", ");
    }

    if (Array.isArray(item?.days_week) && item.days_week.length > 0) {
      return item.days_week.map((d: any) => d.day).join(", ");
    }

    return "";
  };

  const getDayAndDateLabel = (item: any) => {
    const day = getDayName(item);
    const date = formatDate(item?.slot?.date || item?.date);

    if (day && date) return `${day} ${date}`;
    if (day) return day;
    if (date) return date;

    return "";
  };

  const getStartTimeLabel = (item: any) => {
    const start =
      item?.slot?.start_time ||
      item?.start_time ||
      "";

    return formatHour(start);
  };

  const getSlotData = (item: any) => {
    const slot = item?.slot;

    if (slot && typeof slot === "object") return slot;

    const slotId = item?.slot || item?.slot_id;
    if (!slotId) return null;

    return slots?.find((currentSlot: any) => String(currentSlot.id) === String(slotId)) || null;
  };

  const getRoomData = (item: any) => {
    const slot = getSlotData(item);
    const room = slot?.room || item?.room;

    if (room && typeof room === "object") return room;

    const roomId = room || slot?.room_id || item?.room_id;
    if (!roomId) return null;

    return rooms?.find((currentRoom: any) => String(currentRoom.id) === String(roomId)) || null;
  };

  const getRoomName = (item: any) => {
    const room = getRoomData(item);
    const slot = getSlotData(item);
    const fallbackRoom = slot?.room || item?.room;

    return (
      room?.name ||
      room?.room_name ||
      room?.sala ||
      slot?.room_name ||
      item?.room_name ||
      (fallbackRoom ? `Sala #${fallbackRoom}` : "-")
    );
  };

  const getStudioName = (item: any) => {
    const room = getRoomData(item);

    if (room?.studio_name) return room.studio_name;
    if (typeof room?.studio === "object") return room.studio?.name || "-";

    const studioId =
      room?.studio ||
      room?.studio_id ||
      item?.studio ||
      item?.studio_id ||
      item?.slot?.studio ||
      item?.slot?.studio_id;

    if (typeof studioId === "object") return studioId?.name || "-";

    const studio = studios?.find(
      (currentStudio: any) => String(currentStudio.id) === String(studioId)
    );

    return studio?.name || item?.studio_name || item?.slot?.studio_name || "-";
  };

  const getActivityName = (item: any) => {
    const slot = getSlotData(item);
    const activity =
      slot?.activity_subtype ||
      slot?.activity ||
      item?.activity_subtype ||
      item?.activity;

    if (activity && typeof activity === "object") return activity.name || "-";

    const activityId =
      activity ||
      slot?.activity_subtype_id ||
      item?.activity_subtype_id ||
      item?.activity_id;

    const activityFound = activitySubType?.find(
      (currentActivity: any) => String(currentActivity.id) === String(activityId)
    );

    return (
      activityFound?.name ||
      slot?.activity_subtype_name ||
      item?.activity_subtype_name ||
      item?.activity_name ||
      (activityId ? `Actividad #${activityId}` : "-")
    );
  };

  const normalizeText = (value: any) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const sortedList = sortByLastNameAndFirstName(list);

  const studioOptions = [
    { value: "all", label: "Todos los estudios" },
    ...(studios || []).filter(isSelectableStudio).map((studio: any) => ({
      value: String(studio.id),
      label: studio.name,
    })),
  ];

  const filteredItems = sortedList.filter((item: any) => {
    const matchesStudio =
      selectedStudio.value === "all" ||
      normalizeText(getStudioName(item)) === normalizeText(selectedStudio.label);
    if (!matchesStudio) return false;

    const searchLower = normalizeText(searchTerm);

    const fullName = normalizeText(`${item.person?.name || ""} ${item.person?.last_name || ""}`);

    const fullNameReverse = normalizeText(`${item.person?.last_name || ""} ${item.person?.name || ""}`);

    const dni = normalizeText(item.person?.dni || "");

    const weekDay = normalizeText(getDayAndDateLabel(item));

    const timeSlot = normalizeText(getStartTimeLabel(item));
    const studio = normalizeText(getStudioName(item));
    const room = normalizeText(getRoomName(item));
    const activity = normalizeText(getActivityName(item));

    return (
      fullName.includes(searchLower) ||
      fullNameReverse.includes(searchLower) ||
      dni.includes(searchLower) ||
      weekDay.includes(searchLower) ||
      timeSlot.includes(searchLower) ||
      studio.includes(searchLower) ||
      room.includes(searchLower) ||
      activity.includes(searchLower)
    );
  });

  const countPagination = Math.max(
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
    1
  );
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

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

  const cancelRef = React.useRef<any>();
  const toast = useToast();

  useEffect(() => {
    dispatch(getAppointments());
    dispatch(getSlots());
    dispatch(getRooms());
    dispatch(getStudios());
    dispatch(getActivitySubType());
    setLoadingTable(true);

    const timer = setTimeout(() => {
      setLoadingTable(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleDelete = async (code: string) => {
    setLoading(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}${selectedItem.id}/`,
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
        title: "Turno eliminado correctamente.",
        description: "El turno fue eliminado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onCloseAlertDialogDelete();
      dispatch(getAppointments());
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el turno.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClickDelete = (item: any) => {
    onOpenAlertDialogDelete();
    setSelectedItem(item);
  };

  const handleClickEdit = (item: any) => {
    onOpenModalEdit();
    setSelectedItem(item);
  };

  const handleRowDoubleClick = (_index: number, item: any) => {
    setSelectedItem(item);
    onOpenModalEdit();
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
        <ModalContent
          maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
        >
          <ModalCloseButton />
          <ModalAppointmentsEdit
            onClose={onCloseModalEdit}
            product={selectedItem}
            getAppointments={getAppointments}
            appointments={appointments}
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
        <ModalContent
          maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}
          mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}
        >
          <ModalCloseButton />
          <ModalCode
            onClose={onCloseModalCode}
            get={getAppointments}
            onCloseAlert={onCloseAlertDialogDelete}
            entityType={"appointmentsDelete"}
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
                Eliminar turno alumno
              </AlertDialogHeader>
              <AlertDialogBody>
                {selectedItem ? (
                  <>
                    ¿Está seguro que quiere eliminar el turno del alumno{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.person?.name} {selectedItem?.person?.last_name}
                    </span>{" "}
                    con dni{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.person?.dni}
                    </span>{" "}
                    del día{" "}
                    <span style={{ fontWeight: 600 }}>
                      {getDayAndDateLabel(selectedItem)}
                    </span>{" "}
                    a las{" "}
                    <span style={{ fontWeight: 600 }}>
                      {getStartTimeLabel(selectedItem)}
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
              Turnos Alumnos
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Gestión de turnos de los alumnos
            </Text>
          </Box>

          <HStack
            spacing={3}
            w={{ base: "100%", md: "auto" }}
            justify={{ base: "flex-end", md: "flex-end" }}
            flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
            pl={{ base: "", md: "10px" }}
          >
            <Box w={{ base: "100%", md: "260px" }}>
              <Select2
                options={studioOptions}
                value={selectedStudio}
                onChange={(option) => {
                  setSelectedStudio(option || studioOptions[0]);
                  setCurrentPage(1);
                }}
                isClearable={false}
                selectedOptionStyle="check"
                appearance="filter"
              />
            </Box>
            <SearchField
                w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
                placeholder="Buscar por alumno, día, horario…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Button
              leftIcon={<FiPlus />}
              onClick={onOpen}
              w={{ base: "100%", md: "auto" }}
              variant="primary"
            >
              Registrar Turno
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
        <Table size={"sm"} minW={{ base: "1080px", md: "100%" }} data-sticky-actions>
          <Thead>
            <Tr>
              <Th>Alumno</Th>
              <Th>Dni</Th>
              <Th>Día</Th>
              <Th>Horario</Th>
              <Th>Actividad</Th>
              <Th>Sala</Th>
              <Th>Estudio</Th>
              <Th textAlign="center">Declaración</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody style={{ overflowY: "scroll" }}>
            {loadingTable ? (
              <TableState kind="loading" colSpan={9} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item: any, index: number) => (
                <Tr
                  onDoubleClick={() => handleRowDoubleClick(index, item)}
                  key={index}
                  onClick={() => setSelectedRow(item)}
                  data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                >
                  <Td>
                    {item?.person?.last_name} {item?.person?.name}
                  </Td>
                  <Td>{item?.person?.dni}</Td>
                  <Td>{getDayAndDateLabel(item)}</Td>
                  <Td>{getStartTimeLabel(item)}</Td>
                  <Td>{getActivityName(item)}</Td>
                  <Td>{getRoomName(item)}</Td>
                  <Td>{getStudioName(item)}</Td>
                  <Td textAlign="center">
                    <Checkbox
                      isChecked={hasSignedClassDeclaration(item)}
                      isReadOnly
                      aria-label={
                        hasSignedClassDeclaration(item)
                          ? "Declaración firmada"
                          : "Declaración no firmada"
                      }
                    />
                  </Td>
                  <Td isNumeric>
                    <HStack justify="flex-start" spacing={1}>
                      <Tooltip hasArrow label="Editar">
                        <IconButton
                          aria-label="Editar"
                          icon={<Icon path={mdiPencilOutline} size={0.9} />}
                          size="sm"
                          onClick={() => handleClickEdit(item)}
                          variant="ghost"
                        />
                      </Tooltip>
                      <Tooltip hasArrow label="Eliminar">
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
                <TableState kind="empty" colSpan={9} title="No se encontraron datos" />
              )
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

export default TableAppointments;
