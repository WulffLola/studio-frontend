import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    Stack,
    HStack,
    Select,
    Box,
    Text,
    useToast,
    SimpleGrid,
    Input,
    Spinner,
    Image,
    IconButton,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { getNotes } from "../stores/studioSlice";
import { IoCloudUploadOutline } from "react-icons/io5";
import TiptapEditor from "../components/TiptapEditor";
import { LoadingOverlay } from "./ui/Loaders";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const ModalNotesEdit = ({ product, onClose }: any) => {
    const [idNote, setIdNote] = useState(product?.id ?? "");
    const [titulo, setTitulo] = useState(product?.titulo ?? "");
    const [descripcion, setDescripcion] = useState(product?.descripcion ?? "");
    const [estado, setEstado] = useState(product?.estado ?? "borrador");

    const [imagenFile, setImagenFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const [imagenUrl, setImagenUrl] = useState<string>(product?.imagen ?? "");
    const [videoUrl, setVideoUrl] = useState<string>(product?.video ?? "");

    const [imagenPreview, setImagenPreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);

    const imagenInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);

    const dispatch = useAppDispatch();
    const { tokens } = useAuthStore();
    const toast = useToast();

    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    };

    useEffect(() => {
        dispatch(getNotes());
    }, [dispatch]);

    useEffect(() => {
        if (!imagenFile) {
            setImagenPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(imagenFile);
        setImagenPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [imagenFile]);

    useEffect(() => {
        if (!videoFile) {
            setVideoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(videoFile);
        setVideoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [videoFile]);

    const handleSubmit = async () => {
        if (!titulo?.trim()) {
            toast({
                title: "Falta el título",
                description: "Debes ingresar un título para la nota.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (!stripHtml(descripcion)) {
            toast({
                title: "Falta la descripción",
                description: "Debes ingresar una descripción.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (!estado) {
            toast({
                title: "Falta el estado",
                description: "Debes seleccionar un estado.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("titulo", titulo.trim());
        formData.append("descripcion", descripcion);
        formData.append("estado", estado);

        if (imagenFile) {
            formData.append("imagen", imagenFile);
        } else if (!imagenUrl) {
            formData.append("imagen", "");
        }

        if (videoFile) {
            formData.append("video", videoFile);
        } else if (!videoUrl) {
            formData.append("video", "");
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_URL_BACKEND_NOTES}${idNote}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${tokens?.access}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast({
                title: "Nota editada correctamente.",
                description: "La nota fue editada con éxito.",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            dispatch(getNotes());
            onClose();
        } catch (error: any) {
            console.error("Error al editar nota:", error);

            let errorMessage = "Ocurrió un error al editar la nota.";

            if (error?.response?.status === 413) {
                errorMessage = "El archivo es demasiado pesado.";
            } else if (error?.response?.data?.imagen?.[0]) {
                const backendMsg = error.response.data.imagen[0];

                if (
                    backendMsg ===
                    "Upload a valid image. The file you uploaded was either not an image or a corrupted image."
                ) {
                    errorMessage = "El archivo que subiste no era una imagen o estaba dañado.";
                } else {
                    errorMessage = backendMsg;
                }
            } else if (error?.response?.data?.video?.[0]) {
                errorMessage = error.response.data.video[0];
            }

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImagenSelect = (file: File) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            toast({
                title: "Archivo inválido",
                description: "Solo se permiten imágenes JPG, JPEG, PNG o WEBP.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            toast({
                title: "Imagen demasiado pesada",
                description: "La imagen no puede superar los 5 MB.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setImagenUrl("");
        setImagenFile(file);
    };

    const handleVideoSelect = (file: File) => {
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            toast({
                title: "Archivo inválido",
                description: "Solo se permiten videos MP4, WEBM o MOV.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (file.size > MAX_VIDEO_SIZE) {
            toast({
                title: "Video demasiado pesado",
                description: "El video no puede superar los 50 MB.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setVideoUrl("");
        setVideoFile(file);
    };

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImagenSelect(file);
    };

    const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleVideoSelect(file);
    };

    const handleImagenDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleImagenSelect(file);
    };

    const handleVideoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleVideoSelect(file);
    };

    const removeImagen = () => {
        setImagenFile(null);
        setImagenPreview(null);
        setImagenUrl("");
        if (imagenInputRef.current) {
            imagenInputRef.current.value = "";
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        setVideoPreview(null);
        setVideoUrl("");
        if (videoInputRef.current) {
            videoInputRef.current.value = "";
        }
    };

    return (
        <Box>
            {loading && (
                <LoadingOverlay />
            )}

            <Stack
                spacing={4}
                w="full"
                p={{ base: 5, md: 6 }}
            >
                <Heading
                    as="h2"
                    size="lg"
                    pr={8}
                    mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}
                >
                    Editar nota
                </Heading>

                <Box>
                    <FormControl id="titulo" isRequired>
                        <FormLabel>Título</FormLabel>
                        <Input
                            w="100%"
                            type="text"
                            placeholder="Escribir..."
                            h="40px"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                        />
                    </FormControl>
                </Box>

                <Box>
                    <FormControl id="descripcion" isRequired>
                        <FormLabel>Descripción</FormLabel>
                        <TiptapEditor
                            value={descripcion}
                            onChange={setDescripcion}
                            placeholder="Escribir..."
                        />
                    </FormControl>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                        <FormControl>
                            <FormLabel>Agregar imagen</FormLabel>

                            <Input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                display="none"
                                ref={imagenInputRef}
                                onChange={handleImagenChange}
                            />

                            <Box
                                border="1px dashed"
                                borderColor="border.default"
                                borderRadius="card"
                                bg="bg.subtle"
                                p={3}
                                textAlign="center"
                                cursor="pointer"
                                transition="border-color 120ms ease, background-color 120ms ease"
                                _hover={{ bg: "brand.50", borderColor: "brand.300" }}
                                onClick={() => !imagenFile && !imagenUrl && imagenInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleImagenDrop}
                                position="relative"
                                minH="112px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {imagenPreview ? (
                                    <Box position="relative" w="100%" display="flex" justifyContent="center">
                                        <IconButton
                                            aria-label="Quitar imagen"
                                            icon={<Text fontSize="14px">✕</Text>}
                                            size="xs"
                                            position="absolute"
                                            top="-8px"
                                            right="-8px"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImagen();
                                            }}
                                            variant="danger"
                                            borderRadius="full"
                                        />

                                        <Image
                                            src={imagenPreview}
                                            alt="preview"
                                            maxH="160px"
                                            mx="auto"
                                            objectFit="contain"
                                            borderRadius="md"
                                        />
                                    </Box>
                                ) : imagenUrl ? (
                                    <Box position="relative" w="100%" display="flex" justifyContent="center">
                                        <IconButton
                                            aria-label="Quitar imagen"
                                            icon={<Text fontSize="14px">✕</Text>}
                                            size="xs"
                                            position="absolute"
                                            top="-8px"
                                            right="-8px"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImagen();
                                            }}
                                            variant="danger"
                                            borderRadius="full"
                                        />

                                        <Image
                                            src={imagenUrl}
                                            alt="imagen actual"
                                            maxH="160px"
                                            mx="auto"
                                            objectFit="contain"
                                            borderRadius="md"
                                        />
                                    </Box>
                                ) : (
                                    <Stack spacing={2} align="center">
                                        <Box fontSize="24px" color="brand.500">
                                            <IoCloudUploadOutline />
                                        </Box>
                                        <Text color="text.primary" fontSize="14px" fontWeight={600}>
                                            Subir imagen
                                        </Text>
                                        <Text fontSize="xs" color="text.muted">
                                            Hacé click o arrastrá una imagen
                                        </Text>
                                    </Stack>
                                )}
                            </Box>
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl>
                            <FormLabel>Agregar video</FormLabel>

                            <Input
                                type="file"
                                accept=".mp4,.webm,.mov"
                                display="none"
                                ref={videoInputRef}
                                onChange={handleVideoInputChange}
                            />

                            <Box
                                border="1px dashed"
                                borderColor="border.default"
                                borderRadius="card"
                                bg="bg.subtle"
                                p={3}
                                textAlign="center"
                                cursor="pointer"
                                transition="border-color 120ms ease, background-color 120ms ease"
                                _hover={{ bg: "brand.50", borderColor: "brand.300" }}
                                onClick={() => !videoFile && !videoUrl && videoInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleVideoDrop}
                                position="relative"
                                minH="112px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {videoPreview ? (
                                    <Box position="relative" w="100%" display="flex" justifyContent="center">
                                        <IconButton
                                            aria-label="Quitar video"
                                            icon={<Text fontSize="14px">✕</Text>}
                                            size="xs"
                                            position="absolute"
                                            top="-8px"
                                            right="-8px"
                                            zIndex={1}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeVideo();
                                            }}
                                            variant="danger"
                                            borderRadius="full"
                                        />

                                        <video
                                            controls
                                            style={{
                                                width: "100%",
                                                maxHeight: "160px",
                                                borderRadius: "8px",
                                                objectFit: "contain",
                                            }}
                                        >
                                            <source src={videoPreview} />
                                        </video>
                                    </Box>
                                ) : videoUrl ? (
                                    <Box position="relative" w="100%" display="flex" justifyContent="center">
                                        <IconButton
                                            aria-label="Quitar video"
                                            icon={<Text fontSize="14px">✕</Text>}
                                            size="xs"
                                            position="absolute"
                                            top="-8px"
                                            right="-8px"
                                            zIndex={1}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeVideo();
                                            }}
                                            variant="danger"
                                            borderRadius="full"
                                        />

                                        <video
                                            controls
                                            style={{
                                                width: "100%",
                                                maxHeight: "160px",
                                                borderRadius: "8px",
                                                objectFit: "contain",
                                            }}
                                        >
                                            <source src={videoUrl} />
                                        </video>
                                    </Box>
                                ) : (
                                    <Stack spacing={2} align="center">
                                        <Box fontSize="24px" color="brand.500">
                                            <IoCloudUploadOutline />
                                        </Box>
                                        <Text color="text.primary" fontSize="14px" fontWeight={600}>
                                            Subir video
                                        </Text>
                                        <Text fontSize="xs" color="text.muted">
                                            Hacé click o arrastrá un video
                                        </Text>
                                    </Stack>
                                )}
                            </Box>
                        </FormControl>
                    </Box>
                </SimpleGrid>

                <Box pt={6}>
                    <FormControl id="estado" isRequired>
                        <FormLabel>Estado</FormLabel>
                        <Select
                            h="40px"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="borrador">Borrador</option>
                            <option value="en_pausa">En pausa</option>
                            <option value="activo">Activo</option>
                        </Select>
                    </FormControl>
                </Box>

                <HStack spacing={3} justify="flex-end">
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
                </HStack>
            </Stack>
        </Box>
    );
};

export default ModalNotesEdit;