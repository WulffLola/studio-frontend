"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Box,
    Button,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Stack,
    Text,
    Tooltip,
    useDisclosure,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useSelector } from "react-redux";
import axios from "axios";
import Icon from "@mdi/react";
import { mdiDeleteOutline } from "@mdi/js";
import { useAppDispatch } from "../stores/hooks";
import {
    getAppointments,
    getAvailableSlots,
    getOverduePayments,
    getPeoples,
} from "../stores/studioSlice";
import { useAuthStore } from "../stores/auth";
import ModalCode from "./ModalCode";

type OverduePaymentItem = {
    id: number;
    exp_date: string;
    deleted: string | null;
    person: number | { id: number };
    plans_subtype?: {
        name?: string;
        plans_type_name?: string;
    };
};

type PersonData = {
    id: number;
    name?: string;
    last_name?: string;
    deleted?: string | null;
};

type ModalExpiredPaymentsProps = {
    onClose: () => void;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "-";

    const onlyDate = dateString.split("T")[0];
    const [year, month, day] = onlyDate.split("-");

    if (!year || !month || !day) return dateString;

    return `${day}/${month}/${year}`;
};

const getDateTimestamp = (dateString?: string) => {
    if (!dateString) return Number.NEGATIVE_INFINITY;

    const timestamp = new Date(dateString).getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const normalizeText = (text?: string) =>
    (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const normalizeSearchText = (text?: string) =>
    normalizeText(text).replace(
        /\b0?(\d{1,2})\/0?(\d{1,2})\/(\d{4})\b/g,
        (_, day, month, year) => `${Number(day)}/${Number(month)}/${year}`
    );

export default function ModalExpiredPayments({
    onClose,
}: ModalExpiredPaymentsProps) {
    const dispatch = useAppDispatch();
    const [search, setSearch] = useState("");
    const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);
    const [deleting, setDeleting] = useState(false);
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    const toast = useToast();
    const { tipo, tokens } = useAuthStore();
    const {
        isOpen: isDeleteOpen,
        onOpen: onOpenDelete,
        onClose: onCloseDelete,
    } = useDisclosure();
    const {
        isOpen: isCodeOpen,
        onOpen: onOpenCode,
        onClose: onCloseCode,
    } = useDisclosure();

    const {
        overduePayments = [],
        loadingOverduePayments = false,
        peoples = [],
        loadingPeoples = false,
    } = useSelector((state: any) => state.studio);

    useEffect(() => {
        dispatch(getOverduePayments());
        dispatch(getPeoples());
    }, [dispatch]);

    const peopleMap = useMemo(() => {
        const map: Record<number, PersonData> = {};

        (Array.isArray(peoples) ? peoples : []).forEach((person: PersonData) => {
            map[person.id] = person;
        });

        return map;
    }, [peoples]);

    const expiredPayments = useMemo(() => {
        return (Array.isArray(overduePayments) ? overduePayments : [])
            .filter((item: OverduePaymentItem) => !item.deleted)
            .sort(
                (a: OverduePaymentItem, b: OverduePaymentItem) =>
                    getDateTimestamp(b.exp_date) - getDateTimestamp(a.exp_date)
            );
    }, [overduePayments]);

    const getPersonId = (item: OverduePaymentItem) => {
        if (typeof item.person === "object" && item.person !== null) {
            return item.person.id;
        }

        return item.person;
    };

    const filteredExpiredPayments = useMemo(() => {
        const normalizedSearch = normalizeSearchText(search.trim());
        const activeExpiredPayments = expiredPayments.filter(
            (item: OverduePaymentItem) => peopleMap[getPersonId(item)]?.deleted == null
        );

        if (!normalizedSearch) return activeExpiredPayments;

        return activeExpiredPayments.filter((item: OverduePaymentItem) => {
            const person = peopleMap[getPersonId(item)];
            const personName = `${person?.name || ""} ${person?.last_name || ""}`;
            const planName = item.plans_subtype?.name || "";
            const formattedExpirationDate = formatDate(item.exp_date);

            return [personName, planName, item.exp_date, formattedExpirationDate].some(
                (value) => normalizeSearchText(value).includes(normalizedSearch)
            );
        });
    }, [expiredPayments, peopleMap, search]);

    const requestDelete = (person: PersonData) => {
        setSelectedPerson(person);
        onOpenDelete();
    };

    const handleDelete = async (code = "admin") => {
        if (!selectedPerson) return;

        setDeleting(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}${selectedPerson.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                    data: { code },
                }
            );

            toast({
                title: "Alumno dado de baja correctamente.",
                description: "Se eliminaron sus turnos y se liberaron los lugares disponibles.",
                status: "success",
                duration: 4000,
                isClosable: true,
                position: "bottom-right",
            });
            onCloseCode();
            onCloseDelete();
            setSelectedPerson(null);
            await Promise.all([
                dispatch(getPeoples()),
                dispatch(getOverduePayments()),
                dispatch(getAppointments()),
                dispatch(getAvailableSlots()),
            ]);
        } catch (error: any) {
            toast({
                title: "No se pudo dar de baja al alumno.",
                description:
                    error?.response?.data?.detail ||
                    "Ocurrió un error al eliminar al alumno y sus turnos.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setDeleting(false);
        }
    };

    const confirmDelete = () => {
        if (tipo === "Consultor") {
            onOpenCode();
            return;
        }
        handleDelete();
    };

    return (
        <>
            <ModalHeader px={{ base: 4, md: 6 }} pr={{ base: 12, md: 14 }}>
                Pagos vencidos
            </ModalHeader>

            <ModalBody px={{ base: 3, sm: 4, md: 6 }} overflowY="auto">
                {!loadingOverduePayments && !loadingPeoples && (
                    <InputGroup mb={4}>
                        <InputLeftElement pointerEvents="none">
                            <SearchIcon color="text.muted" />
                        </InputLeftElement>
                        <Input
                            placeholder="Buscar por alumno, plan o fecha"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            bg="bg.surface"
                            borderColor="border.default"
                            
                        />
                    </InputGroup>
                )}

                {loadingOverduePayments || loadingPeoples ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <Spinner />
                    </Box>
                ) : filteredExpiredPayments.length === 0 ? (
                    <Box py={6} textAlign="center">
                        <Text color={search.trim() ? "text.muted" : undefined}>
                            {search.trim()
                                ? "No se encontraron pagos con esa búsqueda."
                                : "No hay pagos vencidos."}
                        </Text>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {filteredExpiredPayments.map((item: OverduePaymentItem) => {
                            const personId = getPersonId(item);
                            const person = peopleMap[personId];

                            return (
                                <Box
                                    key={item.id}
                                    border="1px solid"
                                    borderColor="border.subtle"
                                    borderRadius="card"
                                    p={{ base: 3, md: 4 }}
                                    bg="bg.subtle"
                                    minW={0}
                                >
                                    <Stack
                                        direction={{ base: "column", sm: "row" }}
                                        justify="space-between"
                                        align={{ base: "stretch", sm: "start" }}
                                        spacing={{ base: 2, sm: 4 }}
                                        w="100%"
                                        minW={0}
                                    >

                                        {/* IZQUIERDA */}
                                        <VStack align="start" spacing={1} minW={0}>
                                            <Text fontWeight="bold" fontSize="md" overflowWrap="anywhere">
                                                {person
                                                    ? `${person.name || ""} ${person.last_name || ""}`.trim()
                                                    : `Persona #${personId}`}
                                            </Text>

                                            <Text fontSize="sm" color="text.primary">
                                                <Text as="span" fontWeight="bold">
                                                    Plan:{" "}
                                                </Text>
                                                {[item.plans_subtype?.name]
                                                    .filter(Boolean)
                                                    .join(" - ") || "-"}
                                            </Text>
                                        </VStack>

                                        {/* DERECHA */}
                                        <Stack
                                            direction="row"
                                            align="center"
                                            justify={{ base: "space-between", sm: "flex-end" }}
                                            spacing={3}
                                            flexShrink={0}
                                        >
                                            <Text
                                                fontSize="sm"
                                                color="error.fg"
                                                fontWeight="semibold"
                                                textAlign={{ base: "left", sm: "right" }}
                                                whiteSpace="nowrap"
                                            >
                                                Venció: {formatDate(item.exp_date)}
                                            </Text>
                                            {person && (
                                                <Tooltip
                                                    hasArrow
                                                    label="Eliminar"
                                                >
                                                    <IconButton
                                                        aria-label="Eliminar"
                                                        icon={<Icon path={mdiDeleteOutline} size={0.9} />}
                                                        size="sm"
                                                        onClick={() => requestDelete(person)}
                                                        variant="ghostDanger"
                                                    />
                                                </Tooltip>
                                            )}
                                        </Stack>

                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </ModalBody>

            <ModalFooter px={{ base: 3, sm: 4, md: 6 }}>
                <Box w="100%" display="flex" justifyContent="flex-end">
                    <Button
                        aria-label="Cerrar"
                        onClick={onClose}
                        w={["100%", "135px"]}
                        variant="secondary"
                    >
                        Cerrar
                    </Button>
                </Box>
            </ModalFooter>

            <AlertDialog
                isOpen={isDeleteOpen}
                onClose={deleting ? () => undefined : onCloseDelete}
                leastDestructiveRef={cancelRef}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent mx={4}>
                        <AlertDialogHeader>Dar de baja alumno</AlertDialogHeader>
                        <AlertDialogBody>
                            ¿Está seguro que quiere dar de baja a{" "}
                            <Text as="span" fontWeight="bold">
                                {selectedPerson
                                    ? `${selectedPerson.name || ""} ${selectedPerson.last_name || ""}`.trim()
                                    : "este alumno"}
                            </Text>
                            ? Sus turnos serán eliminados y los lugares quedarán disponibles.
                        </AlertDialogBody>
                        <AlertDialogFooter gap={3}>
                            <Button
                                ref={cancelRef}
                                onClick={onCloseDelete}
                                isDisabled={deleting}
                                w={["100%", "135px"]}
                                aria-label="Cancelar"
                                variant="secondary"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                isLoading={deleting}
                                w={["100%", "135px"]}
                                variant="danger"
                            >
                                Eliminar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <Modal onClose={onCloseCode} isOpen={isCodeOpen} isCentered>
                <ModalOverlay />
                <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }}>
                    <ModalCloseButton />
                    <ModalCode
                        onClose={onCloseCode}
                        get={getPeoples}
                        onCloseAlert={onCloseDelete}
                        entityType={"studentsDelete" as any}
                        action={handleDelete}
                    />
                </ModalContent>
            </Modal>
        </>
    );
}
