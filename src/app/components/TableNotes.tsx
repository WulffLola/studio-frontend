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
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  Badge,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Checkbox,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import {
  FiGrid,
  FiList,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";
import {
  getNotes,
} from '../stores/studioSlice';
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import ModalNotesEdit from "./ModalNotesEdit";
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
/* ---------- Componente principal ---------- */
const TableNotes = ({ list, onOpen }: { list: Array<any>; onOpen: () => void; }) => {
  const toast = useToast();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [code, setCode] = useState("admin");
  const { tipo, tokens } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const {
    isOpen: isOpenPreview,
    onOpen: onOpenPreview,
    onClose: onClosePreview,
  } = useDisclosure();

  // Modal crear / editar
  const {
    isOpen: isOpenModalEdit,
    onOpen: onOpenModalEdit,
    onClose: onCloseModalEdit,
  } = useDisclosure();

  const {
    isOpen: isOpenModalDelete,
    onOpen: onOpenModalDelete,
    onClose: onCloseModalDelete,
  } = useDisclosure();

  const {
    isOpen: isAlertDialogDeleteOpen,
    onOpen: onOpenAlertDialogDelete,
    onClose: onCloseAlertDialogDelete,
  } = useDisclosure();

  /*   const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);*/
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const dispatch = useAppDispatch();

  
  // Ordenar por fecha (más nuevas primero)
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

    return sortedList.filter((n: any) => {
      const titulo = normalizeText(n.titulo || "");
      const descripcion = normalizeText(stripHtml(n.descripcion || ""));
      const estado = normalizeText(n.estado || "");

      const fechaObj = n.created_at ? new Date(n.created_at) : null;

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
        fecha.includes(q) ||
        fechaAlt.includes(q)
      );
    });
  }, [sortedList, searchTerm]);


  // Paginación
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);


  const emptyRowsCount = ITEMS_PER_PAGE - currentItems.length;

  const handleClickEdit = (item: any) => {
    setSelectedItem(item);
    onOpenModalEdit();
  };

  const handleClickDelete = (item: any) => {
    setSelectedItem(item);
    onOpenAlertDialogDelete();
  };

  const handleRowDoubleClick = (item: any) => {
    setSelectedItem(item);
    onOpenModalEdit();
  };

  const handleOpenPreview = (item: any) => {
    setSelectedNote(item);
    setMediaIndex(0);
    onOpenPreview();
  };

  const handleClosePreview = () => {
    setSelectedNote(null);
    setMediaIndex(0);
    onClosePreview();
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await axios.delete(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_NOTES}${selectedItem.id}/`,
        {
          headers: {
            'Authorization': `Bearer ${tokens?.access}`, // Añade el token de autenticación
            'Content-Type': 'application/json',
          },
          data: {
            code: code  // Campo 'code' con su valor
          }
        }
      );

      toast({
        title: "Nota eliminada correctamente.",
        description: "La nota se ha eliminado con éxito.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      onCloseAlertDialogDelete();
      dispatch(getNotes());

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar las notas.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false); // Asegura que el estado de carga se desactive
    };
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return " ";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Fecha inválida";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    dispatch(getNotes());
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
      {/* Modal Editar (si lo necesitás como TableStudents) */}
      <Modal
        onClose={onCloseModalEdit}
        isOpen={isOpenModalEdit}
        size={{ base: "300px" }}
      >
        <ModalOverlay />
        <ModalContent
          mt={{ base: "40px", md: "60px" }}   // 👈 acá lo subís
          maxW={{ base: "90%", md: "90%", lg: "75%", xl: "50%" }}
          maxH={{ base: "80vh", md: "80vh", lg: "70vh", xl: "75vh" }}
        >
          <ModalCloseButton />
          <ModalNotesEdit
            onClose={onCloseModalEdit}
            product={selectedItem}
            getNotes={getNotes}
            notes={list}
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
          <ModalHeader>{selectedNote?.titulo ?? "Nota"}</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {selectedNote && (
              <VStack align="stretch" spacing={4}>
                {(selectedNote.imagen || selectedNote.video) && (
                  <Box position="relative">
                    {mediaIndex === 0 && selectedNote.imagen && (
                      <Image
                        src={selectedNote.imagen}
                        alt={selectedNote.titulo}
                        w="100%"
                        borderRadius="md"
                        objectFit="cover"
                        maxH="300px"
                      />
                    )}

                    {(mediaIndex === 1 || !selectedNote.imagen) && selectedNote.video && (
                      <video
                        controls
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          maxHeight: "300px",
                          objectFit: "cover",
                        }}
                      >
                        <source src={selectedNote.video} />
                      </video>
                    )}

                    {selectedNote.imagen && selectedNote.video && (
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
                  {selectedNote.created_at
                    ? new Date(selectedNote.created_at).toLocaleDateString("es-AR")
                    : "-"}
                </Text>

                {selectedNote.descripcion && (
                  <Box
                    fontSize="sm"
                    sx={{
                      p: { margin: "0 0 0.75rem 0" },
                      ul: { paddingLeft: "1.5rem", margin: "0.5rem 0" },
                      ol: { paddingLeft: "1.5rem", margin: "0.5rem 0" },
                      li: { marginBottom: "0.25rem" },
                      strong: { fontWeight: "bold" },
                      em: { fontStyle: "italic" },
                      u: { textDecoration: "underline" },
                      h1: { fontSize: "1.5rem", fontWeight: "bold", margin: "0.75rem 0" },
                      h2: { fontSize: "1.25rem", fontWeight: "bold", margin: "0.75rem 0" },
                      h3: { fontSize: "1.1rem", fontWeight: "bold", margin: "0.75rem 0" },
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedNote.descripcion }}
                  />
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

      {/* Loading overlay */}
      {loading && (
        <LoadingOverlay />
      )}

      {/* AlertDialog eliminar */}
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
              Eliminar nota
            </AlertDialogHeader>

            <AlertDialogBody>
              {selectedItem ? (
                <>
                  ¿Está seguro que quiere eliminar la nota{" "}
                  <span style={{ fontWeight: 600 }}>{selectedItem?.titulo}</span>?
                  <Box mt={2} fontSize="sm" color="text.secondary">
                    Esta acción no se puede deshacer.
                  </Box>
                </>
              ) : (
                <>No se ha seleccionado ninguna nota.</>
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
        {/* HEADER RESPONSIVE */}
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          gap={4}
          mb={6}
          w="100%"
        >
          {/* Izquierda: título */}
          <Box w="100%">
            <Text as="h2" textStyle="sectionTitle">
              Notas de salud y tips
            </Text>
            <Text fontSize="sm" color="text.secondary">
              Panel para que se carguen las notas o tips que ven los alumnos
            </Text>
          </Box>

          {/* Derecha: buscador + botones */}
          <HStack
            spacing={3}
            w={{ base: "100%", md: "auto" }}
            flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
            justify={{ base: "space-between", md: "flex-end" }}
            pl={{ base: "", md: "10px" }}
          >
            {/* Buscador */}
            <SearchField
                w={{ base: "100%", md: "90%", lg: "250px", xl: "350px" }}
                placeholder="Buscar por título, descripción, estado o fecha…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Botones de vista */}
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

            {/* Nueva nota */}
            <Button
              leftIcon={<FiPlus />}
              onClick={onOpen}
              variant="primary"
            >
              Nueva nota
            </Button>
          </HStack>
        </Flex>

        {/* Contenido: Cards o Tabla */}
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
              {filteredItems.map((note) => (
                <NoteCard
                  key={note.id}
                  product={note}
                  onClick={() => handleOpenPreview(note)}
                  onEdit={() => handleClickEdit(note)}
                  onDelete={() => handleClickDelete(note)}
                />
              ))}


            </SimpleGrid>
          ) : (
            <Box opacity={0.7} mt={4}>
              No hay notas que coincidan con tu búsqueda.
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
                {currentItems.map((note) => (
                  <Tr
                    key={note.id}
                    cursor="pointer"
                    onClick={() => handleOpenPreview(note)}
                    _hover={{ bg: "bg.subtle" }}
                  >                    <Td>
                      {note.created_at
                        ? new Date(note.created_at).toLocaleDateString("es-AR")
                        : "-"}
                    </Td>

                    <Td>
                      <Box position="relative" boxSize="56px">
                        {note.imagen ? (
                          <>
                            <Image
                              src={note.imagen}
                              alt={note.titulo}
                              boxSize="56px"
                              objectFit="cover"
                              rounded="md"
                            />

                            {note.video && (
                              <Box
                                position="absolute"
                                bottom="2px"
                                right="2px"
                                bg="rgba(0,0,0,0.6)"
                                borderRadius="full"
                                px="4px"
                              >
                                <Text fontSize="10px" color="white">▶</Text>
                              </Box>
                            )}
                          </>
                        ) : note.video ? (
                          <>
                            <Box
                              boxSize="56px"
                              overflow="hidden"
                              borderRadius="6px"
                            >
                              <video
                                src={note.video}
                                muted
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover"
                                }}
                              />
                            </Box>

                            {/* Flecha del video */}
                            <Box
                              position="absolute"
                              top="50%"
                              left="50%"
                              transform="translate(-50%, -50%)"
                              bg="rgba(0,0,0,0.5)"
                              borderRadius="full"
                              px="5px"
                            >
                              <Text fontSize="12px" color="white">▶</Text>
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
                              Sin<br />imagen
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </Td>
                    <Td maxW={{ base: "220px", md: "360px" }}>
                      <Text fontWeight="semibold" noOfLines={1}>
                        {note.titulo}
                      </Text>
                    </Td>

                    <Td maxW={{ base: "280px", md: "420px" }}>
                      <Box
                        fontSize="sm"
                        color="text.secondary"
                        _dark={{ color: "text.disabled" }}
                        maxH="72px"
                        overflow="hidden"
                        sx={tiptapContentStyles}
                        dangerouslySetInnerHTML={renderTiptapHtml(note.descripcion)}
                      />
                    </Td>

                    <Td>
                      {note.estado === "borrador" ? (
                        <StatusBadge label="Borrador" tone="neutral" />
                      ) : note.estado === "en_pausa" ? (
                        <StatusBadge label="En pausa" tone="warning" />
                      ) : note.estado === "activo" ? (
                        <StatusBadge label="Activo" />
                      ) : note.estado === "eliminado" ? (
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
                            handleClickEdit(note);
                          }}
                          variant="ghost"
                        />
                        <IconButton
                          aria-label="Eliminar"
                          icon={<FiTrash2 />}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClickDelete(note);
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
                No hay notas que coincidan con tu búsqueda.
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
      </Container >
    </>
  );
}

/* ---------- Cards ---------- */
function NoteCard({
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
              onError={() => console.log("img error:", product.imagen)}
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
          maxH="60px"
          overflow="hidden"
          sx={tiptapContentStyles}
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


export default TableNotes;
