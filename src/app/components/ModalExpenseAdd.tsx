import {
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Avatar,
    AvatarBadge,
    IconButton,
    Center,
    Switch,
    Select,
    Box,
    Text,
    RadioGroup,
    Radio,
    useToast,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
    SimpleGrid,
    Input,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Spinner,
} from "@chakra-ui/react";
import { Select as Select2 } from "./ui/Select";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { getExpectedRequestStore } from "next/dist/client/components/request-async-storage.external";
import { Label } from "recharts";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getTeacherHours,
    getTeachers,
    getExpenseType,
    getExpenses,
    getExpensesTodayTeachers,
    getStudios,
} from '../stores/studioSlice';
import { useStudioStore } from "../stores/studio";
import { formatAmount, formatCurrency } from "../utils/amount";
import { LoadingOverlay } from "./ui/Loaders";

const ModalExpenseAdd = ({ product, onClose, onAddExpense }: any) => {
    // const [idPayment, setIdPayment] = useState("")
    const [observation, setObservation] = useState("")
    const [teacher, setTeacher] = useState({ id: "", name: "" })
    const [expenseMethod, setExpenseMethod] = useState("Efectivo")
    const [amount, setAmount] = useState("")
    const [method, setMethod] = useState("")
    const [type, setType] = useState({ id: "", name: "" })
    const [code, setCode] = useState("admin")
    const { tipo, tokens } = useAuthStore();
    // const [amountId, setAmountId] = useState("");
    // const [amountValue, setAmountValue] = useState("");
    const [leftHours, setLeftHours] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState({ id: "", name: "" });
    const [loading, setLoading] = useState(false);

    const { teacherHours, teachers, expenseType, studios } = useSelector((state: any) => state.studio);
    const selectedStudioFromStore = useStudioStore((state: any) => state.selectedStudio);
    const [studio, setStudio] = useState({ id: "", name: "" });


    console.log(selectedStudioFromStore)

    const dispatch = useAppDispatch();

    const toast = useToast();

    const {
        isOpen: isAlertCodeOpen,
        onOpen: onOpenModalCode,
        onClose: onCloseModalCode,
    } = useDisclosure();



    const paymentMethods = [
        { label: "Efectivo", value: "Efectivo" },
        { label: "Transferencia", value: "Transferencia" },
    ];


    const handleSubmitExpense = async (code) => {
        setLoading(true)

        console.log(studio.id)
        const formData = new FormData();
        formData.append('type_id', type.id);
        formData.append('amount', amount);
        formData.append('method', method);
        formData.append('code', code);
        formData.append('observation', observation);
        formData.append("studio", String(studio.id));

        if (type.name.includes("Sueldo")) {
            formData.append('teacher', teacher.id);
        }

        let isFormValid = true;
        formData.forEach((value, key) => {
            if ((value === "" && key !== 'observation')) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor complete todos los campos.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (!type.name.includes("Sueldo") && (!observation || !observation.trim())) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, ingresa una observación.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (type.name.includes("Sueldo") && (!teacher)) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, ingresa una profesora.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        const amountPattern = /^\d+$/; // Acepta solo números enteros

        if (!amountPattern.test(amount)) {
            toast({
                title: "Formato de monto inválido.",
                description: "Por favor, ingresa un monto en un formato válido (número entero).",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }


        if (amount < 0 || amount > 1000000000) {
            toast({
                title: "Error en el campo 'amount'.",
                description: "El monto no puede ser menor a cero o mayor a 1.000.000.000",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false)
            return;
        }

        if (!studio.id) {
            toast({
                title: "Faltan completar campos.",
                description: "Por favor, seleccioná un estudio.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES}`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
                    'Content-Type': 'multipart/form-data', // Si estás usando FormData
                },
            });
            toast({
                title: "Gasto creado correctamente.",
                description: "El gasto fue creado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            if (tipo === "Consultor") {
                dispatch(getExpensesTodayTeachers());
            } else {
                dispatch(getExpenses());
            }
        } catch (error) {
            const errorMessage = error.response?.data?.detail || "Ocurrió un error al registrar el gasto.";

            if (errorMessage === "El código proporcionado no corresponde a ningún usuario.") {
                toast({
                    title: "Error en el código.",
                    description: "El código proporcionado no corresponde a ningún usuario.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (errorMessage === "No se encontró un registro de horas para esta profesora en el mes actual.") {
                toast({
                    title: "Error.",
                    description: "Esta profesora no tiene horas cargadas en el mes actual.", // Usa el mensaje exacto del backend
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else if (errorMessage === "El monto excede las horas disponibles para el sueldo de esa profesora.") {
                toast({
                    title: "Error en el monto.",
                    description: "El monto excede las horas disponibles para el sueldo de esa profesora.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            } else {
                toast({
                    title: "Error.",
                    description: "Ocurrió un error al crear el gasto. Inténtalo de nuevo.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }
        } finally {
            setLoading(false);
        }

    };

    const handleSelectChange = (selectedOption) => {
        if (selectedOption) {
            setType({ id: selectedOption.id, name: selectedOption.name });  // Establecer el tipo seleccionado
        } else {
            // Si no se selecciona nada, establecer un valor vacío
            setType({ id: "", name: "" });
        }

    };

    const handleTeacherChange = (selectedOption) => {
        const teacherId = selectedOption.value;

        if (selectedOption) {
            setTeacher({ id: selectedOption.value, name: selectedOption.label });  // Establecer el tipo seleccionado
        } else {
            // Si no se selecciona nada, establecer un valor vacío
            setTeacher({ id: "", name: "" });
        }

        // Buscar en teacherHours el objeto que coincide con la profesora seleccionada
        const teacherRecord = teacherHours.find(
            (record) => record.teacher.id == teacherId
        );

        // Si se encuentra el registro, actualiza las horas restantes (left)
        if (teacherRecord) {
            setLeftHours(teacherRecord.left);
        } else {
            setLeftHours(null); // Si no se encuentra, restablece a null
        }
    };

    useEffect(() => {
        dispatch(getTeachers());
        dispatch(getTeacherHours());
        dispatch(getExpenseType());
        dispatch(getExpensesTodayTeachers());
        dispatch(getStudios());
    }, [dispatch]);

    useEffect(() => {
        if (selectedStudioFromStore) {
            setStudio({
                id: selectedStudioFromStore.id,
                name: selectedStudioFromStore.name,
            });
        }
    }, [selectedStudioFromStore]);

    useEffect(() => {
        if (tipo === "Consultor") {
            const gastosChicos = expenseType.find((expense) => expense.name === "Gastos Chicos");
            if (gastosChicos) {
                setType({ id: gastosChicos.id, name: gastosChicos.name });
            }
        } else {
            setType({ id: "", name: "" }); // Reiniciar si no es "Consultor"
        }
    }, [tipo, expenseType]);  // Dependencias para que se actualice cuando `tipo` cambie


    return (
        <Box>
            {loading && (
                <LoadingOverlay />
            )}

            <Stack
                spacing={4}
                w={"full"}
                // Responsive padding
                p={{ base: 5, md: 6 }}
            >
                <Modal
                    onClose={onCloseModalCode}
                    isOpen={isAlertCodeOpen}
                    isCentered
                    size={{ base: "90%", md: "70%", lg: "80%" }}
                >
                    <ModalOverlay w={"100%"} h={"100%"} />
                    <ModalContent maxW={{ base: "80%", md: "60%", lg: "50%", xl: "35%" }} maxH={{ base: "80vh", md: "80vh", lg: "60vh", xl: "75vh" }} mt={{ base: "23%", md: "13%", lg: "9.5%", xl: "7%" }}>
                        <ModalCloseButton />
                        <ModalCode
                            onClose={onCloseModalCode}
                            get={tipo === "Consultor" ? getExpensesTodayTeachers : getExpenses}
                            onCloseAlert={onClose}
                            entityType={"expensesAdd"}
                            action={handleSubmitExpense}
                        />
                    </ModalContent>
                </Modal>

                <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                    Nuevo gasto
                </Heading>

                <SimpleGrid columns={[1, 1, 2]} spacing={4}>
                    <Box>
                        <FormControl id="type" isRequired>
                            <FormLabel>Tipo</FormLabel>
                            <Select2
                                height="40px"
                                width="100%"
                                placeholder="Seleccionar..."
                                onChange={handleSelectChange} // El mismo manejador de cambios
                                isDisabled={tipo === "Consultor"} // Deshabilitar si el tipo es "Consultor"
                                options={tipo === "Consultor"
                                    ? expenseType.filter((expense) => expense.name === "Gastos Chicos") // Solo mostrar "Gastos Chicos"
                                    : expenseType // Mostrar todos los elementos
                                }
                                getOptionLabel={(e) => e.name} // Mostrar el nombre de la opción
                                getOptionValue={(e) => e.id}  // El valor de la opción
                                value={type && type.id ? { id: type.id, name: type.name } : null} // Valor seleccionado
                            />
                            {/* <Select
                            h="40px"
                            w="100%"
                            placeholder="Seleccionar"
                            isDisabled={tipo === "Consultor"} // Deshabilitar el Select si el tipo es "Consultor"
                            onChange={event => handleSelectChange(event)}
                            value={type.id || ""}
                        // tipo === "Consultor"
                        // ? expensesType.find((expense) => expense.name === "Gastos Chicos")?.id || "" // Buscar el ID de "Gastos Chicos"
                        // : selectedExpense?.id || "" // Usar el valor del estado cuando no es Consultor
                        >
                            {tipo === "Consultor" ? (
                                expensesType
                                    .filter((expense) => expense.name === "Gastos Chicos")
                                    .map((expense) => (
                                        <option key={expense.id} value={expense.id}>
                                            {expense.name}
                                        </option>
                                    ))
                            ) : (
                                expensesType.map((expense) => (
                                    <option key={expense.id} value={expense.id}>
                                        {expense.name}
                                    </option>
                                ))
                            )}
                        </Select> */}
                        </FormControl>
                    </Box>


                    <Box>
                        <FormControl id="payment-method" isRequired>
                            <FormLabel>Método de pago</FormLabel>
                            <Select2
                                height="40px"
                                width="100%"
                                placeholder="Seleccionar método de pago..."
                                onChange={(selectedOption: any) => setMethod(selectedOption?.value || "")}
                                options={paymentMethods}
                                getOptionLabel={(option: any) => option.label}
                                getOptionValue={(option: any) => option.value}
                                value={paymentMethods.find((option) => option.value === method) || null}
                            />
                        </FormControl>
                    </Box>
                    {type.name.includes("Sueldo") && (
                        <Box>
                            <FormControl id="teacher" isRequired>
                                <FormLabel>Profesora</FormLabel>
                                {/* <Select
                                w="100%"
                                placeholder="Seleccionar"
                                onChange={handleTeacherChange}
                            >
                                {teachers
                                    .filter((teacher) => teacher.deleted === null) // Filtrar por deleted === null
                                    .map((teacher) => (
                                        <option key={teacher.dni} value={teacher.id}>
                                            {teacher.name} {teacher.last_name} - {teacher.dni}
                                        </option>
                                    ))}
                            </Select> */}
                                <Select2
                                    // isClearable
                                    placeholder="Seleccionar"
                                    onChange={handleTeacherChange}
                                    options={teachers
                                        .filter((teacher) => teacher.deleted === null) // Filtrar por deleted === null
                                        .map((teacher) => ({
                                            label: `${teacher.name} ${teacher.last_name} - ${teacher.dni}`,
                                            value: teacher.id
                                        }))
                                    }
                                />
                            </FormControl>
                        </Box>
                    )}
                    {!type.name.includes("Sueldo") && (
                        <Box>
                            <FormControl id="observation" isRequired>
                                <FormLabel>Observación</FormLabel>
                                <Input
                                    w="100%"
                                    type="text"
                                    placeholder="Escribir..."
                                    min="0"
                                    maxLength={100}
                                    h={"40px"}
                                    onChange={(event) => setObservation(event.target.value)}
                                />
                            </FormControl>
                        </Box>
                    )}
                    <Box>
                        <FormControl id="amount" isRequired>
                            <FormLabel>Monto</FormLabel>
                            <Input
                                w="100%"
                                type="number"
                                placeholder="Escribir..."
                                min="0"
                                h={"40px"}
                                onChange={(event) => setAmount(event.target.value)}
                            />
                        </FormControl>

                        {!type.name.includes("Sueldo") &&
                            teacherHours.find((hour) => {
                                // const currentMonth = new Date().getMonth() + 1; // Mes actual (1-12)
                                // const hourMonth = parseInt(hour.month); // Mes de la hora (1-12)

                                return hour.teacher?.id == teacher.id
                                // &&
                                // hourMonth === currentMonth; // Compara como enteros
                            }) &&
                            (
                                <Text color="text.muted" fontSize="sm" mt={"5px"} pl={"5px"}>
                                    Restante a pagar: {formatCurrency(leftHours, "0")} {/* Aquí se muestra el monto */}
                                </Text>
                            )
                        }
                    </Box>

                    {/*                     {!type.name.includes("Sueldo") && (
 */}                  <Box>
                        <FormControl id="studio" isRequired>
                            <FormLabel>Estudio</FormLabel>
                            <Select2
                                placeholder="Seleccionar estudio..."
                                options={studios
                                    .filter((s: any) => s.is_active)
                                    .map((s: any) => ({
                                        label: s.name,
                                        value: s.id,
                                    }))
                                }
                                value={
                                    studio.id
                                        ? {
                                            label: studio.name,
                                            value: studio.id,
                                        }
                                        : null
                                }
                                onChange={(selectedOption: any) =>
                                    setStudio({
                                        id: selectedOption?.value || "",
                                        name: selectedOption?.label || "",
                                    })
                                }
                            />
                        </FormControl>
                    </Box>
                    {/*                     )}
 */}                </SimpleGrid>

                <HStack spacing={3} justify="flex-end" mt={6}>
                    <Button
                        onClick={onClose}
                        w={["100%", "135px"]}
                        aria-label="Cancelar"
                        variant="secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => tipo !== "Consultor" ? handleSubmitExpense(code) : onOpenModalCode()}
                        w={["100%", "135px"]}
                        variant="primary"
                    >
                        Guardar
                    </Button>
                </HStack>
            </Stack>
        </Box>
    );
};

export default ModalExpenseAdd;
