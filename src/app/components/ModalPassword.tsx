import {
    Box,
    Button,
    Stack,
    Heading,
    FormControl,
    Input,
    InputGroup,
    InputRightElement,
    Flex,
    useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

const ModalPassword = ({
    onClose,
    product,
    get,
    onCloseAlert,
    action,
    entityType,
}: {
    onClose: () => void;
    get: () => void;
    onCloseAlert: () => void;
    action: (password: string) => void;
    entityType: () => string;
}) => {
    const [email, setEmail] = useState(product.email);
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const { tipo, tokens } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const toast = useToast();

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleShowPassword2 = () => {
        setShowPassword2(!showPassword2);
    };

    const handleSubmit = () => {
        if (password.length < 8) {
            toast({
                title: "Contraseña inválida",
                description: "La contraseña debe tener al menos 8 caracteres.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (password !== password2) {
            toast({
                title: "Las contraseñas no coinciden",
                description: "Verificá que ambas contraseñas sean iguales.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        onClose();
        action(password);
    };

    return (
        <Stack
            spacing={4}
            w={"full"}
            p={{ base: 5, md: 6 }}
        >
            <Heading
                as="h2"
                size="lg"
                pr={8}
                mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
            >
                Cambiar contraseña
            </Heading>

            <Box>
                <FormControl id="email" isRequired>
                    <Input
                        w="100%"
                        type="text"
                        placeholder="Escribir..."
                        value={email}
                        h={"40px"}
                        isDisabled
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </FormControl>
            </Box>

            <Box>
                <FormControl id="password" isRequired>
                    <InputGroup>
                        <Input
                            w="100%"
                            type={showPassword ? "text" : "password"}
                            placeholder="Escribir contraseña..."
                            minLength={8}
                            h={"40px"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <InputRightElement width="3rem" display="flex" alignItems="center" justifyContent="center">
                            <Flex onClick={handleShowPassword} alignItems="center" justifyContent="center">
                                {showPassword ? (
                                    <ViewIcon w={6} h={6} _hover={{ cursor: "pointer" }} />
                                ) : (
                                    <ViewOffIcon w={6} h={6} _hover={{ cursor: "pointer" }} />
                                )}
                            </Flex>
                        </InputRightElement>
                    </InputGroup>
                </FormControl>
            </Box>

            <Box>
                <FormControl id="password2" isRequired>
                    <InputGroup>
                        <Input
                            w="100%"
                            type={showPassword2 ? "text" : "password"}
                            placeholder="Repetir contraseña..."
                            minLength={8}
                            h={"40px"}
                            value={password2}
                            onChange={(event) => setPassword2(event.target.value)}
                        />
                        <InputRightElement width="3rem" display="flex" alignItems="center" justifyContent="center">
                            <Flex onClick={handleShowPassword2} alignItems="center" justifyContent="center">
                                {showPassword2 ? (
                                    <ViewIcon w={6} h={6} _hover={{ cursor: "pointer" }} />
                                ) : (
                                    <ViewOffIcon w={6} h={6} _hover={{ cursor: "pointer" }} />
                                )}
                            </Flex>
                        </InputRightElement>
                    </InputGroup>
                </FormControl>
            </Box>

            <Stack spacing={4} direction={["column", "row"]} mt={5} justifyContent={"center"}>
                <Button
                    onClick={onClose}
                    w={["100%", "135px"]}
                    aria-label="Cancelar"
                    variant="secondary"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    w={["100%", "135px"]}
                    variant="primary"
                >
                    Guardar
                </Button>
            </Stack>
        </Stack>
    );
};

export default ModalPassword;