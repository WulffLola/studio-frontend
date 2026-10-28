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
    getPlanSubType,
    getSlots,
    getStudios,
    getPaymentAmount,
    getTypePlans,
    getRooms,
    getHolidays,
    getDiscounts,
    getActivitySubType,
    getActivityType,
} from '../stores/studioSlice';
import ModalDiscountAdd from "../components/ModalDiscountAdd";
import ModalTypePlansAdd from "../components/ModalTypePlansAdd";
import TablePlansSubType from "../components/TablePlansSubType";
import TableActivityType from "../components/TableActivityType";
import ModalActivityTypeAdd from "../components/ModalActivityTypeAdd";
import TableActivitySubType from "../components/TableActivitySubType";
import ModalActivitySubTypeAdd from "../components/ModalActivitySubTypeAdd";
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const Plans = () => {
    const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa
    // const [activeSubTab, setActiveSubTab] = useState(0);
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const isSuper = tipo === "Super" || tipo === "SUPER";

    // const [paymentsAmount, setPaymentsAmount] = useState([])
    // const [plans, setPlans] = useState([])
    // const [slots, setSlots] = useState([])
    // const [studios, setStudios] = useState([])

    const { studios, slots, plansSubType, amounts, typePlans, rooms, holidays, discounts, activityType, activitySubType } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const {
        isOpen: isOpenAdd,
        onOpen: onOpenAdd,
        onClose: onCloseAdd,
    } = useDisclosure();

    const {
        isOpen: isOpenAddPlansSubType,
        onOpen: onOpenAddPlansSubType,
        onClose: onCloseAddPlansSubType,
    } = useDisclosure();

    const {
        isOpen: isOpenAddDiscount,
        onOpen: onOpenAddDiscount,
        onClose: onCloseAddDiscount,
    } = useDisclosure();

    const {
        isOpen: isOpenAddActivitySubType,
        onOpen: onOpenAddActivitySubType,
        onClose: onCloseAddActivitySubType,
    } = useDisclosure();

    const {
        isOpen: isOpenAddActivityType,
        onOpen: onOpenAddActivityType,
        onClose: onCloseAddActivityType,
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

    console.log(activityType)

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
            dispatch(getPlanSubType());
            dispatch(getActivitySubType());
            dispatch(getActivityType());
            if (isSuper) {
                dispatch(getTypePlans());
            }
            dispatch(getDiscounts());
        }
    }, [loading, isSuper]);

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
                                Precios
                            </Tab>
                            <Tab>
                                Planes/Actividades
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* Panel de Precios con Subpestañas */}
                            <TabPanel>
                                <Tabs variant="line">
                                    <TabList>
                                        <Tab>
                                            Precios
                                        </Tab>
                                        <Tab>
                                            Descuentos
                                        </Tab>
                                    </TabList>

                                    <TabPanels>
                                        {/* Panel de Precios/Planes */}
                                        <TabPanel>
                                            {/* Panel de Precios */}
                                            <TablePrice
                                                list={amounts}
                                                onOpen={onOpenAddPaymentsAmount}
                                            />
                                        </TabPanel>
                                        <TabPanel>
                                            <TableDiscounts list={discounts} onOpen={onOpenAddDiscount} />
                                        </TabPanel>
                                    </TabPanels>
                                </Tabs>
                            </TabPanel>

                            {/* Panel de Horarios/Estudios */}
                            <TabPanel>
                                <Tabs variant="line">
                                    <TabList>
                                        <Tab>
                                            Actividades
                                        </Tab>
                                        <Tab>
                                            Tipos actividades
                                        </Tab>
                                        <Tab>
                                            Planes
                                        </Tab>
                                        {isSuper && (
                                            <Tab>
                                                Tipos planes
                                            </Tab>
                                        )}

                                    </TabList>
                                    <TabPanels>
                                        {/* Panel de Actividades */}
                                        <TabPanel>
                                            <TableActivitySubType list={activitySubType} onOpen={onOpenAddActivitySubType} />
                                        </TabPanel>{/* Panel de Tipos de actividades */}
                                        <TabPanel>
                                            <TableActivityType list={activityType} onOpen={onOpenAddActivityType} />
                                        </TabPanel>
                                        {/* Panel de Planes */}
                                        <TabPanel>
                                            <TablePlansSubType list={plansSubType} onOpen={onOpenAddPlansSubType} />
                                        </TabPanel>
                                        {isSuper && (
                                            <TabPanel>
                                                <TableTypePlans list={typePlans} onOpen={onOpenAddTypePlans} />
                                            </TabPanel>
                                        )}
                                    </TabPanels>
                                </Tabs>

                            </TabPanel>
                        </TabPanels>
                    </Tabs>

                    <Modal onClose={onCloseAddDiscount} isOpen={isOpenAddDiscount} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalDiscountAdd onClose={onCloseAddDiscount} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddPlansSubType} isOpen={isOpenAddPlansSubType} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalPlansSubTypeAdd onClose={onCloseAddPlansSubType} getPlans={getPlanSubType} isCancel={false} plansSubType={plansSubType} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddPaymentsAmount} isOpen={isOpenAddPaymentsAmount} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "720px" }} maxH="calc(100dvh - 32px)">
                            <ModalCloseButton />
                            <ModalPaymentsAmountAdd onClose={onCloseAddPaymentsAmount} getPaymentsAmount={getPaymentAmount} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    {isSuper && (
                        <Modal onClose={onCloseAddTypePlans} isOpen={isOpenAddTypePlans} isCentered size={{ base: "300px" }}  >
                            <ModalOverlay w={"100%"} h={"100%"} />
                            <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                                <ModalCloseButton />
                                <ModalTypePlansAdd onClose={onCloseAddTypePlans} isCancel={false} />
                            </ModalContent>
                        </Modal>
                    )}

                    <Modal onClose={onCloseAddActivityType} isOpen={isOpenAddActivityType} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "40%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalActivityTypeAdd onClose={onCloseAddActivityType} isCancel={false} />
                        </ModalContent>
                    </Modal>

                    <Modal onClose={onCloseAddActivitySubType} isOpen={isOpenAddActivitySubType} isCentered size={{ base: "300px" }}  >
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent  maxW={{ base: "90%", md: "90%", lg: "70%", xl: "800px" }}  maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalActivitySubTypeAdd onClose={onCloseAddActivitySubType} isCancel={false} />
                        </ModalContent>
                    </Modal>
                </Stack>
            </PageContainer>
        </>
    );

};

export default Plans;
