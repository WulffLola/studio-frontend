// import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, HStack, IconButton, Modal, ModalCloseButton, ModalContent, ModalOverlay, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useDisclosure, useToast, Wrap, WrapItem } from "@chakra-ui/react";
// import React, { useEffect, useMemo, useState } from "react";
// import { mdiChevronLeft, mdiChevronRight, mdiCalendarMonthOutline, mdiEye, mdiPlusCircleOutline } from '@mdi/js';
// import Icon from "@mdi/react";
// import axios from "axios";
// import ModalWaitingListView from "./ModalWaitingListView";
// import ModalWaitingListAdd from "./ModalWaitingListAdd";
// import ModalAppointmentsEdit from "./ModalAppointmentsEdit";
// import ModalAppointmentsAdd from "./ModalAppointmentsAdd";
// import { useAuthStore } from "../stores/auth";
// import ModalCode from "./ModalCode";
// import { useAppDispatch } from "../stores/hooks";
// import { useSelector } from "react-redux";
// import {
// getAppointments,
// getSlots,
// getWaitingList,
// } from '../stores/studioSlice';
// import { FiPlus } from "react-icons/fi";
// import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

// const mockList = [
// {
// id: 1,
// teacher: { id: 1, name: "Carlos", last_name: "Instructor" },
// slot: {
// id: 1,
// day: "Lunes",
// start_time: "08:00:00",
// end_time: "09:00:00",
// room: 1,
// },
// rol: "Instructor Yoga",
// },
// {
// id: 2,
// teacher: { id: 2, name: "Ana", last_name: "Profe" },
// slot: {
// id: 2,
// day: "Martes",
// start_time: "09:00:00",
// end_time: "10:00:00",
// room: 2,
// },
// rol: "Instructor Pilates",
// },
// {
// id: 3,
// teacher: { id: 3, name: "Roberto", last_name: "Gomez" },
// slot: {
// id: 3,
// day: "Miércoles",
// start_time: "18:00:00",
// end_time: "19:00:00",
// room: 1,
// },
// rol: "Instructor Funcional",
// },
// ];

// const ShiftTable = ({ list, updatedAppointments, appointments }) => {
// const [slots, setSlots] = useState([]);
// const [selectedRow, setSelectedRow] = useState([]);
// const [currentDate, setCurrentDate] = useState(new Date());
// const [selectedItem, setSelectedItem] = useState("")
// // const [appointments, setAppointments] = useState([]);
// const { tipo, tokens } = useAuthStore();
// const [code, setCode] = useState("admin");
// const [loadingTable, setLoadingTable] = useState(false);

// const camillas = ["1", "2", "3", "4", "5", "6", "7"];
// const [payments, setPayments] = useState([]);
// // handleRowDoubleClick(appointment, hour)

// const DEFAULT_VISIBLE_SLOTS = 7;

// const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>({});

// const toggleHour = (hour: string) => {
// setExpandedHours((prev) => ({ ...prev, [hour]: !prev[hour] }));
// };
// /*     const { appointments, waitingList } = useSelector((state: any) => state.studio);
// */

// const dispatch = useAppDispatch();

// /////////////////////////////////////////////////////////////////////////////////////////////

// const MOCK_APPOINTMENTS = [
// {
// id: 1,
// person: {
// id: 1,
// plan: null,
// name: "Ludmila",
// last_name: "Ramos",
// sex: "Femenino",
// dni: "41767379",
// email: "agosramos_12@hotmail.com",
// phone: "2914415075",
// birth_date: "1999-02-18",
// observation: null,
// last_payment: null,
// exp_date: "2026-01-26",
// created_at: "2026-01-26T12:01:55.289196-03:00",
// updated_at: "2026-01-26T12:02:27.714032-03:00",
// deleted: null
// },
// slot: {
// id: 2,
// week_day: { id: 1, day: "Lunes", date: "2026-01-26", deleted: null },
// status: { id: 1, status: "Lugares Libres", deleted: null },
// time_slot: "09:00:00",
// availability: 6,
// duration: "01:00:00",
// deleted: null,
// room: 1
// },
// reserved: null,
// created_at: "2026-01-26T12:02:27.707369-03:00",
// updated_at: "2026-01-26T12:02:27.707412-03:00",
// deleted: null
// },
// {
// id: 2,
// person: {
// id: 1,
// plan: null,
// name: "AGostina",
// last_name: "Ramos",
// sex: "Femenino",
// dni: "41767379",
// email: "agosramos_12@hotmail.com",
// phone: "2914415075",
// birth_date: "1999-02-18",
// observation: null,
// last_payment: null,
// exp_date: "2026-01-26",
// created_at: "2026-01-26T12:01:55.289196-03:00",
// updated_at: "2026-01-26T12:02:27.714032-03:00",
// deleted: null
// },
// slot: {
// id: 2,
// week_day: { id: 1, day: "Lunes", date: "2026-02-02", deleted: null },
// status: { id: 1, status: "Lugares Libres", deleted: null },
// time_slot: "12:00:00",
// availability: 6,
// duration: "01:00:00",
// deleted: null,
// room: 2
// },
// reserved: null,
// created_at: "2026-01-26T12:02:27.707369-03:00",
// updated_at: "2026-01-26T12:02:27.707412-03:00",
// deleted: null
// },
// {
// id: 3,
// person: {
// id: 1,
// plan: null,
// name: "Paloma",
// last_name: "Ramos",
// sex: "Femenino",
// dni: "41767379",
// email: "agosramos_12@hotmail.com",
// phone: "2914415075",
// birth_date: "1999-02-18",
// observation: null,
// last_payment: null,
// exp_date: "2026-01-26",
// created_at: "2026-01-26T12:01:55.289196-03:00",
// updated_at: "2026-01-26T12:02:27.714032-03:00",
// deleted: null
// },
// slot: {
// id: 2,
// week_day: { id: 1, day: "Jueves", date: "2026-01-29", deleted: null },
// status: { id: 1, status: "Lugares Libres", deleted: null },
// time_slot: "14:00:00",
// availability: 6,
// duration: "01:00:00",
// deleted: null,
// room: null
// },
// reserved: null,
// created_at: "2026-01-26T12:02:27.707369-03:00",
// updated_at: "2026-01-26T12:02:27.707412-03:00",
// deleted: null
// }
// ];

// /*     const appointments = MOCK_APPOINTMENTS; // <-- fuerza mock
// */
// /////////////////////////////////////////////////////////////////////////////////////////////

// const cancelRef = React.useRef();
// const toast = useToast();

// const {
// isOpen: isAlertWaitingListViewOpen,
// onOpen: onOpenModalWaitingListView,
// onClose: onCloseModalWaitingListView,
// } = useDisclosure();

// const {
// isOpen: isAlertWaitingListAddOpen,
// onOpen: onOpenModalWaitingListAdd,
// onClose: onCloseModalWaitingListAdd,
// } = useDisclosure();

// const {
// isOpen: isAlertDialogMethodDeleteOpen,
// onOpen: onOpenAlertDialogMethodDelete,
// onClose: onCloseAlertDialogMethodDelete,
// } = useDisclosure();

// const {
// isOpen: isAlertEditOpen,
// onOpen: onOpenModalEdit,
// onClose: onCloseModalEdit,
// } = useDisclosure();

// const {
// isOpen: isOpenAdd,
// onOpen: onOpenModalAdd,
// onClose: onCloseModalAdd,
// } = useDisclosure();

// const {
// isOpen: isAlertDialogDeleteOpen,
// onOpen: onOpenAlertDialogDelete,
// onClose: onCloseAlertDialogDelete,
// } = useDisclosure();

// const {
// isOpen: isAlertCodeOpen,
// onOpen: onOpenModalCode,
// onClose: onCloseModalCode,
// } = useDisclosure();



// const capitalizeFirstLetter = (str: string) =>
// str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

// // const normalizeDay = (s: string) =>

// // .normalize("NFD")
// // .replace(/[\u0300-\u036f]/g, "") // saca tildes
// // .toLowerCase()
// // .trim();

// const weekdayIndexMap: Record<string, number> = {
// lunes: 0,
// martes: 1,
// miercoles: 2,
// jueves: 3,
// viernes: 4,
// sabado: 5,
// domingo: 6,
// };

// const getWeekdayIndexFromDate = (date: Date) => {
// const d = date.getDay(); // 0 dom ... 6 sáb
// return d === 0 ? 6 : d - 1; // 0 lunes ... 6 domingo
// };

// const getDatesForWeekdayInMonth = (monthDate: Date, weekdayName: string) => {
// // const key = normalizeDay(weekdayName);
// const key = (weekdayName);

// const targetIndex = weekdayIndexMap[key];
// if (targetIndex === undefined) return [];

// const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
// const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

// const first = new Date(start);
// const startIndex = getWeekdayIndexFromDate(first);

// const add = (targetIndex - startIndex + 7) % 7;
// first.setDate(first.getDate() + add);

// const dates: Date[] = [];
// for (let d = new Date(first); d <= end; d.setDate(d.getDate() + 7)) {
// dates.push(new Date(d));
// }
// return dates;
// };

// const today = new Date();
// /*     const todayDayName = capitalizeFirstLetter(today.toLocaleDateString('es-ES', { weekday: 'long' }));
// */
// /*     const getNextDateForWeekday = (targetDay) => {
// const weekDaysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // convertir 0(domingo) a 6
// const targetIndex = weekDaysOrder.indexOf(targetDay);

// let daysToAdd = (targetIndex - todayIndex + 7) % 7;
// const resultDate = new Date(today);
// resultDate.setDate(today.getDate() + daysToAdd);
// return resultDate;
// };
// */
// /*  const uniqueSortedDaysWithDates = () => {
// const weekDaysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// const uniqueDaysSet = new Set();
// list.forEach(item => {
// uniqueDaysSet.add(item.week_day.day);
// });
// const uniqueDaysArray = Array.from(uniqueDaysSet);
// const todayIndex = weekDaysOrder.indexOf(todayDayName);

