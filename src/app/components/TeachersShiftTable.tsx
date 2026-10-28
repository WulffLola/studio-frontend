import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Badge,
    Box,
    Button,
    Flex,
    HStack,
    IconButton,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
    SimpleGrid,
    Stack,
    Text,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import React, { useEffect, useMemo, useState } from "react";
import ModalTeacherTurnEdit from "./ModalTeacherTurnEdit";
import ModalTeacherTurnAdd from "./ModalTeacherTurnAdd";
import { useSelector } from "react-redux";
import { useStudioStore } from "../stores/studio";
import { brandActivityPalette } from "../../theme/brand";
import { Surface } from "./ui/PageContainer";
import { StateMessage } from "./ui/StateMessage";
import { mdiDeleteOutline, mdiDotsVertical, mdiPencilOutline } from "@mdi/js";
import Icon from "@mdi/react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";

type TeachersShiftTableProps = {
    getTeachersTurn: () => void;
};

const TeachersShiftTable: React.FC<TeachersShiftTableProps> = ({
    getTeachersTurn,
}) => {
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [shouldUpdate, setShouldUpdate] = useState(false);
    const [openTable, setOpenTable] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedMobileDate, setSelectedMobileDate] = useState("");
    const [selectedForDelete, setSelectedForDelete] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);
    const cancelDeleteRef = React.useRef<HTMLButtonElement>(null);
    const toast = useToast();
    const { tokens } = useAuthStore();

    const selectedStudio = useStudioStore((s) => s.selectedStudio);
    const studioId = selectedStudio?.id;

    const allRooms = useSelector((state: any) => state.studio.rooms || []);
    const slots = useSelector((state: any) => state.studio.slots || []);
    const teachersTurn = useSelector((state: any) => state.studio.teachersTurn || []);
    const loadingTable = useSelector((state: any) => state.studio.loadingTeachersTurn);

    const rooms = useMemo(() => {
        if (!studioId) return allRooms || [];

        return (allRooms || []).filter((room: any) => {
            const roomStudioId =
                room?.studio?.id ??
                room?.studio_id ??
                room?.studio;

            return String(roomStudioId) === String(studioId);
        });
    }, [allRooms, studioId]);

    useEffect(() => {
        if (!rooms.length) {
            setSelectedRoomId("");
            return;
        }

        if (!rooms.some((room: any) => String(room.id) === selectedRoomId)) {
            setSelectedRoomId(String(rooms[0].id));
        }
    }, [rooms, selectedRoomId]);

    const {
        isOpen: isAlertOpenEdit,
        onOpen: onOpenModalEdit,
        onClose: onCloseModalEdit,
    } = useDisclosure();

    const {
        isOpen: isAlertOpenTeacherTurn,
        onOpen: onOpenModalTeacherTurn,
        onClose: onCloseModalTeacherTurn,
    } = useDisclosure();

    const {
        isOpen: isDeleteOpen,
        onOpen: onOpenDelete,
        onClose: onCloseDelete,
    } = useDisclosure();

    useEffect(() => {
        getTeachersTurn();
    }, [getTeachersTurn, shouldUpdate, studioId]);

    const getTeacherColor = (teacherId: string | number) => {
        const numericId = Number(teacherId);

        if (Number.isNaN(numericId)) return brandActivityPalette[0];

        const index = (numericId - 1) % brandActivityPalette.length;
        return brandActivityPalette[index];
    };

    const getRoomIdFromItem = (item: any) =>
        String(item?.slot?.room?.id || item?.slot?.room || item?.room || "");

    const getRoomName = (room: any) =>
        room?.name || room?.room_name || room?.sala || `Sala ${room?.id}`;

    const getDateFromItem = (item: any) => item?.slot?.date || item?.date || "";

    const getDayNameFromDate = (dateString?: string) => {
        if (!dateString) return "";

        const date = new Date(`${dateString}T00:00:00`);

        const days = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado",
        ];

        return days[date.getDay()];
    };

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const formatDateString = (dateString?: string) => {
        if (!dateString) return "";
        return formatDate(new Date(`${dateString}T00:00:00`));
    };

    const getTimeLabelFromItem = (item: any) => {
        const start = item?.slot?.start_time || item?.start_time;
        const end = item?.slot?.end_time || item?.end_time;

        if (start && end) {
            return `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`;
        }

        if (start) return String(start).slice(0, 5);

        return "-";
    };

    const getStartMinutesFromItem = (item: any) => {
        const start =
            item?.slot?.start_time ||
            item?.start_time ||
            item?.slot?.time_slot ||
            item?.time_slot;

        if (!start) return 9999;

        const [h, m] = String(start).split(":");
        return Number(h) * 60 + Number(m);
    };

    const filteredTeachersTurn = useMemo(() => {
        if (!studioId) return teachersTurn || [];

        return (teachersTurn || []).filter((item: any) => {
            const itemRoomId =
                item?.slot?.room?.id ??
                item?.slot?.room ??
                item?.room?.id ??
                item?.room;

            const room = (allRooms || []).find(
                (r: any) => String(r.id) === String(itemRoomId)
            );

            if (!room) return false;

            const roomStudioId =
                room?.studio?.id ??
                room?.studio_id ??
                room?.studio;

            return String(roomStudioId) === String(studioId);
        });
    }, [teachersTurn, studioId, allRooms]);

    const dateSlots = useMemo(() => {
        const today = new Date();
        today.setDate(today.getDate() + weekOffset * 7);
        const currentDay = today.getDay();

        const monday = new Date(today);
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        monday.setHours(0, 0, 0, 0);
        monday.setDate(today.getDate() + diffToMonday);

        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        });
    }, [weekOffset]);

    const weekRangeLabel = useMemo(() => {
        if (!dateSlots.length) return "";
        const start = new Date(`${dateSlots[0]}T00:00:00`);
        const end = new Date(`${dateSlots[dateSlots.length - 1]}T00:00:00`);
        const startLabel = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(start);
        const endLabel = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(end);
        return `${startLabel} – ${endLabel}`;
    }, [dateSlots]);

    useEffect(() => {
        setSelectedMobileDate(dateSlots[0] || "");
    }, [dateSlots]);

    const schedule = useMemo(() => {
        const result: Record<string, Record<string, any[]>> = {};

        dateSlots.forEach((date: string) => {
            result[date] = {};

            (rooms || []).forEach((room: any) => {
                const roomId = String(room.id);
                const roomName = getRoomName(room);

                const entries = (filteredTeachersTurn || [])
                    .filter((item: any) => {
                        const sameDate = getDateFromItem(item) === date;
                        const sameRoom = getRoomIdFromItem(item) === roomId;
                        return sameDate && sameRoom;
                    })
                    .sort((a: any, b: any) => getStartMinutesFromItem(a) - getStartMinutesFromItem(b))
                    .map((item: any) => ({
                        id: item.id,
                        teacher: item.teacher,
                        slot: item.slot,
                        slotId: item?.slot?.id,
                        rol: item.rol,
                        time: getTimeLabelFromItem(item),
                        date,
                        roomId,
                        roomName,
                    }));

                result[date][roomId] = entries;
            });
        });

        return result;
    }, [dateSlots, rooms, filteredTeachersTurn]);

    const selectedRoom = rooms.find(
        (room: any) => String(room.id) === selectedRoomId
    );

    const timeRows = useMemo(() => {
        if (!selectedRoomId) return [];

        const labels = new Set<string>();

        (Array.isArray(slots) ? slots : []).forEach((slot: any) => {
            const sameRoom = getRoomIdFromItem(slot) === selectedRoomId;
            const sameWeek = dateSlots.includes(getDateFromItem(slot));
            if (!sameRoom || !sameWeek) return;

            const label = getTimeLabelFromItem(slot);
            if (label && label !== "-") labels.add(label);
        });

        dateSlots.forEach((date) => {
            (schedule?.[date]?.[selectedRoomId] || []).forEach((entry: any) => {
                if (entry.time && entry.time !== "-") labels.add(entry.time);
            });
        });

        return [...labels].sort((a, b) => a.localeCompare(b));
    }, [dateSlots, schedule, selectedRoomId, slots]);

    const openEmptyCell = (date: string, time: string) => {
        if (!selectedRoom) return;
        setSelectedSlot({
            time: time.split(" - ")[0],
            date,
            day: getDayNameFromDate(date),
            isReceptionist: false,
            roomId: selectedRoomId,
            roomName: getRoomName(selectedRoom),
        });
        setOpenTable(true);
        onOpenModalTeacherTurn();
    };

    const handleBoxDoubleClick = (cellData: any) => {
        if (!cellData) return;

        const { id, teacher, slot, rol, time, date, roomId, roomName } = cellData;

        if (teacher && slot) {
            setSelectedTeacher({
                id,
                teacher,
                slot,
                rol,
                time,
                date,
                day: getDayNameFromDate(date),
                roomId,
                roomName,
            });
            onOpenModalEdit();
        } else {
            setSelectedSlot({
                time,
                date,
                day: getDayNameFromDate(date),
                isReceptionist: rol,
                roomId,
                roomName,
            });
            setOpenTable(true);
            onOpenModalTeacherTurn();
        }
    };

    const requestDelete = (entry: any) => {
        setSelectedForDelete(entry);
        onOpenDelete();
    };

    const handleDelete = async () => {
        if (!selectedForDelete?.id) return;
        setDeleting(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_TURN}${selectedForDelete.id}/`,
                { headers: { Authorization: `Bearer ${tokens?.access}` } }
            );
            toast({ title: "Turno eliminado correctamente", status: "success", duration: 3000, isClosable: true, position: "bottom-right" });
            onCloseDelete();
            setSelectedForDelete(null);
            getTeachersTurn();
        } catch {
            toast({ title: "No se pudo eliminar el turno", status: "error", duration: 5000, isClosable: true, position: "bottom-right" });
        } finally {
            setDeleting(false);
        }
    };

    const renderTeacherCard = (entry: any) => (
        <Box
            key={entry.id}
            bg={getTeacherColor(entry?.teacher?.id)}
            borderRadius="8px"
            border="1px solid"
            borderColor="blackAlpha.50"
            p={{ base: 2.5, md: 3 }}
            w="100%"
            h="100%"
            minH={{ base: "64px", md: "68px" }}
            flex="1"
            display="grid"
            gridTemplateColumns="28px minmax(0, 1fr) 28px"
            gridTemplateRows="auto auto"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            cursor="pointer"
            onClick={() => handleBoxDoubleClick(entry)}
            _hover={{ borderColor: "blackAlpha.200", boxShadow: "sm" }}
            transition="border-color 120ms ease, box-shadow 120ms ease"
        >
            <Text gridColumn="2" gridRow="1" minW={0} w="100%" fontWeight={600} color="text.primary" fontSize={{ base: "xs", md: "sm" }} lineHeight="short" overflowWrap="anywhere" noOfLines={2}>
                {entry?.teacher?.name} {entry?.teacher?.last_name}
            </Text>
            <Text gridColumn="2" gridRow="2" minW={0} w="100%" fontSize="xs" color="text.secondary" lineHeight="short" mt={1} noOfLines={2}>
                {entry?.rol || "Sin rol"}
            </Text>
            <Menu placement="bottom-end">
                <MenuButton
                    as={IconButton}
                    aria-label="Acciones del turno de profesora"
                    icon={<Icon path={mdiDotsVertical} size={0.72} />}
                    size="xs"
                    minW="28px"
                    h="28px"
                    variant="ghost"
                    color="text.secondary"
                    _hover={{ bg: "blackAlpha.100", color: "text.primary" }}
                    _active={{ bg: "blackAlpha.200" }}
                    gridColumn="3"
                    gridRow="1 / 3"
                    alignSelf="center"
                    justifySelf="center"
                    onClick={(event: React.MouseEvent) => event.stopPropagation()}
                />
                <Portal>
                    <MenuList minW="170px" fontSize="sm" zIndex="popover" onClick={(event) => event.stopPropagation()}>
                        <MenuItem icon={<Icon path={mdiPencilOutline} size={0.7} />} onClick={() => handleBoxDoubleClick(entry)}>Editar turno</MenuItem>
                        <MenuItem icon={<Icon path={mdiDeleteOutline} size={0.7} />} color="error.fg" _hover={{ bg: "error.bg" }} _focus={{ bg: "error.bg" }} onClick={() => requestDelete(entry)}>Eliminar turno</MenuItem>
                    </MenuList>
                </Portal>
            </Menu>
        </Box>
    );


    console.log("studioId", studioId);
    console.log("allRooms", allRooms);
    console.log("rooms filtradas", rooms);
    console.log("teachersTurn", teachersTurn);
    console.log("filteredTeachersTurn", filteredTeachersTurn);
    console.log("dateSlots", dateSlots);
    console.log("schedule", schedule);

    return (
        <>
            <Modal
                onClose={onCloseModalTeacherTurn}
                isOpen={isAlertOpenTeacherTurn}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                >
                    <ModalCloseButton />
                    <ModalTeacherTurnAdd
                        onClose={onCloseModalTeacherTurn}
                        product={selectedSlot}
                        getTeachersTurn={getTeachersTurn}
                        openTable={openTable}
                        grillRoom={selectedSlot?.roomName}
                    />
                </ModalContent>
            </Modal>

            {selectedTeacher && (
                <Modal
                    onClose={() => {
                        onCloseModalEdit();
                        setShouldUpdate((prev) => !prev);
                    }}
                    isOpen={isAlertOpenEdit}
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
                            product={selectedTeacher}
                            getTeachersTurn={getTeachersTurn}
                        />
                    </ModalContent>
                </Modal>
            )}

            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelDeleteRef}
                onClose={onCloseDelete}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent mx={4}>
                        <AlertDialogHeader>Eliminar turno de profesora</AlertDialogHeader>
                        <AlertDialogBody>
                            ¿Querés eliminar el turno de{" "}
                            <Text as="span" fontWeight="700">
                                {selectedForDelete?.teacher?.name} {selectedForDelete?.teacher?.last_name}
                            </Text>{" "}
                            del{" "}
                            <Text as="span" fontWeight="700">
                                {selectedForDelete ? formatDateString(selectedForDelete.date) : ""}
                            </Text>{" "}
                            a las{" "}
                            <Text as="span" fontWeight="700">
                                {selectedForDelete?.time}
                            </Text>
                            ?
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button ref={cancelDeleteRef} aria-label="Cancelar eliminación" onClick={onCloseDelete} variant="secondary">Cancelar</Button>
                            <Button aria-label="Eliminar turno" onClick={handleDelete} isLoading={deleting} variant="danger">Eliminar</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {!rooms || rooms.length === 0 ? (
                <Surface mt={{ base: 3, md: 4 }} w="full">
                    <StateMessage kind="empty" title="No hay salas configuradas para este estudio." />
                </Surface>
            ) : (
                <Surface
                    mt={{ base: 3, md: 4 }}
                    p={{ base: 3, md: 5 }}
                    w="full"
                >
                    {loadingTable ? (
                        <StateMessage kind="loading" />
                    ) : (
                        <Stack spacing={5}>
                            <Flex justify="center" align="center" gap={3} wrap="wrap">
                                <HStack spacing={2}>
                                    <IconButton
                                        aria-label="Mostrar semana anterior"
                                        icon={<ChevronLeftIcon boxSize={5} />}
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setWeekOffset((value) => value - 1)}
                                    />
                                    <Box minW={{ base: "190px", md: "230px" }} textAlign="center">
                                        <Text textStyle="overline">Semana mostrada</Text>
                                        <Text fontWeight={600}>{weekRangeLabel}</Text>
                                    </Box>
                                    <IconButton
                                        aria-label="Mostrar semana siguiente"
                                        icon={<ChevronRightIcon boxSize={5} />}
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setWeekOffset((value) => value + 1)}
                                    />
                                </HStack>
                            </Flex>

                            <HStack spacing={2} overflowX="auto" pb={1}>
                                {rooms.map((room: any) => {
                                    const active = String(room.id) === selectedRoomId;
                                    return (
                                        <Button
                                            key={room.id}
                                            size="sm"
                                            flexShrink={0}
                                            variant="toggle"
                                            isActive={active}
                                            aria-pressed={active}
                                            onClick={() => setSelectedRoomId(String(room.id))}
                                        >
                                            {getRoomName(room)}
                                        </Button>
                                    );
                                })}
                            </HStack>

                            {timeRows.length === 0 ? (
                                <Box border="1px dashed" borderColor="border.default" borderRadius="card" py={12} textAlign="center" color="text.muted">
                                    No hay turnos asignados para esta sala durante la semana.
                                </Box>
                            ) : (
                                <>
                                <Box display={{ base: "block", xl: "none" }}>
                                    <SimpleGrid columns={7} spacing={1} w="100%" pb={3}>
                                        {dateSlots.map((date) => {
                                            const active = date === selectedMobileDate;
                                            return (
                                                <Button
                                                    key={date}
                                                    size="sm"
                                                    minW={0}
                                                    w="100%"
                                                    h={{ base: "50px", sm: "56px", md: "64px", lg: "68px" }}
                                                    px={0}
                                                    variant="toggle"
                                                    isActive={active}
                                                    aria-pressed={active}
                                                    onClick={() => setSelectedMobileDate(date)}
                                                >
                                                    <Stack spacing={0} align="center">
                                                        <Text fontSize={{ base: "10px", sm: "xs", md: "xs" }} fontWeight="700" textTransform="capitalize">
                                                            <Box as="span" display={{ base: "inline", sm: "none" }}>
                                                                {getDayNameFromDate(date).slice(0, 3)}
                                                            </Box>
                                                            <Box as="span" display={{ base: "none", sm: "inline", md: "none" }}>
                                                                {getDayNameFromDate(date).slice(0, 4)}
                                                            </Box>
                                                            <Box as="span" display={{ base: "none", md: "inline" }}>
                                                                {getDayNameFromDate(date)}
                                                            </Box>
                                                        </Text>
                                                        <Text fontSize={{ base: "9px", sm: "11px", md: "11px" }}>
                                                            <Box as="span" display={{ base: "inline", sm: "none" }}>
                                                                {formatDateString(date).slice(0, 5)}
                                                            </Box>
                                                            <Box as="span" display={{ base: "none", sm: "inline", md: "none" }}>
                                                                {`${formatDateString(date).slice(0, 6)}${formatDateString(date).slice(-2)}`}
                                                            </Box>
                                                            <Box as="span" display={{ base: "none", md: "inline" }}>
                                                                {formatDateString(date)}
                                                            </Box>
                                                        </Text>
                                                    </Stack>
                                                </Button>
                                            );
                                        })}
                                    </SimpleGrid>

                                    <Stack spacing={3}>
                                        {timeRows.map((time) => {
                                            const entries = (schedule?.[selectedMobileDate]?.[selectedRoomId] || []).filter((entry: any) => entry.time === time);
                                            const hasAvailableSlot = (Array.isArray(slots) ? slots : []).some((slot: any) =>
                                                getRoomIdFromItem(slot) === selectedRoomId &&
                                                getDateFromItem(slot) === selectedMobileDate &&
                                                getTimeLabelFromItem(slot) === time
                                            );
                                            return (
                                                <Box key={`${selectedMobileDate}-${time}`} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card" overflow="hidden">
                                                    <Box px={3} py={2} bg="bg.subtle" borderBottom="1px solid" borderColor="border.subtle">
                                                        <Text fontSize="sm" fontWeight={600}>{time}</Text>
                                                    </Box>
                                                    <Box p={2}>
                                                        {entries.length ? (
                                                            <Stack spacing={2}>{entries.map(renderTeacherCard)}</Stack>
                                                        ) : hasAvailableSlot ? (
                                                            <Button w="100%" minH="58px" variant="ghost" border="1px dashed" borderColor="border.default" color="text.muted" _hover={{ borderColor: "brand.300", color: "text.brand", bg: "brand.50" }} onClick={() => openEmptyCell(selectedMobileDate, time)}>
                                                                + Agregar profesora
                                                            </Button>
                                                        ) : (
                                                            <Flex minH="44px" align="center" justify="center" color="text.disabled" fontSize="sm">Sin horario disponible</Flex>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>

                                <Box display={{ base: "none", xl: "block" }} overflowX="auto" border="1px solid" borderColor="border.subtle" borderRadius="card">
                                    <Box minW="1240px" display="grid" gridTemplateColumns="100px repeat(7, minmax(160px, 1fr))">
                                        <Box bg="bg.subtle" borderRight="1px solid" borderBottom="1px solid" borderColor="border.subtle" p={3}>
                                            <Text textStyle="overline">Horario</Text>
                                        </Box>
                                        {dateSlots.map((date) => (
                                            <Box key={date} bg="bg.subtle" borderRight="1px solid" borderBottom="1px solid" borderColor="border.subtle" p={3} textAlign="center">
                                                <Text fontWeight={600} textTransform="capitalize">{getDayNameFromDate(date)}</Text>
                                                <Text fontSize="xs" color="text.muted">{formatDateString(date)}</Text>
                                            </Box>
                                        ))}

                                        {timeRows.map((time) => (
                                            <React.Fragment key={time}>
                                                <Box borderRight="1px solid" borderBottom="1px solid" borderColor="border.subtle" p={3} bg="bg.subtle">
                                                    <Text fontWeight={600} fontSize="sm">{time}</Text>
                                                </Box>
                                                {dateSlots.map((date) => {
                                                    const entries = (schedule?.[date]?.[selectedRoomId] || []).filter((entry: any) => entry.time === time);
                                                    const hasAvailableSlot = (Array.isArray(slots) ? slots : []).some((slot: any) =>
                                                        getRoomIdFromItem(slot) === selectedRoomId &&
                                                        getDateFromItem(slot) === date &&
                                                        getTimeLabelFromItem(slot) === time
                                                    );
                                                    return (
                                                        <Box key={`${date}-${time}`} minH="82px" borderRight="1px solid" borderBottom="1px solid" borderColor="border.subtle" p={1.5} display="flex">
                                                            {entries.length ? (
                                                                <Stack spacing={2} w="100%" h="100%" flex="1">
                                                                    {entries.map(renderTeacherCard)}
                                                                </Stack>
                                                            ) : hasAvailableSlot ? (
                                                                <Button
                                                                    w="100%"
                                                                    h="100%"
                                                                    minH="68px"
                                                                    variant="ghost"
                                                                    border="1px dashed"
                                                                    borderColor="border.default"
                                                                    color="text.muted"
                                                                    fontWeight={500}
                                                                    _hover={{ borderColor: "brand.300", color: "text.brand", bg: "brand.50" }}
                                                                    onClick={() => openEmptyCell(date, time)}
                                                                >
                                                                    + Agregar
                                                                </Button>
                                                            ) : (
                                                                <Flex w="100%" minH="68px" align="center" justify="center" color="text.disabled">—</Flex>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </Box>
                                </Box>
                                </>
                            )}
                        </Stack>
                    )}
                </Surface>
            )}
        </>
    );
};

export default TeachersShiftTable;
