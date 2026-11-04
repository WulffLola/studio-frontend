"use client";

import { FormControl, FormErrorMessage, FormLabel, Input, Select } from "@chakra-ui/react";
import { useEffect, useId, useState } from "react";
import { useDebouncedValue } from "../_lib/filters";

/**
 * Campo numérico de un bloque. Solo informa valores enteros dentro del rango y
 * con debounce, para no disparar una consulta por cada tecla.
 */
export function NumberControl({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const debounced = useDebouncedValue(draft, 500);
  const parsed = Number(debounced);
  const valid = debounced.trim() !== "" && Number.isInteger(parsed) && parsed >= min && parsed <= max;
  useEffect(() => { if (valid && parsed !== value) onChange(parsed); }, [valid, parsed, value, onChange]);
  const draftNumber = Number(draft);
  const draftInvalid = draft.trim() === "" || !Number.isInteger(draftNumber) || draftNumber < min || draftNumber > max;
  return <FormControl w="auto" isInvalid={draftInvalid}>
    <FormLabel htmlFor={id} fontSize="xs" mb={1} color="text.primary">{label}</FormLabel>
    <Input id={id} size="sm" type="number" inputMode="numeric" min={min} max={max} w="96px" bg="bg.surface" value={draft} onChange={(event) => setDraft(event.target.value)} />
    <FormErrorMessage fontSize="xs" mt={1}>Entre {min} y {max}</FormErrorMessage>
  </FormControl>;
}

export function SelectControl({ label, value, onChange, options, width = "150px" }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; width?: string }) {
  const id = useId();
  return <FormControl w="auto">
    <FormLabel htmlFor={id} fontSize="xs" mb={1} color="text.primary">{label}</FormLabel>
    <Select id={id} size="sm" w={width} bg="bg.surface" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </Select>
  </FormControl>;
}

export function MonthControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return <FormControl w="auto">
    <FormLabel htmlFor={id} fontSize="xs" mb={1} color="text.primary">{label}</FormLabel>
    {/* Se ignora el valor vacío: el endpoint exige un mes. */}
    <Input id={id} size="sm" type="month" w="170px" bg="bg.surface" value={value} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) onChange(event.target.value); }} />
  </FormControl>;
}
