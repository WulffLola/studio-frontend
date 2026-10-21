'use client'
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogOverlay,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ModalStudentAdd from "./components/ModalStudentAdd";
import ModalPaymentAdd from "./components/ModalPaymentAdd";
import Icon from '@mdi/react';
import { mdiAccountGroup, mdiCalendarMonthOutline, mdiCancel, mdiChartLine, mdiChevronLeft, mdiChevronRight, mdiPlus } from "@mdi/js";
import ShiftTable from "./components/ShiftTable";
import ModalAppointmentsAdd from "./components/ModalAppointmentsAdd";
import { useAuthStore } from "./stores/auth";
import ModalPlansSubTypeAdd from "./components/ModalPlansSubTypeAdd";
import ModalPaymentsAmountAdd from "./components/ModalPaymentsAmountAdd";
import ModalGenerateSlots from "./components/ModalGenerateSlots";
import ModalAppointmentsAvailable from "./components/ModalAppointmentsAvailable";
import ModalActiveMembers from "./components/ModalActiveMembers";
import ModalDebtor from "./components/ModalDebtor";
import ModalExpiredPayments from "./components/ModalExpiredPayments";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "./stores/hooks";
import { useSelector } from "react-redux";
import {
  getPlans,
  getAppointments,
  getPayments,
  getSlots,
  getPaymentsToday,
  getPeoples,
  getPaymentsStatusCurrentMonth,
  getStatusClients,
  getStudios,
  getRooms,
  getPaymentAmount,
  getCalendar,
} from '../app/stores/studioSlice';
import { selectRoomsForStudio, selectRoomsLoading } from "../app/stores/studioSlice";
import ModalStudioAdd from "./components/ModalStudioAdd";
import ModalRoomsAdd from "./components/ModalRoomsAdd";
import { useStudioStore } from "./stores/studio";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FullPageLoader } from "./components/ui/Loaders";
import { PageContainer, Surface } from "./components/ui/PageContainer";

