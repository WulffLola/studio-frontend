import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    List,
    ListItem,
    ListIcon,
    Flex,
    Heading,
    Text,
    Stack,
    Button,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
    useToast,
    Spinner,
    Badge,
} from '@chakra-ui/react';
import { mdiChevronLeft, mdiChevronRight, mdiCalendarMonthOutline, mdiEye, mdiPlusCircleOutline, mdiWhatsapp, mdiCheckCircleOutline } from '@mdi/js';
import StatusBadge from "./ui/StatusBadge";
import Icon from "@mdi/react";
import { CheckCircleIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import ModalCode from './ModalCode';
import { checkDomainOfScale } from 'recharts/types/util/ChartUtils';

const formatDate = (dateString?: string) => {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("T")[0].split("-");
    if (!year || !month || !day) return dateString;

    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
};

const ModalWaitingListView = ({ onClose, hour, day, getAppointments, appointments, slots, getSlots }) => {
    const [waitingList, setWaitingList] = useState([]);
    const [showAddButton, setShowAddButton] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState("admin")
    const { tipo, tokens } = useAuthStore();
    const [sentIds, setSentIds] = useState<number[]>([]);
    const [loadingAdd, setLoadingAdd] = useState(null); // ID del que está cargando en "+"
    const [loadingWhatsapp, setLoadingWhatsapp] = useState(null); // ID del que está cargando en WhatsApp

    console.log(day)


    const { isOpen: isAlertDialogAddOpen, onOpen: onOpenAlertDialogAdd, onClose: onCloseAlertDialogAdd } = useDisclosure();
    const { isOpen: isAlertCodeOpen, onOpen: onOpenModalCode, onClose: onCloseModalCode } = useDisclosure();
    const { isOpen: isAlertCodeWhatsappOpen, onOpen: onOpenModalCodeWhatsapp, onClose: onCloseModalCodeWhatsapp } = useDisclosure();

    const cancelRef = React.useRef();
    const toast = useToast();

    useEffect(() => {
        const fetchWaitingList = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_WAITING_LIST}`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
                        'Content-Type': 'application/json',
                    },
                });
                setWaitingList(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false); // Cambia el estado de carga a false después de la solicitud
            }
        };

        fetchWaitingList();
        getSlots();
    }, []);

    // Filtrar los productos por día y hora
    const filteredProducts = waitingList.filter(
        product =>
            product.slot?.date === day.date &&
            product.slot?.start_time?.slice(0, 5) === hour?.slice(0, 5)
    );

    // Si hay productos en la lista, activa el botón de añadir
    useEffect(() => {
        if (filteredProducts.length > 0) {
            setShowAddButton(true);
        } else {
            setShowAddButton(false);
        }
    }, [filteredProducts]);

    const handleClickAppointmentsAdd = (item) => {
        onOpenAlertDialogAdd();
        setSelectedItem(item);
    };

    const handleDelete = async (code) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_WAITING_LIST}${selectedItem.id}/`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Añade el token de autenticación
                    'Content-Type': 'application/json',
                }, data: { code: code }
            });
            // toast({ title: "Turno eliminado correctamente.", status: "success", duration: 3000 });
            getAppointments();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmitAppointments = async (selectedItem, code) => {
        const formData = new FormData();
        formData.append('person_id', selectedItem.person.id);
        formData.append('slot_id', selectedItem.slot.id);
        formData.append('code', code);
        // formData.append('reserved', true);

        // Validar si algún campo está vacío
        let isFormValid = true;
        formData.forEach((value) => {
            if ((value === "") || value === "--:--") {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const isDuplicate = Array.isArray(appointments) && appointments.some(
            (appointment) =>
                appointment.person &&
                appointment.slot &&
                appointment.person.id === selectedItem.person.id &&
                appointment.slot.id === selectedItem.slot.id
        );

        if (isDuplicate) {
            toast({
                title: "Turno duplicado.",
                description: "Esta persona ya tiene un turno disponible en este dia y horario.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Verifica si el slot ya no tiene disponibilidad
        const selectedSlot = slots.find(slot => slot.id === selectedItem.slot.id);
        if (selectedSlot && selectedSlot.availability < 1) {
            toast({
                title: "Sin disponibilidad.",
                description: "No hay disponibilidad en este día y horario.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}`, formData, {
                headers: { 'Authorization': `Bearer ${tokens?.access}`, 'Content-Type': 'multipart/form-data' }
            });
            toast({
                title: "Turno registrado correctamente.",
                description: "La persona fue agregada al turno.",
                status: "success", duration: 3000, position: "bottom-right",
                isClosable: true,
            });
            onClose();
            getAppointments();
            return true;
        } catch (error) {
            toast({ title: "Error", description: error.response?.data?.detail || "Ocurrió un error.", status: "error", position: "bottom-right", duration: 5000, isClosable: true });
            return false;

        }
    };

    const handleSubmitAppointments2 = async (item, code) => {

        const formData = new FormData();
        formData.append('person_id', item.person.id);
        formData.append('slot_id', item.slot.id);
        formData.append('code', code);
        formData.append('reserved', true);

        // Validar si algún campo está vacío
        let isFormValid = true;
        formData.forEach((value) => {
            if ((value === "") || value === "--:--") {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        const isDuplicate = Array.isArray(appointments) && appointments.some(
            (appointment) =>
                appointment.person &&
                appointment.slot &&
                appointment.person.id === item.person.id &&
                appointment.slot.id === item.slot.id
        );

        if (isDuplicate) {
            toast({
                title: "Turno duplicado.",
                description: "Esta persona ya tiene un turno disponible en este dia y horario.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        // Verifica si el slot ya no tiene disponibilidad
        const selectedSlot = slots.find(slot => slot.id === item.slot.id);
        if (selectedSlot && selectedSlot.availability < 1) {
            toast({
                title: "Sin disponibilidad.",
                description: "No hay disponibilidad en este día y horario.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_APPOINTMENTS}`, formData, {
                headers: { 'Authorization': `Bearer ${tokens?.access}`, 'Content-Type': 'multipart/form-data' }
            });
            toast({
                title: "Mensaje enviado correctamente.",
                description: "Se envió la notificación de WhatsApp y se reservó el lugar.",
                status: "success", duration: 3000, position: "bottom-right",
                isClosable: true,
            });
            // onClose();
            getAppointments();
            return true;
        } catch (error) {
            toast({ title: "Error", description: error.response?.data?.detail || "Ocurrió un error.", status: "error", position: "bottom-right", duration: 5000, isClosable: true });
            return false;

        }
    };

    const handleMultipleActions = async (code) => {
        const isSuccessful = await handleSubmitAppointments(selectedItem, code);
        if (isSuccessful) {
            await handleDelete(code);
        }
        onCloseAlertDialogAdd();
    };

    const handleSendWhatsapp = async (item, code) => {
        const isSuccessful = await handleSubmitAppointments2(item, code);

        if (isSuccessful) {
            setSentIds((prev) => [...prev, item.id]);
            return true;
        }

        return false;
    };


    return (
        <Flex direction="column" p={5}>
            <Modal
                onClose={onCloseModalCode}
                isOpen={isAlertCodeOpen}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay />
                <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}>
                    <ModalCloseButton />
                    <ModalCode
                        onClose={onCloseModalCode}
                        // get={fetchWaitingList()}
                        onCloseAlert={onClose}
                        entityType={"waitingListAdd"}
                        action={handleMultipleActions}
                    />
                </ModalContent>
            </Modal>

            <Modal
                onClose={onCloseModalCodeWhatsapp}
                isOpen={isAlertCodeWhatsappOpen}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
            >
                <ModalOverlay />
                <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }}>
                    <ModalCloseButton />
                    <ModalCode
                        onClose={onCloseModalCodeWhatsapp}
                        // get={fetchWaitingList()}
                        onCloseAlert={onClose}
                        entityType={"waitingListWhatsapp"}
                        action={(code) => handleSendWhatsapp(selectedItem, code)} />
                </ModalContent>
            </Modal>

            <AlertDialog isOpen={isAlertDialogAddOpen} onClose={onCloseAlertDialogAdd} leastDestructiveRef={cancelRef} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogCloseButton />
                        <AlertDialogBody>
                            {selectedItem ? (
                                <>
                                    ¿Desea agregar a <span style={{ fontWeight: 600 }}>{selectedItem?.person.name} {selectedItem?.person.last_name}</span> al turno del <span style={{ fontWeight: 600 }}>{formatDate(selectedItem?.slot.date)}</span> a las <span style={{ fontWeight: 600 }}>{selectedItem?.slot.start_time?.slice(0, 5)}</span>?
                                </>
                            ) : (
                                <>No se ha seleccionado ninguna solicitud.</>
                            )}
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                onClick={onCloseAlertDialogAdd}
                                w={["100%", "135px"]}
                                aria-label="Cancelar"
                                variant="secondary"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => (tipo !== "Consultor" ? handleMultipleActions(code) : onOpenModalCode())}
                                w={["100%", "135px"]}
                                variant="primary"
                            >
                                Aceptar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Heading as="h4" size="md" mb={8}>
                Lista de Espera
            </Heading>
            {loading ? (
                <Flex justifyContent="center" alignItems="center" height="100%">
                    <Spinner size="lg" />
                    <Text ml={4}>Cargando...</Text>
                </Flex>
            ) : filteredProducts.length > 0 ? (
                <List spacing={3}>
                    {filteredProducts.map(filteredProduct => {
                        const isReserved = appointments.some(app =>
                            app.person.id === filteredProduct.person.id &&
                            app.slot.id === filteredProduct.slot.id &&
                            app.reserved === true
                        );

                        return (
                            <ListItem key={filteredProduct.id}>
                                <Flex alignItems="center" justifyContent="space-between" gap={3} minW={0}>
                                    <Flex alignItems="flex-start" minW={0} flex="1">
                                        <ListIcon as={CheckCircleIcon} color="success.solid" mt="3px" flexShrink={0} />
                                        <Text
                                            minW={0}
                                            whiteSpace="normal"
                                            overflowWrap="anywhere"
                                            wordBreak="break-word"
                                            lineHeight="1.35"
                                        >
                                            {filteredProduct.person.name} {filteredProduct.person.last_name} - {filteredProduct.person.phone}
                                        </Text>
                                    </Flex>

                                    <Flex justifyContent="flex-end" alignItems="center" flexShrink={0}>
                                        {(sentIds.includes(filteredProduct.id) || isReserved) && (
                                            <StatusBadge label="Enviado" tone="success" />
                                        )}

                                        <Button
                                            variant="ghost"
                                            aria-label="Agregar turno desde lista de espera"
                                            size="xs"
                                            minW="auto"
                                            isLoading={loadingAdd === filteredProduct.id}
                                            onClick={async () => {
                                                if (tipo === "Consultor") {
                                                    setSelectedItem(filteredProduct);
                                                    onOpenModalCode();
                                                } else {
                                                    setLoadingAdd(filteredProduct.id);
                                                    await handleClickAppointmentsAdd(filteredProduct);
                                                    setLoadingAdd(null);
                                                }
                                            }}
                                            isDisabled={sentIds.includes(filteredProduct.id) || isReserved}
                                        >

                                            <Icon path={mdiPlusCircleOutline} size={1} />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            aria-label="Enviar turno por WhatsApp"
                                            size="xs"
                                            minW="auto"
                                            isLoading={loadingWhatsapp === filteredProduct.id}
                                            onClick={async () => {
                                                if (tipo === "Consultor") {
                                                    setSelectedItem(filteredProduct); // solo si el modal lo necesita
                                                    onOpenModalCodeWhatsapp();
                                                } else {
                                                    setLoadingWhatsapp(filteredProduct.id); // loading se activa INSTANTÁNEAMENTE

                                                    const isSuccessful = await handleSendWhatsapp(filteredProduct, code);

                                                    setLoadingWhatsapp(null); // lo sacás apenas termina
                                                }
                                            }}
                                            isDisabled={sentIds.includes(filteredProduct.id) || isReserved}
                                        >
                                            <Icon path={mdiWhatsapp} size={1} />
                                        </Button>
                                    </Flex>
                                </Flex>
                            </ListItem>
                        );
                    })}
                </List>
            ) : (
                <Text>No hay lista de espera para este día y horario.</Text>
            )
            }

            <Stack spacing={4} direction={["column", "row"]} mt={8} justifyContent={"right"}>
                <Button
                    aria-label="Cerrar"
                    onClick={onClose}
                    w={["100%", "135px"]}
                    variant="secondary"
                >
                    Cerrar
                </Button>
            </Stack>
        </Flex >
    );
};

export default ModalWaitingListView;
