'use client'
import { Box, Button, Container, Modal, ModalCloseButton, ModalContent, ModalOverlay, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, useDisclosure } from "@chakra-ui/react";
import ModalStudentAdd from "../components/ModalStudentAdd";
import { useEffect, useState } from "react";
import axios from "axios";
import ModalAppointmentsAdd from "../components/ModalAppointmentsAdd";
import TableAppointments from "../components/TableAppointments";
import TeachersShiftTable from "../components/TeachersShiftTable";
import ModalTeacherTurnAdd from "../components/ModalTeacherTurnAdd";
import { useAuthStore } from "../stores/auth";
import TableTeachersTurn from "../components/TableTeachersTurn";
import TableActions from "../components/TableActions";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {getUsers, getActions} from '../stores/studioSlice';
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const Actions = () => {
  // const [actions, setActions] = useState([])
  const [selectedRow, setSelectedRow] = useState([])
  const [teachersTurn, setTeachersTurn] = useState([])
  const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa
  const { tipo, tokens } = useAuthStore();
  // const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { actions, users } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();


  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const {
    isOpen: isAlertOpenTeacherTurn,
    onOpen: onOpenModalTeacherTurn,
    onClose: onCloseModalTeacherTurn,
  } = useDisclosure();


  // async function getActions() {
  // try {
  // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIONS}`, {
  // headers: {
  // 'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
  // 'Content-Type': 'multipart/form-data', // Si estás usando FormData
  // },
  // });
  // setActions(response.data)
  // } catch (error) {
  // console.log(error);
  // }
  // };

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
      dispatch(getActions())
      dispatch(getUsers()); // Llamar a la API cuando el componente se monta
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

          <TableActions
            list={actions}
            onOpen={onOpenAdd}
            getActions={getActions}
            getUsers={getUsers}
            users={users}
          />

          {/* Modales
            <Modal onClose={onCloseAdd} isOpen={isOpenAdd} isCentered size="300px">
              <ModalOverlay w="100%" h="100%" />
              <ModalContent
                maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
                maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
              >
                <ModalCloseButton />
                <ModalAppointmentsAdd
                  onClose={onCloseAdd}
                  getAppointments={getAppointments}
                />
              </ModalContent>
            </Modal> */}

          {/* ModalTeacherTurnAdd solo si tipo !== 'Consultor'
            {tipo !== "Consultor" && (
              <Modal
                onClose={onCloseModalTeacherTurn}
                isOpen={isAlertOpenTeacherTurn}
                isCentered
                size={{ base: "90%", md: "70%", lg: "80%" }}
              >
                <ModalOverlay w="100%" h="100%" />
                <ModalContent
                  maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }}
                  maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                >
                  <ModalCloseButton />
                  <ModalTeacherTurnAdd
                    onClose={onCloseModalTeacherTurn}
                    product={selectedRow}
                    getTeachersTurn={getTeachersTurn}
                  />
                </ModalContent>
              </Modal> */}


        </Stack>
      </PageContainer>



    </>
  );

};

export default Actions;