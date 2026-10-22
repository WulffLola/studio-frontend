'use client'
import { Button, Container, Modal, ModalCloseButton, ModalContent, ModalOverlay, Spinner, Stack, useDisclosure } from "@chakra-ui/react";
import ModalStudentAdd from "../components/ModalStudentAdd";
import { useEffect, useState } from "react";
import axios from "axios";
import TableStudents from "../components/TableStudents";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getPeoples,
  getAppointments,
} from '../stores/studioSlice';
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const Students = () => {
  // const [peoples, setPeoples] = useState([])
  const [loading, setLoading] = useState(true);

  const { peoples } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();


  const { isOpen, onOpen, onClose } = useDisclosure();
  const { tipo, tokens } = useAuthStore();


  const {
    isOpen: isOpenAdd,
    onOpen: onOpenAdd,
    onClose: onCloseAdd,
  } = useDisclosure();
  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit,
  } = useDisclosure();

  // async function getPeoples() {
  // try {
  // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PEOPLE}`, {
  // headers: {
  // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
  // 'Content-Type': 'application/json',
  // },
  // });
  // setPeoples(response.data)
  // } catch (error) {
  // console.log(error);
  // }
  // };

  useEffect(() => {
    dispatch(getPeoples());
  }, [dispatch]);

  useEffect(() => {
    // Simulamos una carga de datos o componentes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Cambia este tiempo según tus necesidades

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <FullPageLoader />
    );
  }

  return (
    <>
      <PageContainer>
        <Stack spacing={4} w="100%" align="stretch">
          <Modal onClose={onCloseAdd} isOpen={isOpenAdd} isCentered size={{ base: "300px" }}  >
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalStudentAdd onClose={onCloseAdd} getPeoples={getPeoples} peoples={peoples} />
            </ModalContent>
          </Modal>
          <TableStudents list={peoples} onOpen={onOpenAdd} getPeoples={getPeoples} />
        </Stack>
      </PageContainer>

    </>
  );

};

export default Students;