// const sortedDaysArray = uniqueDaysArray.sort((a, b) => {
// const indexA = (weekDaysOrder.indexOf(a) + 7 - todayIndex) % 7;
// const indexB = (weekDaysOrder.indexOf(b) + 7 - todayIndex) % 7;
// return indexA - indexB;
// });

// return sortedDaysArray.map(dayName => ({
// dayName,
// date: getNextDateForWeekday(dayName)
// }));
// }; */

// /*    const daysWithDates = useMemo(() => uniqueSortedDaysWithDates(), [list]);

// const initialDayIndex = useMemo(() => {
// const todayName = capitalizeFirstLetter(new Date().toLocaleDateString('es-ES', { weekday: 'long' }));
// let index = daysWithDates.findIndex(d => d.dayName.toLowerCase() === todayName.toLowerCase());
// if (todayName.toLowerCase() === 'domingo' || index === -1) {
// index = daysWithDates.findIndex(d => d.dayName.toLowerCase() === 'lunes');
// }
// return index >= 0 ? index : 0;
// }, [daysWithDates]);


// const [currentDayIndex, setCurrentDayIndex] = useState(initialDayIndex);
// const [formattedDay, setFormattedDay] = useState(
// daysWithDates.length > 0 ? daysWithDates[initialDayIndex] : null
// ); */

// /*     useEffect(() => {
// setFormattedDay(daysWithDates[currentDayIndex]);
// }, [currentDayIndex, daysWithDates]);

// const changeDay = (direction) => {
// let newIndex = currentDayIndex + direction;
// if (newIndex < 0) newIndex = daysWithDates.length - 1;
// else if (newIndex >= daysWithDates.length) newIndex = 0;
// setCurrentDayIndex(newIndex);
// setFormattedDay(daysWithDates[newIndex]);
// }; */

// // 0=Lunes ... 6=Domingo (como tu weekDaysOrder)
// const weekDaysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];


// const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
// const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

// const [currentMonth, setCurrentMonth] = useState(() => new Date()); // mes visible

// const monthGridDates = useMemo(() => {
// const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
// const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

// const dates: Date[] = [];
// for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
// dates.push(new Date(d));
// }
// return dates;
// }, [currentMonth]);


// const allowedWeekdays = useMemo(() => {
// const set = new Set<string>();
// list.forEach((item: any) => set.add(item.day));
// return Array.from(set);
// }, [mockList]);

// // const allowedWeekdays = [
// // "LUNES",
// // "MARTES",
// // "MIÉRCOLES",
// // "JUEVES",
// // "VIERNES",
// // ];
// const allowedWeekdayIndexes = useMemo(() => {
// const set = new Set<number>();

// allowedWeekdays.forEach((name) => {
// // const idx = weekdayIndexMap[normalizeDay(name)];
// const idx = weekdayIndexMap[(name)];

// if (idx !== undefined) set.add(idx);
// });

// return set;
// }, [allowedWeekdays]);

// const isEnabledDate = (d: Date) => allowedWeekdayIndexes.has(getWeekdayIndexFromDate(d));

// const findEnabledDate = (from: Date, direction: 1 | -1) => {
// // evita loops infinitos: buscamos hasta 400 días (más que suficiente)
// const d = new Date(from);

// for (let i = 0; i < 400; i++) {
// if (isEnabledDate(d)) return new Date(d);
// d.setDate(d.getDate() + direction);
// }

// return null;
// };



// const [selectedDate, setSelectedDate] = useState<Date | null>(null);

// useEffect(() => {
// const today = new Date();

// const isSameMonth =
// today.getFullYear() === currentMonth.getFullYear() &&
// today.getMonth() === currentMonth.getMonth();

// if (isSameMonth) {
// // hoy si es válido, sino el próximo válido
// const start = new Date(today);
// const next = findEnabledDate(start, 1);
// setSelectedDate(next);
// } else {
// // al navegar a otro mes: primer día válido del mes
// const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
// const next = findEnabledDate(firstDay, 1);
// setSelectedDate(next);
// }
// }, [currentMonth, allowedWeekdayIndexes]);



// const changeSelectedDay = (direction: number) => {
// if (!selectedDate) return;

// const step = direction > 0 ? 1 : -1;

// const base = new Date(selectedDate);
// base.setDate(base.getDate() + step); // empezamos a buscar desde el día siguiente/anterior

// const next = findEnabledDate(base, step);
// if (!next) return;

// setSelectedDate(next);

// // si cambió de mes, sincronizá currentMonth
// if (
// next.getFullYear() !== currentMonth.getFullYear() ||
// next.getMonth() !== currentMonth.getMonth()
// ) {
// setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
// }
// };


// const formatLongDate = (date: Date) => {
// const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
// const day = date.getDate();
// const month = date.toLocaleDateString("es-ES", { month: "long" });
// const year = date.getFullYear();
// return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} de ${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
// };

// const formatFullDate = (date: Date) =>
// date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });


// const selectedDayName = selectedDate
// ? capitalizeFirstLetter(selectedDate.toLocaleDateString("es-ES", { weekday: "long" }))
// : null;

// const filteredTimeSlots = selectedDayName
// ? list
// .filter((item: any) => normalizeDay(item.day) === normalizeDay(selectedDayName))
// .map((item: any) => item.start_time)
// //item.time_slot.slice(0, 5)
// : [];

// const timeSlots = Array.from(new Set(filteredTimeSlots)).sort();

// const filterAppointmentsByDay = (appointments: any[], dayName: string) => {
// return appointments.filter(
// (appointment: any) =>
// normalizeDay(appointment.slot.day) === normalizeDay(dayName)
// );
// };

// useEffect(() => {
// getSlots();
// getWaitingList();
// setLoadingTable(true)

// const timer = setTimeout(() => {
// setLoadingTable(false); // Desactiva loading después de 2 segundos
// }, 800); // Ajusta el tiempo en milisegundos

// return () => clearTimeout(timer);
// }, []);



// const handleClickWaitingListView = (item) => {
// onOpenModalWaitingListView();
// const hour = item + ":00"; // Declarar 'hour' correctamente
// setSelectedItem(hour);
// };

// const handleClickWaitingListAdd = (item) => {
// const matchingSlot = list.find(
// (slot) => slot.day === formattedDay.dayName && slot.time_slot.slice(0, 5) === item
// );
// const slotId = matchingSlot ? matchingSlot.id : null;

// // Pasa el slotId al modal de agregar
// setSelectedItem({ item, formattedDay, slotId });


// onOpenModalWaitingListAdd();
// // const hour = item + ":00"; // Declarar 'hour' correctamente
// // setSelectedItem(item);
// };

// const handleRowDoubleClick = (item, hour) => {
// if (item) {
// setSelectedItem(item);
// onOpenAlertDialogMethodDelete()
// // onOpenModalEdit();
// } else {
// const matchingSlot = list.find(
// (slot) => slot.day.toLowerCase() === formattedDay.dayName.toLowerCase() && slot.time_slot.slice(0, 5) === hour
// );
// const slotId = matchingSlot ? matchingSlot.id : null;

// // Pasa el slotId al modal de agregar
// setSelectedItem({ hour, formattedDay, slotId });
// console.log("slotid", slotId)

// onOpenModalAdd();
// }
// };


// const handleDelete = async (code) => {
// try {
// const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMETS}${selectedItem.id}/`,
// {
// headers: {
// 'Authorization': `Bearer ${tokens?.access}`, // Añade el token de autenticación
// 'Content-Type': 'application/json',
// },
// data: {
// code: code  // Aquí agregas el campo 'codigo' con su valor
// }
// });
// toast({
// title: "Turno eliminado correctamente.",
// description: "El turno fue eliminado con éxito.",
// status: "success",
// duration: 3000,
// isClosable: true,
// position: "bottom-right",
// });
// onCloseAlertDialogDelete();
// getAppointments();
// } catch (error) {
// console.error(error);
// toast({
// title: "Error",
// description: "Ocurrió un error al eliminar el turno.",
// status: "error",
// duration: 5000,
// isClosable: true,
// position: "bottom-right",
// });
// }
// };

// const getBackgroundColor = (appointment, updatedAppointments) => {
// if (!appointment) return "transparent";

// if (appointment.reserved === true || appointment.reserved === "true")
// return "#b0b0b0"; // GRIS - Reservado

// const isUpdated = updatedAppointments.includes(appointment.person.id);
// const expDate = new Date(appointment.person.exp_date);
// const now = new Date();
// const threeDaysBeforeExp = new Date(expDate);
// threeDaysBeforeExp.setDate(expDate.getDate() - 3);

// if (isUpdated) return "#7dd586"; // VERDE - Válido
// if (!appointment.person.exp_date) return "#cd705f"; // ROJO - Expirado
// if (now >= threeDaysBeforeExp && now <= expDate) return "#fddf60"; // AMARILLO CLARO - Próximo a vencer
// if (appointment.person.plan === null) return "#60a3f8"; // AZUL - Sin plan
// if (expDate < now) return "#cd705f"; // ROJO - Expirado

// return "#7dd586"; // VERDE - Válido
// };

// console.log(selectedItem)


// const DEV_FORCE_CUPOS = true;

// // poné los que quieras para testear
// const DEV_CUPOS_BY_HOUR: Record<string, number> = {
// "08:00": 30,
// "09:00": 16,
// "10:00": 8,
// "11:00": 20,
// };

