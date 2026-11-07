'use client'
import { useState } from "react";
import React from "react";
import {
    Box,
    Text,
    Flex,
    Image,
    FormControl,
    Stack,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Button,
    Icon,
    IconButton,
    FormLabel,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth";
import { brandAssets, brandName } from "../../theme/brand";

// Cartel de entorno de demostración: se activa con NEXT_PUBLIC_DEMO_MODE=true.
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const EmailOutlineIcon = () => (
    <Icon viewBox="0 0 24 24" boxSize={5} fill="none">
        <path d="M4 6.75h16v10.5H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="m4.75 7.5 7.25 5 7.25-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
);

const LockOutlineIcon = () => (
    <Icon viewBox="0 0 24 24" boxSize={5} fill="none">
        <rect x="5.5" y="10" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Icon>
);

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState(false);
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const router = useRouter();

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(false);
        setInvalidCredentials(false);
        setLoading(true);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_LOGIN}`,
                { identifier: username, password }
            );

            const data = response.data;
            login(data); // guarda tokens en Zustand

            // Token recién recibido (por si Zustand tarda un tick)
            const access =
                data?.tokens?.access ??
                data?.access ??
                useAuthStore.getState().tokens?.access;

            // 1) Traer studios
            const studiosResp = await axios.get(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_STUDIOS}`, // ⚡ tu endpoint real
                { headers: access ? { Authorization: `Bearer ${access}` } : {} }
            );

            const studios = studiosResp.data;

            // 2) Decidir
            if (Array.isArray(studios) && studios.length > 0) {
                router.push("/studioSelection");
            } else {
                router.push("/"); // 👈 si no hay studios
            }
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const hasInvalidCredentials =
                    e.response?.data?.non_field_errors?.includes("Credenciales incorrectas");

                if (hasInvalidCredentials) {
                    setInvalidCredentials(true);
                    setPassword("");
                } else {
                    setError(true);
                }
            } else {
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <Flex minH="100dvh" direction={{ base: "column", lg: "row" }} bg="bg.surface">
            {/* Panel de marca */}
            <Flex
                w={{ base: "100%", lg: "40%" }}
                flex={{ base: "0 0 auto", lg: "0 0 40%" }}
                minH={{ base: "38dvh", md: "40dvh", lg: "100dvh" }}
                bg="brand.primary"
                color="white"
                direction="column"
                justify="center"
                align="center"
                px={{ base: 6, md: 10, xl: 14 }}
                py={{ base: 8, md: 10, lg: 12 }}
            >
                <Stack spacing={{ base: 3, lg: 5 }} align="center" textAlign="center">
                    <Image
                        src={brandAssets.logoDark}
                        alt=""
                        aria-hidden
                        w={{ base: "64px", md: "80px", lg: "112px" }}
                        h="auto"
                        objectFit="contain"
                        draggable={false}
                    />
                    <Text
                        as="p"
                        fontSize={{ base: "22px", lg: "32px" }}
                        fontWeight={600}
                        lineHeight="1.1"
                        letterSpacing="-0.02em"
                    >
                        {brandName}
                    </Text>
                </Stack>
            </Flex>

            {/* Formulario */}
            <Flex
                w={{ base: "100%", lg: "60%" }}
                flex={{ base: "1", lg: "0 0 60%" }}
                align={{ base: "flex-start", lg: "center" }}
                justify="center"
                px={{ base: 5, sm: 8, md: 12 }}
                py={{ base: 8, md: 12 }}
            >
                <Box w="100%" maxW="380px">
                    <Text as="h1" textStyle="pageTitle" fontSize={{ base: "22px", md: "24px" }}>
                        Iniciar sesión
                    </Text>
                    <Text mt={1.5} mb={{ base: 6, md: 8 }} color="text.secondary" fontSize="14px">
                        Accedé a tu espacio de gestión.
                    </Text>

                    {isDemo && (
                        <Box
                            role="note"
                            bg="info.bg"
                            border="1px solid"
                            borderColor="info.border"
                            color="info.fg"
                            fontSize="13px"
                            lineHeight="1.5"
                            px={3.5}
                            py={3}
                            mb={{ base: 6, md: 7 }}
                            mt={{ base: -2, md: -3 }}
                            borderRadius="control"
                        >
                            <Text fontWeight={600} mb={1}>
                                Entorno de demostración
                            </Text>
                            <Text>
                                Todos los datos (alumnos, profesoras, pagos y clases) son ficticios y se generaron para esta demo.
                            </Text>
                            <Text mt={1.5}>
                                El envío de correos y de mensajes de WhatsApp no está configurado, así que el sistema no contacta a nadie aunque un correo o un número generado coincida con uno real. El resto del flujo funciona con normalidad: cuando una acción intenta enviar un mensaje, se muestra un aviso.
                            </Text>
                        </Box>
                    )}

                    <Stack spacing={5} as="form" onSubmit={handleSubmit}>
                        <FormControl isRequired>
                            <FormLabel requiredIndicator={<></>}>Email</FormLabel>
                            <InputGroup size="lg">
                                <InputLeftElement pointerEvents="none" color="text.muted">
                                    <EmailOutlineIcon />
                                </InputLeftElement>
                                <Input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="ejemplo@correo.com"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    isRequired
                                />
                            </InputGroup>
                        </FormControl>

                        <FormControl isRequired isInvalid={invalidCredentials}>
                            <FormLabel requiredIndicator={<></>}>Contraseña</FormLabel>
                            <InputGroup size="lg">
                                <InputLeftElement pointerEvents="none" color="text.muted">
                                    <LockOutlineIcon />
                                </InputLeftElement>
                                <Input
                                    pr="48px"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    placeholder="Ingresá tu contraseña"
                                    onChange={(e) => setPassword(e.target.value)}
                                    isRequired
                                />
                                <InputRightElement>
                                    <IconButton
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                        onClick={handleShowPassword}
                                        variant="ghost"
                                        size="sm"
                                    />
                                </InputRightElement>
                            </InputGroup>
                            {invalidCredentials && (
                                <Text color="error.fg" fontSize="13px" mt={2} role="alert">
                                    El usuario o contraseña son incorrectos.
                                </Text>
                            )}
                        </FormControl>

                        {error && (
                            <Box
                                role="alert"
                                bg="error.bg"
                                border="1px solid"
                                borderColor="error.border"
                                color="error.fg"
                                fontSize="13px"
                                px={3}
                                py={2.5}
                                borderRadius="control"
                            >
                                No pudimos iniciar sesión. Comuníquese con soporte.
                            </Box>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            w="100%"
                            mt={1}
                            isLoading={loading}
                            loadingText="Ingresando"
                        >
                            Ingresar
                        </Button>
                    </Stack>
                </Box>
            </Flex>
        </Flex>
    );
}
