'use client'
import { Button, Container, Modal, ModalCloseButton, ModalContent, ModalOverlay, Spinner, Stack, useDisclosure } from "@chakra-ui/react";
import ModalStudentAdd from "../components/ModalStudentAdd";
import { useEffect, useState } from "react";
import axios from "axios";
import TableUsers from "../components/TableUsers";
import { useAuthStore } from "../stores/auth";
import ModalUserAdd from "../components/ModalUserAdd";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getUsers
} from '../stores/studioSlice';
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const Users = () => {
  // const [users, setUsers] = useState([]);
  const { login, tokens } = useAuthStore(); // Obtener el token del store de autenticación
  const [loading, setLoading] = useState(true);

  const { users } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenAdd, onOpen: onOpenAdd, onClose: onCloseAdd } = useDisclosure();
  const { isOpen: isOpenEdit, onOpen: onOpenEdit, onClose: onCloseEdit } = useDisclosure();

  // // Función para obtener los usuarios
  // async function getUsers() {
  // try {
  // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_USERS}`, {
  // headers: {
  // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
  // 'Content-Type': 'application/json',
  // },
  // });
  // setUsers(response.data);
  // } catch (error) {
  // console.log("Error al obtener usuarios:", error);
  // }
  // }

  useEffect(() => {
    // Simulamos una carga de datos o componentes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Cambia este tiempo según tus necesidades

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      dispatch(getUsers());
    }// Llamar a la API cuando el componente se monta
  }, [loading]); // Asegúrate de que el hook solo se ejecute una vez al montar el componente

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
              <ModalUserAdd onClose={onCloseAdd} getUsers={getUsers} users={users} autoComplete="off" />
            </ModalContent>
          </Modal>
          <TableUsers list={users} onOpen={onOpenAdd} getUsers={getUsers} users={users} />
        </Stack>
      </PageContainer>

    </>
  );

};
export default Users;