'use client'
import React, { useEffect, useState } from "react";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Heading,
    Stack,
    Input,
    useDisclosure,
    Container,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Spinner,
} from '@chakra-ui/react';
import axios from "axios";
import TableCashRegister from "../components/TableCashRegister";
import ModalExpenseAdd from "../components/ModalExpenseAdd";
import ModalPaymentAdd from "../components/ModalPaymentAdd";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getPayments,
    getPaymentsToday,
    getExpenses,
} from '../stores/studioSlice';
import { PageContainer } from "../components/ui/PageContainer";

interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    method: string;
}

const CashRegister = () => {
    // const [paymentsToday, setPaymentsToday] = useState([]);
    // const [payments, setPayments] = useState([]);
    // const [expenses, setExpenses] = useState([]);
    const [cashRegister, setCashRegister] = useState([]);
    const { tipo, tokens } = useAuthStore();
    const [shouldRefetch, setShouldRefetch] = useState(false);

    const {payments, paymentsToday, expenses } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const {
        isOpen: isOpenAddExpense,
        onOpen: onOpenAddExpense,
        onClose: onCloseAddExpense,
    } = useDisclosure();

    const {
        isOpen: isOpenAddPayment,
        onOpen: onOpenAddPayment,
        onClose: onCloseAddPayment,
    } = useDisclosure();

    const {
        isOpen: isOpenAddCashRegister,
        onOpen: onOpenAddCashRegister,
        onClose: onCloseAddCashRegister,
    } = useDisclosure();

    const handleCloseAddExpense = () => {
        setShouldRefetch(prev => !prev); // Cambia el estado al cerrar
        onCloseAddExpense(); // Llama a la función del hook
    };

    const handleCloseAddPayment = () => {
        setShouldRefetch(prev => !prev); // Cambia el estado al cerrar
        onCloseAddPayment(); // Llama a la función del hook
    };


    useEffect(() => {
        dispatch(getPaymentsToday());
        dispatch(getExpenses());
        dispatch(getPayments());
    }, [dispatch]);

    return (
        <>
            <PageContainer>
                <Stack spacing={4} w="100%" align="stretch">

                    {/* Modal para agregar un gasto */}
                    <Modal onClose={onCloseAddExpense} isOpen={isOpenAddExpense} isCentered size={{ base: "300px" }}>
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalExpenseAdd onClose={handleCloseAddExpense} getExpenses={getExpenses} />
                        </ModalContent>
                    </Modal>

                    {/* Modal para agregar un gasto */}
                    <Modal onClose={onCloseAddPayment} isOpen={isOpenAddPayment} isCentered size={{ base: "300px" }}>
                        <ModalOverlay w={"100%"} h={"100%"} />
                        <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
                            <ModalCloseButton />
                            <ModalPaymentAdd onClose={handleCloseAddPayment} getPayments={tipo === "Consultor" ? getPaymentsToday : getPayments} />
                        </ModalContent>
                    </Modal>

                    <TableCashRegister
                        onOpenExpense={onOpenAddExpense}
                        onOpenPayment={onOpenAddPayment}
                        shouldRefetch={shouldRefetch}
                    />
                </Stack>
            </PageContainer>
        </>
    );
};

export default CashRegister;