// const getCuposForHour = (hour: string, slotForHour: any) => {
// if (DEV_FORCE_CUPOS) return DEV_CUPOS_BY_HOUR[hour] ?? 12; // default 12 para que SIEMPRE haya flecha
// return Number(slotForHour?.availability ?? 0);
// };



// ////////////////////////////////////////////////



// const ymd = (d: Date) => {
// const y = d.getFullYear();
// const m = String(d.getMonth() + 1).padStart(2, "0");
// const day = String(d.getDate()).padStart(2, "0");
// return `${y}-${m}-${day}`;
// };

// const weekdayNameFromDate = (d: Date) =>
// d.toLocaleDateString("es-ES", { weekday: "long" });


// type Appointment = any; // si querés después lo tipamos

// const appointmentsByDate = useMemo(() => {
// const out: Record<string, Appointment[]> = {};

// // inicializo todas las fechas del mes como []
// monthGridDates.forEach((d) => {
// out[ymd(d)] = [];
// });

// // meto cada appointment en su fecha exacta
// appointments.forEach((app: Appointment) => {
// const dateKey = app?.slot?.date; // "2026-01-26"
// if (!dateKey) return;

// // si la fecha no está en el mes visible, igual la creo por si la usás después
// if (!out[dateKey]) out[dateKey] = [];

// out[dateKey].push({
// ...app,
// mock_date: dateKey, // opcional
// });
// });

// return out;
// }, [appointments, monthGridDates]);


// const selectedKey = selectedDate ? ymd(selectedDate) : null;

// const filtered = useMemo(() => {
// if (!selectedKey) return [];
// return appointmentsByDate[selectedKey] ?? [];
// }, [appointmentsByDate, selectedKey]);


// ////////////////////////////////////////////////

// const getSlotForHour = (hour: string) => {
// if (!selectedKey) return null;

// return (
// list.find((s: any) => {
// const sameDate = s?.date === selectedKey;
// const sameHour = s?.time_slot?.slice(0, 5) === hour;
// return sameDate && sameHour;
// }) ?? null
// );
// };

// // const getActivityName = (slotForHour: any) => {
// // return (
// // slotForHour?.activity_name ||
// // slotForHour?.activity?.name ||
// // slotForHour?.class_type ||
// // slotForHour?.type ||
// // "Pilates"
// // );
// // };

// const DEFAULT_ACTIVITIES = ["Pilates", "Mambo", "Bachata", "Aero Yoga"];

// const getActivityName = (slotForHour: any) => {
// return (
// slotForHour?.activity_name ||
// slotForHour?.activity?.name ||
// slotForHour?.class_type ||
// slotForHour?.type ||
// DEFAULT_ACTIVITIES[Math.floor(Math.random() * DEFAULT_ACTIVITIES.length)]
// );
// };


// const stringToColor = (str: string) => {
// let hash = 0;

// for (let i = 0; i < str.length; i++) {
// hash = str.charCodeAt(i) + ((hash << 5) - hash);
// }

// const hue = hash % 360;

// // pastel suave
// return `hsl(${hue}, 60%, 92%)`;
// };

// const getActivityBarBg = (name: string) => {
// if (!name) return "#F3F5F7";
// return stringToColor(name);
// };


// return (
// <>
// <AlertDialog
// isOpen={isAlertDialogMethodDeleteOpen}
// onClose={onCloseAlertDialogMethodDelete}
// leastDestructiveRef={cancelRef}
// >
// <AlertDialogOverlay>
// <AlertDialogContent m={100}>
// <AlertDialogCloseButton />
// <AlertDialogBody textAlign={"center"} mt={55}>
// {selectedItem ? (
// <>
// ¿Desea editar o eliminar el turno?
// </>
// ) : (
// <>No se ha seleccionado ninguna shownAppointmentssolicitud.</>
// )}

// </AlertDialogBody>
// <AlertDialogFooter mt={5} display={"flex"} justifyContent={"center"} gap={"20px"}>
// <Button
// onClick={() => { onOpenModalEdit(); onCloseAlertDialogMethodDelete() }}
// w={"135px"}
// h={"40px"}
// bg={"#FFFFFF"}
// color="text.disabled"
//
// border={"1px solid #9FA5D8"}
// fontWeight={800}
// >
// Editar
// </Button>
// <Button
// onClick={() => { onOpenAlertDialogDelete(); onCloseAlertDialogMethodDelete() }}
// bg={"gray.400"}
// color={"white"}
// w={"135px"}
//
// >
// Eliminar
// </Button>
// </AlertDialogFooter>
// </AlertDialogContent>
// </AlertDialogOverlay>
// </AlertDialog>

// <AlertDialog
// isOpen={isAlertDialogDeleteOpen}
// onClose={onCloseAlertDialogDelete}
// leastDestructiveRef={cancelRef}
// >
// <AlertDialogOverlay>
// <AlertDialogContent m={100}>
// <AlertDialogCloseButton />
// <AlertDialogBody textAlign={"center"} mt={55}>
// {/* {selectedItem && selectedItem.person ? (
// <>¿Desea eliminar el turno del alumno <span style={{ fontWeight: 600 }}>{selectedItem?.person.name} {selectedItem?.person.last_name}
// </span> con dni <span style={{ fontWeight: 600 }}>{selectedItem?.person.dni}</span> del dia  <span style={{ fontWeight: 600 }}>{selectedItem?.slot.week_day.day}</span> a las <span style={{ fontWeight: 600 }}>{selectedItem?.slot.time_slot.slice(0, 5)}</span> ?</>
// ) : (
// <>No se ha seleccionado ninguna solicitud.</>
// )} */}
// </AlertDialogBody>
// <AlertDialogFooter mt={5} display={"flex"} justifyContent={"center"} gap={"20px"}>
// <Button
// onClick={onCloseAlertDialogDelete}
// bg="bg.surface"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// border="1px solid black"
// borderRadius={4}
// fontWeight="medium"
// boxShadow="none"
// _hover={{ bg: "bg.hover" }}
// >
// Cancelar
// </Button>
// <Button
// onClick={() => tipo === "Consultor" ? onOpenModalCode() : handleDelete(code)}
// bg="studio.primary"
// color="text.primary"
// w={["100%", "135px"]}
// h="40px"
// borderRadius={4}
// fontWeight="medium"
//
// _hover={{ bg: "studio.primaryHover" }}
// >
// Aceptar
// </Button>
// </AlertDialogFooter>
// </AlertDialogContent>
// </AlertDialogOverlay>
// </AlertDialog>

// {/*        <Modal
// onClose={onCloseModalWaitingListView}
// isOpen={isAlertWaitingListViewOpen}
// size={{ base: "90%", md: "60%", lg: "60%", xl: "50%" }}
// >
// <ModalOverlay w={"100%"} h={"100%"} />
// <ModalContent
// maxW={{ base: "90%", md: "50%", lg: "35%", xl: "30%" }}
// maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
// mt={{ base: "25%", md: "15%", lg: "12%", xl: "8%" }}  // Ajuste de margen superior
// >
// <ModalCloseButton />
// <ModalWaitingListView
// onClose={onCloseModalWaitingListView}
// getAppointments={getAppointments}
// hour={selectedItem}
// day={formattedDay}
// appointments={appointments}
// slots={slots}
// getSlots={getSlots}
// />
// </ModalContent>
// </Modal> */}

// {/* <Modal onClose={onCloseModalAdd}
// isOpen={isOpenAdd}
// isCentered
// size={{ base: "300px" }}  >
// <ModalOverlay w={"100%"} h={"100%"} />
// <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
// <ModalCloseButton />
// <ModalAppointmentsAdd
// onClose={onCloseModalAdd}
// getAppointments={getAppointments}
// hour={selectedItem.hour}
// day={selectedItem.formattedDay}
// product={selectedItem.slotId}  // Nuevo parámetro para el id del slot

// />
// </ModalContent>
// </Modal>

// <Modal
// onClose={onCloseModalEdit}
// isOpen={isAlertEditOpen}
// isCentered
// size={{ base: "90%", md: "70%", lg: "80%" }}
// >
// <ModalOverlay w={"100%"} h={"100%"} />
// <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
// <ModalCloseButton />
// <ModalAppointmentsEdit
// onClose={onCloseModalEdit}
// product={selectedItem}
// getAppointments={getAppointments}
// />
// </ModalContent>
// </Modal>

// <Modal
// onClose={onCloseModalWaitingListAdd}
// isOpen={isAlertWaitingListAddOpen}
// isCentered
// size={{ base: "90%", md: "70%", lg: "80%" }}
// >
// <ModalOverlay w={"100%"} h={"100%"} />
// <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
// <ModalCloseButton />
// <ModalWaitingListAdd
// onClose={onCloseModalWaitingListAdd}
// getWaitingList={getWaitingList}
// hour={selectedItem.item}
// day={selectedItem.formattedDay}
// product={selectedItem.slotId}
// />
// </ModalContent>
// </Modal>

// <Modal
// onClose={onCloseModalCode}
// isOpen={isAlertCodeOpen}
// isCentered
// size={{ base: "90%", md: "70%", lg: "80%" }}
// >
// <ModalOverlay w={"100%"} h={"100%"} />
// <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }} mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}>
// <ModalCloseButton />
// <ModalCode
// onClose={onCloseModalCode}
// get={getAppointments}
// onCloseAlert={onCloseAlertDialogDelete}
// entityType={"appointmentsDelete"}
// action={handleDelete}
// />
// </ModalContent>
// </Modal> */}

