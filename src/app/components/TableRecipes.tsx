"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LoadingOverlay } from "./ui/Loaders";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  Badge,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  Spinner,
  VStack,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import {
  FiGrid,
  FiList,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import { getRecipes } from "../stores/studioSlice";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import ModalRecipesEdit from "./ModalRecipesEdit";
import Pagination from "./Pagination";
import SearchField from "./ui/SearchField";
import StatusBadge from "./ui/StatusBadge";

const ITEMS_PER_PAGE = 10;

const renderTiptapHtml = (html?: string) => ({
  __html: html || "",
});

const tiptapContentStyles = {
  p: { margin: 0 },
  ul: { paddingLeft: "1.2rem", margin: "0.25rem 0" },
  ol: { paddingLeft: "1.2rem", margin: "0.25rem 0" },
  li: { marginBottom: "0.15rem" },
  strong: { fontWeight: "bold" },
  em: { fontStyle: "italic" },
  u: { textDecoration: "underline" },
  h1: { fontSize: "1.1rem", fontWeight: "bold", margin: "0.4rem 0" },
  h2: { fontSize: "1rem", fontWeight: "bold", margin: "0.35rem 0" },
  h3: { fontSize: "0.95rem", fontWeight: "bold", margin: "0.3rem 0" },
};

export default function TableRecipes({
  list,
  onOpen,
}: {
  list: Array<any>;
  onOpen: () => void;
}) {
  const toast = useToast();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [code, setCode] = useState("admin");
  const { tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const {
    isOpen: isOpenPreview,
    onOpen: onOpenPreview,
    onClose: onClosePreview,
  } = useDisclosure();

  const {
    isOpen: isOpenModalEdit,
    onOpen: onOpenModalEdit,
    onClose: onCloseModalEdit,
  } = useDisclosure();

  const {
    isOpen: isAlertDialogDeleteOpen,
    onOpen: onOpenAlertDialogDelete,
    onClose: onCloseAlertDialogDelete,
  } = useDisclosure();

  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const dispatch = useAppDispatch();

  const sortedList = useMemo(() => {
    const arr = [...(list || [])];
    return arr.sort((a: any, b: any) => {
      const da = new Date(a.createdAt || a.created_at || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || 0).getTime();
      return db - da;
    });
  }, [list]);

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  const filteredItems = useMemo(() => {
    const q = normalizeText(searchTerm);

    if (!q) return sortedList;

    return sortedList.filter((r: any) => {
      const titulo = normalizeText(r.titulo || "");
      const descripcion = normalizeText(stripHtml(r.descripcion || ""));
      const estado = normalizeText(r.estado || "");
      const ingredientes = normalizeText(
        Array.isArray(r.ingredientes)
          ? r.ingredientes.join(" ")
          : stripHtml(r.ingredientes || "")
      );
      const pasos = normalizeText(
        Array.isArray(r.pasos)
          ? r.pasos.join(" ")
          : stripHtml(r.pasos || "")
      );

      const fechaObj = r.created_at ? new Date(r.created_at) : null;

      const fecha = fechaObj
        ? normalizeText(fechaObj.toLocaleDateString("es-AR"))
        : "";

      const fechaAlt = fechaObj
        ? normalizeText(
          `${fechaObj.getDate()}/${fechaObj.getMonth() + 1}/${fechaObj.getFullYear()}`
        )
        : "";

      return (
        titulo.includes(q) ||
        descripcion.includes(q) ||
        estado.includes(q) ||
        ingredientes.includes(q) ||
        pasos.includes(q) ||
        fecha.includes(q) ||
        fechaAlt.includes(q)
      );
    });
  }, [sortedList, searchTerm]);

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);

  const handleClickEdit = (item: any) => {
    setSelectedItem(item);
    onOpenModalEdit();
  };

  const handleClickDelete = (item: any) => {
    setSelectedItem(item);
    onOpenAlertDialogDelete();
  };

  const handleOpenPreview = (item: any) => {
    setSelectedRecipe(item);
    setMediaIndex(0);
    onOpenPreview();
  };

  const handleClosePreview = () => {
    setSelectedRecipe(null);
    setMediaIndex(0);
    onClosePreview();
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_RECIPES}${selectedItem.id}/`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
            "Content-Type": "application/json",
          },
          data: {
            code,
          },
        }
      );

      toast({
        title: "Receta eliminada correctamente.",
        description: "La receta se ha eliminado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onCloseAlertDialogDelete();
      dispatch(getRecipes());
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la receta.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(getRecipes());
    setLoadingTable(true);

    const timer = setTimeout(() => setLoadingTable(false), 800);
    return () => clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, view]);

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredItems.length, currentPage]);

  return (
    <>
      <Modal
        onClose={onCloseModalEdit}
        isOpen={isOpenModalEdit}
        size={{ base: "300px" }}
      >
        <ModalOverlay />
        <ModalContent
          mt={{ base: "40px", md: "60px" }}
          maxW={{ base: "90%", md: "90%", lg: "75%", xl: "50%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
        >
          <ModalCloseButton />
          <ModalRecipesEdit
            onClose={onCloseModalEdit}
            product={selectedItem}
            recipes={list}
          />
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isOpenPreview}
        onClose={handleClosePreview}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent mr={"10px"} ml={"10px"}>
          <ModalHeader>{selectedRecipe?.titulo ?? "Nota"}</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {selectedRecipe && (
              <VStack align="stretch" spacing={4}>
                {(selectedRecipe.imagen || selectedRecipe.video) && (
                  <Box position="relative">
                    {mediaIndex === 0 && selectedRecipe.imagen && (
                      <Image
                        src={selectedRecipe.imagen}
                        alt={selectedRecipe.titulo}
                        w="100%"
                        borderRadius="md"
                        objectFit="cover"
                        maxH="300px"
                      />
                    )}

                    {(mediaIndex === 1 || !selectedRecipe.imagen) && selectedRecipe.video && (
                      <video
                        controls
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          maxHeight: "300px",
                          objectFit: "cover",
                        }}
                      >
                        <source src={selectedRecipe.video} />
                      </video>
                    )}

                    {selectedRecipe.imagen && selectedRecipe.video && (
                      <>
                        <IconButton
                          aria-label="Anterior"
                          icon={<Text fontSize="18px">‹</Text>}
                          position="absolute"
                          top="50%"
                          left="8px"
                          transform="translateY(-50%)"
                          onClick={() => setMediaIndex((prev) => (prev === 0 ? 1 : 0))}
                          size="sm"
                          borderRadius="full"
                         variant="ghost" />

                        <IconButton
                          aria-label="Siguiente"
                          icon={<Text fontSize="18px">›</Text>}
                          position="absolute"
                          top="50%"
                          right="8px"
                          transform="translateY(-50%)"
                          onClick={() => setMediaIndex((prev) => (prev === 0 ? 1 : 0))}
                          size="sm"
                          borderRadius="full"
                         variant="ghost" />
                      </>
                    )}
                  </Box>
                )}

                <Text fontSize="sm" color="text.muted">
                  {selectedRecipe.created_at
                    ? new Date(selectedRecipe.created_at).toLocaleDateString("es-AR")
                    : "-"}
                </Text>

                {selectedRecipe.descripcion && (
                  <Box
                    fontSize="sm"
                    sx={tiptapContentStyles}
                    dangerouslySetInnerHTML={renderTiptapHtml(selectedRecipe.descripcion)}
                  />
                )}

                {selectedRecipe.ingredientes && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Ingredientes</Text>
                    <Box
                      fontSize="sm"
                      sx={tiptapContentStyles}
                      dangerouslySetInnerHTML={renderTiptapHtml(selectedRecipe.ingredientes)}
                    />
                  </Box>
                )}

                {selectedRecipe.pasos && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Pasos</Text>
                    <Box
                      fontSize="sm"
                      sx={tiptapContentStyles}
                      dangerouslySetInnerHTML={renderTiptapHtml(selectedRecipe.pasos)}
                    />
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button aria-label="Cerrar" onClick={handleClosePreview} variant="secondary">
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {loading && (
        <LoadingOverlay />
      )}

      <AlertDialog
        isOpen={isAlertDialogDeleteOpen}
        onClose={onCloseAlertDialogDelete}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogCloseButton />
            <AlertDialogHeader>
              Eliminar receta
            </AlertDialogHeader>

            <AlertDialogBody>
              {selectedItem ? (
                <>
                  ¿Está seguro que quiere eliminar la receta{" "}
                  <span style={{ fontWeight: 600 }}>{selectedItem?.titulo}</span>?
                  <Box mt={2} fontSize="sm" color="text.secondary">
                    Esta acción no se puede deshacer.
                  </Box>
                </>
              ) : (
                <>No se ha seleccionado ninguna receta.</>
              )}
            </AlertDialogBody>

            <AlertDialogFooter gap={3}>
              <Button
                ref={cancelRef}
                onClick={onCloseAlertDialogDelete}
                w={["100%", "135px"]}
                aria-label="Cancelar"
                variant="secondary"
              >
                Cancelar
              </Button>

              <Button
                onClick={handleDelete}
                ml={3}
                w={["100%", "135px"]}
                variant="danger"
              >
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Container maxW="100%" py={6} px={{ base: 4, md: 6 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          gap={4}
          mb={6}
          w="100%"
        >
          <Box w="100%">
            <Text as="h2" textStyle="sectionTitle">
              Recetas saludables
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Panel para cargar recetas que ven los alumnos
            </Text>
          </Box>

          <HStack
            spacing={3}
            w={{ base: "100%", md: "auto" }}
            flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
            justify={{ base: "space-between", md: "flex-end" }}
            pl={{ base: "", md: "10px" }}
          >
            <SearchField
                w={{ base: "100%", md: "90%", lg: "250px", xl: "350px" }}
                placeholder="Buscar por título, descripción, ingredientes, pasos, estado o fecha…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <HStack spacing={2}>
              <IconButton
                aria-label="Vista tarjetas"
                icon={<FiGrid />}
                onClick={() => setView("cards")}
                variant="toggle" isActive={view === "cards"} aria-pressed={view === "cards"}
                size="sm"
              />
              <IconButton
                aria-label="Vista tabla"
                icon={<FiList />}
                onClick={() => setView("table")}
                variant="toggle" isActive={view === "table"} aria-pressed={view === "table"}
                size="sm"
              />
            </HStack>

            <Button leftIcon={<FiPlus />} onClick={onOpen} variant="primary">
              Nueva receta
            </Button>
          </HStack>
        </Flex>

        {loadingTable ? (
          <Flex justify="center" align="center" py={20}>
            <Spinner size="lg" />
          </Flex>
        ) : view === "cards" ? (
          filteredItems.length > 0 ? (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
              spacing={{ base: 4, md: 6 }}
            >
              {filteredItems.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  product={recipe}
                  onClick={() => handleOpenPreview(recipe)}
                  onEdit={() => handleClickEdit(recipe)}
                  onDelete={() => handleClickDelete(recipe)}
                />

              ))}
            </SimpleGrid>
          ) : (
            <Box opacity={0.7} mt={4}>
              No hay recetas que coincidan con tu búsqueda.
            </Box>
          )
        ) : (
          <Box overflowX="auto" mt={2} pb={2} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card" boxShadow="card">
            <Table size="sm" data-sticky-actions>
              <Thead>
                <Tr>
                  <Th>Fecha</Th>
                  <Th>Imagen</Th>
                  <Th>Título</Th>
                  <Th>Descripción</Th>
                  <Th>Estado</Th>
                  <Th isNumeric>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentItems.map((recipe) => (
                  <Tr
                    key={recipe.id}
                    cursor="pointer"
                    onClick={() => handleOpenPreview(recipe)}
                    _hover={{ bg: "bg.subtle" }}
                  >                    <Td>
                      {recipe.created_at
                        ? new Date(recipe.created_at).toLocaleDateString("es-AR")
                        : "-"}
                    </Td>

                    <Td>
                      <Box position="relative" boxSize="56px">
                        {recipe.imagen ? (
                          <>
                            <Image
                              src={recipe.imagen}
                              alt={recipe.titulo}
                              boxSize="56px"
                              objectFit="cover"
                              rounded="md"
                            />

                            {recipe.video && (
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
                        ) : recipe.video ? (
                          <>
                            <Box boxSize="56px" overflow="hidden" borderRadius="6px">
                              <video
                                src={recipe.video}
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
                            _dark={{ bg: "gray.700" }}
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

                    <Td maxW={{ base: "220px", md: "360px" }}>
                      <Text fontWeight="semibold" noOfLines={1}>
                        {recipe.titulo}
                      </Text>
                    </Td>

                    <Td maxW={{ base: "280px", md: "420px" }}>
                      <Box
                        fontSize="sm"
                        color="text.secondary"
                        _dark={{ color: "text.disabled" }}
                        overflow="hidden"
                        display="-webkit-box"
                        sx={{
                          ...tiptapContentStyles,
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                        dangerouslySetInnerHTML={renderTiptapHtml(recipe.descripcion)}
                      />
                    </Td>

                    <Td>
                      {recipe.estado === "borrador" ? (
                        <StatusBadge label="Borrador" tone="neutral" />
                      ) : recipe.estado === "en_pausa" ? (
                        <StatusBadge label="En pausa" tone="warning" />
                      ) : recipe.estado === "activo" ? (
                        <StatusBadge label="Activo" />
                      ) : recipe.estado === "eliminado" ? (
                        <StatusBadge label="Eliminado" />
                      ) : (
                        <StatusBadge label="Sin estado" tone="neutral" />
                      )}
                    </Td>

                    <Td isNumeric>
                      <HStack justify="flex-end" spacing={1}>
                        <IconButton
                          aria-label="Editar"
                          icon={<FiEdit2 />}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClickEdit(recipe);
                          }}
                          variant="ghost"
                        />
                        <IconButton
                          aria-label="Eliminar"
                          icon={<FiTrash2 />}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClickDelete(recipe);
                          }}
                          variant="ghostDanger"
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {currentItems.length === 0 && (
              <Box p={4} opacity={0.7}>
                No hay recetas que coincidan con tu búsqueda.
              </Box>
            )}
          </Box>
        )}

        {!loadingTable && view === "table" && (
          <Box display="flex" justifyContent="center" mt={4} w="100%">
            <Pagination
              count={countPagination}
              pageSize={ITEMS_PER_PAGE}
              totalItems={filteredItems.length}
              defaultPage={1}
              page={currentPage}
              onPageChange={setCurrentPage}
            />
          </Box>
        )}
      </Container>
    </>
  );
}

function RecipeCard({
  product,
  onEdit,
  onDelete,
  onClick,
}: {
  product: any;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const dateStr = product.created_at
    ? new Date(product.created_at).toLocaleDateString("es-AR")
    : "-";

  const badge =
    product.estado === "borrador"
      ? { label: "Borrador", tone: "neutral" as const }
      : product.estado === "en_pausa"
        ? { label: "En pausa", tone: "warning" as const }
        : product.estado === "activo"
          ? { label: "Activo", tone: "success" as const }
          : product.estado === "eliminado"
            ? { label: "Eliminado", tone: "error" as const }
            : { label: "Sin estado", tone: "neutral" as const };

  return (
    <Stack
      borderWidth="1px"
      borderRadius="card"
      overflow="hidden"
      spacing={0}
      cursor="pointer"
      onClick={onClick}
      _hover={{ shadow: "md" }}
    >
      <Box
        position="relative"
        bg="bg.subtle"
        _dark={{ bg: "gray.800" }}
        h={{ base: "150px", md: "160px" }}
        w="100%"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {product.imagen ? (
          <>
            <Image
              src={product.imagen}
              alt={product.titulo}
              w="100%"
              h="100%"
              objectFit="cover"
            />

            {product.video && (
              <Box
                position="absolute"
                bottom="8px"
                right="8px"
                bg="rgba(0,0,0,0.6)"
                borderRadius="full"
                px="6px"
                py="2px"
              >
                <Text fontSize="12px" color="white">
                  ▶
                </Text>
              </Box>
            )}
          </>
        ) : product.video ? (
          <>
            <video
              src={product.video}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              bg="rgba(0,0,0,0.5)"
              borderRadius="full"
              px="8px"
              py="2px"
            >
              <Text fontSize="14px" color="white">
                ▶
              </Text>
            </Box>
          </>
        ) : (
          <Text fontSize="sm" color="text.disabled">
            Sin imagen
          </Text>
        )}
      </Box>

      <Box p={3}>
        <HStack justify="space-between" align="start" mb={1}>
          <Text fontWeight="semibold" noOfLines={2} fontSize="sm">
            {product.titulo}
          </Text>

          <StatusBadge label={badge.label} tone={badge.tone} ml={2} />
        </HStack>

        <Text fontSize="xs" color="text.muted" mb={2}>
          {dateStr}
        </Text>

        <Box
          fontSize="xs"
          color="text.secondary"
          overflow="hidden"
          display="-webkit-box"
          sx={{
            ...tiptapContentStyles,
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
          dangerouslySetInnerHTML={renderTiptapHtml(product.descripcion)}
        />

        <HStack mt={3} spacing={2}>
          <IconButton
            aria-label="Editar"
            icon={<FiEdit2 />}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            variant="ghost"
          />
          <IconButton
            aria-label="Eliminar"
            icon={<FiTrash2 />}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            variant="ghostDanger"
          />
        </HStack>
      </Box>
    </Stack>
  );
}
