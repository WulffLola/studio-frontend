"use client";

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
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { IoCloudUploadOutline } from "react-icons/io5";
import TiptapEditor from "./TiptapEditor";
import { LoadingOverlay } from "./ui/Loaders";

type HomePostStatus = "draft" | "paused" | "active";

type HomePostItem = {
  id: number;
  title?: string;
  text: string;
  image?: string | null;
  video?: string | null;
  status: HomePostStatus;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  post: HomePostItem | null;
  token?: string;
  onSuccess: () => void;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const ModalHomePostEdit = ({
  isOpen,
  onClose,
  post,
  token,
  onSuccess,
}: Props) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<HomePostStatus>("draft");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const toast = useToast();

  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title || "");
      setText(post.caption || "");
      setStatus(post.status || "draft");
      setExistingImage(post.image || null);
      setExistingVideo(post.video || null);
      setImageFile(null);
      setVideoFile(null);
    } else if (isOpen) {
      setTitle("");
      setText("");
      setStatus("draft");
      setExistingImage(null);
      setExistingVideo(null);
      setImageFile(null);
      setVideoFile(null);
    }
  }, [post, isOpen]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [videoFile]);

  const handleImageSelect = (file: File) => {
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

    setImageFile(file);
    setExistingImage(null);
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

    setVideoFile(file);
    setExistingVideo(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVideoSelect(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleVideoSelect(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setExistingImage(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setExistingVideo(null);

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast({
        title: "Falta el texto",
        description: "Debes ingresar un texto para el posteo.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    if (!status) {
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

    if (!post?.id) {
      toast({
        title: "Error",
        description: "No se encontró el posteo a editar.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("caption", text.trim());
    formData.append("status", status);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (videoFile) {
      formData.append("video", videoFile);
    }

    if (!imageFile && !existingImage) {
      formData.append("image", "");
      formData.append("remove_image", "true");
    }

    if (!videoFile && !existingVideo) {
      formData.append("video", "");
      formData.append("remove_video", "true");
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_HOME_POSTS}${post.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast({
        title: "Posteo actualizado correctamente.",
        description: "El posteo fue actualizado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error al actualizar posteo:", error);

      let errorMessage = "Ocurrió un error al guardar el posteo.";

      if (error?.response?.status === 413) {
        errorMessage = "El archivo es demasiado pesado.";
      } else if (error?.response?.data?.image?.[0]) {
        errorMessage = error.response.data.image[0];
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

  const currentImage = imagePreview || existingImage;
  const currentVideo = videoPreview || existingVideo;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalCloseButton
          zIndex={2}
          bg="bg.surface"
          borderRadius="full"
          _hover={{ bg: "bg.muted" }}
        />

        <ModalBody p={0}>
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
                Editar posteo
              </Heading>

              <Box>
                <FormControl id="title" isRequired>
                  <FormLabel>Título</FormLabel>
                  <Input
                    w="100%"
                    type="text"
                    placeholder="Escribir..."
                    h="40px"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </FormControl>
              </Box>

              <Box>
                <FormControl id="text" isRequired>
                  <FormLabel>Descripción</FormLabel>
                  <TiptapEditor
                    value={text}
                    onChange={setText}
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
                      ref={imageInputRef}
                      onChange={handleImageChange}
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
                      onClick={() => !currentImage && imageInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleImageDrop}
                      position="relative"
                      minH="112px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {currentImage ? (
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
                              removeImage();
                            }}
                            variant="danger"
                            borderRadius="full"
                          />

                          <Image
                            src={currentImage}
                            alt="preview"
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
                      onChange={handleVideoChange}
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
                      onClick={() => !currentVideo && videoInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleVideoDrop}
                      position="relative"
                      minH="112px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {currentVideo ? (
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
                            <source src={currentVideo} />
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
                <FormControl id="status" isRequired>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    h="40px"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as HomePostStatus)}
                  >
                    <option value="draft">Borrador</option>
                    <option value="paused">En pausa</option>
                    <option value="active">Activo</option>
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
                  isLoading={loading}
                  loadingText="Guardando"
                  variant="primary"
                >
                  Guardar
                </Button>
              </HStack>
            </Stack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalHomePostEdit;
