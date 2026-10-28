'use client'
import { Container, Stack, Text, Spinner, useDisclosure, Modal, ModalContent, ModalOverlay, ModalCloseButton, Tabs, TabList, TabPanels, Tab, TabPanel, } from "@chakra-ui/react";
import TableTeachers from "../components/TableTeachers";
import { useEffect, useState } from "react";
import axios from "axios";
import ModalTeacherAdd from "../components/ModalTeacherAdd";
import TableTeachersExtraHours from "../components/TableTeachersExtraHours";
import ModalExtraHoursAdd from "../components/ModalExtraHoursAdd";
import TableTeachersHours from "../components/TableTeachersHours";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getTeachers,
  getExtraHours,
  getTeacherHours,

} from '../stores/studioSlice';
import { FullPageLoader } from "../components/ui/Loaders";
import { PageContainer } from "../components/ui/PageContainer";

const Teachers = () => {
  const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa

  // const [teachers, setTeachers] = useState([])
  // const [extraHours, setExtraHours] = useState([])
  // const [teachersHours, setTeachersHours] = useState([])
  const { tipo, tokens } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const { teachers, extraHours, teacherHours } =
    useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();


  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: isOpenAdd,
    onOpen: onOpenAdd,
    onClose: onCloseAdd,
  } = useDisclosure();

  const {
    isOpen: isOpenAddExtraHours,
    onOpen: onOpenAddExtraHours,
    onClose: onCloseAddExtraHours,
  } = useDisclosure();

  // async function getTeachers() {
  // try {
  // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS}`, {
  // headers: {
  // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
  // 'Content-Type': 'application/json',
  // },
  // });
  // setTeachers(response.data)
  // } catch (error) {
  // console.log(error);
  // }
  // };

  // async function getExtraHours() {
  // try {
  // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXTRA_HOURS}`, {
  // headers: {
  // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
  // 'Content-Type': 'application/json',
  // },
  // });
  // setExtraHours(response.data)
  // } catch (error) {
  // console.log(error);
  // }
  // };

  // async function getTeachersHours() {
  // try {
  // const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_TEACHERS_HOURS}`, {
  // headers: {
  // 'Authorization': `Bearer ${tokens?.access}`, // Solo el token de acceso
  // 'Content-Type': 'application/json',
  // },
  // });
  // setTeachersHours(response.data)
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
      dispatch(getTeachers());
      dispatch(getExtraHours());
      dispatch(getTeacherHours());
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
          {/* Pestañas para cambiar entre Pagos y Gastos */}
          <Tabs
            variant="soft-rounded"
            isFitted
            w="100%"
            onChange={(index) => setActiveTab(index)} // Actualiza la pestaña activa
          >
            <TabList >
              <Tab>
                Profesoras
              </Tab>
              <Tab>
                Horas
              </Tab>
              <Tab>Horas Extras
              </Tab>
            </TabList>

            <TabPanels>
              {/* Panel de Profesoras */}
              <TabPanel>
                <TableTeachers list={teachers} onOpen={onOpenAdd} />
              </TabPanel>

              <TabPanel>
                <TableTeachersHours list={teacherHours} onOpen={onOpenAdd} getTeachersHours={getTeacherHours} />
              </TabPanel>

              {/* Panel de Horas extras */}
              <TabPanel>
                <TableTeachersExtraHours list={extraHours} onOpen={onOpenAddExtraHours} getExtraHours={getExtraHours} />
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Modal onClose={onCloseAdd} isOpen={isOpenAdd} isCentered size={{ base: "300px" }}  >
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalTeacherAdd onClose={onCloseAdd} getTeachers={getTeachers} teachers={teachers} />
            </ModalContent>
          </Modal>

          {/* Modal para agregar un gasto */}
          <Modal onClose={onCloseAddExtraHours} isOpen={isOpenAddExtraHours} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "50%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalExtraHoursAdd onClose={onCloseAddExtraHours} getExtraHours={getExtraHours} extraHours={extraHours} />
            </ModalContent>
          </Modal>
        </Stack>
      </PageContainer>

    </>
  );

};

export default Teachers;
