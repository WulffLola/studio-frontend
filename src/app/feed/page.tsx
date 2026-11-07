"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    Switch,
    Text,
    Textarea,
    Badge,
    HStack,
    Spinner,
    useToast,
    Container,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Image,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    SimpleGrid,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertDialogCloseButton,
} from "@chakra-ui/react";

import { useAppDispatch } from "@/app/stores/hooks";
import { useSelector } from "react-redux";
import { getSwornStatements, getHomePhrase, getPosts } from "@/app/stores/studioSlice";
import { useAuthStore } from "@/app/stores/auth";
import HomePhrasePreview from "../components/HomePhrasePreview";
import { FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";
import ModalHomePostEdit from "../components/ModalHomePostEdit";
import ModalHomePostAdd from "../components/ModalHomePostAdd";
import ModalSwornStatementAdd from "../components/ModalSwornStatementAdd";
import ModalSwornStatementEdit, {
    DEFAULT_STATEMENT_TYPE_OPTIONS,
    getStatementTypeLabel,
    isSwornStatementActive,
    SwornStatementItem,
} from "../components/ModalSwornStatementEdit";
import Pagination from "../components/Pagination";
import TableNotes from "../components/TableNotes";
import TableRecipes from "../components/TableRecipes";
import ModalNotesAdd from "../components/ModalNotesAdd";
import ModalRecipesAdd from "../components/ModalRecipesAdd";
import { getRecipes, getNotes } from "@/app/stores/studioSlice";
import SearchField from "../components/ui/SearchField";
import StatusBadge from "../components/ui/StatusBadge";
import { PageContainer } from "../components/ui/PageContainer";
import { StateMessage } from "../components/ui/StateMessage";

type HomePhraseItem = {
    id: number;
    title: string;
    phrase: string;
    is_active: boolean;
};

type HomePostStatus = "draft" | "paused" | "active" | "deleted";

type HomePostItem = {
    id: number;
    title?: string;
    text?: string;
    caption?: string;
    image?: string | null;
    video?: string | null;
    status: HomePostStatus;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

const ITEMS_PER_PAGE = 10;

const HomeContentPage = () => {
    const dispatch = useAppDispatch();
    const toast = useToast();
    const deleteSwornStatementCancelRef = useRef<HTMLButtonElement | null>(null);
    const unavailableSwornStatementCancelRef = useRef<HTMLButtonElement | null>(null);

    const [activeTab, setActiveTab] = useState<"muro" | "studio-tips" | "declaraciones">("muro");
    const [muroTab, setMuroTab] = useState(0);
    const [studioTipsTab, setStudioTipsTab] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const posts = useSelector((state: any) => state.studio.posts || []);
    const [loadingPosts] = useState(false);
    const [search, setSearch] = useState("");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddSwornStatementOpen, setIsAddSwornStatementOpen] = useState(false);
    const [isEditSwornStatementOpen, setIsEditSwornStatementOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<HomePostItem | null>(null);
    const [selectedSwornStatement, setSelectedSwornStatement] = useState<SwornStatementItem | null>(null);
    const [swornStatementToDelete, setSwornStatementToDelete] = useState<SwornStatementItem | null>(null);

    const { tokens } = useAuthStore();

    const homePhrase = useSelector((state: any) => state.studio.homePhrase);
    const loadingHomePhrase = useSelector((state: any) => state.studio.loadingHomePhrase);

    const { swornStatements, recipes, notes } = useSelector((state: any) => state.studio);

    const {
        isOpen: isOpenAddNotes,
        onOpen: onOpenAddNotes,
        onClose: onCloseAddNotes,
    } = useDisclosure();

    const {
        isOpen: isOpenAddRecipes,
        onOpen: onOpenAddRecipes,
        onClose: onCloseAddRecipes,
    } = useDisclosure();

    const {
        isOpen: isDeleteSwornStatementOpen,
        onOpen: onOpenDeleteSwornStatement,
        onClose: onCloseDeleteSwornStatement,
    } = useDisclosure();

    const {
        isOpen: isUnavailableSwornStatementOpen,
        onOpen: onOpenUnavailableSwornStatement,
        onClose: onCloseUnavailableSwornStatement,
    } = useDisclosure();

    useEffect(() => {
        dispatch(getHomePhrase());
        dispatch(getPosts());
        dispatch(getSwornStatements());
        dispatch(getNotes());
        dispatch(getRecipes());
    }, [dispatch]);

    useEffect(() => {
        const currentHomePhrase: HomePhraseItem | null = Array.isArray(homePhrase)
            ? homePhrase[0] || null
            : Array.isArray(homePhrase?.results)
                ? homePhrase.results[0] || null
                : homePhrase || null;

        if (currentHomePhrase) {
            setCurrentId(currentHomePhrase.id ?? null);
            setTitle(currentHomePhrase.title || "");
            setMessage(currentHomePhrase.phrase || "");
            setIsActive(
                typeof currentHomePhrase.is_active === "boolean"
                    ? currentHomePhrase.is_active
                    : true
            );
        }
    }, [homePhrase]);

    const messageLines = useMemo<string[]>(() => {
        return message
            .split("\n")
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
    }, [message]);

    const sortedPosts = useMemo(() => {
        const arr = [...(posts || [])];

        return arr.sort((a: HomePostItem, b: HomePostItem) => {
            const da = new Date(a.created_at || a.updated_at || 0).getTime();
            const db = new Date(b.created_at || b.updated_at || 0).getTime();
            return db - da;
        });
    }, [posts]);

    const filteredPosts = useMemo(() => {
        return sortedPosts.filter((post: HomePostItem) => {
            const fullText = `${post.title || ""} ${post.text || ""} ${post.caption || ""} ${post.status || ""}`.toLowerCase();
            return fullText.includes(search.toLowerCase());
        });
    }, [sortedPosts, search]);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentPosts = filteredPosts.slice(indexOfFirstItem, indexOfLastItem);
    const countPagination = Math.max(Math.ceil(filteredPosts.length / ITEMS_PER_PAGE), 1);

    const sortedSwornStatements = useMemo(() => {
        const arr = [...(swornStatements || [])];

        return arr.sort((a: SwornStatementItem, b: SwornStatementItem) => {
            const da = new Date(a.created_at || a.updated_at || 0).getTime();
            const db = new Date(b.created_at || b.updated_at || 0).getTime();
            return db - da;
        });
    }, [swornStatements]);

    const swornStatementTypeOptions = useMemo(() => {
        const dynamicTypes = (swornStatements || [])
            .map((item: SwornStatementItem) => item.statement_type)
            .filter((type: string | undefined): type is string => Boolean(type));

        return Array.from(
            new Set([
                ...DEFAULT_STATEMENT_TYPE_OPTIONS.map((item) => item.value),
                ...dynamicTypes,
            ])
        );
    }, [swornStatements]);

    const activeSwornStatementTypes = useMemo(() => {
        return new Set(
            (swornStatements || [])
                .filter((item: SwornStatementItem) => isSwornStatementActive(item))
                .map((item: SwornStatementItem) => item.statement_type)
                .filter((type: string | undefined): type is string => Boolean(type))
        );
    }, [swornStatements]);

    const hasAvailableSwornStatementType = swornStatementTypeOptions.some(
        (type) => !activeSwornStatementTypes.has(type)
    );

    const handleOpenAddSwornStatement = () => {
        if (!hasAvailableSwornStatementType) {
            onOpenUnavailableSwornStatement();
            return;
        }

        setIsAddSwornStatementOpen(true);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        const maxPage = Math.max(Math.ceil(filteredPosts.length / ITEMS_PER_PAGE), 1);

        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [filteredPosts.length, currentPage]);

    const handleSave = async () => {
        setSaving(true);

        try {
            const payload = {
                title,
                phrase: message,
                is_active: isActive,
            };

            const config = {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                    "Content-Type": "application/json",
                },
            };

            if (currentId) {
                await axios.put(
                    `${process.env.NEXT_PUBLIC_URL_BACKEND_HOME_PHRASE}${currentId}/`,
                    payload,
                    config
                );
            } else {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_URL_BACKEND_HOME_PHRASE}`,
                    payload,
                    config
                );

                if (response.data?.id) {
                    setCurrentId(response.data.id);
                }
            }

            toast({
                title: "Contenido actualizado correctamente.",
                description: "La frase del inicio se guardó con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            dispatch(getHomePhrase());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Ocurrió un error al guardar la frase del inicio.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePost = async (id: number) => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_HOME_POSTS}${id}/`, {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                },
            });

            toast({
                title: "Posteo eliminado",
                description: "El posteo se eliminó correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            dispatch(getPosts());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo eliminar el posteo.",
                status: "error",
                duration: 4000,
                isClosable: true,
                position: "bottom-right",
            });
        }
    };

    const handleDeleteSwornStatement = async () => {
        if (!swornStatementToDelete?.id) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_URL_BACKEND_SWORN_STATEMENT}${swornStatementToDelete.id}/`, {
                headers: {
                    Authorization: `Bearer ${tokens?.access}`,
                },
            });

            toast({
                title: "Declaración eliminada",
                description: "La declaración jurada se eliminó correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            dispatch(getSwornStatements());
            setSwornStatementToDelete(null);
            onCloseDeleteSwornStatement();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo eliminar la declaración jurada.",
                status: "error",
                duration: 4000,
                isClosable: true,
                position: "bottom-right",
            });
        }
    };

    const handleReactivateSwornStatement = async (swornStatement: SwornStatementItem) => {
        const hasActiveSameType = (swornStatements || []).some(
            (item: SwornStatementItem) =>
                item.id !== swornStatement.id &&
                item.statement_type === swornStatement.statement_type &&
                isSwornStatementActive(item)
        );

        if (hasActiveSameType) {
            toast({
                title: "Ya existe una declaración activa",
                description: `No se puede reactivar porque ya hay una declaración activa de tipo ${getStatementTypeLabel(swornStatement.statement_type)}.`,
                status: "warning",
                duration: 4000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_SWORN_STATEMENT}${swornStatement.id}/`,
                {
                    text: swornStatement.text || "",
                    statement_type: swornStatement.statement_type,
                },
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast({
                title: "Declaración reactivada",
                description: "La declaración jurada se reactivó correctamente.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            dispatch(getSwornStatements());
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo reactivar la declaración jurada.",
                status: "error",
                duration: 4000,
                isClosable: true,
                position: "bottom-right",
            });
        }
    };

    const getSwornStatementContent = (swornStatement: SwornStatementItem) =>
        swornStatement.text || "<p>Sin contenido</p>";

    const getSwornStatementTypeLabel = (statementType?: string) =>
        getStatementTypeLabel(statementType);

    const panelBoxStyles = {
        bg: "bg.surface",
        border: "1px solid",
        borderColor: "border.subtle",
        borderRadius: "card",
        boxShadow: "card",
        overflow: "hidden",
    };

    // Los campos usan el estilo estándar del theme.
    const filterInputStyles = {};

    return (
        <>

                <PageContainer>
                    <Stack
                        spacing={5}
                        align="stretch"
                        w="100%"
                    >
                        {loadingHomePhrase ? (
                            <Flex justify="center" py={10}>
                                <Spinner size="lg" />
                            </Flex>
                        ) : (
                            <>
                                <Tabs
                                    variant="soft-rounded"
                                    isFitted
                                    w="100%"
                                    index={activeTab === "muro" ? 0 : activeTab === "studio-tips" ? 1 : 2}
                                    onChange={(index) => {
                                        if (index === 0) setActiveTab("muro");
                                        if (index === 1) setActiveTab("studio-tips");
                                        if (index === 2) setActiveTab("declaraciones");
                                    }}
                                >
                                    <TabList gap={2}>
                                        <Tab>
                                            Muro
                                        </Tab>

                                        <Tab>
                                            Studio Tips
                                        </Tab>

                                        <Tab>
                                            Declaraciones
                                        </Tab>
                                    </TabList>
                                </Tabs>

                                {activeTab === "muro" && (
                                    <Box w="full">
                                        <Tabs
                                            variant="line"
                                            w="100%"
                                            index={muroTab}
                                            onChange={(index) => setMuroTab(index)}
                                        >
                                            <TabList overflowX="auto" overflowY="hidden">
                                                <Tab flexShrink={0}>
                                                    Frase
                                                </Tab>

                                                <Tab flexShrink={0}>
                                                    Posteos
                                                </Tab>
                                            </TabList>

                                            <TabPanels>
                                                <TabPanel px={0} py={4}>
                                                    <Stack direction={{ base: "column", lg: "row" }} spacing={5} w="full" align="stretch">
                                            <Box {...panelBoxStyles} w={{ base: "full", lg: "70%" }} maxW={{ base: "100%", xl: "80%" }} alignSelf="stretch" order={{ base: 2, lg: 1 }}>
                                                <Box px={{ base: 4, md: 6 }} py={5}>
                                                    <Flex
                                                        justify="space-between"
                                                        align={{ base: "start", md: "center" }}
                                                        direction={{ base: "column", md: "row" }}
                                                        gap={3}
                                                    >
                                                        <Box>
                                                            <Heading as="h2" size="lg">
                                                                Frase destacada
                                                            </Heading>
                                                            <Text mt={1} color="text.secondary" fontSize="sm">
                                                                Editá el mensaje principal que ven los alumnos en el muro.
                                                            </Text>
                                                        </Box>

                                                        <StatusBadge
                                                            label={isActive ? "Activo" : "Oculto"}
                                                            tone={isActive ? "success" : "neutral"}
                                                        />
                                                    </Flex>
                                                </Box>

                                                <Divider />

                                                <Box px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                                                    <Stack spacing={5}>
                                                        <FormControl isRequired>
                                                            <FormLabel>
                                                                Título principal
                                                            </FormLabel>
                                                            <Input
                                                                value={title}
                                                                onChange={(e) => setTitle(e.target.value)}
                                                                placeholder="Ej: Bienvenid@ a Studio House Studio"
                                                                {...filterInputStyles}
                                                            />
                                                        </FormControl>

                                                        <FormControl isRequired>
                                                            <FormLabel>
                                                                Mensaje
                                                            </FormLabel>
                                                            <Textarea
                                                                value={message}
                                                                onChange={(e) => setMessage(e.target.value)}
                                                                placeholder="Escribí el mensaje destacado..."
                                                                rows={8}
                                                                resize="vertical"
                                                            />
                                                            <Text mt={1.5} fontSize="12px" color="text.muted">
                                                                Usá saltos de línea para separar frases o párrafos.
                                                            </Text>
                                                        </FormControl>

                                                        <Flex
                                                            justify="space-between"
                                                            align={{ base: "start", md: "center" }}
                                                            direction={{ base: "column", md: "row" }}
                                                            gap={3}
                                                        >
                                                            <Box>
                                                                <Text color="text.primary" fontWeight={500} fontSize="sm">
                                                                    Mostrar en el home
                                                                </Text>
                                                                <Text fontSize="12px" color="text.muted">
                                                                    Si está desactivado, el bloque no se mostrará en el sistema de alumnos.
                                                                </Text>
                                                            </Box>

                                                            <Switch
                                                                isChecked={isActive}
                                                                onChange={(e) => setIsActive(e.target.checked)}
                                                            />
                                                        </Flex>

                                                        <Flex justify="flex-end">
                                                            <Button
                                                                onClick={handleSave}
                                                                isLoading={saving}
                                                                loadingText="Guardando"
                                                                w={{ base: "full", md: "auto" }}
                                                                variant="primary"
                                                            >
                                                                Guardar cambios
                                                            </Button>
                                                        </Flex>
                                                    </Stack>
                                                </Box>
                                            </Box>

                                            <Box {...panelBoxStyles} w="full" maxW="full" order={{ base: 1, lg: 2 }}>
                                                <Box px={{ base: 4, md: 6 }} py={5}>
                                                    <Flex
                                                        justify="space-between"
                                                        align={{ base: "start", md: "center" }}
                                                        direction={{ base: "column", md: "row" }}
                                                        gap={3}
                                                    >
                                                        <Box>
                                                            <Heading as="h2" size="lg">
                                                                Frase del muro
                                                            </Heading>

                                                            <Text mt={1} color="text.secondary" fontSize="sm">
                                                                Gestioná el mensaje destacado que se muestra en la parte superior del muro.
                                                            </Text>
                                                        </Box>

                                                        <Badge colorScheme="brand">Previsualización</Badge>
                                                    </Flex>
                                                </Box>

                                                <Divider />

                                                <Box px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                                                    {isActive ? (
                                                        messageLines.length > 0 ? (
                                                            <HomePhrasePreview
                                                                title={title || "Bienvenid@ a Studio House Studio 💚"}
                                                                lines={messageLines}
                                                            />
                                                        ) : (
                                                            <Box
                                                                border="1px dashed"
                                                                borderColor="border.default"
                                                                borderRadius="card"
                                                                px={6}
                                                                py={10}
                                                                textAlign="center"
                                                                bg="bg.subtle"
                                                            >
                                                                <Text color="text.muted" fontSize="sm">
                                                                    Acá vas a ver la vista previa del mensaje.
                                                                </Text>
                                                            </Box>
                                                        )
                                                    ) : (
                                                        <Box
                                                            border="1px dashed"
                                                            borderColor="border.default"
                                                            borderRadius="card"
                                                            px={6}
                                                            py={10}
                                                            textAlign="center"
                                                            bg="bg.subtle"
                                                        >
                                                            <StatusBadge label="Oculto" tone="neutral" mb={3} />

                                                            <Text color="text.muted" fontSize="sm">
                                                                El bloque está desactivado y no se mostrará en el inicio.
                                                            </Text>
                                                        </Box>
                                                    )}

                                                    <Text fontSize="xs" color="text.muted" mt={4}>
                                                        Esta tarjeta simula cómo se verá el bloque destacado en el sistema de alumnos.
                                                    </Text>
                                                </Box>
                                            </Box>
                                                    </Stack>
                                                </TabPanel>

                                                <TabPanel px={0} py={4}>
                                                    <Box {...panelBoxStyles} w="full">
                                            <Box px={{ base: 4, md: 6 }} py={5}>
                                                <Flex
                                                    direction={{ base: "column", md: "row" }}
                                                    align={{ base: "stretch", md: "center" }}
                                                    justify="space-between"
                                                    gap={4}
                                                >
                                                    <Box>
                                                        <Heading as="h2" size="lg">
                                                            Posteos
                                                        </Heading>
                                                        <Text mt={1} color="text.secondary" fontSize="sm">
                                                            Gestión de posteos del muro.
                                                        </Text>
                                                    </Box>

                                                    <HStack
                                                        spacing={3}
                                                        w={{ base: "100%", md: "auto" }}
                                                        justify={{ base: "stretch", md: "flex-end" }}
                                                        flexWrap={{ base: "wrap", lg: "nowrap" }}
                                                    >
                                                        <SearchField
                                                            w={{ base: "100%", md: "350px" }}
                                                            placeholder="Buscar por título, texto o estado..."
                                                            value={search}
                                                            onChange={(e) => setSearch(e.target.value)}
                                                        />

                                                        <Button
                                                            leftIcon={<FiPlus />}
                                                            onClick={() => {
                                                                setSelectedPost(null);
                                                                setIsAddModalOpen(true);
                                                            }}
                                                            w={{ base: "100%", md: "auto" }}
                                                            variant="primary"
                                                        >
                                                            Nuevo posteo
                                                        </Button>
                                                    </HStack>
                                                </Flex>
                                            </Box>

                                            <Divider />

                                            {loadingPosts ? (
                                                <StateMessage kind="loading" py={20} />
                                            ) : (
                                                <Box overflowX="auto" pb={2} bg="bg.surface">
                                                    <Table size="sm" data-sticky-actions>
                                                        <Thead>
                                                            <Tr>
                                                                <Th>Fecha</Th>
                                                                <Th>Vista previa</Th>
                                                                <Th>Título</Th>
                                                                <Th>Descripción</Th>
                                                                <Th>Estado</Th>
                                                                <Th>Acciones</Th>
                                                            </Tr>
                                                        </Thead>

                                                        <Tbody>
                                                            {currentPosts.map((post: HomePostItem) => (
                                                                <Tr key={post.id} _hover={{ bg: "bg.subtle" }}>
                                                                    <Td>
                                                                        {post.created_at
                                                                            ? new Date(post.created_at).toLocaleDateString("es-AR")
                                                                            : "-"}
                                                                    </Td>

                                                                    <Td>
                                                                        <Box position="relative" boxSize="56px">
                                                                            {post.image ? (
                                                                                <>
                                                                                    <Image
                                                                                        src={post.image}
                                                                                        alt={post.title || "Posteo"}
                                                                                        boxSize="56px"
                                                                                        objectFit="cover"
                                                                                        rounded="md"
                                                                                    />

                                                                                    {post.video && (
                                                                                        <Box
                                                                                            position="absolute"
                                                                                            bottom="2px"
                                                                                            right="2px"
                                                                                            bg="rgba(0,0,0,0.6)"
                                                                                            borderRadius="full"
                                                                                            px="4px"
                                                                                        >
                                                                                            <Text fontSize="10px" color="white">
                                                                                                ▶
                                                                                            </Text>
                                                                                        </Box>
                                                                                    )}
                                                                                </>
                                                                            ) : post.video ? (
                                                                                <>
                                                                                    <Box boxSize="56px" overflow="hidden" borderRadius="6px">
                                                                                        <video
                                                                                            src={post.video}
                                                                                            muted
                                                                                            style={{
                                                                                                width: "100%",
                                                                                                height: "100%",
                                                                                                objectFit: "cover",
                                                                                            }}
                                                                                        />
                                                                                    </Box>

                                                                                    <Box
                                                                                        position="absolute"
                                                                                        top="50%"
                                                                                        left="50%"
                                                                                        transform="translate(-50%, -50%)"
                                                                                        bg="rgba(0,0,0,0.5)"
                                                                                        borderRadius="full"
                                                                                        px="5px"
                                                                                    >
                                                                                        <Text fontSize="12px" color="white">
                                                                                            ▶
                                                                                        </Text>
                                                                                    </Box>
                                                                                </>
                                                                            ) : (
                                                                                <Box
                                                                                    boxSize="56px"
                                                                                    bg="bg.muted"
                                                                                    rounded="md"
                                                                                    display="grid"
                                                                                    placeItems="center"
                                                                                >
                                                                                    <Text
                                                                                        fontSize="xs"
                                                                                        color="text.disabled"
                                                                                        textAlign="center"
                                                                                        lineHeight="1.1"
                                                                                    >
                                                                                        Sin
                                                                                        <br />
                                                                                        imagen
                                                                                    </Text>
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    </Td>

                                                                    <Td maxW={{ base: "220px", md: "320px" }}>
                                                                        <Text fontWeight="semibold" noOfLines={1}>
                                                                            {post.title?.trim() || "Sin título"}
                                                                        </Text>
                                                                    </Td>

                                                                    <Td maxW={{ base: "280px", md: "420px" }}>
                                                                        <Box
                                                                            fontSize="sm"
                                                                            color="text.secondary"
                                                                            maxH="72px"
                                                                            overflow="hidden"
                                                                            sx={{
                                                                                maskImage: "linear-gradient(to bottom, black 48px, transparent 72px)",
                                                                                WebkitMaskImage: "linear-gradient(to bottom, black 48px, transparent 72px)",
                                                                                p: { mb: 2, lineHeight: "1.5" },
                                                                                ul: { pl: 5, mb: 2 },
                                                                                ol: { pl: 5, mb: 2 },
                                                                                li: { mb: 1 },
                                                                                strong: { fontWeight: 700 },
                                                                                em: { fontStyle: "italic" },
                                                                                u: { textDecoration: "underline" },
                                                                                h1: { fontSize: "20px", fontWeight: 700, mb: 2 },
                                                                                h2: { fontSize: "18px", fontWeight: 700, mb: 2 },
                                                                                h3: { fontSize: "16px", fontWeight: 600, mb: 2 },
                                                                                a: { color: "text.link", textDecoration: "underline" },
                                                                            }}
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: post.caption || post.text || "<p>Sin descripción</p>",
                                                                            }}
                                                                        />
                                                                    </Td>

                                                                    <Td>
                                                                        {post.status === "draft" ? (
                                                                            <StatusBadge label="Borrador" tone="neutral" />
                                                                        ) : post.status === "paused" ? (
                                                                            <StatusBadge label="En pausa" tone="warning" />
                                                                        ) : post.status === "active" ? (
                                                                            <StatusBadge label="Activo" />
                                                                        ) : post.status === "deleted" ? (
                                                                            <StatusBadge label="Eliminado" />
                                                                        ) : (
                                                                            <StatusBadge label="Sin estado" tone="neutral" />
                                                                        )}
                                                                    </Td>

                                                                    <Td>
                                                                        <HStack spacing={1}>
                                                                            {!post.deleted_at && (
                                                                                <>
                                                                                    <IconButton
                                                                                        aria-label="Editar posteo"
                                                                                        icon={<FiEdit2 />}
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            setSelectedPost(post);
                                                                                            setIsEditModalOpen(true);
                                                                                        }}
                                                                                        variant="ghost"
                                                                                    />

                                                                                    <IconButton
                                                                                        aria-label="Eliminar posteo"
                                                                                        icon={<FiTrash2 />}
                                                                                        size="sm"
                                                                                        onClick={() => handleDeletePost(post.id)}
                                                                                        variant="ghostDanger"
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </HStack>
                                                                    </Td>
                                                                </Tr>
                                                            ))}
                                                        </Tbody>
                                                    </Table>

                                                    {currentPosts.length === 0 && (
                                                        <StateMessage kind="noResults" title="No hay posteos que coincidan con tu búsqueda." compact />
                                                    )}
                                                </Box>
                                            )}

                                            {!loadingPosts && (
                                                <Box display="flex" justifyContent="center" mt={4} pb={4}>
                                                    <Pagination
                                                        count={countPagination}
                                                        pageSize={ITEMS_PER_PAGE}
                                                        totalItems={filteredPosts.length}
                                                        defaultPage={1}
                                                        page={currentPage}
                                                        onPageChange={setCurrentPage}
                                                    />
                                                </Box>
                                            )}
                                                    </Box>
                                                </TabPanel>
                                            </TabPanels>
                                        </Tabs>
                                    </Box>
                                )}

                                {activeTab === "studio-tips" && (
                                    <Box w="full">
                                        <Tabs
                                            variant="line"
                                            w="100%"
                                            onChange={(index) => setStudioTipsTab(index)}
                                        >
                                            <TabList>
                                                <Tab>
                                                    Notas
                                                </Tab>

                                                <Tab>
                                                    Recetas
                                                </Tab>
                                            </TabList>

                                            <TabPanels>
                                                <TabPanel px={0} py={4}>
                                                    <TableNotes onOpen={onOpenAddNotes} list={notes} />
                                                </TabPanel>

                                                <TabPanel px={0} py={4}>
                                                    <TableRecipes onOpen={onOpenAddRecipes} list={recipes} />
                                                </TabPanel>
                                            </TabPanels>
                                        </Tabs>

                                        <Modal onClose={onCloseAddNotes} isOpen={isOpenAddNotes} isCentered>
                                            <ModalOverlay />
                                            <ModalContent
                                                maxW={{ base: "90%", md: "90%", lg: "75%", xl: "50%" }}
                                                maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                                                overflowY="auto"
                                            >
                                                <ModalCloseButton />
                                                <ModalNotesAdd onClose={onCloseAddNotes} />
                                            </ModalContent>
                                        </Modal>

                                        <Modal onClose={onCloseAddRecipes} isOpen={isOpenAddRecipes} isCentered>
                                            <ModalOverlay />
                                            <ModalContent
                                                maxW={{ base: "90%", md: "90%", lg: "75%", xl: "50%" }}
                                                maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
                                                overflowY="auto"
                                            >
                                                <ModalCloseButton />
                                                <ModalRecipesAdd
                                                    onClose={onCloseAddRecipes}
                                                    getRecipes={getRecipes}
                                                />
                                            </ModalContent>
                                        </Modal>
                                    </Box>
                                )}

                                {activeTab === "declaraciones" && (
                                    <Box {...panelBoxStyles} w="full">
                                        <Box px={6} py={5}>
                                            <Flex
                                                justify="space-between"
                                                align={{ base: "start", md: "center" }}
                                                direction={{ base: "column", md: "row" }}
                                                gap={4}
                                            >
                                                <Box>
                                                    <Heading as="h2" size="lg">
                                                        Declaraciones juradas
                                                    </Heading>
                                                    <Text mt={1} color="text.secondary" fontSize="sm">
                                                        Gestioná los textos legales que deben aceptar los alumnos.
                                                    </Text>
                                                </Box>

                                                <Button
                                                    leftIcon={<FiPlus />}
                                                    onClick={handleOpenAddSwornStatement}
                                                    variant="primary"
                                                >
                                                    Nueva declaración
                                                </Button>
                                            </Flex>
                                        </Box>

                                        <Divider />

                                        <Box px={6} py={6}>
                                            {sortedSwornStatements.length > 0 ? (
                                                <Box overflowX="auto" pb={2} bg="bg.surface">
                                                    <Table size="sm" data-sticky-actions>
                                                        <Thead>
                                                            <Tr>
                                                                <Th>Tipo</Th>
                                                                <Th>Declaración</Th>
                                                                <Th>Fecha</Th>
                                                                <Th>Estado</Th>
                                                                <Th>Acciones</Th>
                                                            </Tr>
                                                        </Thead>

                                                        <Tbody>
                                                            {sortedSwornStatements.map((item: SwornStatementItem) => {
                                                                const typeLabel = getSwornStatementTypeLabel(item.statement_type);
                                                                const active = isSwornStatementActive(item);

                                                                return (
                                                                    <Tr key={item.id} _hover={{ bg: "bg.subtle" }}>
                                                                        <Td minW="180px">
                                                                            <Text color="text.primary" >
                                                                                {typeLabel}
                                                                            </Text>
                                                                        </Td>

                                                                        <Td maxW={{ base: "320px", md: "680px" }}>
                                                                            <Box
                                                                                fontSize="sm"
                                                                                color="text.secondary"
                                                                                maxH="72px"
                                                                                overflow="hidden"
                                                                                sx={{
                                                                                    maskImage: "linear-gradient(to bottom, black 48px, transparent 72px)",
                                                                                    WebkitMaskImage: "linear-gradient(to bottom, black 48px, transparent 72px)",
                                                                                    p: { mb: 2, lineHeight: "1.5" },
                                                                                    ul: { pl: 5, mb: 2 },
                                                                                    ol: { pl: 5, mb: 2 },
                                                                                    li: { mb: 1 },
                                                                                    strong: { fontWeight: 700 },
                                                                                    em: { fontStyle: "italic" },
                                                                                    u: { textDecoration: "underline" },
                                                                                }}
                                                                                dangerouslySetInnerHTML={{ __html: getSwornStatementContent(item) }}
                                                                            />
                                                                        </Td>

                                                                        <Td minW="120px">
                                                                            {item.created_at
                                                                                ? new Date(item.created_at).toLocaleDateString("es-AR")
                                                                                : "-"}
                                                                        </Td>

                                                                        <Td>
                                                                            <StatusBadge label={active ? "Activa" : "Eliminada"} />
                                                                        </Td>

                                                                        <Td>
                                                                            <HStack spacing={1}>
                                                                                <IconButton
                                                                                    aria-label="Editar declaración"
                                                                                    icon={<FiEdit2 />}
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setSelectedSwornStatement(item);
                                                                                        setIsEditSwornStatementOpen(true);
                                                                                    }}
                                                                                    variant="ghost"
                                                                                />

                                                                                {active ? (
                                                                                    <IconButton
                                                                                        aria-label="Eliminar declaración"
                                                                                        icon={<FiTrash2 />}
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            setSwornStatementToDelete(item);
                                                                                            onOpenDeleteSwornStatement();
                                                                                        }}
                                                                                        variant="ghostDanger"
                                                                                    />
                                                                                ) : (
                                                                                    <IconButton
                                                                                        aria-label="Reactivar declaración"
                                                                                        icon={<FiRefreshCw />}
                                                                                        size="sm"
                                                                                        onClick={() => handleReactivateSwornStatement(item)}
                                                                                        variant="ghost"
                                                                                    />
                                                                                )}
                                                                            </HStack>
                                                                        </Td>
                                                                    </Tr>
                                                                );
                                                            })}
                                                        </Tbody>
                                                    </Table>
                                                </Box>
                                            ) : (
                                                <Box
                                                    border="1px dashed"
                                                    borderColor="border.default"
                                                    borderRadius="card"
                                                    px={6}
                                                    py={10}
                                                    textAlign="center"
                                                    bg="bg.subtle"
                                                >
                                                    <Text color="text.muted" fontSize="sm">
                                                        Todavía no hay declaraciones juradas cargadas.
                                                    </Text>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </>
                        )}
                    </Stack>
                </PageContainer>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPost(null);
                }}
                size="4xl"
                isCentered
            >
                <ModalOverlay />
                <ModalContent bg="transparent" boxShadow="none">
                    <ModalCloseButton
                        zIndex={2}
                        bg="bg.surface"
                        borderRadius="full"
                        _hover={{ bg: "bg.muted" }}
                    />
                    <ModalBody p={0}>
                        <ModalHomePostEdit
                            isOpen={isEditModalOpen}
                            onClose={() => {
                                setIsEditModalOpen(false);
                                setSelectedPost(null);
                            }}
                            post={selectedPost}
                            token={tokens?.access}
                            onSuccess={() => {
                                dispatch(getPosts());
                                setIsEditModalOpen(false);
                                setSelectedPost(null);
                            }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setSelectedPost(null);
                }}
                size="4xl"
                isCentered
            >
                <ModalOverlay />
                <ModalContent bg="transparent" boxShadow="none">
                    <ModalCloseButton
                        zIndex={2}
                        bg="bg.surface"
                        borderRadius="full"
                        _hover={{ bg: "bg.muted" }}
                    />
                    <ModalBody p={0}>
                        <ModalHomePostAdd
                            post={null}
                            token={tokens?.access}
                            onClose={() => {
                                setIsAddModalOpen(false);
                                setSelectedPost(null);
                            }}
                            onSuccess={() => {
                                dispatch(getPosts());
                                setIsAddModalOpen(false);
                                setSelectedPost(null);
                            }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isAddSwornStatementOpen}
                onClose={() => setIsAddSwornStatementOpen(false)}
                size="4xl"
                isCentered
            >
                <ModalOverlay />
                <ModalContent bg="transparent" boxShadow="none">
                    <ModalCloseButton
                        zIndex={2}
                        bg="bg.surface"
                        borderRadius="full"
                        _hover={{ bg: "bg.muted" }}
                    />
                    <ModalBody p={0}>
                        <ModalSwornStatementAdd
                            existingSwornStatements={swornStatements || []}
                            token={tokens?.access}
                            onClose={() => setIsAddSwornStatementOpen(false)}
                            onSuccess={() => {
                                dispatch(getSwornStatements());
                                setIsAddSwornStatementOpen(false);
                            }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isEditSwornStatementOpen}
                onClose={() => {
                    setIsEditSwornStatementOpen(false);
                    setSelectedSwornStatement(null);
                }}
                size="4xl"
                isCentered
            >
                <ModalOverlay />
                <ModalContent bg="transparent" boxShadow="none">
                    <ModalCloseButton
                        zIndex={2}
                        bg="bg.surface"
                        borderRadius="full"
                        _hover={{ bg: "bg.muted" }}
                    />
                    <ModalBody p={0}>
                        <ModalSwornStatementEdit
                            swornStatement={selectedSwornStatement}
                            existingSwornStatements={swornStatements || []}
                            token={tokens?.access}
                            onClose={() => {
                                setIsEditSwornStatementOpen(false);
                                setSelectedSwornStatement(null);
                            }}
                            onSuccess={() => {
                                dispatch(getSwornStatements());
                                setIsEditSwornStatementOpen(false);
                                setSelectedSwornStatement(null);
                            }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <AlertDialog
                isOpen={isDeleteSwornStatementOpen}
                leastDestructiveRef={deleteSwornStatementCancelRef}
                onClose={() => {
                    setSwornStatementToDelete(null);
                    onCloseDeleteSwornStatement();
                }}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            Eliminar declaración jurada
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            ¿Querés eliminar la declaración de tipo{" "}
                            <Text as="span" fontWeight="700">
                                {getStatementTypeLabel(swornStatementToDelete?.statement_type)}
                            </Text>
                            ? Esta acción la marcará como eliminada.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button
                                ref={deleteSwornStatementCancelRef}
                                onClick={() => {
                                    setSwornStatementToDelete(null);
                                    onCloseDeleteSwornStatement();
                                }}
                                aria-label="Cancelar"
                                variant="secondary"
                            >
                                Cancelar
                            </Button>

                            <Button onClick={handleDeleteSwornStatement} ml={3} variant="danger">
                                Eliminar
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            <AlertDialog
                isOpen={isUnavailableSwornStatementOpen}
                leastDestructiveRef={unavailableSwornStatementCancelRef}
                onClose={onCloseUnavailableSwornStatement}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
{/*                         <AlertDialogCloseButton />
 */}                        <AlertDialogHeader>
                            No se puede crear una nueva declaración
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Ya existe una declaración activa para cada tipo disponible. Editá o eliminá una existente para liberar el tipo.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button
                                ref={unavailableSwornStatementCancelRef}
                                onClick={onCloseUnavailableSwornStatement}
                                variant="primary"
                            >
                                Entendido
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
};

export default HomeContentPage;
