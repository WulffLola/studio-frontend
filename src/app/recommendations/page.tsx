"use client";

import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Icon from "@mdi/react";
import {
  mdiAccountGroupOutline,
  mdiAlertCircleOutline,
  mdiArrowRight,
  mdiCalendarRange,
  mdiCheck,
  mdiClockOutline,
  mdiCogOutline,
  mdiHistory,
  mdiInformationOutline,
  mdiLightbulbOnOutline,
  mdiMapMarkerOutline,
  mdiTuneVariant,
  mdiWindowClose,
} from "@mdi/js";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader, Surface } from "../components/ui/PageContainer";

type Status = "pending" | "accepted" | "discarded";
type Kind = "add" | "move" | "review";

type Recommendation = {
  id: number;
  kind: Kind;
  status: Status;
  title: string;
  activity: string;
  location: string;
  room: string;
  slot: string;
  period: string;
  observations: number;
  occupancy: number;
  recurrence: number;
  freeSpots: number;
  waitlist: number;
  affected: number;
  alternative?: string;
  alternativeRoom?: string;
  reason: string;
  pending: string[];
  decidedBy?: string;
  decidedAt?: string;
};

const initialRecommendations: Recommendation[] = [
  {
    id: 1,
    kind: "add",
    status: "pending",
    title: "Incorporar una clase",
    activity: "Pilates Reformer",
    location: "Sede Palermo",
    room: "Sala 1",
    slot: "Martes · 18:00",
    period: "12 ago – 28 oct 2026",
    observations: 12,
    occupancy: 92,
    recurrence: 83,
    freeSpots: 1,
    waitlist: 7,
    affected: 0,
    alternative: "Jueves · 18:00",
    alternativeRoom: "Sala 2 · 10 lugares",
    reason: "La franja supera el 80 % de ocupación en 10 de las últimas 12 clases y acumula personas en espera.",
    pending: ["Confirmar disponibilidad de la profesora", "Validar equipamiento de Sala 2"],
  },
  {
    id: 2,
    kind: "move",
    status: "pending",
    title: "Reubicar una clase",
    activity: "Yoga integral",
    location: "Sede Centro",
    room: "Sala Yoga",
    slot: "Viernes · 15:00",
    period: "19 ago – 28 oct 2026",
    observations: 10,
    occupancy: 38,
    recurrence: 70,
    freeSpots: 9,
    waitlist: 0,
    affected: 4,
    alternative: "Miércoles · 19:00",
    alternativeRoom: "Sala Yoga · sin conflictos",
    reason: "El origen registra baja ocupación recurrente; la franja propuesta presenta 88 % de ocupación y 5 personas en espera.",
    pending: ["Consultar a los 4 alumnos con turno fijo", "Confirmar disponibilidad de la profesora"],
  },
  {
    id: 3,
    kind: "review",
    status: "pending",
    title: "Revisar la oferta",
    activity: "Stretching",
    location: "Sede Palermo",
    room: "Sala 3",
    slot: "Lunes · 08:00",
    period: "12 ago – 28 oct 2026",
    observations: 12,
    occupancy: 42,
    recurrence: 75,
    freeSpots: 7,
    waitlist: 0,
    affected: 5,
    alternative: "Miércoles · 09:00 / Sábado · 10:00",
    reason: "La franja se mantuvo por debajo del 50 % en 9 observaciones y no registra demanda en lista de espera.",
    pending: ["Evaluar continuidad con la profesora", "Consultar alternativas con los alumnos"],
  },
  {
    id: 4,
    kind: "add",
    status: "accepted",
    title: "Reforzar una clase",
    activity: "Funcional",
    location: "Sede Centro",
    room: "Sala Funcional",
    slot: "Lunes · 19:00",
    period: "05 ago – 21 oct 2026",
    observations: 12,
    occupancy: 96,
    recurrence: 92,
    freeSpots: 0,
    waitlist: 9,
    affected: 0,
    alternative: "Miércoles · 20:00",
    alternativeRoom: "Sala Funcional · 14 lugares",
    reason: "Demanda alta y sostenida, con lista de espera activa.",
    pending: ["Confirmar disponibilidad de la profesora"],
    decidedBy: "Mariana López",
    decidedAt: "30 oct 2026 · 16:42",
  },
];

const kindMeta: Record<Kind, { label: string; color: string; bg: string }> = {
  add: { label: "Ampliar oferta", color: "purple.700", bg: "purple.50" },
  move: { label: "Reubicar", color: "blue.700", bg: "blue.50" },
  review: { label: "Revisar oferta", color: "orange.700", bg: "orange.50" },
};