// <Stack direction={{ base: "column", md: "row", lg: "row", xl: "row" }} w={{ base: "100%", lg: "100%", xl: "100%" }}>
// <Box
// position="relative"
// display="flex"
// alignItems="center"
// justifyContent="center"
// mb={4}
// width={{ base: "100%", xl: "35%" }}
// minHeight="40px"
// px={{ base: 10, md: 16 }}
// >
// <IconButton
// icon={<Icon path={mdiChevronLeft} size={1.2} />}
// onClick={() => changeSelectedDay(-1)}
// aria-label="Mes anterior"
// variant="ghost"
// position="absolute"
// left={{ base: "8px", md: "16px" }}
// top="50%"
// transform="translateY(-50%)"
// w="32px"
// h="32px"
// />

// <Box display="flex" alignItems="center" gap={2} whiteSpace="nowrap" overflow="hidden">
// <Box display={{ base: "none", sm: "block" }}>
// <Box color="brand.500" display="flex"><Icon path={mdiCalendarMonthOutline} size={0.9} /></Box>
// </Box>
// <Text fontSize={{ base: "sm", sm: "md", md: "lg" }} fontWeight={500} color="#2b2b2b" textAlign="center" noOfLines={1}>
// {selectedDate ? formatLongDate(selectedDate) : "Sin días disponibles"}
// </Text>
// </Box>

// <IconButton
// icon={<Icon path={mdiChevronRight} size={1.2} />}
// onClick={() => changeSelectedDay(1)}
// aria-label="Mes siguiente"
// variant="ghost"
// position="absolute"
// right={{ base: "8px", md: "16px" }}
// top="50%"
// transform="translateY(-50%)"
// w="32px"
// h="32px"
// />
// </Box>

// <Box
// mt={{ base: 0, md: 2, lg: 3, xl: 3 }}
// mb={5}
// p={{ base: 0, md: 2, xl: 4 }}
// pr={8}
// ml={{ base: "auto", md: 10, lg: "350px", xl: "auto" }}
// >
// <Wrap spacing={4}>
// <WrapItem>
// <HStack>
// <Box w={4} h={4} bg="#cd705f" borderRadius="sm" />
// <Text fontSize="sm">Pago expirado</Text>
// </HStack>
// </WrapItem>
// <WrapItem>
// <HStack>
// <Box w={4} h={4} bg="#60a3f8" borderRadius="sm" />
// <Text fontSize="sm">Sin pago</Text>
// </HStack>
// </WrapItem>
// <WrapItem>
// <HStack>
// <Box w={4} h={4} bg="#fddf60" borderRadius="sm" />
// <Text fontSize="sm">Pago próximo a vencer</Text>
// </HStack>
// </WrapItem>
// <WrapItem>
// <HStack>
// <Box w={4} h={4} bg="#7dd586" borderRadius="sm" />
// <Text fontSize="sm">Pago vigente</Text>
// </HStack>
// </WrapItem>
// <WrapItem>
// <HStack>
// <Box w="10px" h="10px" bg={paymentStatusColors.waiting.accent} borderRadius="full" />
// <Text fontSize="sm">En espera</Text>
// </HStack>
// </WrapItem>
// </Wrap>
// </Box>
// </Stack>

// <TableContainer
// /*                 border="1px solid #D9E0EA"
// /*                 bg="#ffffffe0"
// */                bg="bg.canvas"
// /*                 boxShadow="0px 10px 30px rgba(0,0,0,0.06)"
// */                p={4}
//
// border={"1px solid #d1d6db"}
// borderRadius={"4px"}
// >
// <Table
// variant="unstyled"
// size="md"
// sx={{
// borderCollapse: "separate",
// borderSpacing: "0 14px", // 🔥 espacio entre filas tipo cards
// }}
// >
// <Tbody>
// {loadingTable ? (
// <Tr>
// <Td colSpan={20} textAlign="center" py="80px">
// Cargando...
// </Td>
// </Tr>
// ) : timeSlots.length === 0 ? (
// <Tr>
// <Td colSpan={20} textAlign="center">
// No se encontraron datos
// </Td>
// </Tr>
// ) : (
// timeSlots.map((hour: string, rowIndex: number) => {
// const slotForHour = getSlotForHour(hour);
// const activityName = getActivityName(slotForHour);

// const appsForHour = filtered.filter(
// (app: any) => app?.slot?.time_slot?.slice(0, 5) === hour
// );

// /*    const isLibre =
// !slotForHour ||
// !activityName ||
// activityName.toLowerCase() === "libre";
// */
// const cupos = getCuposForHour(hour, slotForHour);
// // SIEMPRE 8 visibles (aunque cupos sea menor)
// const isExpanded = !!expandedHours[hour];
// const visibleCupos = isExpanded ? cupos : DEFAULT_VISIBLE_SLOTS;
// const hasMore = cupos > DEFAULT_VISIBLE_SLOTS;

// return (
// <Tr key={rowIndex}>
// {/* HORA */}
// <Td
// w="90px"
// fontWeight="500"
// /*                                             color="#3A3F45"
// */                              color="#000000"
// fontSize="15px"
// verticalAlign="top"
// pt="60px"
// >
// {hour}
// </Td>

// {/* CARD */}
// <Td p={0}>
// <Box
// bg="#ffffff"
// border="1px solid #D9E0EA"
// borderRadius="16px"
// boxShadow="0px 10px 30px rgba(0,0,0,0.06)"
// >
// {/* HEADER ACTIVIDAD */}
// <Box
// h="48px"
// display="flex"
// alignItems="center"
// justifyContent="space-between"
// px={6}
// borderTopLeftRadius="16px"
// borderTopRightRadius="16px"
// bg={getActivityBarBg(activityName)}
// >
// <Text
// fontWeight="800"
// letterSpacing="0.04em"
// fontSize="14px"
// >
// {activityName.toUpperCase()}
// </Text>

// {hasMore && (
// <Button
// size="sm"
// variant="ghost"
// onClick={() => toggleHour(hour)}
// rightIcon={
// isExpanded ? (
// <ChevronUpIcon />
// ) : (
// <ChevronDownIcon />
// )
// }
// fontWeight="500"
// >
// {isExpanded
// ? "Ver menos"
// : `Ver ${cupos - DEFAULT_VISIBLE_SLOTS} cupos más`}
// </Button>
// )}
// </Box>

// {/* CUPOS */}
// <Box px={5} py={4}>
// <Box
// display="grid"
// gridTemplateColumns={{
// base: "repeat(2, 1fr)",
// sm: "repeat(3, 1fr)",
// md: "repeat(5, 1fr)",
// lg: "repeat(7, 1fr)",
// }}
// gap={3}
// >
// {Array.from({ length: visibleCupos }).map((_, i) => {
// // si i >= cupos, es "slot fantasma" para completar hasta 8
// const isSlotReal = i < cupos;
// const appointment = isSlotReal ? (appsForHour[i] ?? null) : null;

// return (
// <Box
// key={i}
// h="44px"
// display="flex"
// alignItems="center"
// justifyContent="center"
// fontSize="13px"
// fontWeight="600"
// border="2px solid #D9E0EA"
// borderRadius="8px"
// bg={
// appointment
// ? getBackgroundColor(appointment, updatedAppointments)
// : "#ffffff"
// }
// color="#2B2B2B"
// boxShadow={isSlotReal ? "0px 4px 8px rgba(0,0,0,0.08)" : "none"}
// opacity={isSlotReal ? 1 : 0.35}
// transition="all 0.2s ease"
// _hover={
// isSlotReal
// ? {
// transform: "translateY(-2px)",
// boxShadow: "0px 6px 14px rgba(0,0,0,0.12)",
// cursor: "pointer",
// }
// : {}
// }
// onDoubleClick={() => {
// if (!isSlotReal) return;
// handleRowDoubleClick(appointment, hour);
// }}
// >
// {appointment ? appointment.person.name : ""}
// </Box>
// );
// })}
// </Box>

// {/*  FLECHA PARA DESPLEGAR */}
// {/* {hasMore && (
// <Box
// display="flex"
// justifyContent="center"
// mt={3}
// >
// <Button
// size="sm"
// variant="ghost"
// onClick={() => toggleHour(hour)}
// rightIcon={
// isExpanded ? (
// <ChevronUpIcon />
// ) : (
// <ChevronDownIcon />
// )
// }
// fontWeight="700"
// >
// {isExpanded
// ? "Ver menos"
// : `Ver ${cupos - DEFAULT_VISIBLE_SLOTS} más`}
// </Button>
// </Box>
// )} */}
// </Box>
// </Box>
// </Td>

// {/* BOTONES (al final de cada fila) */}
// <Td
// padding={0}
// width="72px"
// verticalAlign="middle"   // 🔥 centra respecto a la fila
// >
// <Box
// display="flex"
// flexDirection="column"   // uno arriba del otro (más prolijo)
// alignItems="center"
// justifyContent="center"
// gap="10px"
// height="100%"
// >
// <Tooltip hasArrow label="Ver lista de espera" bg="bg.inverted" borderRadius={4}>
// <Button
// size="sm"
// w="40px"
// h="40px"
// display="flex"
// justifyContent="center"
// alignItems="center"
// borderRadius="8px"
// bg="transparent"
// _hover={{ bg: "bg.muted" }}
// onClick={() => handleClickWaitingListView(hour)}
// >
// <Icon path={mdiEye} size={1} />
// </Button>
// </Tooltip>

// <Tooltip
// hasArrow
// label="Agregar a lista de espera"
// bg="bg.inverted"
// borderRadius={4}
// >
// <Button
// size="sm"
// w="40px"
// h="40px"
// display="flex"
// justifyContent="center"
// alignItems="center"
// borderRadius="8px"
// bg="transparent"
// _hover={{ bg: "bg.muted" }}
// onClick={() => handleClickWaitingListAdd(hour)}
// >
// <Icon path={mdiPlusCircleOutline} size={1} />
// </Button>
// </Tooltip>
// </Box>
// </Td>

