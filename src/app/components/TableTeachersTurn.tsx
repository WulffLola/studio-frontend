"use client";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  AlertDialogHeader,
  HStack,
  IconButton,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { isSelectableStudio } from "../utils/studios";
import Icon from "@mdi/react";
import { mdiPencilOutline, mdiDeleteOutline } from "@mdi/js";
import Pagination from "./Pagination";
import ModalTeacherTurnEdit from "./ModalTeacherTurnEdit";
import { useAuthStore } from "../stores/auth";
import TeachersShiftTable from "./TeachersShiftTable";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { getTeachersTurn, getRooms, getSlots } from "../stores/studioSlice";
import { useStudioStore } from "../stores/studio";
import { Select as Select2 } from "./ui/Select";
import { LoadingOverlay } from "./ui/Loaders";
import { StateMessage, TableState } from "./ui/StateMessage";

const ITEMS_PER_PAGE = 10;


const mockList = [
  {
    id: 1,
    teacher: { id: 1, name: "Carlos", last_name: "Instructor" },
    slot: {
      id: 1,
      week_day: { day: "Lunes" },
      start_time: "08:00:00",
      end_time: "09:00:00",
      room: 1,
    },
    rol: "Instructor Principal",
  },
  {
    id: 2,
    teacher: { id: 2, name: "Ana", last_name: "Profe" },
    slot: {
      id: 2,
      week_day: { day: "Lunes" },
      start_time: "09:00:00",
      end_time: "10:00:00",
      room: 1,
    },
    rol: "Recepcionista Tarde",
  },
  {
    id: 3,
    teacher: { id: 3, name: "Roberto", last_name: "Gomez" },
    slot: {
      id: 3,
      week_day: { day: "Martes" },
      start_time: "15:00:00",
      end_time: "16:00:00",
      room: 2,
    },
    rol: "Apoyo Circuito",
  },
  {
    id: 4,
    teacher: { id: 4, name: "Lucía", last_name: "Sosa" },
    slot: {
      id: 4,
      week_day: { day: "Miércoles" },
      start_time: "18:00:00",
      end_time: "19:00:00",
      room: 3,
    },
    rol: "Yoga Belgrano",
  },
  {
    id: 5,
    teacher: { id: 1, name: "Carlos", last_name: "Instructor" },
    slot: {
      id: 5,
      week_day: { day: "Jueves" },
      start_time: "08:00:00",
      end_time: "09:00:00",
      room: 1,
    },
    rol: "Instructor VIP",
  },
];


