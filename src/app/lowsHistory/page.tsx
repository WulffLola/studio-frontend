'use client'
import { Container, Stack, Text, Spinner, useDisclosure, Modal, ModalContent, ModalOverlay, ModalCloseButton, Tabs, TabList, TabPanels, Tab, TabPanel, } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import TablePlans from "../components/TablePlansSubType";
import ModalPlansSubTypeAdd from "../components/ModalPlansSubTypeAdd";
import ModalPaymentsAmountAdd from "../components/ModalPaymentsAmountAdd";
import TablePrice from "../components/TablePrice";
import TableSlots from "../components/TableSlots";
import ModalGenerateSlots from "../components/ModalGenerateSlots";
import { useAuthStore } from "../stores/auth";
import TableLowsHistory from "../components/TableLowsHistory";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getDeletedPeople,
    getSlots,
} from '../stores/studioSlice';
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const LowsHistory = () => {
    const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa
    // const [activeSubTab, setActiveSubTab] = useState(0);
    const { tipo, tokens } = useAuthStore();
    const [loading, setLoading] = useState(true);

    const { deletedPeople, slots } =
        useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    // const [deletedPeople, setDeletedPeople] = useState([])
    // // const [plans, setPlans] = useState([])
    // const [slots, setSlots] = useState([])

    const { isOpen, onOpen, onClose } = useDisclosure();

    const {
        isOpen: isOpenAdd,
        onOpen: onOpenAdd,
        onClose: onCloseAdd,
    } = useDisclosure();

    const {
        isOpen: isOpenAddPaymentsAmount,
        onOpen: onOpenAddPaymentsAmount,
        onClose: onCloseAddPaymentsAmount,
    } = useDisclosure();

    const {
        isOpen: isOpenAddSlots,
        onOpen: onOpenAddSlots,
        onClose: onCloseAddSlots,
    } = useDisclosure();

    // async function getDeletedPeople() {
    // try {
    // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_DELETED_PEOPLE}`, {
    // headers: {
    // 'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
    // 'Content-Type': 'multipart/form-data', // Si estás usando FormData
    // },
    // });
    // console.log(response.data)
    // setDeletedPeople(response.data)
    // } catch (error) {
    // console.log(error);
    // }
    // };

    // async function getPlans() {
    // try {
    // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PLAN}`, {
    // headers: {
    // 'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
    // 'Content-Type': 'multipart/form-data', // Si estás usando FormData
    // },
    // });
    // setPlans(response.data)
    // } catch (error) {
    // console.log(error);
    // }
    // };

    // async function getSlots() {
    // try {
    // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_SLOTS}`, {
    // headers: {
    // 'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
    // 'Content-Type': 'multipart/form-data', // Si estás usando FormData
    // },
    // });
    // setSlots(response.data)
    // } catch (error) {
    // console.log(error);
    // }
    // };

    useEffect(() => {
        // Simulamos una carga de datos o componentes
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000); // Cambia este tiempo según tus necesidades

        return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
        if (!loading) {
            dispatch(getDeletedPeople());
            // getPlans();
            dispatch(getSlots());
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
                    <TableLowsHistory
                        list={deletedPeople}
/*                         getDeletedPeople={getDeletedPeople}
 */                    />
                </Stack>
            </PageContainer>
        </>
    );
};

export default LowsHistory;