// </Tr>
// );
// })
// )}
// </Tbody>
// </Table>
// </TableContainer>
// </>
// );
// };

// export default ShiftTable;


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
    IconButton,
    Stack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Tooltip,
    Tr,
    useDisclosure,
    useToast,
    Wrap,
    WrapItem,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import {
    mdiChevronLeft,
    mdiChevronRight,
    mdiCalendarMonthOutline,
    mdiEye,
    mdiPlusCircleOutline,
    mdiPencilOutline,
    mdiDeleteOutline,
    mdiDotsVertical,
} from "@mdi/js";
import Icon from "@mdi/react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import ModalAppointmentsAdd from "./ModalAppointmentsAdd";
import ModalAppointmentsEdit from "./ModalAppointmentsEdit";
import ModalWaitingListAdd from "./ModalWaitingListAdd";
import ModalWaitingListView from "./ModalWaitingListView";
import {
    getAppointments,
    getSlots,
    getWaitingList,
    getCalendar,
} from "../stores/studioSlice";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { brandActivityColors, brandActivityPalette, paymentStatusColors } from "../../theme/brand";
import { TableState } from "./ui/StateMessage";


const DEFAULT_VISIBLE_SLOTS = 7;
const DEV_FORCE_CUPOS = false;

const PAYMENT_STATUS_COLORS = {
    expired: paymentStatusColors.expired.bg,
    unpaid: paymentStatusColors.unpaid.bg,
    expiringSoon: paymentStatusColors.expiringSoon.bg,
    current: paymentStatusColors.current.bg,
} as const;

// Indicador lateral de cada celda según el tinte de estado de pago.
const PAYMENT_STATUS_ACCENT: Record<string, string> = Object.fromEntries(
    Object.values(paymentStatusColors).map(({ bg, accent }) => [bg, accent])
);

const DEMO_EXPIRING_APPOINTMENT = {
    date: "2026-08-20",
};

const dateTomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const normalizeDay = (s: string) =>
    (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

// const weekdayIndexMap: Record<string, number> = {
// lunes: 0,
// martes: 1,
// miercoles: 2,
// jueves: 3,
// viernes: 4,
// sabado: 5,
// domingo: 6,
// };

type ShiftTableProps = {
    calendar?: any[];
    updatedAppointments?: any[];
    selectedRoom?: any;
};

const ShiftTable: React.FC<ShiftTableProps> = ({
    calendar,
    updatedAppointments = [],
    selectedRoom,
}) => {
    const [selectedItem, setSelectedItem] = useState<any>("");
    const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>(
        {}
    );
    const { tipo, tokens } = useAuthStore();
    const [code] = useState("admin");
    const dispatch = useAppDispatch();
    const toast = useToast();
    const cancelRef = React.useRef<any>(null);
    const peoples = useSelector((state: any) => state.studio.peoples);

    // Fallback temporal: /calendar todavía no incluye vencimiento ni plan.
    // Se cruza por person_id con /people hasta que el backend entregue esos datos.
    const peopleById = useMemo(() => {
        const map = new Map<string, any>();
        if (Array.isArray(peoples)) {
            peoples.forEach((person: any) => {
                if (person?.id != null) map.set(String(person.id), person);
            });
        }
        return map;
    }, [peoples]);


    const flattenedCalendarSlots = useMemo(() => {
        if (!calendar?.length) return [];

        return calendar.flatMap((dayItem: any) =>
            (dayItem.slots || []).map((slot: any) => ({
                id: slot.id,
                day: slot.week_day_name,
                date: dayItem.date,
                time_slot: slot.start_time?.slice(0, 5),
                end_time: slot.end_time?.slice(0, 5),
                availability: Number(slot.availability ?? 0),
                capacity: Number(slot.capacity ?? 0),
                room_name: slot.room_name,
                studio_name: slot.studio_name,
                activity_name: slot.activity,
                status_name: slot.status_name,
                appointments: slot.appointments || [],
            }))
        );
    }, [calendar]);

    const flattenedAppointments = useMemo(() => {
        if (!calendar?.length) return [];

        let demoApplied = false;

        return calendar.flatMap((dayItem: any) =>
            (dayItem.slots || []).flatMap((slot: any) =>
                (slot.appointments || []).map((appointment: any) => {
                    const fullName = appointment.person_name || "";
                    const [name, ...rest] = fullName.split(" ");
                    const personFromPeople = peopleById.get(String(appointment.person_id));
                    const isDemoAppointment =
                        !demoApplied &&
                        appointment.reserved !== true &&
                        appointment.reserved !== "true" &&
                        String(dayItem.date).slice(0, 10) === DEMO_EXPIRING_APPOINTMENT.date;

                    if (isDemoAppointment) demoApplied = true;

                    return {
                        id: appointment.id,
                        reserved: appointment.reserved,
                        person: {
                            id: appointment.person_id,
                            name: name || "",
                            last_name: rest.join(" ") || "",
                            phone: appointment.person_phone || "",
                            exp_date: isDemoAppointment
                                ? dateTomorrow()
                                : appointment.person_exp_date ?? personFromPeople?.exp_date ?? null,
                            plan: appointment.person_plan ?? personFromPeople?.plan ?? null,
                            photo: appointment.person_photo || null,
                        },
                        slot: {
                            id: slot.id,
                            day: slot.week_day_name,
                            date: dayItem.date,
                            time_slot: slot.start_time?.slice(0, 5),
                            availability: Number(slot.availability ?? 0),
                            capacity: Number(slot.capacity ?? 0),
                            room_name: slot.room_name,
                        },
                    };
                })
            )
        );
    }, [calendar, peopleById]);

    const effectiveList = flattenedCalendarSlots.length
        ? flattenedCalendarSlots
        : [];

    const effectiveAppointments = flattenedAppointments.length
        ? flattenedAppointments
        : [];

    const slots = useSelector((state: any) => state.studio.slots);


    const availableDateKeys = useMemo(() => {
        const set = new Set<string>();

        effectiveList.forEach((item: any) => {
            if (item?.date) {
                set.add(item.date);
            }
        });

        return set;
    }, [effectiveList]);


    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const [selectedDate, setSelectedDate] = useState<Date | null>(today);
    const toggleHour = (hour: string) => {
        setExpandedHours((prev) => ({ ...prev, [hour]: !prev[hour] }));
    };


    const {
        isOpen: isAlertDialogMethodDeleteOpen,
        onOpen: onOpenAlertDialogMethodDelete,
        onClose: onCloseAlertDialogMethodDelete,
    } = useDisclosure();

    const {
        isOpen: isAlertDialogDeleteOpen,
        onOpen: onOpenAlertDialogDelete,
        onClose: onCloseAlertDialogDelete,
    } = useDisclosure();

    const {
        isOpen: isModalAppointmentsAddOpen,
        onOpen: onOpenModalAppointmentsAdd,
        onClose: onCloseModalAppointmentsAdd,
    } = useDisclosure();

    const {
        isOpen: isModalAppointmentsEditOpen,
        onOpen: onOpenModalAppointmentsEdit,
        onClose: onCloseModalAppointmentsEdit,
    } = useDisclosure();

    const {
        isOpen: isModalWaitingListViewOpen,
        onOpen: onOpenModalWaitingListView,
        onClose: onCloseModalWaitingListView,
    } = useDisclosure();

    const {
        isOpen: isModalWaitingListAddOpen,
        onOpen: onOpenModalWaitingListAdd,
        onClose: onCloseModalWaitingListAdd,
    } = useDisclosure();

    const capitalizeFirstLetter = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

    // const getWeekdayIndexFromDate = (date: Date) => {
    // const d = date.getDay();
    // return d === 0 ? 6 : d - 1;
    // };

    const monthGridDates = useMemo(() => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const dates: Date[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    }, [currentMonth]);

    // const allowedWeekdays = useMemo(() => {
    // const set = new Set<string>();
    // effectiveList.forEach((item: any) => {
    // if (item?.day) set.add(item.day);
    // });
    // return Array.from(set);
    // }, [effectiveList]);

    // const allowedWeekdayIndexes = useMemo(() => {
    // const set = new Set<number>();

    // allowedWeekdays.forEach((name) => {
    // const idx = weekdayIndexMap[normalizeDay(name)];
    // if (idx !== undefined) set.add(idx);
    // });

    // return set;
    // }, [allowedWeekdays]);

    const isEnabledDate = (d: Date) => availableDateKeys.has(ymd(d));

    const findEnabledDate = (from: Date, direction: 1 | -1) => {
        const d = new Date(from);

        for (let i = 0; i < 400; i++) {
            if (isEnabledDate(d)) return new Date(d);
            d.setDate(d.getDate() + direction);
        }

        return null;
    };

    useEffect(() => {
        if (!effectiveList.length) {
            setSelectedDate(null);
            return;
        }

        const todayKey = ymd(new Date());
        const allDates = [...new Set(effectiveList.map((item: any) => item?.date).filter(Boolean))]
            .sort();

        if (allDates.length > 0) {
            const availableDates = new Set(allDates);
            const initialDateKey =
                allDates.find((date) => date >= todayKey) ?? allDates[allDates.length - 1];

            setSelectedDate((previousDate) => {
                if (previousDate && availableDates.has(ymd(previousDate))) {
                    return previousDate;
                }

                const [year, month, day] = initialDateKey.split("-").map(Number);
                const nextDate = new Date(year, month - 1, day);
                setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
                return nextDate;
            });
        } else {
            setSelectedDate(null);
        }
    }, [effectiveList]);

    // useEffect(() => {
    // if (!effectiveList?.length) {
    // setSelectedDate(null);
    // return;
    // }

    // const datesInCurrentMonth = effectiveList
    // .map((item: any) => item?.date)
    // .filter(Boolean)
    // .map((date: string) => parseDateLocal(date))
    // .filter(
    // (date: Date) =>
    // date.getFullYear() === currentMonth.getFullYear() &&
    // date.getMonth() === currentMonth.getMonth()
    // )
    // .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    // if (datesInCurrentMonth.length > 0) {
    // const keepCurrent =
    // selectedDate &&
    // datesInCurrentMonth.some(
    // (date) => date.toDateString() === selectedDate.toDateString()
    // );

    // if (!keepCurrent) {
    // setSelectedDate(datesInCurrentMonth[0]);
    // }
    // return;
    // }

    // const allDates = effectiveList
    // .map((item: any) => item?.date)
    // .filter(Boolean)
    // .map((date: string) => parseDateLocal(date))
    // .sort((a: Date, b: Date) => a.getTime() - b.getTime());

    // if (allDates.length > 0) {
    // const firstDate = allDates[0];
    // setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
    // setSelectedDate(firstDate);
    // } else {
    // setSelectedDate(null);
    // }
    // }, [currentMonth, effectiveList]);

    const changeSelectedDay = (direction: number) => {
        if (!selectedDate) return;

        const step = direction > 0 ? 1 : -1;
        const base = new Date(selectedDate);
        base.setDate(base.getDate() + step);

        const next = findEnabledDate(base, step);
        if (!next) return;

        setSelectedDate(next);

        if (
            next.getFullYear() !== currentMonth.getFullYear() ||
            next.getMonth() !== currentMonth.getMonth()
        ) {
            setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    };

    const formatLongDate = (date: Date) => {
        const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
        const day = date.getDate();
        const month = date.toLocaleDateString("es-ES", { month: "long" });
        const year = date.getFullYear();

        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} de ${month.charAt(0).toUpperCase() + month.slice(1)
            } de ${year}`;
    };

    const selectedDayName = selectedDate
        ? capitalizeFirstLetter(
            selectedDate.toLocaleDateString("es-ES", { weekday: "long" })
        )
        : null;

    useEffect(() => {
        dispatch(getWaitingList());
    }, [dispatch]);

    const ymd = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const appointmentsByDate = useMemo(() => {
        const out: Record<string, any[]> = {};

        monthGridDates.forEach((d) => {
            out[ymd(d)] = [];
        });

        effectiveAppointments.forEach((app: any) => {
            const dateKey = app?.slot?.date;
            if (!dateKey) return;
            if (!out[dateKey]) out[dateKey] = [];
            out[dateKey].push(app);
        });

        return out;
    }, [effectiveAppointments, monthGridDates]);

    const selectedKey = selectedDate ? ymd(selectedDate) : null;

    const timeSlots = useMemo(() => {
        if (!selectedKey) return [];

        const hoursForDay = effectiveList
            .filter((slot: any) => slot?.date === selectedKey)
            .map((slot: any) => slot?.time_slot)
            .filter(Boolean);

        return Array.from(new Set(hoursForDay)).sort((a: string, b: string) =>
            a.localeCompare(b)
        );
    }, [effectiveList, selectedKey]);

    const filtered = useMemo(() => {
        if (!selectedKey) return [];
        return appointmentsByDate[selectedKey] ?? [];
    }, [appointmentsByDate, selectedKey]);

    const activityColorByName = useMemo(() => {
        const names = Array.from(
            new Set(
                effectiveList
                    .map((slot: any) =>
                        slot?.activity_name ||
                        slot?.activity?.name ||
                        slot?.class_type ||
                        slot?.type ||
                        "Sin actividad"
                    )
                    .filter(Boolean)
                    .map((name: string) => normalizeDay(name))
            )
        ).sort();
        const colors = new Map<string, string>();
        const brandHues = [32, 42, 145, 158, 20, 330];
        const usedColors = new Set(
            names.map((name) => brandActivityColors[name]).filter(Boolean)
        );
        let paletteCursor = 0;

        names.forEach((name, index) => {
            const assignedBrandColor = brandActivityColors[name];
            if (assignedBrandColor) {
                colors.set(name, assignedBrandColor);
                return;
            }

            while (
                paletteCursor < brandActivityPalette.length &&
                usedColors.has(brandActivityPalette[paletteCursor])
            ) {
                paletteCursor += 1;
            }

            if (paletteCursor < brandActivityPalette.length) {
                const paletteColor = brandActivityPalette[paletteCursor];
                colors.set(name, paletteColor);
                usedColors.add(paletteColor);
                paletteCursor += 1;
                return;
            }

            const extendedIndex = index - brandActivityPalette.length;
            const hue = brandHues[extendedIndex % brandHues.length];
            const saturation = 20 + (Math.floor(extendedIndex / brandHues.length) % 4) * 4;
            const lightness = 82 - (Math.floor(extendedIndex / (brandHues.length * 4)) % 4) * 4;
            colors.set(name, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
        });

        return colors;
    }, [effectiveList]);

    const getSlotForHour = (hour: string) => {
        return (
            effectiveList.find(
                (s: any) => s?.time_slot === hour && s?.date === selectedKey
            ) ?? null
        );
    };

    const getActivityName = (slotForHour: any) => {
        return (
            slotForHour?.activity_name ||
            slotForHour?.activity?.name ||
            slotForHour?.class_type ||
            slotForHour?.type ||
            "Sin actividad"
        );
    };

    const getActivityBarBg = (name: string) => {
        if (!name) return brandActivityPalette[0];
        return activityColorByName.get(normalizeDay(name)) ?? brandActivityPalette[0];
    };

    const getCuposForHour = (_hour: string, slotForHour: any) => {
        if (DEV_FORCE_CUPOS) return 12;
        return Number(slotForHour?.capacity ?? 0);
    };

    const handleClickWaitingListView = (hour: string) => {
        const matchingSlot = effectiveList.find(
            (slot: any) => slot?.date === selectedKey && slot?.time_slot === hour
        );

        setSelectedItem({
            hour: `${hour}:00`,
            dayName: selectedDayName,
            slotId: matchingSlot?.id ?? null,
            date: selectedKey,
        });
        onOpenModalWaitingListView();
    };

    const handleClickWaitingListAdd = (hour: string) => {
        const matchingSlot = effectiveList.find(
            (slot: any) =>
                slot?.date === selectedKey &&
                slot?.time_slot?.slice(0, 5) === hour &&
                normalizeDay(slot?.day) === normalizeDay(selectedDayName || "")
        );

        const slotId = matchingSlot ? matchingSlot.id : null;

        setSelectedItem({
            hour,
            dayName: selectedDayName,
            slotId,
            date: selectedKey,
        });
        onOpenModalWaitingListAdd();
    };

    const handleRowDoubleClick = (item: any, hour: string) => {
        const matchingSlot = effectiveList.find(
            (slot: any) =>
                normalizeDay(slot.day) === normalizeDay(selectedDayName || "") &&
                slot.time_slot.slice(0, 5) === hour &&
                slot.date === selectedKey
        );

        const slotId = matchingSlot ? matchingSlot.id : null;

        if (item) {
            setSelectedItem(item);
            onOpenAlertDialogMethodDelete();
        } else {
            setSelectedItem({
                hour,
                dayName: selectedDayName,
                slotId,
                date: selectedKey,
            });
            onOpenModalAppointmentsAdd();
        }
    };

    const handleEditAppointment = (appointment: any) => {
        if (!appointment || tipo === "Consultor") return;
        setSelectedItem(appointment);
        onOpenModalAppointmentsEdit();
    };

    const handleDeleteAppointment = (appointment: any) => {
        if (!appointment || tipo === "Consultor") return;
        setSelectedItem(appointment);
        onOpenAlertDialogDelete();
    };

    const handleDelete = async (codeValue: string) => {
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}${selectedItem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                    data: { code: codeValue },
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
            dispatch(getCalendar());
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al eliminar el turno.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        }
    };

    const getBackgroundColor = (appointment: any, updatedAppointmentsList: any[]) => {
        if (!appointment) return "transparent";

        if (appointment.reserved === true || appointment.reserved === "true") {
            return "gray.300";
        }

        const isUpdated = updatedAppointmentsList.includes(appointment.person?.id);

        if (isUpdated) return PAYMENT_STATUS_COLORS.current;
        if (!appointment.person?.exp_date) return PAYMENT_STATUS_COLORS.unpaid;

        const expDate = new Date(appointment.person.exp_date);
        const now = new Date();
        const threeDaysBeforeExp = new Date(expDate);
        threeDaysBeforeExp.setDate(expDate.getDate() - 3);

        if (now >= threeDaysBeforeExp && now <= expDate) return PAYMENT_STATUS_COLORS.expiringSoon;
        if (appointment.person.plan === null) return PAYMENT_STATUS_COLORS.unpaid;
        if (expDate < now) return PAYMENT_STATUS_COLORS.expired;

        return PAYMENT_STATUS_COLORS.current;
    };



    return (
        <>
            <AlertDialog
                isOpen={isAlertDialogMethodDeleteOpen}
                onClose={onCloseAlertDialogMethodDelete}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>¿Desea editar o eliminar el turno?</>
                            ) : (
                                <>No se ha seleccionado ninguna solicitud.</>
                            )}
                        </AlertDialogBody>
                        <AlertDialogFooter
                            gap={3}
                        >
                            <Button
                                onClick={() => {
                                    onCloseAlertDialogMethodDelete();
                                    onOpenModalAppointmentsEdit();
                                }}
                                w={["100%", "135px"]}
                                variant="secondary"
                            >
                                Editar
                            </Button>
                            <Button
                                onClick={() => {
                                    onOpenAlertDialogDelete();
                                    onCloseAlertDialogMethodDelete();
                                }}
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
                isOpen={isAlertDialogDeleteOpen}
                onClose={onCloseAlertDialogDelete}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            {selectedItem?.person ? (
                                <>
                                    ¿Desea eliminar el turno de{" "}
                                    <span style={{ fontWeight: 600 }}>
                                        {selectedItem.person.name} {selectedItem.person.last_name}
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
                                    tipo === "Consultor" ? null : handleDelete(code)
                                }
                                w={["100%", "135px"]}
                                variant="danger"
                            >
                                Aceptar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Modal
                isOpen={isModalAppointmentsAddOpen}
                onClose={onCloseModalAppointmentsAdd}
                isCentered
                size={{ base: "300px" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
                    maxH="calc(100dvh - 24px)"
                    overflowY="auto"
                >
                    <ModalCloseButton />
                    <ModalAppointmentsAdd
                        onClose={onCloseModalAppointmentsAdd}
                        product={selectedItem?.slotId}
                        hour={selectedItem?.hour}
                        day={{ date: selectedItem?.date }}
                        initialRoom={selectedRoom}
                    />
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isModalAppointmentsEditOpen}
                onClose={onCloseModalAppointmentsEdit}
                isCentered
                size={{ base: "300px" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                    overflowY="auto"
                >
                    <ModalCloseButton />
                    <ModalAppointmentsEdit
                        onClose={onCloseModalAppointmentsEdit}
                        product={selectedItem}
                    />
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isModalWaitingListViewOpen}
                onClose={onCloseModalWaitingListView}
                isCentered
                size={{ base: "300px" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    w={{ base: "calc(100% - 24px)", sm: "90%" }}
                    maxW={{ base: "calc(100% - 24px)", sm: "85%", md: "60%", lg: "42%", xl: "34%" }}
                    maxH={{ base: "calc(100dvh - 24px)", md: "85vh", lg: "80vh" }}
                    m={{ base: 3, md: 4 }}
                    overflowY="auto"
                >
                    <ModalCloseButton />
                    <ModalWaitingListView
                        onClose={onCloseModalWaitingListView}
                        hour={selectedItem?.hour}
                        day={{ date: selectedItem?.date }}
                        appointments={effectiveAppointments}
                        slots={slots}
                        getAppointments={() => {
                            dispatch(getAppointments());
                            dispatch(getCalendar());
                        }}
                        getSlots={() => dispatch(getSlots())}
                    />
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isModalWaitingListAddOpen}
                onClose={onCloseModalWaitingListAdd}
                isCentered
                size={{ base: "300px" }}
            >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                    maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
                    maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                    overflow="visible"
                >
                    <ModalCloseButton />
                    <ModalWaitingListAdd
                        onClose={onCloseModalWaitingListAdd}
                        product={selectedItem?.slotId}
                        hour={selectedItem?.hour}
                        day={{ date: selectedItem?.date }}
                        getWaitingList={() => dispatch(getWaitingList())}
                    />
                </ModalContent>
            </Modal>

            <Stack
                direction={{ base: "column", lg: "row" }}
                align={{ base: "stretch", lg: "center" }}
                justify="space-between"
                spacing={{ base: 3, lg: 6 }}
                w="100%"
                mb={{ base: 4, md: 5 }}
            >
                <Box
                    position="relative"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width={{ base: "100%", lg: "460px", xl: "35%" }}
                    minHeight={{ base: "44px", md: "48px" }}
                    px={{ base: 11, md: 14 }}
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="card"
                    flexShrink={0}
                >
                    <IconButton
                        icon={<Icon path={mdiChevronLeft} size={1} />}
                        onClick={() => changeSelectedDay(-1)}
                        aria-label="Día anterior"
                        variant="ghost"
                        position="absolute"
                        left={{ base: "6px", md: "12px" }}
                        top="50%"
                        transform="translateY(-50%)"
                        w="32px"
                        h="32px"
                    />

                    <Box
                        display="flex"
                        alignItems="center"
                        gap={2}
                        whiteSpace={{ base: "nowrap", lg: "normal" }}
                        overflow={{ base: "hidden", lg: "visible" }}
                    >
                        <Box display={{ base: "none", sm: "block" }}>
                            <Box color="brand.500" display="flex"><Icon path={mdiCalendarMonthOutline} size={0.9} /></Box>
                        </Box>
                        <Text
                            fontSize={{ base: "sm", sm: "md" }}
                            fontWeight={600}
                            color="text.primary"
                            sx={{ "&::first-letter": { textTransform: "uppercase" } }}
                            textAlign="center"
                        >
                            {selectedDate ? formatLongDate(selectedDate) : "Sin días disponibles"}
                        </Text>
                    </Box>

                    <IconButton
                        icon={<Icon path={mdiChevronRight} size={1} />}
                        onClick={() => changeSelectedDay(1)}
                        aria-label="Día siguiente"
                        variant="ghost"
                        position="absolute"
                        right={{ base: "6px", md: "12px" }}
                        top="50%"
                        transform="translateY(-50%)"
                        w="32px"
                        h="32px"
                    />
                </Box>

                <Box
                    w={{ base: "100%", lg: "auto" }}
                    px={{ base: 1, md: 2 }}
                >
                    <Wrap spacingX={{ base: 3, md: 5 }} spacingY={2} justify={{ base: "flex-start", lg: "flex-end" }}>
                        <WrapItem>
                            <HStack spacing={1.5}>
                                <Box w="10px" h="10px" bg={paymentStatusColors.expired.accent} borderRadius="full" />
                                <Text fontSize="13px" color="text.secondary">Pago expirado</Text>
                            </HStack>
                        </WrapItem>
                        <WrapItem>
                            <HStack spacing={1.5}>
                                <Box w="10px" h="10px" bg={paymentStatusColors.unpaid.accent} borderRadius="full" />
                                <Text fontSize="13px" color="text.secondary">Sin pago</Text>
                            </HStack>
                        </WrapItem>
                        <WrapItem>
                            <HStack spacing={1.5}>
                                <Box w="10px" h="10px" bg={paymentStatusColors.expiringSoon.accent} borderRadius="full" />
                                <Text fontSize="13px" color="text.secondary">Pago próximo a vencer</Text>
                            </HStack>
                        </WrapItem>
                        <WrapItem>
                            <HStack spacing={1.5}>
                                <Box w="10px" h="10px" bg={paymentStatusColors.current.accent} borderRadius="full" />
                                <Text fontSize="13px" color="text.secondary">Pago vigente</Text>
                            </HStack>
                        </WrapItem>
                        <WrapItem>
                            <HStack spacing={1.5}>
                                <Box w="10px" h="10px" bg={paymentStatusColors.waiting.accent} borderRadius="full" />
                                <Text fontSize="13px" color="text.secondary">En espera</Text>
                            </HStack>
                        </WrapItem>
                    </Wrap>
                </Box>
            </Stack>

            <TableContainer
                w="100%"
                maxW="100%"
                p={0}
                overflowX="hidden"
            >
                <Table
                    variant="unstyled"
                    size="md"
                    w="100%"
                    sx={{
                        tableLayout: "fixed",
                        borderCollapse: "separate",
                        borderSpacing: { base: "0 10px", md: "0 14px" },
                    }}
                >
                    <Tbody
                        display={{ base: "grid", md: "table-row-group" }}
                        gap={{ base: 4, md: 0 }}
                    >
                        {!selectedDate || timeSlots.length === 0 ? (
                            <TableState kind="empty" colSpan={20} title="No se encontraron datos" />
                        ) : (
                            timeSlots.map((hour: string, rowIndex: number) => {
                                const slotForHour = getSlotForHour(hour);
                                const activityName = getActivityName(slotForHour);

                                const appsForHour = filtered.filter(
                                    (app: any) => app?.slot?.time_slot?.slice(0, 5) === hour
                                );

                                const cupos = getCuposForHour(hour, slotForHour);
                                const isExpanded = !!expandedHours[hour];
                                const visibleCupos = isExpanded ? cupos : DEFAULT_VISIBLE_SLOTS;
                                const hasMore = cupos > DEFAULT_VISIBLE_SLOTS;

                                return (
                                    <Tr
                                        key={`${selectedKey}-${hour}-${rowIndex}`}
                                        display={{ base: "grid", md: "table-row" }}
                                        gridTemplateColumns={{ base: "1fr auto" }}
                                        bg={{ base: "bg.surface", md: "transparent" }}
                                        border={{ base: "1px solid", md: "none" }}
                                        borderColor={{ base: "border.subtle", md: "transparent" }}
                                        borderRadius={{ base: "10px", md: 0 }}
                                        _hover={{ bg: { base: "bg.surface", md: "transparent" } }}
                                        overflow={{ base: "hidden", md: "visible" }}
                                        w="100%"
                                        maxW="100%"
                                        minW={0}
                                    >
                                        <Td
                                            gridColumn={{ base: "1", md: "auto" }}
                                            gridRow={{ base: "1", md: "auto" }}
                                            w={{ base: "auto", md: "72px", lg: "90px" }}
                                            fontWeight={600}
                                            color="text.primary"
                                            fontSize={{ base: "md", md: "15px" }}
                                            verticalAlign={{ base: "middle", md: "top" }}
                                            p={{ base: "12px 14px 8px", md: 0 }}
                                            pt={{ md: "60px" }}
                                        >
                                            {hour}
                                        </Td>

                                        <Td
                                            gridColumn={{ base: "1 / -1", md: "auto" }}
                                            gridRow={{ base: "2", md: "auto" }}
                                            display={{ base: "block", md: "table-cell" }}
                                            p={{ base: "0 8px 8px", md: 0 }}
                                            w={{ base: "100%", md: "calc(100% - 144px)", lg: "calc(100% - 162px)" }}
                                            maxW="100%"
                                            minW={0}
                                        >
                                            <Box
                                                w="100%"
                                                maxW="100%"
                                                minW={0}
                                                bg="bg.surface"
                                                border="1px solid"
                                                borderColor="border.subtle"
                                                borderRadius={{ base: "10px", md: "12px" }}
                                                boxShadow={{ base: "none", md: "card" }}
                                                overflow="hidden"
                                            >
                                                <Box
                                                    minH="48px"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    px={{ base: 3, md: 5, lg: 6 }}
                                                    py={{ base: 2, md: 0 }}
                                                    gap={2}
                                                    bg={getActivityBarBg(activityName)}
                                                >
                                                    <Text
                                                        fontWeight={600}
                                                        letterSpacing="0.04em"
                                                        color="text.primary"
                                                        fontSize={{ base: "12px", md: "13px" }}
                                                        lineHeight="1.25"
                                                        minW={0}
                                                        pr={hasMore ? 3 : 0}
                                                        overflowWrap="anywhere"
                                                        wordBreak="break-word"
                                                        noOfLines={2}
                                                    >
                                                        {activityName.toUpperCase()}
                                                    </Text>

                                                    {hasMore && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            color="text.primary"
                                                            _hover={{ bg: "blackAlpha.50" }}
                                                            _active={{ bg: "blackAlpha.100" }}
                                                            onClick={() => toggleHour(hour)}
                                                            rightIcon={
                                                                isExpanded ? (
                                                                    <ChevronUpIcon />
                                                                ) : (
                                                                    <ChevronDownIcon />
                                                                )
                                                            }
                                                            fontWeight="500"
                                                            flexShrink={0}
                                                            fontSize={{ base: "xs", md: "sm" }}
                                                            px={{ base: 1, md: 3 }}
                                                        >
                                                            {isExpanded
                                                                ? "Ver menos"
                                                                : `Ver ${cupos - DEFAULT_VISIBLE_SLOTS} ${cupos - DEFAULT_VISIBLE_SLOTS === 1 ? "cupo" : "cupos"
                                                                } más`}
                                                        </Button>
                                                    )}
                                                </Box>

                                                <Box px={{ base: 2, sm: 3, md: 4, lg: 5 }} py={{ base: 2, md: 4 }}>
                                                    <Box
                                                        display="grid"
                                                        gridTemplateColumns={{
                                                            base: "minmax(0, 1fr)",
                                                            sm: "repeat(2, minmax(0, 1fr))",
                                                            md: "repeat(auto-fit, minmax(170px, 1fr))",
                                                        }}
                                                        w="100%"
                                                        maxW="100%"
                                                        minW={0}
                                                        gap={{ base: 2, md: 3 }}
                                                    >
                                                        {Array.from({ length: visibleCupos }).map((_, i) => {
                                                            const isSlotReal = i < cupos;
                                                            const appointment = isSlotReal
                                                                ? appsForHour[i] ?? null
                                                                : null;

                                                            return (
                                                                <Box
                                                                    key={`${hour}-${i}`}
                                                                    minH={{ base: "76px", md: "72px" }}
                                                                    px={{ base: 1, md: 2 }}
                                                                    position="relative"
                                                                    minW={0}
                                                                    maxW="100%"
                                                                    overflow="hidden"
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                    textAlign="center"
                                                                    fontSize={{ base: "12px", md: "13px", lg: "14px" }}
/*                                                                     fontWeight="600"
 */                                                                    border={appointment ? "1px solid" : "1px dashed"}
                                                                    borderColor={appointment ? "blackAlpha.100" : "border.default"}
                                                                    borderLeftWidth={appointment ? "3px" : "1px"}
                                                                    borderLeftColor={
                                                                        appointment
                                                                            ? PAYMENT_STATUS_ACCENT[getBackgroundColor(appointment, updatedAppointments)] ?? "border.default"
                                                                            : "border.default"
                                                                    }
                                                                    borderRadius="8px"
                                                                    bg={
                                                                        appointment
                                                                            ? getBackgroundColor(appointment, updatedAppointments)
                                                                            : "bg.surface"
                                                                    }
                                                                    color="text.primary"
                                                                    opacity={isSlotReal ? 1 : 0.4}
                                                                    transition="border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease"
                                                                    _hover={
                                                                        isSlotReal
                                                                            ? appointment
                                                                                ? { boxShadow: "sm", cursor: "pointer" }
                                                                                : { borderColor: "brand.300", bg: "brand.50", color: "text.brand", cursor: "pointer" }
                                                                            : {}
                                                                    }
                                                                    onClick={() => {
                                                                        if (!isSlotReal) return;
                                                                        if (appointment) {
                                                                            handleEditAppointment(appointment);
                                                                        } else {
                                                                            handleRowDoubleClick(null, hour);
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* {appointment ? (
                                                                        <Box
                                                                            display="flex"
                                                                            flexDirection="column"
                                                                            alignItems="center"
                                                                            justifyContent="center"
                                                                            lineHeight="1.1"
                                                                        >
                                                                            <Text fontSize="12px" fontWeight="500">
                                                                                {appointment.person.name} {appointment.person.last_name}
                                                                            </Text>
                                                                            <Text fontSize="12px" fontWeight="500">
                                                                                {appointment.person.phone}
                                                                            </Text>
                                                                        </Box>
                                                                    ) : null} */}
                                                                    {appointment ? (
                                                                        <Box
                                                                            minW={0}
                                                                            w="100%"
                                                                            lineHeight="1.25"
                                                                            display="grid"
                                                                            gridTemplateColumns={tipo !== "Consultor" ? "34px minmax(0, 1fr) 34px" : "minmax(0, 1fr)"}
                                                                            gridTemplateRows="auto auto"
                                                                            alignItems="center"
                                                                            justifyContent="center"
                                                                            textAlign="center"
                                                                        >
                                                                            <Text gridColumn={tipo !== "Consultor" ? "2" : "1"} gridRow="1" minW={0} fontSize="inherit" overflowWrap="anywhere" wordBreak="normal" whiteSpace="normal" textAlign="center">
                                                                                {appointment.person.name} {appointment.person?.last_name}
                                                                            </Text>
                                                                            <Text gridColumn={tipo !== "Consultor" ? "2" : "1"} gridRow="2" minW={0} fontSize={{ base: "10px", md: "11px" }} noOfLines={1} mt={0.5} textAlign="center">
                                                                                {appointment.person.phone}
                                                                            </Text>
                                                                            {tipo !== "Consultor" && (
                                                                                <Menu placement="bottom-end">
                                                                                    <MenuButton
                                                                                        as={IconButton}
                                                                                        aria-label="Acciones del turno"
                                                                                        icon={<Icon path={mdiDotsVertical} size={0.75} />}
                                                                                        size="xs"
                                                                                        minW="28px"
                                                                                        h="28px"
                                                                                        mb={3}
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
                                                                                        <MenuList
                                                                                            minW="170px"
                                                                                            fontSize="sm"
                                                                                            zIndex="popover"
                                                                                            onClick={(event) => event.stopPropagation()}
                                                                                        >
                                                                                            <MenuItem
                                                                                                icon={<Icon path={mdiPencilOutline} size={0.7} />}
                                                                                                onClick={() => handleEditAppointment(appointment)}
                                                                                            >
                                                                                                Editar turno
                                                                                            </MenuItem>
                                                                                            <MenuItem
                                                                                                icon={<Icon path={mdiDeleteOutline} size={0.7} />}
                                                                                                color="error.fg"
                                                                                                _hover={{ bg: "error.bg" }}
                                                                                                _focus={{ bg: "error.bg" }}
                                                                                                onClick={() => handleDeleteAppointment(appointment)}
                                                                                            >
                                                                                                Eliminar turno
                                                                                            </MenuItem>
                                                                                        </MenuList>
                                                                                    </Portal>
                                                                                </Menu>
                                                                            )}
                                                                        </Box>
                                                                    ) : isSlotReal ? (
                                                                        <Text fontSize="xs" color="inherit" fontWeight={500}>
                                                                            + Reservar
                                                                        </Text>
                                                                    ) : null}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                </Box>

                                            </Box>
                                        </Td>

                                        <Td
                                            gridColumn={{ base: "2", md: "auto" }}
                                            gridRow={{ base: "1", md: "auto" }}
                                            padding={{ base: "4px 8px", md: 0 }}
                                            width={{ base: "auto", md: "64px", lg: "72px" }}
                                            verticalAlign={{ base: "middle", md: "top", lg: "middle" }}
                                            pt={{ md: 2, lg: 0 }}
                                        >
                                            <Box
                                                display="flex"
                                                flexDirection={{ base: "row", md: "column" }}
                                                alignItems="center"
                                                justifyContent="center"
                                                gap={{ base: 1, md: "10px" }}
                                                height="100%"
                                            >
                                                <Tooltip
                                                    hasArrow
                                                    label="Ver lista de espera"
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        w={{ base: "36px", md: "40px" }}
                                                        h={{ base: "36px", md: "40px" }}
                                                        px={0}
                                                        display="flex"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        aria-label="Ver lista de espera"
                                                        onClick={() => handleClickWaitingListView(hour)}
                                                    >
                                                        <Icon path={mdiEye} size={1} />
                                                    </Button>
                                                </Tooltip>

                                                <Tooltip
                                                    hasArrow
                                                    label="Agregar a lista de espera"
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        w={{ base: "36px", md: "40px" }}
                                                        h={{ base: "36px", md: "40px" }}
                                                        px={0}
                                                        display="flex"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        aria-label="Agregar a lista de espera"
                                                        onClick={() => handleClickWaitingListAdd(hour)}
                                                    >
                                                        <Icon path={mdiPlusCircleOutline} size={1} />
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Td>
                                    </Tr>
                                );
                            })
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
        </>
    );
};

export default ShiftTable;
