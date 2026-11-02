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
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ModalCode from "./ModalCode";
import { useAuthStore } from "../stores/auth";
import { getExpectedRequestStore } from "next/dist/client/components/request-async-storage.external";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
    getExpenseType,
} from '../stores/studioSlice';


const ModalExpensesTypeEdit = ({ product, onClose }: any) => {
    const [idExpensesType, setIdExpensesType] = useState(product.id)
    const [name, setName] = useState(product.name)
    // const [teacher, setTeacher] = useState("")
    // const [expenseMethod, setExpenseMethod] = useState("Efectivo")
    // const [amount, setAmount] = useState("")
    // const [method, setMethod] = useState("Efectivo")
    // const [type, setType] = useState("")
    const { tipo, tokens } = useAuthStore();
    // const [amountId, setAmountId] = useState("");
    // const [amountValue, setAmountValue] = useState("");

    const [teachers, setTeachers] = useState([])
    // const [paymentAmount, setPaymentAmount] = useState([])
    // const [expensesType, setExpensesType] = useState([])


    const { expense_type } = useSelector((state: any) => state.studio);
    const dispatch = useAppDispatch();


    const toast = useToast();

    // const {
    // isOpen: isAlertCodeOpen,
    // onOpen: onOpenModalCode,
    // onClose: onCloseModalCode,
    // } = useDisclosure();

    const handleSubmitExpenseType = async () => {
        const formData = new FormData();
        formData.append('name', name);

        // Validar si algún campo está vacío
        let isFormValid = true;
        formData.forEach((value) => {
            if ((value === "")) {
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
            return;
        }

        if (!name.trim()) {
            toast({
                title: "Nombre no válido.",
                description: "El campo de nombre no puede estar vacío o contener solo espacios.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        if (expense_type.some(type => type.name === name)) {
            toast({
                title: "Nombre de tipo de gasto duplicado.",
                description: "Ya existe un tipo de gasto con este nombre. Por favor elige otro.",
                status: "error",
                position: "bottom-right",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await axios.put(`${process.env.NEXT_PUBLIC_URL_BACKEND_EXPENSES_TYPE}${idExpensesType}/`, formData, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access}`, // Incluir el token si es necesario
                    'Content-Type': 'multipart/form-data', // Si estás usando FormData
                },
            });
            toast({
                title: "Tipo de gasto editado correctamente.",
                description: "El tipo de gasto fue editado con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
            dispatch(getExpenseType());
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Ocurrió un error al registrar el turno.";

            // Verificamos si el error contiene el mensaje específico
            if (errorMessage === "A type with this name already exists.") {
                // Si el error es de tipo duplicado
                toast({
                    title: "Nombre de tipo de gasto duplicado.",
                    description: "Ya existe un tipo de gasto con este nombre. Por favor elige otro.",
                    status: "error",
                    position: "bottom-right",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                // Si el error no es el duplicado, mostramos el error genérico
                toast({
                    title: "Error",
                    description: "Ocurrió un error al registrar el tipo de gasto.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "bottom-right",
                });
            }
        }
    }

    useEffect(() => {
        // getPaymentAmount()
        dispatch(getExpenseType())
    }, []);


    return (
        <Stack
            spacing={4}
            w={"full"}
            // Responsive padding
            p={{ base: 5, md: 6 }}
        >
            {/* <Modal
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
                        get={getExpensesType}
                        onCloseAlert={onClose}
                        entityType={"expensesTypeAdd"}
                        action={handleSubmitExpenseType}
                    />
                </ModalContent>
            </Modal> */}

            <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
                Editar tipo de gasto
            </Heading>

            <SimpleGrid columns={[1, 1, 1]} spacing={4}>
                <Box display="flex" justifyContent="center" w="100%">
                    <FormControl id="name" isRequired>
                        <FormLabel>Nombre</FormLabel>
                        <Input
                            w="100%"
                            type="text"
                            value={name}
                            placeholder="Escribir..."
                            min="0"
                            h={"40px"}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </FormControl>
                </Box>
            </SimpleGrid>

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
                    onClick={handleSubmitExpenseType}
                    w={["100%", "135px"]}
                    variant="primary"
                >
                    Guardar
                </Button>
            </HStack>
        </Stack>
    );
};

export default ModalExpensesTypeEdit;