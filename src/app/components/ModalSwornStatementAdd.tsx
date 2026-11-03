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
import {
  DEFAULT_STATEMENT_TYPE_OPTIONS,
  getStatementTypeLabel,
  isSwornStatementActive,
  StatementType,
  SwornStatementItem,
} from "./ModalSwornStatementEdit";
import { LoadingOverlay } from "./ui/Loaders";

type Props = {
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

const ModalSwornStatementAdd = ({
  existingSwornStatements = [],
  onClose,
  token,
  onSuccess,
}: Props) => {
  const [content, setContent] = useState("");
  const [statementType, setStatementType] = useState<StatementType>("person");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const activeTypes = useMemo(
    () =>
      new Set(
        existingSwornStatements
          .filter(isSwornStatementActive)
          .map((item) => item.statement_type)
          .filter((type): type is string => Boolean(type))
      ),
    [existingSwornStatements]
  );

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

  const hasAvailableType = statementTypeOptions.some((option) => !activeTypes.has(option.value));

  useEffect(() => {
    if (!activeTypes.has(statementType)) return;

    const nextAvailableType = statementTypeOptions.find((option) => !activeTypes.has(option.value));

    if (nextAvailableType) {
      setStatementType(nextAvailableType.value);
    }
  }, [activeTypes, statementType, statementTypeOptions]);

  const handleSubmit = async () => {
    if (activeTypes.has(statementType)) {
      toast({
        title: "Ya existe una declaración activa",
        description: `Ya hay una declaración activa de tipo ${getStatementTypeLabel(statementType)}. Editá la existente o eliminá/reactivá según corresponda.`,
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    if (!getPlainText(content)) {
      toast({
        title: "Falta el contenido",
        description: "Debes ingresar el texto de la declaración.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_URL_BACKEND_SWORN_STATEMENT}`,
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
        title: "Declaración creada",
        description: "La declaración jurada se creó correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al crear declaración:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la declaración jurada.",
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
          Nueva declaración jurada
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
            isDisabled={!hasAvailableType}
          >
            {statementTypeOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={activeTypes.has(option.value)}>
                {option.label}
              </option>
            ))}
          </Select>
          {!hasAvailableType && (
            <Text fontSize="sm" color="warning.fg" mt={2}>
              Ya existe una declaración activa para cada tipo disponible. Editá o eliminá una existente para liberar el tipo.
            </Text>
          )}
        </FormControl>

        <HStack spacing={3} justify="flex-end">
          <Button onClick={onClose} w={["100%", "135px"]} aria-label="Cancelar" variant="secondary">
            Cancelar
          </Button>

          <Button onClick={handleSubmit} isDisabled={!hasAvailableType} w={["100%", "135px"]} variant="primary">
            Guardar
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default ModalSwornStatementAdd;
