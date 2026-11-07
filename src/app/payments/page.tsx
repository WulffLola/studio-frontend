'use client'
import { Button, Container, Modal, ModalCloseButton, ModalContent, ModalOverlay, Stack, Tabs, TabList, TabPanels, Tab, TabPanel, useDisclosure, Spinner } from "@chakra-ui/react";
import ModalStudentAdd from "../components/ModalStudentAdd";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import TablePayments from "../components/TablePayments";
import ModalPaymentAdd from '../components/ModalPaymentAdd';
import TableExpenses from "../components/TableExpenses"; // Importar la tabla de gastos
import ModalExpenseAdd from "../components/ModalExpenseAdd";
import { useAuthStore } from "../stores/auth";
import TableExpensesType from "../components/TableExpensesType";
import ModalExpensesTypeAdd from "../components/ModalExpensesTypeAdd";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import { getPayments, getPaymentsLastMonth, getPaymentsToday, getExpenseType, getExpensesTodayTeachers, getExpenses } from '../stores/studioSlice';
import { PageContainer } from "../components/ui/PageContainer";
import { FullPageLoader } from "../components/ui/Loaders";
import { useStudioStore } from "../stores/studio";

const Payments = () => {
  // const [payments, setPayments] = useState([]);
  // const [paymentsToday, setPaymentsToday] = useState([]);
  // const [expenses, setExpenses] = useState([]); // Estado para gastos
  const [activeTab, setActiveTab] = useState(0); // Estado para controlar la pestaña activa
  const [loading, setLoading] = useState(true);
  // const [expensesType, setExpensesType] = useState([])
  // const [expensesToday, setExpensesToday] = useState([]);
  // const [paymentsLastMonth, setPaymentsLastMonth] = useState([]);
  const [updatedAppointments, setUpdatedAppointments] = useState([]);
  const [selectedExpenseStudio, setSelectedExpenseStudio] = useState<any>({
    value: "all",
    label: "Todos los estudios",
  });
  const selectedStudioFromHeader = useStudioStore((state) => state.selectedStudio);
  const studioStoreHasHydrated = useStudioStore((state) => state.hasHydrated);
  const expenseStudioFilterInitialized = useRef(false);
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0);

  const { payments, paymentsToday, paymentsLastMonth, expenseType, expensesTodayTeachers, expenses } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  const { tipo, tokens } = useAuthStore();

  useEffect(() => {
    if (!studioStoreHasHydrated) return;

    if (tipo === "Consultor") {
      setSelectedExpenseStudio(
        selectedStudioFromHeader?.id
          ? {
              value: selectedStudioFromHeader.id,
              label: selectedStudioFromHeader.name,
            }
          : { value: "all", label: "Todos los estudios" }
      );
      return;
    }

    if (expenseStudioFilterInitialized.current) return;

    if (selectedStudioFromHeader?.id) {
      setSelectedExpenseStudio({
        value: selectedStudioFromHeader.id,
        label: selectedStudioFromHeader.name,
      });
    }

    expenseStudioFilterInitialized.current = true;
  }, [selectedStudioFromHeader, studioStoreHasHydrated, tipo]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: isOpenAddPayment,
    onOpen: onOpenAddPayment,
    onClose: onCloseAddPayment,
  } = useDisclosure();

  const {
    isOpen: isOpenAddExpense,
    onOpen: onOpenAddExpense,
    onClose: onCloseAddExpense,
  } = useDisclosure();

  const {
    isOpen: isOpenAddExpenseType,
    onOpen: onOpenAddExpenseType,
    onClose: onCloseAddExpenseType,
  } = useDisclosure();

  const {
    isOpen: isOpenAdd,
    onOpen: onOpenAdd,
    onClose: onCloseAdd,
  } = useDisclosure();

  // Función para obtener pagos
  // async function getPayments() {
  //   try {
  //     const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS}`, {
  //       headers: {
  //         'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
  //         'Content-Type': 'multipart/form-data', // Si estás usando FormData
  //       },
  //     });
  //     setPayments(response.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }


  // async function getPaymentsLastMonth() {
  //   try {
  //     const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_PAYMENTS_LAST_MONTH}`, {
  //       headers: {
  //         'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
  //         'Content-Type': 'multipart/form-data', // Si estás usando FormData
  //       },
  //     });
  //     setPaymentsLastMonth(response.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // // Función para obtener gastos
  // async function getExpenses() {
  //   try {
  //     const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES}`, {
  //       headers: {
  //         'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
  //         'Content-Type': 'multipart/form-data', // Si estás usando FormData
  //       },
  //     }); // URL para los gastos
  //     setExpenses(response.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // async function getExpensesType() {
  //   try {
  //     const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES_TYPE}`, {
  //       headers: {
  //         'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
  //         'Content-Type': 'multipart/form-data', // Si estás usando FormData
  //       },
  //     });
  //     setExpensesType(response.data)
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // Función para obtener pagos de hoy
  // async function getExpensesToday() {
  //   try {
  //     const response = await axios.get(`${process.env.NEXT_PUBLIC_URL_BACKEND_TOTAL_EXPENSES_TODAY_TEACHERS
  //       }`, {
  //       headers: {
  //         'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
  //         'Content-Type': 'multipart/form-data', // Si estás usando FormData
  //       },
  //     });
  //     setExpensesToday(response.data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  useEffect(() => {
    // Simulamos una carga de datos o componentes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Cambia este tiempo según tus necesidades

    return () => clearTimeout(timer);
  }, []);

  // Este `useEffect` se ejecutará una vez cuando `loading` se haya puesto en `false`
  useEffect(() => {
    if (!loading) {
      // getPaymentsToday();
      dispatch(getExpenseType());
      dispatch(getExpensesTodayTeachers());
      dispatch(getPaymentsLastMonth());
    }
  }, [dispatch, loading]); // Este useEffect depende de `loading`

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
            <TabList>
              <Tab>
                Pagos
              </Tab>
              <Tab>
                Gastos
              </Tab>
            </TabList>

            <TabPanels>
              {/* Panel de Pagos */}
              <TabPanel>
                <TablePayments
                  list={payments}
                  onOpen={onOpenAddPayment}
                  getPayments={getPayments}
                />
              </TabPanel>

              {/* Panel de Gastos */}
              <TabPanel>
                <Tabs
                  variant="line"
                >

                  <TabList>
                    {tipo !== "Consultor" && (
                      <Tab
                      >
                        Gastos
                      </Tab>
                    )}
                    {tipo !== "Consultor" && (
                      <Tab
                      >
                        Tipos de Gastos
                      </Tab>
                    )}
                  </TabList>

                  <TabPanels>
                    {/* Panel de Gastos */}
                    <TabPanel>
                      <TableExpenses
                        list={expenses}
                        onOpen={onOpenAddExpense}
                        selectedStudio={selectedExpenseStudio}
                        setSelectedStudio={setSelectedExpenseStudio}
                        refreshKey={expenseRefreshKey}
                      />
                    </TabPanel>

                    {/* Panel de Tipos de Gastos */}
                    {tipo !== "Consultor" && (
                      <TabPanel>
                        <TableExpensesType
                          list={expenseType}
                          onOpen={onOpenAddExpenseType}
                          getExpensesType={getExpenseType}
                        />
                      </TabPanel>
                    )}
                  </TabPanels>
                </Tabs>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Modal para agregar un pago */}
          <Modal onClose={onCloseAddPayment} isOpen={isOpenAddPayment} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "60%" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalPaymentAdd onClose={onCloseAddPayment} getPayments={tipo === "Consultor" ? getPaymentsLastMonth : getPayments} setUpdatedAppointments={setUpdatedAppointments} />
            </ModalContent>
          </Modal>

          {/* Modal para agregar un gasto */}
          <Modal onClose={onCloseAddExpense} isOpen={isOpenAddExpense} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "90%", lg: "80%", xl: "800px" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalExpenseAdd
                onClose={() => {
                  onCloseAddExpense();
                  setExpenseRefreshKey((current) => current + 1);
                }}
                getExpenses={getExpenses}
              />
            </ModalContent>
          </Modal>

          {/* Modal para agregar un gasto */}
          <Modal onClose={onCloseAddExpenseType} isOpen={isOpenAddExpenseType} isCentered size={{ base: "300px" }}>
            <ModalOverlay w={"100%"} h={"100%"} />
            <ModalContent maxW={{ base: "90%", md: "70%", lg: "50%", xl: "600px" }} maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}>
              <ModalCloseButton />
              <ModalExpensesTypeAdd onClose={onCloseAddExpenseType} getExpensesType={getExpenseType} expensesType={expenseType} />
            </ModalContent>
          </Modal>
        </Stack>
      </PageContainer>
    </>
  );
};


export default Payments;