export default function Home() {
  const [selectedRow, setSelectedRow] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reloadTable, setReloadTable] = useState(false);

  // flags informativos (opcional)
  const [wasPlansEmptyOnOpen, setWasPlansEmptyOnOpen] = useState<boolean | null>(null);
  const [wasPaymentAmountEmptyOnOpen, setWasPaymentAmountEmptyOnOpen] = useState<boolean | null>(null);
  const [wasSlotsEmptyOnOpen, setWasSlotsEmptyOnOpen] = useState<boolean | null>(null);
  const [wasStudiosEmptyOnOpen, setWasStudiosEmptyOnOpen] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [updatedAppointments, setUpdatedAppointments] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const { clearStudio } = useStudioStore();
  const selectedStudio = useStudioStore((s) => s.selectedStudio);
  const setSelectedStudio = useStudioStore((s) => s.setSelectedStudio);
  const studioId = selectedStudio?.id;

  ////////////////////////////////////////////////////////////////////////

  const rooms = useSelector((s: any) => selectRoomsForStudio(s, studioId));
  const roomsLoading = useSelector((s: any) => selectRoomsLoading(s, studioId));

  const selectedRoom = rooms.find((r: any) => r.id === selectedRoomId);

  const {
    studios,
    slots,
    payments,
    paymentsToday,
    appointments,
    plans,
    peoples,
    statusClients,
    paymentsStatusCurrentMonth,
    calendar,
  } = useSelector((state: any) => state.studio);

  const appointmentsSource = appointments;

  ////////////////////////////////////////////////////////////////////////

  const dispatch = useAppDispatch();

  const { tipo, logout, tokens } = useAuthStore();

  const cancelRef = React.useRef<any>();
  const router = useRouter();

  const {
    isOpen: isAlertOpenStudios,
    onOpen: onOpenModalStudios,
    onClose: onCloseModalStudios,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenRooms,
    onOpen: onOpenModalRooms,
    onClose: onCloseModalRooms,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenStudent,
    onOpen: onOpenModalStudent,
    onClose: onCloseModalStudent,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenPayment,
    onOpen: onOpenModalPayment,
    onClose: onCloseModalPayment,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenAppointments,
    onOpen: onOpenModalAppointments,
    onClose: onCloseModalAppointments,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenAppointmentsAvailable,
    onOpen: onOpenModalAppointmentsAvailable,
    onClose: onCloseModalAppointmentsAvailable,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenSlots,
    onOpen: onOpenModalSlots,
    onClose: onCloseModalSlots,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenPlans,
    onOpen: onOpenModalPlans,
    onClose: onCloseModalPlans,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenPaymentsAmount,
    onOpen: onOpenModalPaymentsAmount,
    onClose: onCloseModalPaymentsAmount,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenActiveMembers,
    onOpen: onOpenModalActiveMembers,
    onClose: onCloseModalActiveMembers,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenDebtor,
    onOpen: onOpenModalDebtor,
    onClose: onCloseModalDebtor,
  } = useDisclosure();

  const {
    isOpen: isAlertDialogEmpty,
    onOpen: onOpenAlertDialogEmpty,
    onClose: onCloseAlertDialogEmpty,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenExpiredPayments,
    onOpen: onOpenModalExpiredPayments,
    onClose: onCloseModalExpiredPayments,
  } = useDisclosure();

  // Datos base que ya pedías (no abren modales, solo llenan el estado global)
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      dispatch(getPlans()),
      dispatch(getSlots()),
      dispatch(getPaymentsToday()),
      dispatch(getPayments()),
      dispatch(getPeoples()),
      dispatch(getAppointments()),
      dispatch(getPaymentsStatusCurrentMonth()),
      dispatch(getStatusClients()),
      dispatch(getRooms()),
      dispatch(getPaymentAmount()),
      dispatch(getCalendar()),
    ]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Si cambia de estudio, limpiá la selección actual
  useEffect(() => {
    setSelectedRoomId(null);
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;

    const exists = rooms?.some((r: any) => r.id === selectedRoomId);

    if ((!selectedRoomId || !exists) && rooms?.length) {
      const firstActive = rooms.find((r: any) => r.is_active !== false);
      setSelectedRoomId(firstActive?.id ?? null);
    }
  }, [studioId, rooms, selectedRoomId]);

  // ===== Helpers de filtrado por studio / room =====
  const getStudioIdFromItem = (item: any) => {
    const rawStudio = item?.studio;
    return typeof rawStudio === "object" ? rawStudio?.id : rawStudio;
  };

  const getRoomIdFromItem = (item: any) => {
    const rawRoom = item?.room;
    return typeof rawRoom === "object" ? rawRoom?.id : rawRoom;
  };

  const filterListByStudio = (list: any[], currentStudioId: number | string) => {
    return list.filter((item: any) => Number(getStudioIdFromItem(item)) === Number(currentStudioId));
  };


  const calendarByRoom = useMemo(() => {
    if (!selectedRoom || !Array.isArray(calendar)) return [];

    const selectedRoomName = selectedRoom.name?.trim().toLowerCase();

    return calendar
      .map((dayItem: any) => {
        const filteredSlots = (dayItem.slots || []).filter((slot: any) => {
          return slot?.room_name?.trim().toLowerCase() === selectedRoomName;
        });

        return {
          ...dayItem,
          slots: filteredSlots,
        };
      })
      .filter((dayItem: any) => dayItem.slots.length > 0);
  }, [calendar, selectedRoom]);


  // ===== Helpers que DEVUELVEN arrays (con await unwrap) =====
  const getStudiosAndCheck = async (): Promise<any[]> => {
    try {
      const list = await dispatch(getStudios() as any).unwrap();
      setWasStudiosEmptyOnOpen(list.length === 0);
      return list;
    } catch {
      setWasStudiosEmptyOnOpen(true);
      return [];
    }
  };

  const getRoomsAndCheck = async (): Promise<any[]> => {
    try {
      const list = await dispatch(getRooms() as any).unwrap();
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  const getSlotsAndCheck = async (): Promise<any[]> => {
    try {
      const list = await dispatch(getSlots() as any).unwrap();
      setWasSlotsEmptyOnOpen(list.length === 0);
      return Array.isArray(list) ? list : [];
    } catch {
      setWasSlotsEmptyOnOpen(true);
      return [];
    }
  };

  const getPlansAndCheck = async (): Promise<any[]> => {
    try {
      const list = await dispatch(getPlans() as any).unwrap();
      setWasPlansEmptyOnOpen(list.length === 0);
      return Array.isArray(list) ? list : [];
    } catch {
      setWasPlansEmptyOnOpen(true);
      return [];
    }
  };

  const getPaymentsAmountAndCheck = async (): Promise<any[]> => {
    try {
      const list = await dispatch(getPaymentAmount() as any).unwrap();
      setWasPaymentAmountEmptyOnOpen(list.length === 0);
      return Array.isArray(list) ? list : [];
    } catch {
      setWasPaymentAmountEmptyOnOpen(true);
      return [];
    }
  };

  // ===== Helpers filtrados por studio actual =====
  const getRoomsForCurrentStudio = async (): Promise<any[]> => {
    if (!studioId) return [];
    const list = await getRoomsAndCheck();
    return filterListByStudio(list, studioId);
  };

  const getPlansForCurrentStudio = async (): Promise<any[]> => {
    if (!studioId) return [];
    const list = await getPlansAndCheck();
    return filterListByStudio(list, studioId);
  };

  const getPaymentsAmountForCurrentStudio = async (): Promise<any[]> => {
    if (!studioId) return [];
    const list = await getPaymentsAmountAndCheck();
    return filterListByStudio(list, studioId);
  };

  const getSlotsForCurrentStudio = async (): Promise<any[]> => {
    if (!studioId) return [];

    const slotsList = await getSlotsAndCheck();
    const roomsList = await getRoomsForCurrentStudio();

    if (!roomsList.length) return [];

    const roomIds = roomsList.map((room: any) => Number(room.id));

    return slotsList.filter((slot: any) => {
      const slotRoomId = getRoomIdFromItem(slot);
      return roomIds.includes(Number(slotRoomId));
    });
  };

  // ===== Guardias =====
  const safeGetRooms = async () => {
    const studiosList = Array.isArray(studios) ? studios : [];
    if (studiosList.length === 0 || !studioId) return [];
    return await getRoomsForCurrentStudio();
  };

  const safeGetSlots = async () => {
    const studiosList = Array.isArray(studios) ? studios : [];
    if (studiosList.length === 0 || !studioId) return [];
    return await getSlotsForCurrentStudio();
  };

  const safeGetPlans = async () => {
    const studiosList = Array.isArray(studios) ? studios : [];
    if (studiosList.length === 0 || !studioId) return [];
    return await getPlansForCurrentStudio();
  };

  const safeGetPaymentsAmount = async () => {
    const studiosList = Array.isArray(studios) ? studios : [];
    if (studiosList.length === 0 || !studioId) return [];
    return await getPaymentsAmountForCurrentStudio();
  };

  // ===== Orquestador estable =====
  type FlowStep =
    | "idle"
    | "awaiting-studio"
    | "awaiting-rooms"
    | "awaiting-slots"
    | "awaiting-plans"
    | "awaiting-payments-amount"
    | "ready";

  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const ranOnceRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (!studioId) return;
    if (ranOnceRef.current === studioId) return;

    ranOnceRef.current = studioId;

    let alive = true;

    (async () => {
      const studiosList = await getStudiosAndCheck();
      if (!alive) return;

      if (studiosList.length === 0) {
        setFlowStep("awaiting-studio");
        onOpenModalStudios();
        return;
      }

      const roomsList = await getRoomsForCurrentStudio();
      if (!alive) return;

      if (roomsList.length === 0) {
        setFlowStep("awaiting-rooms");
        onOpenModalRooms();
        return;
      }

      const slotsList = await getSlotsForCurrentStudio();
      if (!alive) return;

      if (slotsList.length === 0) {
        setFlowStep("awaiting-slots");
        onOpenModalSlots();
        return;
      }

      const plansList = await getPlansForCurrentStudio();
      if (!alive) return;

      // if (plansList.length === 0) {
      // setFlowStep("awaiting-plans");
      // onOpenModalPlans();
      // return;
      // }

      // const paymentsAmountList = await getPaymentsAmountForCurrentStudio();
      // if (!alive) return;

      // if (paymentsAmountList.length === 0) {
      // setFlowStep("awaiting-payments-amount");
      // onOpenModalPaymentsAmount();
      // return;
      // }

      setFlowStep("ready");
    })();

    return () => {
      alive = false;
    };
  }, [studioId]);

  // ===== Handlers encadenados =====

  // const handleCloseStudiosModal = async () => {
  // onCloseModalStudios();

  // const roomsList = await safeGetRooms();
  // if (roomsList.length === 0) {
  // setFlowStep("awaiting-rooms");
  // onOpenModalRooms();
  // return;
  // }

  // const slotsList = await safeGetSlots();
  // if (slotsList.length === 0) {
  // setFlowStep("awaiting-slots");
  // onOpenModalSlots();
  // return;
  // }

  // const plansList = await safeGetPlans();
  // if (plansList.length === 0) {
  // setFlowStep("awaiting-plans");
  // onOpenModalPlans();
  // return;
  // }

  // const paymentsAmountList = await safeGetPaymentsAmount();
  // if (paymentsAmountList.length === 0) {
  // setFlowStep("awaiting-payments-amount");
  // onOpenModalPaymentsAmount();
  // return;
  // }

  // setFlowStep("ready");
  // };

  // const handleCloseRoomsModal = async () => {
  // onCloseModalRooms();

  // const slotsList = await safeGetSlots();
  // if (slotsList.length === 0) {
  // setFlowStep("awaiting-slots");
  // onOpenModalSlots();
  // return;
  // }

  // const plansList = await safeGetPlans();
  // if (plansList.length === 0) {
  // setFlowStep("awaiting-plans");
  // onOpenModalPlans();
  // return;
  // }

  // const paymentsAmountList = await safeGetPaymentsAmount();
  // if (paymentsAmountList.length === 0) {
  // setFlowStep("awaiting-payments-amount");
  // onOpenModalPaymentsAmount();
  // return;
  // }

  // setFlowStep("ready");
  // };

  // const handleCloseSlotsModal = async () => {
  // onCloseModalSlots();

  // const plansList = await safeGetPlans();
  // if (plansList.length === 0) {
  // setFlowStep("awaiting-plans");
  // onOpenModalPlans();
  // return;
  // }

  // const paymentsAmountList = await safeGetPaymentsAmount();
  // if (paymentsAmountList.length === 0) {
  // setFlowStep("awaiting-payments-amount");
  // onOpenModalPaymentsAmount();
  // return;
  // }

  // setFlowStep("ready");
  // };

  // const handleClosePlansModal = async () => {
  // onCloseModalPlans();

  // const paymentsAmountList = await safeGetPaymentsAmount();
  // if (paymentsAmountList.length === 0) {
  // setFlowStep("awaiting-payments-amount");
  // onOpenModalPaymentsAmount();
  // return;
  // }

  // setFlowStep("ready");
  // };

  // const handleClosePaymentsAmountModal = () => {
  // onCloseModalPaymentsAmount();
  // setFlowStep("ready");
  // };

  const handleLogout = () => {
    setIsLoggingOut(true);

    try {
      useStudioStore.getState().clearStudio();
      if (typeof window !== "undefined") {
        localStorage.removeItem("studio-storage");
      }
    } catch { }

    logout();
    router.replace("/login");
  };

  if (loading) {
    return (
      <FullPageLoader />
    );
  }

  return (
    <>
      <PageContainer>
        <Stack spacing={4} w="100%" align="stretch">

          {/* mensaje "El administrador debe cargar los datos antes de que pueda usar el sistema." */}
          <AlertDialog
            isOpen={isAlertDialogEmpty}
            onClose={onCloseAlertDialogEmpty}
            closeOnEsc={false}
            leastDestructiveRef={cancelRef}
            closeOnOverlayClick={false}
            isCentered
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogBody>
                  El administrador debe cargar los datos antes de que pueda usar el sistema.
                </AlertDialogBody>
                <AlertDialogFooter gap={3}>
                  <Button
                    aria-label="Cerrar"
                    onClick={() => {
                      onCloseAlertDialogEmpty();
                      handleLogout();
                    }}
                    w={"135px"}
                    variant="secondary"
                  >
                    Cerrar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>

          {/* Studios */}
          {/* <Modal
            // isOpen={isAlertOpenStudios}
            // onClose={handleCloseStudiosModal}
            isCentered
            closeOnOverlayClick={false}
            closeOnEsc={false}
          >
            <ModalOverlay />
            <ModalContent
              maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
              maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
              mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}
            >
              <ModalStudioAdd
                // onClose={handleCloseStudiosModal}
                isCancel={true}
                onCreated={(studio: any) => {
                  if (!selectedStudio) setSelectedStudio(studio);
                  dispatch(getStudios());
                  dispatch(getRooms());
                  dispatch(getPaymentAmount());
                }}
              />
            </ModalContent>
          </Modal> */}

          {/* Rooms */}
          {/* <Modal
            isOpen={isAlertOpenRooms}
            onClose={handleCloseRoomsModal}
            isCentered
            closeOnOverlayClick={false}
            closeOnEsc={false}
          >
            <ModalOverlay />
            <ModalContent
              maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
              maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
              mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}
            >
              <ModalRoomsAdd
                onClose={handleCloseRoomsModal}
                isCancel={true}
                onCreated={async () => {
                  await dispatch(getRooms() as any).unwrap();
                }}
              />
            </ModalContent>
          </Modal> */}

          {/* Slots */}
          {/* <Modal
            onClose={handleCloseSlotsModal}
            isOpen={isAlertOpenSlots}
            isCentered
            size={{ base: "300px" }}
            closeOnOverlayClick={false}
            closeOnEsc={false}
          >
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalGenerateSlots onClose={handleCloseSlotsModal} isCancel={true} />
            </ModalContent>
          </Modal> */}

          {/* Plans */}
          {/* <Modal
            onClose={handleClosePlansModal}
            isOpen={isAlertOpenPlans}
            isCentered
            size={{ base: "300px" }}
            closeOnOverlayClick={false}
            closeOnEsc={false}
          >
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalPlansSubTypeAdd onClose={handleClosePlansModal} isCancel={true} closeOnOverlayClick={false} closeOnEsc={false} />
            </ModalContent>
          </Modal> */}

          {/* Payment Amount */}
          {/* <Modal
            onClose={handleClosePaymentsAmountModal}
            isOpen={isAlertOpenPaymentsAmount}
            isCentered
            size={{ base: "300px" }}
            closeOnOverlayClick={false}
            closeOnEsc={false}
          >
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "53%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalPaymentsAmountAdd onClose={handleClosePaymentsAmountModal} isCancel={true} closeOnOverlayClick={false} closeOnEsc={false} />
            </ModalContent>
          </Modal> */}

          {/* Student */}
          <Modal onClose={onCloseModalStudent} isOpen={isAlertOpenStudent} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH="calc(100dvh - 24px)">
              <ModalCloseButton />
              <ModalStudentAdd onClose={onCloseModalStudent} getPeoples={getPeoples} peoples={peoples} />
            </ModalContent>
          </Modal>

          {/* Payment */}
          <Modal onClose={onCloseModalPayment} isOpen={isAlertOpenPayment} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalPaymentAdd onClose={onCloseModalPayment} getPayments={getPayments} updatedAppointments={updatedAppointments} setUpdatedAppointments={setUpdatedAppointments} />
            </ModalContent>
          </Modal>

          {/* Appointments */}
          <Modal onClose={onCloseModalAppointments} isOpen={isAlertOpenAppointments} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalAppointmentsAdd onClose={onCloseModalAppointments} getAppointments={getAppointments} appointments={appointments} />
            </ModalContent>
          </Modal>

          {/* Disponibles */}
          <Modal onClose={onCloseModalAppointmentsAvailable} isOpen={isAlertOpenAppointmentsAvailable} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent
              w={{ base: "calc(100% - 24px)", sm: "90%" }}
              maxW={{ base: "calc(100% - 24px)", md: "70%", lg: "50%", xl: "40%" }}
              maxH={{ base: "calc(100dvh - 24px)", md: "85vh", lg: "80vh" }}
              m={{ base: 3, md: 4 }}
              overflow="hidden"
            >
              <ModalCloseButton />
              <ModalAppointmentsAvailable onClose={onCloseModalAppointmentsAvailable} />
            </ModalContent>
          </Modal>

          {/* Activos */}
          <Modal onClose={onCloseModalActiveMembers} isOpen={isAlertOpenActiveMembers} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent
              maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
              maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
              mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}
            >
              <ModalCloseButton />
              <ModalActiveMembers product={statusClients.active_clients} onClose={onCloseModalActiveMembers} />
            </ModalContent>
          </Modal>

          {/* Deudores */}
          <Modal onClose={onCloseModalDebtor} isOpen={isAlertOpenDebtor} isCentered size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent
              maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
              maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "80vh" }}
              mt={{ base: "25%", md: "15%", lg: "12%", xl: "6%" }}
            >
              <ModalCloseButton />
              <ModalDebtor product={paymentsStatusCurrentMonth.people_who_didnt_pay} onClose={onCloseModalDebtor} />
            </ModalContent>
          </Modal>

          {/* Pagos vencidos */}
          <Modal
            onClose={onCloseModalExpiredPayments}
            isOpen={isAlertOpenExpiredPayments}
            isCentered
            size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}
          >
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent
              w={{ base: "calc(100% - 24px)", sm: "90%" }}
              maxW={{ base: "calc(100% - 24px)", md: "70%", lg: "50%", xl: "40%" }}
              maxH={{ base: "calc(100dvh - 24px)", md: "85vh", lg: "80vh" }}
              m={{ base: 3, md: 4 }}
              overflow="hidden"
            >
              <ModalCloseButton />
              <ModalExpiredPayments onClose={onCloseModalExpiredPayments} />
            </ModalContent>
          </Modal>
          {/* Estadisticas profes */}
          <Flex
            wrap={{ base: "wrap", lg: "nowrap" }}
            gap={2}
            alignItems="center"
            justifyContent={tipo !== "Consultor" ? "flex-end" : "space-between"}
            w="100%"
          >
            {tipo === "Consultor" && (
              <Flex
                direction={{ base: "column", md: "row" }}
                wrap="wrap"
                gap={3}
                w="100%"
                justifyContent="flex-start"
                alignItems="flex-start"
              >
<Box
                  as="button"
                  type="button"
                  onClick={onOpenModalActiveMembers}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="card"
                  boxShadow="card"
                  p={4}
                  width={{ base: "100%", md: "260px", xl: "300px" }}
                  textAlign="left"
                  transition="border-color 120ms ease, background-color 120ms ease"
                  _hover={{ borderColor: "brand.200", bg: "bg.subtle" }}
                  _focusVisible={{ boxShadow: "focusRing", outline: "none" }}
                >
                  <HStack spacing={3} justify="space-between" w="100%">
                    <HStack spacing={3}>
                      <Flex w="36px" h="36px" borderRadius="8px" bg="brand.50" color="brand.600" align="center" justify="center">
                        <Icon path={mdiAccountGroup} size={0.8} />
                      </Flex>
                      <Text fontSize="13px" fontWeight={500} color="text.secondary">
                        Miembros activos
                      </Text>
                    </HStack>
                    <Text fontSize="22px" fontWeight={600} color="text.primary" lineHeight="1">{statusClients.total_active_clients}</Text>
                  </HStack>
                </Box>

                <Box
                  as="button"
                  type="button"
                  onClick={onOpenModalDebtor}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="card"
                  boxShadow="card"
                  p={4}
                  width={{ base: "100%", md: "260px", xl: "300px" }}
                  textAlign="left"
                  transition="border-color 120ms ease, background-color 120ms ease"
                  _hover={{ borderColor: "brand.200", bg: "bg.subtle" }}
                  _focusVisible={{ boxShadow: "focusRing", outline: "none" }}
                >
                  <HStack spacing={3} justify="space-between" w="100%">
                    <HStack spacing={3}>
                      <Flex w="36px" h="36px" borderRadius="8px" bg="brand.50" color="brand.600" align="center" justify="center">
                        <Icon path={mdiCancel} size={0.8} />
                      </Flex>
                      <Text fontSize="13px" fontWeight={500} color="text.secondary">
                        Deudores
                      </Text>
                    </HStack>
                    <Text fontSize="22px" fontWeight={600} color="text.primary" lineHeight="1">{paymentsStatusCurrentMonth.people_who_didnt_pay_count}</Text>
                  </HStack>
                </Box>
              </Flex>
            )}
          </Flex>

          {/* Salas */}
          <Flex
            wrap={{ base: "wrap", lg: "nowrap" }}
            gap={3}
            alignItems={{ base: "stretch", lg: "flex-start" }}
            justifyContent="space-between"
            w="100%"
          >
            <Box
              order={{ base: 2, lg: 1 }}
              w={{ base: "100%", lg: "260px" }}
            >
              {roomsLoading ? (
                <Spinner size="sm" color="brand.500" />
              ) : (
                // <Select
                // // placeholder="Seleccionar Sala"
                // value={selectedRoomId ?? ""}
                // onChange={(e) =>
                // setSelectedRoomId(e.target.value ? Number(e.target.value) : null)
                // }
                // bg="studio.primary"
                // color="text.primary"
                // borderRadius="full"
                // fontWeight="medium"
                // >
                // {rooms.map((r: any) => (
                // <option
                // key={r.id}
                // value={r.id}
                // disabled={r.is_active === false}
                // >
                // {r.name}
                // </option>
                // ))}
                // </Select>
                <Menu matchWidth>
                  <MenuButton
                    as={Button}
                    variant="secondary"
                    rightIcon={<ChevronDownIcon color="text.muted" />}
                    w="100%"
                    textAlign="left"
                    fontWeight={500}
                    title={selectedRoom?.name || "Seleccionar sala"}
                  >
                    <Box
                      overflow="hidden"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      maxW="100%"
                    >
                      {selectedRoom?.name || "Seleccionar sala"}
                    </Box>
                  </MenuButton>

                  <MenuList
                    minW="0"
                    maxH="280px"
                    overflowY="auto"
                    zIndex={20}
                  >
                    {rooms
                      .filter((r: any) => r.is_active !== false)
                      .map((r: any) => (
                      <MenuItem
                        key={r.id}
                        fontWeight={r.id === selectedRoomId ? 600 : 400}
                        color={r.id === selectedRoomId ? "text.brand" : "text.primary"}
                        bg={r.id === selectedRoomId ? "bg.selected" : "transparent"}
                        _hover={{ bg: r.id === selectedRoomId ? "bg.selectedHover" : "bg.hover" }}
                        _focus={{ bg: r.id === selectedRoomId ? "bg.selectedHover" : "bg.hover" }}
                        onClick={() => setSelectedRoomId(r.id)}
                      >
                        {r.name}
                      </MenuItem>
                      ))}
                  </MenuList>
                </Menu>
              )}
            </Box>

            {/* Botones */}
            <SimpleGrid
              order={{ base: 1, lg: 2 }}
              columns={{ base: 2, lg: 3, xl: 5 }}
              spacing={2}
              w="100%"
              maxW={{ base: "100%", lg: "760px", xl: "72%" }}
            >
              <Button w="100%" onClick={onOpenModalExpiredPayments} variant="secondary">
                Pagos vencidos
              </Button>

              <Button w="100%" onClick={onOpenModalAppointmentsAvailable} variant="secondary">
                Turnos Disponibles
              </Button>

              <Button w="100%" leftIcon={<Icon path={mdiPlus} size={0.75} />} onClick={onOpenModalStudent} variant="secondary">
                Registrar Alumno
              </Button>

              <Button w="100%" leftIcon={<Icon path={mdiPlus} size={0.75} />} onClick={onOpenModalPayment} variant="secondary">
                Registrar Pago
              </Button>

              <Button w="100%" gridColumn={{ base: "span 2", lg: "auto" }} leftIcon={<Icon path={mdiPlus} size={0.75} />} onClick={onOpenModalAppointments} variant="primary">
                Registrar Turno
              </Button>
            </SimpleGrid>
          </Flex>

          {/* Grilla de turnos */}
          <Surface p={{ base: 3, md: 5 }} w="full">
            <ShiftTable
              calendar={calendarByRoom}
              updatedAppointments={updatedAppointments}
              selectedRoom={selectedRoom}
            />
          </Surface>
        </Stack>
      </PageContainer>
    </>
  );
}
