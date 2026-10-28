import {
  Button,
  Stack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  Box,
  Spinner,
  HStack,
  IconButton,
  Text,
  Image,
} from "@chakra-ui/react";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../stores/hooks";
import { getActivityType } from "../stores/studioSlice";
import { IoCloudUploadOutline } from "react-icons/io5";
import { cropActivityTypeImage } from "./activityTypeImage";
import ActivityTypeImageEditor from "./ActivityTypeImageEditor";
import { LoadingOverlay } from "./ui/Loaders";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ModalActivityTypeAdd = ({ onClose, isCancel }: any) => {
  const [name, setName] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [editorOpenRequest, setEditorOpenRequest] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageOffsetX, setImageOffsetX] = useState(0);
  const [imageOffsetY, setImageOffsetY] = useState(0);

  const imagenInputRef = useRef<HTMLInputElement | null>(null);

  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { activityType } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();
  const toast = useToast();

  useEffect(() => {
    if (!imagenFile) {
      setImagenPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imagenFile);
    setImagenPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imagenFile]);

  useEffect(() => () => {
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
  }, [croppedPreview]);

  const normalizeText = (text: string) =>
    text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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

    setImageZoom(1);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setCroppedPreview(null);
    setImagenFile(file);
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImagenSelect(file);
  };

  const handleImagenDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImagenSelect(file);
  };

  const removeImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    setImageZoom(1);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setCroppedPreview(null);

    if (imagenInputRef.current) {
      imagenInputRef.current.value = "";
    }
  };

  const updateCroppedPreview = async (zoom: number, offsetX: number, offsetY: number) => {
    if (!imagenFile) return;
    const croppedImage = await cropActivityTypeImage(imagenFile, zoom, offsetX, offsetY);
    setCroppedPreview(URL.createObjectURL(croppedImage));
  };

  const handleSubmitActivityType = async () => {
    setLoading(true);

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast({
        title: "Faltan completar campos.",
        description: "Por favor completá el campo 'Nombre'.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    if (!imagenFile) {
      toast({
        title: "Falta cargar la imagen.",
        description: "La imagen del tipo de actividad es obligatoria.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const wordsRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!wordsRegex.test(trimmedName)) {
      toast({
        title: "Nombre inválido.",
        description: "Por favor ingresá solo letras.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const exists =
      Array.isArray(activityType) &&
      activityType.some(
        (item: any) =>
          normalizeText(item.name || "") === normalizeText(trimmedName)
      );

    if (exists) {
      toast({
        title: "Tipo de actividad duplicado.",
        description: "Ya existe un tipo de actividad con ese nombre.",
        status: "error",
        position: "bottom-right",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);

    if (imagenFile) {
      try {
        const croppedImage = await cropActivityTypeImage(imagenFile, imageZoom, imageOffsetX, imageOffsetY);
        formData.append("photo", croppedImage);
      } catch {
        toast({ title: "No se pudo procesar la imagen", status: "error", position: "bottom-right" });
        setLoading(false);
        return;
      }
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_ACTIVITY_TYPE}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast({
        title: "Tipo de actividad creado correctamente.",
        description: "El tipo de actividad fue creado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onClose();
      dispatch(getActivityType());
    } catch (error: any) {
      console.error("Error en la solicitud:", error);

      let errorMessage = "Ocurrió un error al registrar el tipo de actividad.";

      if (error?.response?.status === 413) {
        errorMessage = "El archivo es demasiado pesado.";
      } else if (error?.response?.data?.photo?.[0]) {
        const backendMsg = error.response.data.photo[0];

        if (
          backendMsg ===
          "Upload a valid image. The file you uploaded was either not an image or a corrupted image."
        ) {
          errorMessage =
            "El archivo que subiste no era una imagen o estaba dañado.";
        } else {
          errorMessage = backendMsg;
        }
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
          Nuevo tipo de actividad
        </Heading>

        <SimpleGrid columns={[1, 1, 1]} spacing={4} justifyContent="center">
          <Box display="flex" justifyContent="center" w="100%">
            <FormControl id="name" isRequired>
              <FormLabel>Nombre</FormLabel>
              <Input
                type="text"
                w="100%"
                placeholder="Escribir..."
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </FormControl>
          </Box>

          <Box>
            <FormControl isRequired>
              <FormLabel>Agregar imagen</FormLabel>
              <Text fontSize="xs" color="text.secondary" mb={3}>
                Podés usar una imagen de cualquier tamaño u orientación y ajustar su encuadre.
              </Text>
           

              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                display="none"
                ref={imagenInputRef}
                onChange={handleImagenChange}
              />

              <Box
                border="1px dashed"
                borderColor={imagenFile ? "success.border" : "border.default"}
                borderRadius="card"
                p={5}
                bg={imagenFile ? "success.bg" : "bg.subtle"}
                textAlign="center"
                cursor="pointer"
                transition="border-color 120ms ease, background-color 120ms ease"
                _hover={{ borderColor: "brand.400", bg: "brand.50" }}
                onClick={() => !imagenFile && imagenInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleImagenDrop}
                position="relative"
                minH="132px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {imagenPreview ? (
                  <Box
                    position="relative"
                    w="100%"
                    display="flex"
                    justifyContent="center"
                  >
                    <IconButton
                      aria-label="Quitar imagen"
                      icon={<Text fontSize="14px">✕</Text>}
                      size="xs"
                      position="absolute"
                      zIndex={1}
                      top="-8px"
                      right="-8px"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImagen();
                      }}
                      variant="danger"
                      borderRadius="full"
                    />

                    <Box w="100%" maxW="400px">
                      <Box
                        w="100%"
                        h="160px"
                        overflow="hidden"
                        borderRadius="control"
                        cursor="pointer"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditorOpenRequest((value) => value + 1);
                        }}
                      >
                        <Image
                          src={croppedPreview || imagenPreview}
                          alt="Encuadre seleccionado"
                          w="100%"
                          h="100%"
                          objectFit="cover"
                          objectPosition="center"
                        />
                      </Box>
                      <Text fontSize="xs" color="success.fg" mt={2}>Encuadre seleccionado</Text>
                    </Box>
                  </Box>
                ) : (
                  <Stack spacing={2} align="center">
                    <Box fontSize="26px" color="brand.600" bg="brand.50" p={3} borderRadius="full">
                      <IoCloudUploadOutline />
                    </Box>
                    <Text color="text.primary" fontSize="14px" fontWeight={600}>
                      Elegí una imagen o arrastrala acá
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      JPEG, PNG o WebP · hasta 5 MB
                    </Text>
                  </Stack>
                )}
              </Box>

              {imagenPreview && (
                <ActivityTypeImageEditor
                  src={imagenPreview}
                  editable
                  zoom={imageZoom}
                  offsetX={imageOffsetX}
                  offsetY={imageOffsetY}
                  onZoomChange={setImageZoom}
                  onOffsetXChange={setImageOffsetX}
                  onOffsetYChange={setImageOffsetY}
                  onSaveFrame={updateCroppedPreview}
                  openRequest={editorOpenRequest}
                />
              )}
            </FormControl>
          </Box>
        </SimpleGrid>

        <HStack spacing={3} justify="flex-end" mt={6}>
          <Button
            onClick={onClose}
            w={["100%", "135px"]}
            isDisabled={isCancel}
            aria-label="Cancelar"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitActivityType}
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

export default ModalActivityTypeAdd;
