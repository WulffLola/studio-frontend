import { AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogOverlay, Box, Button, Flex, HStack, Input, InputGroup, InputLeftElement, InputRightElement, Modal, ModalCloseButton, ModalContent, ModalOverlay, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, useDisclosure, useToast } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Icon from '@mdi/react';
import { mdiPencilOutline, mdiDeleteOutline, mdiMagnify, mdiClose } from '@mdi/js';
import Pagination from "./Pagination";
import ModalCode from "./ModalCode";
import ModalAppointmentsEdit from "./ModalAppointmentsEdit";
import { useAuthStore } from "../stores/auth";
import { useAppDispatch } from "../stores/hooks";
import { useSelector } from "react-redux";
import {
  getActions,
  getUsers,
} from '../stores/studioSlice';
import { FiSearch } from "react-icons/fi";
import { TableState } from "./ui/StateMessage";
import SearchField from "./ui/SearchField";


const ITEMS_PER_PAGE = 10;

const TableActions = ({ list, onOpen }: { list: Array<any>; onOpen: () => void; }) => {
  const [selectedRow, setSelectedRow] = useState([])
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const { tipo, tokens } = useAuthStore();
  const [loadingTable, setLoadingTable] = useState(false);

  const { users } = useSelector((state: any) => state.studio);
  const dispatch = useAppDispatch();

  // Función para ordenar por timestamp de más reciente a más antiguo
  const sortByTimestamp = (items) => {
    return [...items].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split("T")[0].split("-");

    return `${day}/${month}/${year}`;
  };


  // Ordenar el 'list' con esta función sin mutarlo
  const sortedList = sortByTimestamp(list);

  // Filtrado de items según el término de búsqueda
  const filteredItems = sortedList.filter(item => {
    const user = users.find(user => user.id === item.user);
    const userName = user ? `${user.name} ${user.last_name}` : "Usuario desconocido";

    // Aquí hacemos la comparación en todos los campos relevantes
    return (
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(item.timestamp).toLocaleDateString().includes(searchTerm) ||
      new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).includes(searchTerm) ||
      item.old_value.some(val => `${val.field}: ${val.value}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.new_value.some(val => `${val.field}: ${val.value}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calcula el índice del primer y último elemento a mostrar
  const countPagination = Math.max(Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 1);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Lógica para mantener siempre 8 filas
  const emptyRowsCount = ITEMS_PER_PAGE - currentItems.length;

  // Diccionario de traducciones
  const translations = {
    Persona: "Alumno",
    // Puedes añadir más traducciones si llegan más términos del backend
  };



  // Función de traducción flexible
  const translateText = (text) => translations[text] || text;

  const formatEmbeddedDate = (value: any) => {
    if (value === null || value === undefined) return "";
    const text = String(value);

    return text.replace(
      /(\d{4})-(\d{2})-(\d{2})/g,
      (_, year, month, day) => `${day}/${month}/${year}`
    );
  };


  useEffect(() => {
    setLoadingTable(true)

    const timer = setTimeout(() => {
      setLoadingTable(false); // Desactiva loading después de 2 segundos
    }, 800); // Ajusta el tiempo en milisegundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Stack mt={4} mb={2} w="100%">
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          w="100%"
          gap={4}
        >
          {/* Izquierda: título + subtítulo */}
          <Box>
            <Text fontSize="sm" color="text.secondary">
              Visualizá todas las acciones que realizan los usuarios
            </Text>
          </Box>

          {/* Derecha: buscador + botón */}
          <HStack
            spacing={3}
            w={{ base: "100%", md: "auto" }}
            justify={{ base: "flex-end", md: "flex-end" }}
            flexWrap={{ base: "wrap", md: "wrap", lg: "nowrap" }}
            pl={{ base: "", md: "10px" }}

          >
            {/* Buscador */}
            <SearchField
                w={{ base: "100%", md: "50%", lg: "350px", xl: "350px" }}
                placeholder="Buscar…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </HStack>
        </Flex>
      </Stack>


      <Box
        overflowX="auto"
        mt={0}
        minH={"100%"}
        w={"100%"}
        bg="bg.surface"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="card"
        boxShadow="card"
      >
        <Table size={"sm"}>
          <Thead>
            <Tr>
              <Th>Dia</Th>
              <Th>Horario</Th>
              <Th>Acción</Th>
              <Th>Objetivo</Th>
              <Th>Valor anterior</Th>
              <Th>Valor nuevo</Th>
              <Th>Usuario</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loadingTable ? ( // Mostrar "Cargando..." por defecto
              <TableState kind="loading" colSpan={6} />
            ) : currentItems.length > 0 ? (
              currentItems.map((item, index) => {
                const user = users.find(user => user.id === item.user);
                const userName = user ? `${user.name} ${user.last_name}` : "Usuario desconocido";

                return (
                  <Tr
                    key={index}
                    onClick={() => setSelectedRow(item)}
                    data-selected={selectedRow?.id === item.id || undefined}
                    cursor="pointer"
                  >
                    <Td>{formatDate(item.timestamp)}</Td>
                    <Td>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Td>
                    <Td>{translateText(item.action)}</Td>
                    <Td>{translateText(item.target)}</Td>
                    <Td>
                      {item.old_value.map(val => (
                        <span key={val.field}>
                          <strong>{translateText(val.field)}:</strong> {formatEmbeddedDate(val.value)}
                          <br />
                        </span>
                      ))}
                    </Td>
                    <Td>
                      {item.new_value.map(val => (
                        <span key={val.field}>
                          <strong>{translateText(val.field)}:</strong> {formatEmbeddedDate(val.value)}
                          <br />
                        </span>
                      ))}
                    </Td>
                    <Td>
                      {userName}
                    </Td>
                  </Tr>
                );
              })
            ) : (!loadingTable && currentItems.length === 0) && (
              <TableState kind="empty" colSpan={8} title="No se encontraron datos" />
            )}
          </Tbody>
        </Table>
      </Box>


      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={countPagination}
          pageSize={ITEMS_PER_PAGE}
          defaultPage={1}
          onPageChange={setCurrentPage}
        />
      </Box>
    </>
  );
};
export default TableActions;
