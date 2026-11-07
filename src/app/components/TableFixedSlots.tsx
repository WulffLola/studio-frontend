"use client";

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
import { mdiDeleteOutline, mdiPencilOutline } from "@mdi/js";
import Icon from "@mdi/react";
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { getActivitySubType, getPeoples, getRooms, getStudios } from "../stores/studioSlice";
import { useStudioStore } from "../stores/studio";
import { isSelectableStudio } from "../utils/studios";
import Pagination from "./Pagination";
import ModalFixedSlotAdd from "./ModalFixedSlotAdd";
import SearchField from "./ui/SearchField";
import { Select as Select2 } from "./ui/Select";

const ITEMS_PER_PAGE = 10;
const fixedSlotsUrl = () =>
  process.env.NEXT_PUBLIC_URL_BACKEND_FIXED_SLOTS ||
  `${process.env.NEXT_PUBLIC__URL_BACKEND}fixed-slots/`;

const entityId = (value: any) =>
  String(typeof value === "object" ? value?.id ?? "" : value ?? "");

const normalizeText = (value: any) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatHour = (value?: string) => value?.slice(0, 5) || "-";

const TableFixedSlots = ({
  refreshKey,
  onOpenAdd,
}: {
  refreshKey: number;
  onOpenAdd: () => void;
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudio, setSelectedStudio] = useState<any>({
    value: "all",
    label: "Todos los estudios",
  });
  const selectedStudioFromHeader = useStudioStore((state) => state.selectedStudio);
  const studioStoreHasHydrated = useStudioStore((state) => state.hasHydrated);
  const studioFilterInitialized = useRef(false);
  const { tokens } = useAuthStore();
  const { peoples, rooms, studios, activitySubType } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const cancelRef = useRef<any>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  useEffect(() => {
    Promise.all([
      dispatch(getPeoples()),
      dispatch(getRooms()),
      dispatch(getStudios()),
      dispatch(getActivitySubType()),
    ]);
  }, [dispatch]);

  useEffect(() => {
    if (!studioStoreHasHydrated || studioFilterInitialized.current) return;
    if (selectedStudioFromHeader?.id) {
      setSelectedStudio({
        value: String(selectedStudioFromHeader.id),
        label: selectedStudioFromHeader.name,
      });
    }
    studioFilterInitialized.current = true;
  }, [selectedStudioFromHeader, studioStoreHasHydrated]);

  const loadFixedSlots = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(fixedSlotsUrl(), {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      const results = Array.isArray(data) ? data : data?.results || [];
      setItems(results.filter((item: any) => !item.deleted));
    } catch (error: any) {
      toast({
        title: "No se pudieron cargar los turnos fijos",
        description: error.response?.data?.detail || "Intentá nuevamente.",
        status: "error",
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFixedSlots();
    // Se actualiza al montar y después de crear un turno desde el modal padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, tokens?.access]);

  const personOf = (item: any) => {
    if (typeof item.person === "object") return item.person;
    return peoples?.find((person: any) => entityId(person) === entityId(item.person)) || {};
  };

  const templateOf = (item: any) => item.template || item.slot_template || {};

  const roomOf = (item: any) => {
    const template = templateOf(item);
    const room = template.room || item.room;
    if (typeof room === "object") return room;
    return rooms?.find((candidate: any) => entityId(candidate) === entityId(room)) || {};
  };

  const studioOf = (item: any) => {
    const room = roomOf(item);
    const studio = room.studio || room.studio_id || item.studio;
    if (typeof studio === "object") return studio;
    return studios?.find((candidate: any) => entityId(candidate) === entityId(studio)) || {};
  };

  const activityName = (item: any) => {
    const template = templateOf(item);
    const activity = template.activity_subtype || item.activity_subtype;
    if (typeof activity === "object") return activity.name || "-";
    return activitySubType?.find((candidate: any) => entityId(candidate) === entityId(activity))?.name || "-";
  };

  const daysLabel = (item: any) => {
    const template = templateOf(item);
    const days = template.days_of_week || template.days_week || [];
    return days.map((day: any) => day?.day || String(day)).join(", ") || "-";
  };

  const studioOptions = useMemo(
    () => [
      { value: "all", label: "Todos los estudios" },
      ...(studios || []).filter(isSelectableStudio).map((studio: any) => ({
        value: String(studio.id),
        label: studio.name,
      })),
    ],
    [studios],
  );

  const filteredItems = items
    .filter((item) => {
      const person = personOf(item);
      const room = roomOf(item);
      const studio = studioOf(item);
      const template = templateOf(item);
      const matchesStudio = selectedStudio.value === "all" || entityId(studio) === String(selectedStudio.value);
      if (!matchesStudio) return false;
      const searchable = normalizeText([
        person.name,
        person.last_name,
        person.dni,
        daysLabel(item),
        template.start_time,
        activityName(item),
        room.name,
        studio.name,
      ].join(" "));
      return searchable.includes(normalizeText(searchTerm));
    })
    .sort((a, b) => {
      const personA = personOf(a);
      const personB = personOf(b);
      return `${personA.last_name || ""} ${personA.name || ""}`.localeCompare(
        `${personB.last_name || ""} ${personB.name || ""}`,
      );
    });

  const pageCount = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => setCurrentPage(1), [searchTerm, selectedStudio.value]);

  const confirmDelete = (item: any) => {
    setSelectedItem(item);
    onOpen();
  };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    onEditOpen();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setDeleting(true);
    try {
      await axios.delete(`${fixedSlotsUrl()}${selectedItem.id}/`, {
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      toast({
        title: "Turno fijo dado de baja",
        description: "Se cancelaron las reservas automáticas futuras y se liberaron los cupos.",
        status: "success",
        duration: 4500,
        isClosable: true,
        position: "bottom-right",
      });
      onClose();
      await loadFixedSlots();
    } catch (error: any) {
      toast({
        title: "No se pudo dar de baja el turno fijo",
        description: error.response?.data?.detail || "Intentá nuevamente.",
        status: "error",
        position: "bottom-right",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack mt={4} mb={2} w="100%">
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        w="100%"
        gap={{ base: 4, md: 0 }}
      >
        <Box>
          <Text fontSize="lg" fontWeight="bold">Turnos fijos</Text>
          <Text fontSize="sm" color="gray.500">Horarios recurrentes asignados a los alumnos</Text>
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
              onChange={(option) => setSelectedStudio(option || studioOptions[0])}
              isClearable={false}
              selectedOptionStyle="check"
              appearance="filter"
            />
          </Box>
          <SearchField
            w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
            placeholder="Buscar por alumno, día, horario…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onClear={() => setSearchTerm("")}
          />
          <Button
            leftIcon={<FiPlus />}
            onClick={onOpenAdd}
            w={{ base: "100%", md: "auto" }}
            flexBasis={{ base: "100%", md: "auto" }}
            flexShrink={0}
            whiteSpace="nowrap"
            variant="primary"
          >
            Registrar Turno Fijo
          </Button>
        </HStack>
      </Flex>

      <Box
        overflowX="auto"
        borderWidth="1px"
        rounded="xl"
        bg="white"
        mt={0}
        minH="100%"
        w="100%"
      >
        <Table colorScheme="gray" size="sm" minW="1180px">
          <Thead h="50px">
            <Tr>
              <Th>Alumno</Th>
              <Th>DNI</Th>
              <Th>Días</Th>
              <Th>Horario</Th>
              <Th>Actividad</Th>
              <Th>Sala</Th>
              <Th>Estudio</Th>
              <Th>Desde</Th>
              <Th>Hasta</Th>
              <Th isNumeric>Reservas</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr><Td colSpan={11} textAlign="center" py={8}><Spinner size="sm" mr={2} />Cargando...</Td></Tr>
            ) : currentItems.length ? currentItems.map((item) => {
              const person = personOf(item);
              const template = templateOf(item);
              const room = roomOf(item);
              const studio = studioOf(item);
              return (
                <Tr key={item.id}>
                  <Td>{person.last_name} {person.name}</Td>
                  <Td>{person.dni || "-"}</Td>
                  <Td>{daysLabel(item)}</Td>
                  <Td>{formatHour(template.start_time)} a {formatHour(template.end_time)}</Td>
                  <Td>{activityName(item)}</Td>
                  <Td>{room.name || "-"}</Td>
                  <Td>{studio.name || "-"}</Td>
                  <Td>{formatDate(item.start_date)}</Td>
                  <Td>{item.end_date ? formatDate(item.end_date) : "Sin vencimiento"}</Td>
                  <Td isNumeric>{item.reservas_count ?? 0}</Td>
                  <Td>
                    <HStack spacing={1}>
                    <Tooltip label="Editar" hasArrow bg="studio.tooltipBg">
                      <IconButton
                        aria-label="Editar turno fijo"
                        icon={<Icon path={mdiPencilOutline} size={0.9} />}
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                      />
                    </Tooltip>
                    <Tooltip label="Dar de baja" hasArrow bg="studio.tooltipBg">
                      <IconButton
                        aria-label="Quitar turno fijo"
                        icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                        variant="outline"
                        bg="transparent"
                        color="gray.600"
                        borderColor="gray.200"
                        _hover={{
                          bg: "transparent",
                          color: "gray.700",
                          borderColor: "gray.300",
                        }}
                        _active={{
                          bg: "transparent",
                          color: "gray.700",
                          borderColor: "gray.300",
                        }}
                        size="sm"
                        onClick={() => confirmDelete(item)}
                      />
                    </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              );
            }) : (
              <Tr><Td colSpan={11} textAlign="center" py={8}>No se encontraron turnos fijos</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      <Flex justify="center">
        <Pagination
          count={pageCount}
          pageSize={ITEMS_PER_PAGE}
          totalItems={filteredItems.length}
          defaultPage={1}
          page={currentPage}
          onPageChange={setCurrentPage}
        />
      </Flex>

      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogCloseButton />
            <AlertDialogHeader>Dar de baja turno fijo</AlertDialogHeader>
            <AlertDialogBody>
              ¿Querés dar de baja el turno fijo de <strong>{personOf(selectedItem || {}).name} {personOf(selectedItem || {}).last_name}</strong>? Se cancelarán únicamente las reservas automáticas futuras.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={onClose} variant="outline">Cancelar</Button>
              <Button colorScheme="red" onClick={handleDelete} isLoading={deleting}>Dar de baja</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay />
        <ModalContent
          maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
          overflowY="auto"
        >
          <ModalCloseButton />
          {selectedItem && (
            <ModalFixedSlotAdd
              key={selectedItem.id}
              product={selectedItem}
              onClose={onEditClose}
              onCreated={loadFixedSlots}
            />
          )}
        </ModalContent>
      </Modal>
    </Stack>
  );
};

export default TableFixedSlots;
