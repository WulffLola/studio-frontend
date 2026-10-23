'use client'
import { Container, Stack, Text, Spinner, useDisclosure, Modal, ModalContent, ModalOverlay, ModalCloseButton, Tabs, TabList, TabPanels, Tab, TabPanel, } from "@chakra-ui/react";
import TableTeachers from "../components/TableTeachers";
import { useEffect, useState } from "react";
import axios from "axios";
import ModalTeacherAdd from "../components/ModalTeacherAdd";
import TableTeachersExtraHours from "../components/TableTeachersExtraHours";
import ModalExtraHoursAdd from "../components/ModalExtraHoursAdd";
import TablePlans from "../components/TablePlansSubType";
import ModalPlansSubTypeAdd from "../components/ModalPlansSubTypeAdd";
import ModalPaymentsAmountAdd from "../components/ModalPaymentsAmountAdd";
import TablePrice from "../components/TablePrice";
import TableSlots from "../components/TableSlots";
import ModalGenerateSlots from "../components/ModalGenerateSlots";
import { useAuthStore } from "../stores/auth";
import TableStudios from "../components/TableStudios";
import ModalStudioAdd from "../components/ModalStudioAdd";
import TableTypePlans from "../components/TableTypePlans";
import TableDiscounts from "../components/TableDiscounts";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getPlans,
    getSlots,
    getStudios,
    getPaymentAmount,
    getTypePlans,
    getRooms,
    getSlotTemplates,
    getHolidays,
    getDiscounts,
} from '../stores/studioSlice';
import TableRooms from "../components/TableRooms";
import ModalRoomsAdd from "../components/ModalRoomsAdd";
import { getHolidaysMap } from "react-datepicker/dist/date_utils";
import TableHolidays from "../components/TableHolidays";
import ModalHolidayAdd from "../components/ModalHolidayAdd";
import ModalDiscountAdd from "../components/ModalDiscountAdd";
import TableSlotTemplates from "../components/TableSlotTemplates";
import ModalSlotEdit from "../components/ModalSlotEdit";
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const Studios = () => {
    const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa
    // const [activeSubTab, setActiveSubTab] = useState(0);
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [selectedSlotTemplate, setSelectedSlotTemplate] = useState<any>(null);

    // const [paymentsAmount, setPaymentsAmount] = useState([])
    // const [plans, setPlans] = useState([])
    // const [slots, setSlots] = useState([])
    // const [studios, setStudios] = useState([])

    const { studios, slots, plans, paymentAmount, typePlans, rooms, holidays, discounts, slotTemplates } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const {
        isOpen: isOpenAdd,
        onOpen: onOpenAdd,
        onClose: onCloseAdd,
    } = useDisclosure();

    const {
        isOpen: isOpenAddPlans,
        onOpen: onOpenAddPlans,
        onClose: onCloseAddPlans,
    } = useDisclosure();

    const {
        isOpen: isOpenAddDiscount,
        onOpen: onOpenAddDiscount,
        onClose: onCloseAddDiscount,
    } = useDisclosure();

    const {
        isOpen: isOpenAddTypePlans,
        onOpen: onOpenAddTypePlans,
        onClose: onCloseAddTypePlans,
    } = useDisclosure();


    const {
        isOpen: isOpenAddPaymentsAmount,
        onOpen: onOpenAddPaymentsAmount,
        onClose: onCloseAddPaymentsAmount,
    } = useDisclosure();

    const {
        isOpen: isOpenAddRooms,
        onOpen: onOpenAddRooms,
        onClose: onCloseAddRooms,
    } = useDisclosure();

    const {
        isOpen: isOpenAddSlots,
        onOpen: onOpenAddSlots,
        onClose: onCloseAddSlots,
    } = useDisclosure();

    const {
        isOpen: isOpenEditSlotTemplate,
        onOpen: onOpenEditSlotTemplate,
        onClose: onCloseEditSlotTemplate,
    } = useDisclosure();

    const handleEditSlotTemplate = (template: any) => {
        setSelectedSlotTemplate(template);
        onOpenEditSlotTemplate();
    };

    const {
        isOpen: isOpenAddStudios,
        onOpen: onOpenAddStudios,
        onClose: onCloseAddStudios,
    } = useDisclosure();

    const {
        isOpen: isOpenAddHolidays,
        onOpen: onOpenAddHolidays,
        onClose: onCloseAddHolidays,
    } = useDisclosure();

    useEffect(() => {
        // Simulamos una carga de datos o componentes
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000); // Cambia este tiempo según tus necesidades

        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        if (!loading) {
            dispatch(getPaymentAmount());
            dispatch(getPlans());
            dispatch(getSlots());
            dispatch(getStudios());
            dispatch(getTypePlans());
            dispatch(getHolidays());
            dispatch(getDiscounts());
            dispatch(getSlotTemplates());

        }
    }, [loading]);

    if (loading) {
        return (
            <FullPageLoader />
        );
    }

    return (
        <>
            <PageContainer>
                <Stack spacing={4} w="100%" align="stretch">
                    <Tabs variant="soft-rounded" isFitted w="100%" >
                        <TabList>
                            <Tab>
                                Feriados/Horarios
                            </Tab>
                            <Tab>
                                Estudios/Salas
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Panel de Precios con Subpestañas */}
                            <TabPanel>
                                <Tabs variant="line">
                                    <TabList>
                                        <Tab>
                                            Feriados
                                        </Tab>
                                        <Tab>
                                            Horarios
                                        </Tab>
                                        <Tab>
                                            Plantillas de horarios
                                        </Tab>
                                    </TabList>

                                    <TabPanels>
                                        {/* Panel de Feriados */}
                                        <TabPanel>
                                            <TableHolidays onOpen={onOpenAddHolidays} />
                                        </TabPanel>
                                        {/* Panel de horarios */}
                                        <TabPanel>
                                            <TableSlots list={slots} />
                                        </TabPanel>
                                        <TabPanel>
                                            <TableSlotTemplates
                                                list={slotTemplates}
                                                onOpen={onOpenAddSlots}
                                                onEdit={handleEditSlotTemplate}
                                                getSlotTemplates={getSlotTemplates}
                                            />
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </TabPanel>

                            {/* Panel de Horarios/Estudios */}
                            <TabPanel>
                                <Tabs variant="line">
                                    <TabList>
                                        <Tab>
                                            Salas
                                        </Tab>
                                        <Tab>
                                            Estudios
                                        </Tab>

                                    </TabList>
                                    <TabPanels>
                                        {/* Panel de Salas */}
                                        <TabPanel>
                                            <TableRooms onOpen={onOpenAddRooms} />
                                        </TabPanel>
                                        {/* Panel de Estudios */}
                                        <TabPanel>
                                            <TableStudios onOpen={onOpenAddStudios} />
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>

                            </TabPanel>
                        </TabPanels>
                    </Tabs>

                    <Modal onClose={onCloseAddPlans} isOpen={isOpenAddPlans} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalPlansSubTypeAdd onClose={onCloseAddPlans} getPlans={getPlans} isCancel={false} plans={plans} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddDiscount} isOpen={isOpenAddDiscount} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalDiscountAdd onClose={onCloseAddDiscount} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddPaymentsAmount} isOpen={isOpenAddPaymentsAmount} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "720px" }} maxH="calc(100dvh - 32px)">
                            <ModalCloseButton />
                            <ModalPaymentsAmountAdd onClose={onCloseAddPaymentsAmount} getPaymentsAmount={getPaymentAmount} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    {/* <Modal onClose={onCloseAddTypePlans} isOpen={isOpenAddTypePlans} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalTypePlansAdd onClose={onCloseAddTypePlans} isCancel={false} />
                        </ModalContent>
                    </Modal> */}

                    <Modal onClose={onCloseAddSlots} isOpen={isOpenAddSlots} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalGenerateSlots onClose={onCloseAddSlots} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseEditSlotTemplate} isOpen={isOpenEditSlotTemplate} isCentered size={{ base: "300px" }}>
                        <ModalOverlay w="100%" h="100%" />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }} overflowY="auto">
                            <ModalCloseButton />
                            {selectedSlotTemplate && (
                                <ModalSlotEdit
                                    product={selectedSlotTemplate}
                                    onClose={onCloseEditSlotTemplate}
                                    getSlots={() => dispatch(getSlotTemplates())}
                                />
                            )}
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddStudios} isOpen={isOpenAddStudios} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalStudioAdd onClose={onCloseAddStudios} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddRooms} isOpen={isOpenAddRooms} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalRoomsAdd onClose={onCloseAddRooms} isCancel={false} />
                        </ModalContent>
                    </Modal>
                    <Modal onClose={onCloseAddHolidays} isOpen={isOpenAddHolidays} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalHolidayAdd onClose={onCloseAddHolidays} isCancel={false} />
                        </ModalContent>
                    </Modal>
                </Stack>
            </PageContainer>
        </>
    );

};

export default Studios;