const TableTeachersTurn = ({
  list,
  view,
  searchTerm,
}: {
  list: Array<any>;
  view: "grill" | "table";
  searchTerm: string;
}) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  const { teachersTurn, studios, rooms } = useSelector((state: any) => state.studio);

  const selectedStudioFromStore = useStudioStore((s) => s.selectedStudio);

  const [selectedStudioLocal, setSelectedStudioLocal] = useState<string>("");

  useEffect(() => {
    setSelectedStudioLocal("");
  }, []);

  // filtra por el estudio seleccionado en el studioSlection
  // useEffect(() => {
  // setSelectedStudioLocal(
  // selectedStudioFromStore?.id ? String(selectedStudioFromStore.id) : ""
  // );
  // }, [selectedStudioFromStore]);

  const studiosOptions = React.useMemo(() => {
    const arr = Array.isArray(studios) ? studios : [];

    return [...arr]
      .filter((s) => s?.id && s?.name && isSelectableStudio(s))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s: any) => ({
        value: String(s.id),
        label: s.name,
      }));
  }, [studios]);

  const selectedStudioOption =
    studiosOptions.find((option) => option.value === selectedStudioLocal) || null;

  const dispatch = useAppDispatch();
  const refreshTeachersTurn = React.useCallback(() => {
    dispatch(getTeachersTurn());
  }, [dispatch]);

  const getRoomData = (item: any) => {
    const roomId = item?.slot?.room;
    if (!roomId || !Array.isArray(rooms)) return null;

    return rooms.find((room: any) => String(room.id) === String(roomId)) || null;
  };

  const getStudioId = (item: any) => {
    const roomData = getRoomData(item);
    console.log(roomData)
    return roomData?.studio?.id || roomData?.studio || "";
  };

  const getStudioName = (item: any) => {
    const roomData = getRoomData(item);

    if (typeof roomData?.studio === "object") {
      return roomData?.studio?.name || "-";
    }

    if (roomData?.studio) {
      const studioFound = studios?.find(
        (studio: any) => String(studio.id) === String(roomData.studio)
      );
      return studioFound?.name || "-";
    }

    return "-";
  };

  const getRoom = (item: any) => {
    const roomData = getRoomData(item);

    if (!roomData) return item?.slot?.room || "-";

    return roomData?.name || roomData?.number || roomData?.room_name || item?.slot?.room || "-";
  };

  const getTeacherFullName = (item: any) =>
    `${item?.teacher?.last_name || ""} ${item?.teacher?.name || ""}`.trim();

  const getWeekDay = (item: any) => {
    const date = item?.slot?.date;

    if (!date) return "-";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  };

  const getStartTime = (item: any) => item?.slot?.start_time || "";

  const getEndTime = (item: any) => item?.slot?.end_time || "";

  const getTimeRange = (item: any) => {
    const start = getStartTime(item);
    const end = getEndTime(item);

    // if (start && end) return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
    if (start) return start.slice(0, 5);
    return "-";
  };


  const sortByLastNameAndFirstName = (items: any[] = []) => {
    return [...items].sort((a, b) => {
      const aLastName = a?.teacher?.last_name || "";
      const bLastName = b?.teacher?.last_name || "";
      const aName = a?.teacher?.name || "";
      const bName = b?.teacher?.name || "";

      const lastNameComparison = aLastName.localeCompare(bLastName);

      if (lastNameComparison === 0) {
        return aName.localeCompare(bName);
      }

      return lastNameComparison;
    });
  };


  const sortedList = sortByLastNameAndFirstName(list);

  const filteredItems = sortedList.filter((item) => {
    const norm = (str: string) =>
      str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

    const searchLower = norm(searchTerm);

    const fullName = norm(`${item?.teacher?.name || ""} ${item?.teacher?.last_name || ""}`);
    const reversefullName = norm(
      `${item?.teacher?.last_name || ""} ${item?.teacher?.name || ""}`
    );
    const dni = norm(item?.teacher?.dni || "");
    const name = norm(item?.teacher?.name || "");
    const lastName = norm(item?.teacher?.last_name || "");
    const weekDay = norm(getWeekDay(item));
    const timeSlot = norm(getTimeRange(item));
    const rol = norm((item?.rol || "").toString());
    const room = norm(String(getRoom(item)));
    const studio = norm(getStudioName(item));

    return (
      fullName.includes(searchLower) ||
      reversefullName.includes(searchLower) ||
      name.includes(searchLower) ||
      lastName.includes(searchLower) ||
      dni.includes(searchLower) ||
      weekDay.includes(searchLower) ||
      timeSlot.includes(searchLower) ||
      rol.includes(searchLower) ||
      room.includes(searchLower) ||
      studio.includes(searchLower)
    );
  });

  const filteredByStudio =
    selectedStudioLocal === ""
      ? filteredItems
      : filteredItems.filter(
        (item) => String(getStudioId(item)) === String(selectedStudioLocal)
      );


  const countPagination = Math.max(
    Math.ceil(filteredByStudio.length / ITEMS_PER_PAGE),
    1
  );
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredByStudio.slice(indexOfFirstItem, indexOfLastItem);

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

  const cancelRef = React.useRef<any>();
  const toast = useToast();

  const handleDelete = () => {
    if (!selectedItem) return;
    setLoading(true);

    axios
      .delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_TURN}${selectedItem.id}/`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then(() => {
        toast({
          title: "Turno eliminado correctamente.",
          description: "El turno fue eliminado con éxito.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom-right",
        });
        onCloseAlertDialogDelete();
        dispatch(getTeachersTurn());
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
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

  useEffect(() => {
    setLoadingTable(true);

    const timer = setTimeout(() => {
      setLoadingTable(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    dispatch(getRooms())
    dispatch(getSlots())
  }, [dispatch]);


  console.log("list original", list);
  console.log("sortedList", sortedList);
  console.log("filteredItems", filteredItems);
  console.log("selectedStudioLocal", selectedStudioLocal);
  console.log("filteredByStudio", filteredByStudio);
  console.log("currentItems", currentItems);
  console.log("searchTerm", searchTerm);

  return (
    <>
      {selectedItem && (
        <Modal
          onClose={onCloseModalEdit}
          isOpen={isAlertEditOpen}
          isCentered
          size={{ base: "90%", md: "70%", lg: "80%" }}
        >
          <ModalOverlay w="100%" h="100%" />
          <ModalContent
            maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }}
            maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
          >
            <ModalCloseButton />
            <ModalTeacherTurnEdit
              onClose={onCloseModalEdit}
              product={selectedItem}
              getTeachersTurn={() => dispatch(getTeachersTurn())}
            />
          </ModalContent>
        </Modal>
      )}

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
                Eliminar turno profesora
              </AlertDialogHeader>
              <AlertDialogBody>
                {selectedItem ? (
                  <>
                    ¿Está seguro que quiere eliminar el turno de la profesora{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.teacher?.name} {selectedItem?.teacher?.last_name}
                    </span>{" "}
                    con dni{" "}
                    <span style={{ fontWeight: 600 }}>
                      {selectedItem?.teacher?.dni}
                    </span>{" "}
                    del día{" "}
                    <span style={{ fontWeight: 600 }}>
                      {getWeekDay(selectedItem)}
                    </span>{" "}
                    a las{" "}
                    <span style={{ fontWeight: 600 }}>
                      {getTimeRange(selectedItem)}
                    </span>{" "}
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

      {view === "grill" ? (
        loadingTable ? (
          <StateMessage
            kind="loading"
            bg="bg.surface"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="card"
            mt={2}
            w="100%"
          />
        ) : (
          <>
            {/* <Box
              bg="bg.surface"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="10px"
              px={3}
              py={2}
              mb={4}
              maxW={{ base: "100%", md: "360px" }}
            >
              <FormControl>
                <FormLabel fontSize="xs" mb={1} color="text.muted">
                  Estudio
                </FormLabel>

                <Select2
                  options={studiosOptions}
                  value={selectedStudioOption}
                  onChange={(option) => {
                    setSelectedStudioLocal(option?.value || "");
                    setCurrentPage(1);
                  }}
                  placeholder="Seleccionar estudio"
                  isClearable={false}
                  selectedOptionStyle="check"
                  appearance="filter"
                />
              </FormControl>
            </Box> */}

            <TeachersShiftTable
              getTeachersTurn={refreshTeachersTurn}
            />
          </>
        )
      ) : (
        <>
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
                  <Th>Profesora</Th>
                  <Th>Dni</Th>
                  <Th>Día</Th>
                  <Th>Horario</Th>
                  <Th>Rol</Th>
                  <Th>Estudio</Th>
                  <Th>Sala</Th>
                  <Th isNumeric>
                    Acciones
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {loadingTable ? (
                  <TableState kind="loading" colSpan={8} />
                ) : currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <Tr
                      onDoubleClick={() => handleRowDoubleClick(index, item)}
                      key={index}
                      onClick={() => setSelectedRow(item)}
                      data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                    >
                      <Td>{getTeacherFullName(item)}</Td>
                      <Td>{item?.teacher?.dni || "-"}</Td>
                      <Td>{getWeekDay(item)}</Td>
                      <Td>{getTimeRange(item)}</Td>
                      <Td>{item?.rol || "-"}</Td>
                      <Td>{getStudioName(item)}</Td>
                      <Td>{getRoom(item)}</Td>
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
                    <TableState kind="empty" colSpan={8} title="No se encontraron datos" />
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
      )}
    </>
  );
};

export default TableTeachersTurn;