const statusMeta: Record<Status, { label: string; scheme: string }> = {
  pending: { label: "Pendiente", scheme: "orange" },
  accepted: { label: "Aceptada", scheme: "green" },
  discarded: { label: "Descartada", scheme: "gray" },
};

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box>
      <Text fontSize="11px" color="text.muted" textTransform="uppercase" letterSpacing=".04em" fontWeight={600}>{label}</Text>
      <Text fontSize="18px" fontWeight={650} color="text.primary" mt={0.5}>{value}</Text>
      {hint && <Text fontSize="12px" color="text.secondary">{hint}</Text>}
    </Box>
  );
}

export default function RecommendationsPage() {
  const [items, setItems] = useState(initialRecommendations);
  const [status, setStatus] = useState<Status | "all">("pending");
  const [kind, setKind] = useState<Kind | "all">("all");
  const [location, setLocation] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [weeks, setWeeks] = useState(12);
  const [minimum, setMinimum] = useState(8);
  const [high, setHigh] = useState(80);
  const [low, setLow] = useState(50);
  const [recurrence, setRecurrence] = useState(60);
  const settings = useDisclosure();
  const detail = useDisclosure();
  const toast = useToast();

  const visible = useMemo(() => items.filter((item) =>
    (status === "all" || item.status === status) &&
    (kind === "all" || item.kind === kind) &&
    (location === "all" || item.location === location)
  ), [items, status, kind, location]);

  const decide = (id: number, next: Status) => {
    setItems((current) => current.map((item) => item.id === id ? {
      ...item,
      status: next,
      decidedBy: "Mariana López",
      decidedAt: "04 nov 2026 · 10:30",
    } : item));
    toast({
      title: next === "accepted" ? "Recomendación aceptada" : "Recomendación descartada",
      description: "La decisión quedó registrada. No se modificó ninguna clase.",
      status: next === "accepted" ? "success" : "info",
      duration: 3500,
      isClosable: true,
    });
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const highDemand = items.filter((i) => i.kind === "add" && i.status === "pending").length;
  const lowDemand = items.filter((i) => (i.kind === "move" || i.kind === "review") && i.status === "pending").length;
  const selected = items.find((item) => item.id === selectedId) ?? null;

  const openDetail = (id: number) => {
    setSelectedId(id);
    detail.onOpen();
  };

  return (
    <PageContainer>
      <PageHeader
        level="page"
        title="Recomendaciones"
        description="Oportunidades detectadas a partir de la ocupación y las listas de espera."
        actions={<>
          <Button leftIcon={<Icon path={mdiHistory} size={0.68} />} onClick={() => setStatus("all")}>Ver todas</Button>
          <Button variant="primary" leftIcon={<Icon path={mdiCogOutline} size={0.68} />} onClick={settings.onOpen}>Configurar análisis</Button>
        </>}
      />

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={5}>
        {[
          { label: "Pendientes de revisión", value: pendingCount, help: "Requieren una decisión", icon: mdiLightbulbOnOutline, color: "brand.500", bg: "brand.50" },
          { label: "Alta demanda", value: highDemand, help: "Oportunidades de ampliar", icon: mdiAccountGroupOutline, color: "green.600", bg: "green.50" },
          { label: "Baja ocupación", value: lowDemand, help: "Franjas para revisar", icon: mdiAlertCircleOutline, color: "orange.600", bg: "orange.50" },
        ].map((card) => (
          <Surface key={card.label} p={4}>
            <HStack spacing={3}>
              <Flex w="42px" h="42px" borderRadius="12px" bg={card.bg} color={card.color} align="center" justify="center">
                <Icon path={card.icon} size={0.9} />
              </Flex>
              <Stat>
                <StatLabel fontSize="12px" color="text.secondary" fontWeight={500}>{card.label}</StatLabel>
                <HStack align="baseline" spacing={2}><StatNumber fontSize="24px">{card.value}</StatNumber><Text fontSize="12px" color="text.muted">{card.help}</Text></HStack>
              </Stat>
            </HStack>
          </Surface>
        ))}
      </SimpleGrid>

      <Surface mb={4} p={3}>
        <Flex gap={3} direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "center" }}>
          <HStack color="text.secondary" px={1} flexShrink={0}><Icon path={mdiTuneVariant} size={0.72} /><Text fontSize="13px" fontWeight={600}>Filtrar por</Text></HStack>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={2} flex="1">
            <Select size="sm" value={status} onChange={(e) => setStatus(e.target.value as Status | "all")} aria-label="Estado">
              <option value="pending">Pendientes</option><option value="accepted">Aceptadas</option><option value="discarded">Descartadas</option><option value="all">Todos los estados</option>
            </Select>
            <Select size="sm" value={kind} onChange={(e) => setKind(e.target.value as Kind | "all")} aria-label="Tipo">
              <option value="all">Todas las acciones</option><option value="add">Ampliar oferta</option><option value="move">Reubicar</option><option value="review">Revisar oferta</option>
            </Select>
            <Select size="sm" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Sede">
              <option value="all">Todas las sedes</option><option value="Sede Palermo">Sede Palermo</option><option value="Sede Centro">Sede Centro</option>
            </Select>
          </SimpleGrid>
          <Text fontSize="12px" color="text.muted" whiteSpace="nowrap">Análisis actual · 12 semanas</Text>
        </Flex>
      </Surface>

      <Surface overflow="hidden">
        <Flex px={4} py={3} borderBottom="1px solid" borderColor="border.subtle" justify="space-between" align="center">
          <Text fontSize="13px" fontWeight={650}>{visible.length} {visible.length === 1 ? "recomendación" : "recomendaciones"}</Text>
          <Text fontSize="12px" color="text.muted">Seleccioná una fila para ver la evidencia</Text>
        </Flex>
        {visible.length > 0 ? (
          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead bg="bg.subtle">
                <Tr>
                  <Th py={3}>Actividad y franja</Th>
                  <Th display={{ base: "none", md: "table-cell" }}>Sede / sala</Th>
                  <Th isNumeric>Ocupación</Th>
                  <Th isNumeric display={{ base: "none", lg: "table-cell" }}>Recurrencia</Th>
                  <Th isNumeric display={{ base: "none", md: "table-cell" }}>Espera</Th>
                  <Th>Recomendación</Th>
                  <Th>Estado</Th>
                  <Th w="90px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {visible.map((item) => {
                  const meta = kindMeta[item.kind];
                  const state = statusMeta[item.status];
                  return (
                    <Tr key={item.id} cursor="pointer" onClick={() => openDetail(item.id)} _hover={{ bg: "bg.hover" }} transition="background-color 120ms ease">
                      <Td py={3.5}>
                        <Text fontSize="13px" fontWeight={650}>{item.activity}</Text>
                        <Text fontSize="12px" color="text.secondary" mt={0.5}>{item.slot}</Text>
                      </Td>
                      <Td display={{ base: "none", md: "table-cell" }}><Text fontSize="12px">{item.location}</Text><Text fontSize="11px" color="text.muted">{item.room}</Text></Td>
                      <Td isNumeric><Text fontWeight={650} color={item.kind === "add" ? "green.600" : "orange.600"}>{item.occupancy} %</Text></Td>
                      <Td isNumeric display={{ base: "none", lg: "table-cell" }}><Text fontSize="12px">{item.recurrence} %</Text><Text fontSize="11px" color="text.muted">{Math.round(item.observations * item.recurrence / 100)} de {item.observations}</Text></Td>
                      <Td isNumeric display={{ base: "none", md: "table-cell" }}><Text fontWeight={item.waitlist ? 650 : 400}>{item.waitlist}</Text></Td>
                      <Td><Badge bg={meta.bg} color={meta.color} borderRadius="full" px={2.5} py={1} textTransform="none" whiteSpace="nowrap">{meta.label}</Badge></Td>
                      <Td><Badge colorScheme={state.scheme} variant="subtle" borderRadius="full" px={2.5} py={1} textTransform="none">{state.label}</Badge></Td>
                      <Td textAlign="right"><Button size="xs" onClick={(event) => { event.stopPropagation(); openDetail(item.id); }}>Ver detalle</Button></Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        ) : <Box p={10} textAlign="center"><Text fontWeight={600}>No hay recomendaciones con estos filtros</Text><Text fontSize="13px" color="text.muted" mt={1}>Probá cambiando el estado, la acción o la sede.</Text></Box>}
      </Surface>

      <Modal isOpen={detail.isOpen} onClose={detail.onClose} size="xl" isCentered scrollBehavior="outside">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <ModalContent maxW={{ base: "calc(100vw - 24px)", md: "760px" }} maxH={{ base: "calc(100vh - 24px)", lg: "none" }} borderRadius={{ base: "12px", md: "16px" }} overflow={{ base: "hidden", lg: "visible" }}>
          <ModalCloseButton top={4} right={4} />
          {selected && <>
            <ModalHeader borderBottomWidth="1px" pr={14} px={{ base: 5, md: 6 }} py={5}>
              <HStack spacing={2} mb={2} wrap="wrap">
                <Badge bg={kindMeta[selected.kind].bg} color={kindMeta[selected.kind].color} borderRadius="full" px={2.5} py={1} textTransform="none">{kindMeta[selected.kind].label}</Badge>
                <Badge colorScheme={statusMeta[selected.status].scheme} variant="subtle" borderRadius="full" px={2.5} py={1} textTransform="none">{statusMeta[selected.status].label}</Badge>
              </HStack>
              <Text fontSize="20px">{selected.title}</Text>
              <Text fontSize="14px" color="text.secondary" fontWeight={500} mt={1}>{selected.activity}</Text>
            </ModalHeader>
            <ModalBody py={5} px={{ base: 5, md: 6 }} overflowY={{ base: "auto", lg: "visible" }}>
              <Stack spacing={6}>
                <Box>
                  <Text fontSize="11px" color="text.muted" textTransform="uppercase" fontWeight={650} letterSpacing=".04em" mb={2}>Franja analizada</Text>
                  <Stack spacing={2}>
                    <HStack><Icon path={mdiMapMarkerOutline} size={0.62} /><Text fontSize="13px">{selected.location} · {selected.room}</Text></HStack>
                    <HStack><Icon path={mdiClockOutline} size={0.62} /><Text fontSize="13px">{selected.slot}</Text></HStack>
                    <HStack><Icon path={mdiCalendarRange} size={0.62} /><Text fontSize="13px">{selected.period}</Text></HStack>
                  </Stack>
                </Box>
                <SimpleGrid columns={2} spacing={4} p={4} bg="bg.subtle" borderRadius="12px">
                  <Metric label="Ocupación" value={`${selected.occupancy} %`} />
                  <Box><Metric label="Recurrencia" value={`${selected.recurrence} %`} hint={`${Math.round(selected.observations * selected.recurrence / 100)} de ${selected.observations} clases`} /><Progress value={selected.recurrence} colorScheme={selected.kind === "add" ? "green" : "orange"} size="xs" mt={1.5} borderRadius="full" /></Box>
                  <Metric label="Lista de espera" value={`${selected.waitlist} personas`} />
                  <Metric label={selected.kind === "add" ? "Cupos libres" : "Alumnos afectados"} value={String(selected.kind === "add" ? selected.freeSpots : selected.affected)} />
                </SimpleGrid>
                <Box><Text fontSize="13px" fontWeight={650} mb={2}>Por qué se recomienda</Text><Text fontSize="13px" lineHeight="1.7" color="text.secondary">{selected.reason}</Text></Box>
                {selected.alternative && <Box p={4} border="1px solid" borderColor="brand.200" bg="brand.50" borderRadius="12px">
                  <Text fontSize="11px" color="text.brand" textTransform="uppercase" fontWeight={650} letterSpacing=".04em">Alternativa propuesta</Text>
                  <Flex mt={3} gap={3} align="center"><Box flex="1"><Text fontSize="11px" color="text.muted">Origen</Text><Text fontSize="13px" fontWeight={600}>{selected.slot}</Text></Box><Icon path={mdiArrowRight} size={0.75} /><Box flex="1"><Text fontSize="11px" color="text.muted">Destino</Text><Text fontSize="13px" fontWeight={600}>{selected.alternative}</Text><Text fontSize="11px" color="text.secondary">{selected.alternativeRoom}</Text></Box></Flex>
                  {selected.kind === "add" && <HStack mt={3} color="blue.700" bg="blue.50" borderRadius="8px" px={3} py={2} align="flex-start"><Icon path={mdiInformationOutline} size={0.65} /><Text fontSize="12px">Es un horario nuevo: todavía no cuenta con demanda histórica propia.</Text></HStack>}
                </Box>}
                <Box><Text fontSize="13px" fontWeight={650} mb={2}>Condiciones por confirmar</Text><Stack spacing={2}>{selected.pending.map((condition) => <HStack key={condition} align="flex-start"><Box color="orange.500" mt="2px"><Icon path={mdiAlertCircleOutline} size={0.58} /></Box><Text fontSize="13px" color="text.secondary">{condition}</Text></HStack>)}</Stack></Box>
                <Box p={3} bg="bg.subtle" borderRadius="8px"><Text fontSize="12px" color="text.secondary"><b>Regla aplicada:</b> {selected.kind === "add" ? "ocupación ≥ 80 %" : "ocupación ≤ 50 %"} en ≥ 60 % de {selected.observations} observaciones.</Text></Box>
                {selected.status !== "pending" && <Text fontSize="12px" color="text.secondary">Decisión registrada por <b>{selected.decidedBy}</b> · {selected.decidedAt}</Text>}
              </Stack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px" display="block" px={{ base: 5, md: 6 }} py={4}>
              {selected.status === "pending" ? <><Text fontSize="11px" color="text.muted" mb={3}>Aceptar registra la decisión; no modifica la agenda.</Text><HStack justify="flex-end"><Button leftIcon={<Icon path={mdiWindowClose} size={0.6} />} onClick={() => decide(selected.id, "discarded")}>Descartar</Button><Button variant="primary" leftIcon={<Icon path={mdiCheck} size={0.6} />} onClick={() => decide(selected.id, "accepted")}>Aceptar recomendación</Button></HStack></> : <Button w="100%" onClick={detail.onClose}>Cerrar</Button>}
            </ModalFooter>
          </>}
        </ModalContent>
      </Modal>

      <Modal isOpen={settings.isOpen} onClose={settings.onClose} size="xl" isCentered scrollBehavior="outside">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <ModalContent maxW={{ base: "calc(100vw - 24px)", md: "680px" }} borderRadius={{ base: "12px", md: "16px" }} overflow="hidden">
          <ModalCloseButton top={4} right={4} />
          <ModalHeader borderBottomWidth="1px" px={{ base: 5, md: 6 }} py={5} pr={14}>
            <Text fontSize="20px">Configurar análisis</Text>
            <Text mt={1} fontSize="13px" color="text.secondary" fontWeight={400}>Definí qué datos se comparan y cuándo una franja genera una recomendación.</Text>
          </ModalHeader>
          <ModalBody px={{ base: 5, md: 6 }} py={5}>
            <Stack spacing={4}>
              <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="12px">
                <Text fontSize="14px" fontWeight={650}>Período y muestra</Text>
                <Text fontSize="12px" color="text.muted" mt={0.5} mb={4}>Cantidad de semanas y clases necesarias para considerar confiable el análisis.</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl><FormLabel>Ventana de análisis</FormLabel><Select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}><option value={8}>8 semanas</option><option value={10}>10 semanas</option><option value={12}>12 semanas</option></Select><FormHelperText>Período de clases comparables.</FormHelperText></FormControl>
                  <FormControl><FormLabel>Mínimo de clases</FormLabel><NumberInput min={1} max={30} value={minimum} onChange={(_, n) => setMinimum(n)}><NumberInputField /></NumberInput><FormHelperText>Si no se alcanza: “Datos insuficientes”.</FormHelperText></FormControl>
                </SimpleGrid>
              </Box>

              <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="12px">
                <Text fontSize="14px" fontWeight={650}>Reglas de clasificación</Text>
                <Text fontSize="12px" color="text.muted" mt={0.5} mb={4}>Umbrales usados para detectar demanda alta o subutilización recurrente.</Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl><FormLabel>Alta demanda</FormLabel><NumberInput min={1} max={100} value={high} onChange={(_, n) => setHigh(n)}><NumberInputField /></NumberInput><FormHelperText>Ocupación ≥ {high} %</FormHelperText></FormControl>
                  <FormControl><FormLabel>Subutilización</FormLabel><NumberInput min={1} max={100} value={low} onChange={(_, n) => setLow(n)}><NumberInputField /></NumberInput><FormHelperText>Ocupación ≤ {low} %</FormHelperText></FormControl>
                  <FormControl><FormLabel>Recurrencia</FormLabel><NumberInput min={1} max={100} value={recurrence} onChange={(_, n) => setRecurrence(n)}><NumberInputField /></NumberInput><FormHelperText>En ≥ {recurrence} % de clases</FormHelperText></FormControl>
                </SimpleGrid>
              </Box>

              <Flex bg="brand.50" border="1px solid" borderColor="brand.200" borderRadius="10px" p={3.5} gap={3} align="flex-start">
                <Box color="brand.600" mt="1px"><Icon path={mdiInformationOutline} size={0.72} /></Box>
                <Box><Text fontSize="12px" fontWeight={650} color="text.brand">Resumen de la regla</Text><Text fontSize="12px" color="text.secondary" mt={0.5}>Se analizarán {weeks} semanas, con al menos {minimum} clases. Alta demanda desde {high} % y subutilización hasta {low} %, sostenidas en {recurrence} % de las observaciones.</Text></Box>
              </Flex>
            </Stack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" px={{ base: 5, md: 6 }} py={4}>
            <Button mr={3} onClick={settings.onClose}>Cancelar</Button>
            <Button variant="primary" onClick={() => { settings.onClose(); toast({ title: "Configuración guardada", description: `Próximo análisis: ${weeks} semanas y mínimo ${minimum} clases.`, status: "success", duration: 3000, isClosable: true }); }}>Guardar parámetros</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}
