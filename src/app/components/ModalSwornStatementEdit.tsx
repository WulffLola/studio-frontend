"use client";

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Select,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import TiptapEditor from "./TiptapEditor";
import { LoadingOverlay } from "./ui/Loaders";

export type SwornStatementItem = {
  id: number;
  text?: string;
  statement_type?: StatementType;
  is_active?: boolean;
  active?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StatementType = string;

type Props = {
  swornStatement: SwornStatementItem | null;
  existingSwornStatements?: SwornStatementItem[];
  onClose: () => void;
  token?: string;
  onSuccess: () => void;
};

const getPlainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const getSwornStatementContent = (swornStatement: SwornStatementItem | null) =>
  swornStatement?.text || "";

export const DEFAULT_STATEMENT_TYPE_OPTIONS = [
  { value: "person", label: "Declaración de Persona" },
  { value: "appointment", label: "Declaración de Turno" },
];

export const getStatementTypeLabel = (statementType?: string) => {
  const option = DEFAULT_STATEMENT_TYPE_OPTIONS.find((item) => item.value === statementType);
  if (option?.label) return option.label;
  return statementType ? `Declaración de ${statementType}` : "Sin tipo";
};

export const isSwornStatementActive = (swornStatement: SwornStatementItem) => {
  if (swornStatement.deleted_at) return false;
  if (typeof swornStatement.is_active === "boolean") return swornStatement.is_active;
  if (typeof swornStatement.active === "boolean") return swornStatement.active;
  return true;
};

const ModalSwornStatementEdit = ({
  swornStatement,
  existingSwornStatements = [],
  onClose,
  token,
  onSuccess,
}: Props) => {
  const [content, setContent] = useState("");
  const [statementType, setStatementType] = useState<StatementType>("person");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const statementTypeOptions = useMemo(() => {
    const dynamicTypes = existingSwornStatements
      .map((item) => item.statement_type)
      .filter((type): type is string => Boolean(type));
    const values = Array.from(
      new Set([
        ...DEFAULT_STATEMENT_TYPE_OPTIONS.map((item) => item.value),
        ...dynamicTypes,
        ...(statementType ? [statementType] : []),
      ])
    );

    return values.map((value) => ({
      value,
      label: getStatementTypeLabel(value),
    }));
  }, [existingSwornStatements, statementType]);

  const statementTypeAlreadyUsed = useMemo(
    () =>
      existingSwornStatements.some(
        (item) =>
          item.id !== swornStatement?.id &&
          item.statement_type === statementType &&
          isSwornStatementActive(item)
      ),
    [existingSwornStatements, statementType, swornStatement?.id]
  );

  useEffect(() => {
    setContent(getSwornStatementContent(swornStatement));
    setStatementType(swornStatement?.statement_type || "person");
  }, [swornStatement]);

  const handleSubmit = async () => {
    if (!swornStatement?.id) {
      toast({
        title: "No se encontró la declaración",
        description: "No hay un id válido para editar.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    if (statementTypeAlreadyUsed) {
      toast({
        title: "Ya existe una declaración activa",
        description: `Ya hay otra declaración activa de tipo ${getStatementTypeLabel(statementType)}.`,
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    if (!getPlainText(content)) {
      toast({
        title: "Datos incompletos",
        description: "Completá el contenido antes de guardar.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_SWORN_STATEMENT}${swornStatement.id}/`,
        {
          text: content.trim(),
          statement_type: statementType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Declaración actualizada",
        description: "La declaración jurada se actualizó correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al editar declaración:", error);
      toast({
        title: "Error",
        description: "No se pudo editar la declaración jurada.",
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
        <Heading as="h2" size="lg" pr={8} mb={1} position="sticky" top={0} zIndex={2} bg="bg.surface" py={2} mt={-2}>
          Editar declaración jurada
        </Heading>

        <FormControl isRequired>
          <FormLabel>Contenido</FormLabel>
          <TiptapEditor value={content} onChange={setContent} placeholder="Escribir declaración..." />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Tipo de declaración</FormLabel>
          <Select
            h="40px"
            value={statementType}
            onChange={(e) => setStatementType(e.target.value as StatementType)}
          >
            {statementTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {statementTypeAlreadyUsed && (
            <Text fontSize="sm" color="warning.fg" mt={2}>
              Ya existe otra declaración activa para este tipo. Elegí otro tipo o editá esa declaración.
            </Text>
          )}
        </FormControl>

        <HStack spacing={3} justify="flex-end">
          <Button onClick={onClose} w={["100%", "135px"]} aria-label="Cancelar" variant="secondary">
            Cancelar
          </Button>

          <Button onClick={handleSubmit} isDisabled={statementTypeAlreadyUsed} w={["100%", "135px"]} variant="primary">
            Guardar
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default ModalSwornStatementEdit;
