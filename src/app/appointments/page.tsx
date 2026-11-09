'use client'
import {
  Box,
  Button,
  Container,
  Flex,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  HStack,
  Text,
  Input,
  IconButton,
  FormControl,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { isSelectableStudio } from "../utils/studios";
import ModalAppointmentsAdd from "../components/ModalAppointmentsAdd";
import TableAppointments from "../components/TableAppointments";
import TableFixedSlots from "../components/TableFixedSlots";
import ModalTeacherTurnAdd from "../components/ModalTeacherTurnAdd";
import { useAuthStore } from "../stores/auth";
import TableTeachersTurn from "../components/TableTeachersTurn";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { getAppointments, getTeachersTurn, getStudios } from "..//stores/studioSlice";
import { FiGrid, FiList, FiPlus, FiSearch } from "react-icons/fi";
import { Select as Select2 } from "../components/ui/Select";
import SearchField from "../components/ui/SearchField";
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";
import { useStudioStore } from "../stores/studio";

const Appointments = () => {
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { tipo } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);
  const [appointmentFormType, setAppointmentFormType] = useState<0 | 1>(0);
  const [visibleAppointmentType, setVisibleAppointmentType] = useState<"individual" | "fixed">("individual");
  const [teachersTurnRefreshKey, setTeachersTurnRefreshKey] = useState(0);
  const selectedStudioFromHeader = useStudioStore((state) => state.selectedStudio);
  const studioStoreHasHydrated = useStudioStore((state) => state.hasHydrated);
  const studioFilterInitialized = useRef(false);
  const [selectedStudio, setSelectedStudio] = useState<any>({
    value: "all",
    label: "Todos los estudios",
  });

  const { appointments, teachersTurn, studios } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: isOpenAdd,
    onOpen: onOpenAdd,
    onClose: onCloseAdd,
  } = useDisclosure();

  const {
    isOpen: isAlertOpenTeacherTurn,
    onOpen: onOpenModalTeacherTurn,
    onClose: onCloseModalTeacherTurn,
  } = useDisclosure();

  // 🔹 Estado para vista y buscador de TURNOS PROFESORAS
  const [viewTeachers, setViewTeachers] = useState<"grill" | "table">("grill");
  const [searchTeachers, setSearchTeachers] = useState("");

  const studioOptions = [
    { value: "all", label: "Todos los estudios" },
    ...(studios || []).filter(isSelectableStudio).map((studio: any) => ({
      value: studio.id,
      label: studio.name,
    })),
  ];

  useEffect(() => {
    if (!studioStoreHasHydrated || studioFilterInitialized.current) return;

    if (selectedStudioFromHeader?.id) {
      setSelectedStudio({
        value: selectedStudioFromHeader.id,
        label: selectedStudioFromHeader.name,
      });
    }

    studioFilterInitialized.current = true;
  }, [selectedStudioFromHeader, studioStoreHasHydrated]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      dispatch(getStudios()),
    ]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (loading) {
    return (
      <FullPageLoader message="Cargando Turnos" />
    );
  }

  return (
    <>
      <PageContainer>
        <Stack spacing={4} w="100%" align="stretch">
          <Tabs
            variant="soft-rounded"
            isFitted
            w="100%"
            onChange={(index) => setActiveTab(index)}
          >
            <TabList>
              {tipo !== "Consultor" && (
                <Tab>
                  Turnos Alumnos
                </Tab>
              )}
              {tipo !== "Consultor" && (
                <Tab>
                  Turnos Profesoras
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Panel de Turnos de Alumnos */}
              <TabPanel>
                <Tabs variant="enclosed">
                  <TabList>
                    <Tab>Turnos</Tab>
                    <Tab>Turnos fijos</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px={0}>
                <TableAppointments
                  list={appointments}
                        onOpen={() => {
                          setAppointmentFormType(0);
                          setVisibleAppointmentType("individual");
                          onOpenAdd();
                        }}
                  refreshKey={appointmentsRefreshKey}
                />
              </TabPanel>
                    <TabPanel px={0}>
                      <TableFixedSlots
                        refreshKey={appointmentsRefreshKey}
                        onOpenAdd={() => {
                          setAppointmentFormType(1);
                          setVisibleAppointmentType("fixed");
                          onOpenAdd();
                        }}
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </TabPanel>

              {/* Panel de Turnos de Profesoras */}
              {tipo !== "Consultor" && (
                <TabPanel>
                  <Flex
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "flex-start", md: "center" }}
                    justify="space-between"
                    gap={{ base: 4, md: 6 }}
                    mt={2}
                    mb={3}
                    w="100%"
                  >
                    <Box
                      w={{ base: "100%", md: "220px", lg: "280px", xl: "340px" }}
                      flexShrink={0}
                      minW={0}
                    >
                      <Text as="h2" textStyle="sectionTitle">
                        Turnos Profesoras
                      </Text>
                      <Text fontSize="sm" color="text.secondary" lineHeight="short">
                        Gestión de turnos y horarios asignados a las profesoras
                      </Text>
                    </Box>

                    <HStack
                      spacing={{ base: 3, md: 2 }}
                      w={{ base: "100%", md: "auto" }}
                      flex={{ md: "1 1 auto" }}
                      flexWrap={{
                        base: "wrap",
                        lg: viewTeachers === "table" ? "wrap" : "nowrap",
                        xl: "nowrap",
                      }}
                      justify={{ base: "flex-start", md: "flex-end" }}
                      pl={{ base: 0, xl: "10px" }}
                    >
                      {/* SELECT DE ESTUDIO PRIMERO EN TABLA */}
                      {viewTeachers === "table" && (
                        <HStack
                          px={{ base: 0, md: 1 }}
                          py={1.5}
                          rounded="full"
                          order={1}
                          flex={{ base: "1 1 100%", md: "0 0 180px", xl: "0 0 210px" }}
                          w={{ base: "100%", md: "180px", xl: "210px" }}
                          maxW={{ base: "100%", md: "180px", xl: "210px" }}
                          minW={0}
                        >
                          <Select2
                            options={studioOptions}
                            value={selectedStudio}
                            onChange={(option) =>
                              setSelectedStudio(
                                option || {
                                  value: "all",
                                  label: "Todos los estudios",
                                }
                              )
                            }
                            appearance="filter"
                            placeholder="Todos los estudios"
                            isClearable={false}
                            selectedOptionStyle="check"
                          />
                        </HStack>
                      )}

                      {/* BUSCADOR SOLO EN TABLA */}
                      {viewTeachers === "table" && (
                        <SearchField
                            w={{ base: "100%", lg: "280px", xl: "320px" }}
                            order={2}
                            placeholder="Buscar por profesora, día, horario…"
                            value={searchTeachers}
                            onChange={(e) => setSearchTeachers(e.target.value)}
                        />
                      )}

                      {/* SELECT DE ESTUDIO EN SU LUGAR ACTUAL EN GRILLA */}
                      {viewTeachers === "grill" && (
                        <HStack
                          px={{ base: 0, md: 1 }}
                          py={1.5}
                          rounded="full"
                          order={1}
                          flex={{ base: "1 1 100%", md: "0 0 180px", xl: "0 0 210px" }}
                          w={{ base: "100%", md: "180px", xl: "210px" }}
                          maxW={{ base: "100%", md: "180px", xl: "210px" }}
                          minW={0}
                        >
                          <Select2
                            options={studioOptions}
                            value={selectedStudio}
                            onChange={(option) =>
                              setSelectedStudio(
                                option || {
                                  value: "all",
                                  label: "Todos los estudios",
                                }
                              )
                            }
                            appearance="filter"
                            placeholder="Todos los estudios"
                            isClearable={false}
                            selectedOptionStyle="check"
                          />
                        </HStack>
                      )}

                      <HStack spacing={2} order={3} flexShrink={0}>
                        <IconButton
                          aria-label="Vista grilla"
                          icon={<FiGrid />}
                          size="sm"
                          onClick={() => setViewTeachers("grill")}
                          variant="toggle" isActive={viewTeachers === "grill"} aria-pressed={viewTeachers === "grill"}
                        />

                        <IconButton
                          aria-label="Vista tabla"
                          icon={<FiList />}
                          size="sm"
                          onClick={() => setViewTeachers("table")}
                          variant="toggle" isActive={viewTeachers === "table"} aria-pressed={viewTeachers === "table"}
                        />
                      </HStack>

                      <Button
                        leftIcon={<FiPlus />}
                        onClick={onOpenModalTeacherTurn}
                        w={{ base: "100%", md: "auto" }}
                        flexBasis={{ base: "100%", md: "auto" }}
                        flexShrink={0}
                        whiteSpace="nowrap"
                        order={4}
                        variant="primary"
                      >
                        Registrar Turno Profesora
                      </Button>
                    </HStack>
                  </Flex>

                  <TableTeachersTurn
                    list={teachersTurn}
                    view={viewTeachers}
                    searchTerm={searchTeachers}
                    selectedStudio={selectedStudio}
                    refreshKey={teachersTurnRefreshKey}
                  />
                </TabPanel>
              )}
            </TabPanels>

            {/* Modal Turnos Alumnos */}
            <Modal onClose={onCloseAdd} isOpen={isOpenAdd} isCentered size="300px">
              <ModalOverlay w="100%" h="100%" />
              <ModalContent
                maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
                maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
              >
                <ModalCloseButton />
                <ModalAppointmentsAdd
                  initialTurnType={appointmentFormType}
                  visibleTurnType={visibleAppointmentType}
                  onClose={() => {
                    onCloseAdd();
                    setAppointmentsRefreshKey((current) => current + 1);
                  }}
                  getAppointments={getAppointments}
                  appointments={appointments}
                />
              </ModalContent>
            </Modal>

            {/* Modal Turnos Profesoras */}
            {tipo !== "Consultor" && (
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
                    onClose={() => {
                      onCloseModalTeacherTurn();
                      setTeachersTurnRefreshKey((current) => current + 1);
                    }}
                    product={selectedRow}
                    getTeachersTurn={getTeachersTurn}
                  />
                </ModalContent>
              </Modal>
            )}
          </Tabs>
        </Stack>
      </PageContainer>
    </>
  );
};

export default Appointments;
