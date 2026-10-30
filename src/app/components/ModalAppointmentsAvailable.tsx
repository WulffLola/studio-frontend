import React, { useEffect, useMemo, useState } from 'react';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    Heading,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { getAvailableSlots } from '../stores/studioSlice';

const ModalAppointmentsAvailable = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const [search, setSearch] = useState("");

    const {
        availableSlots,
        loadingAvailableSlots,
    } = useSelector((state: any) => state.studio);

    const normalizeText = (text: string) => {
        return (text || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    const formatDateWithDay = (dateString: string) => {
        const date = new Date(`${dateString}T00:00:00`);
        const formatted = date.toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "numeric",
            year: "numeric",
        });

        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    useEffect(() => {
        dispatch(getAvailableSlots());
    }, [dispatch]);

    const groupedSlots = useMemo(() => {
        if (!availableSlots || !Array.isArray(availableSlots)) return [];

        const grouped = availableSlots.reduce((acc: any, slot: any) => {
            const date = slot.date;

            if (!acc[date]) {
                acc[date] = [];
            }

            acc[date].push(slot);
            return acc;
        }, {});

        return Object.entries(grouped)
            .sort(
                ([dateA], [dateB]) =>
                    new Date(dateA as string).getTime() - new Date(dateB as string).getTime()
            )
            .map(([date, slots]: any) => ({
                date,
                formattedDate: formatDateWithDay(date),
                slots: slots.sort(
                    (a: any, b: any) => a.start_time.localeCompare(b.start_time)
                ),
            }));
    }, [availableSlots]);

    const filteredGroupedSlots = useMemo(() => {
        const searchNormalized = normalizeText(search.trim());

        if (!searchNormalized) return groupedSlots;

        return groupedSlots
            .map((group: any) => {
                const formattedDateNormalized = normalizeText(group.formattedDate);
                const rawDateNormalized = normalizeText(group.date);

                const dayMatches =
                    formattedDateNormalized.includes(searchNormalized) ||
                    rawDateNormalized.includes(searchNormalized);

                const filteredSlots = group.slots.filter((slot: any) => {
                    const startTime = slot.start_time?.slice(0, 5) || "";
                    return normalizeText(startTime).includes(searchNormalized);
                });

                return {
                    ...group,
                    slots: dayMatches ? group.slots : filteredSlots,
                };
            })
            .filter((group: any) => group.slots.length > 0);
    }, [groupedSlots, search]);

    const defaultOpenIndexes = useMemo(() => {
        if (!search.trim()) return [];
        return filteredGroupedSlots.map((_: any, index: number) => index);
    }, [filteredGroupedSlots, search]);

    return (
        <Flex
            direction="column"
            p={{ base: 3, sm: 4, md: 6 }}
            maxH="inherit"
            minH={0}
            overflow="hidden"
        >
            <Heading as="h4" size="md" mb={5}>
                Turnos Disponibles
            </Heading>

            {!loadingAvailableSlots && (
                <InputGroup mb={4}>
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="text.muted" />
                    </InputLeftElement>
                    <Input
                        placeholder="Buscar por día o por horario"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        bg="bg.surface"
                        borderColor="border.default"
                        
                    />
                </InputGroup>
            )}

            {loadingAvailableSlots ? (
                <Flex justifyContent="center" alignItems="center" height="100%">
                    <Spinner size="lg" />
                    <Text ml={4}>Cargando...</Text>
                </Flex>
            ) : filteredGroupedSlots.length > 0 ? (
                <Flex direction="column" overflowY="auto" minH={0} flex="1" mb={4}>
                    <Accordion
                        allowMultiple
                        defaultIndex={defaultOpenIndexes}
                        display="flex"
                        flexDirection="column"
                        gap={3}
                    >
                        {filteredGroupedSlots.map((group: any) => (
                            <AccordionItem
                                key={group.date}
                                border="1px solid"
                                borderColor="border.subtle"
                                borderRadius="md"
                                overflow="hidden"
                                bg="bg.surface"
                            >
                                <h2>
                                    <AccordionButton
                                        py={4}
                                        px={4}
                                        _hover={{ bg: "bg.subtle" }}
                                    >
                                        <Box flex="1" textAlign="left">
                                            <Text fontWeight="semibold">
                                                {group.formattedDate}
                                            </Text>
                                            <Text fontSize="sm" color="text.secondary">
                                                {group.slots.length}{" "}
                                                {group.slots.length === 1
                                                    ? "horario disponible"
                                                    : "horarios disponibles"}
                                            </Text>
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>

                                <AccordionPanel px={4} pb={4} pt={1}>
                                    <Stack spacing={2}>
                                        {group.slots.map((slot: any) => (
                                            <Flex
                                                key={slot.id}
                                                justifyContent="space-between"
                                                alignItems="center"
                                                border="1px solid"
                                                borderColor="border.subtle"
                                                borderRadius="md"
                                                px={3}
                                                py={2.5}
                                                bg="bg.subtle"
                                            >
                                                <Text fontWeight="medium">
                                                    {slot.start_time.slice(0, 5)} hs
                                                </Text>

                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    color={
                                                        slot.availability <= 3
                                                            ? "warning.solid"
                                                            : "success.solid"
                                                    }
                                                >
                                                    {slot.availability}{" "}
                                                    {slot.availability === 1
                                                        ? "lugar"
                                                        : "lugares"}
                                                </Text>
                                            </Flex>
                                        ))}
                                    </Stack>
                                </AccordionPanel>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Flex>
            ) : (
                <Text color="text.muted">
                    {search.trim()
                        ? "No se encontraron turnos con esa búsqueda."
                        : "No hay turnos disponibles."}
                </Text>
            )}

            <Stack spacing={4} direction={["column", "row"]} mt={8} justifyContent="right">
                <Button
                    aria-label="Cerrar"
                    onClick={onClose}
                    w={["100%", "135px"]}
                    variant="secondary"
                >
                    Cerrar
                </Button>
            </Stack>
        </Flex>
    );
};

export default ModalAppointmentsAvailable;
