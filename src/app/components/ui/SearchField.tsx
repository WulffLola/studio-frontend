"use client";

import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  type InputProps,
  type ResponsiveValue,
} from "@chakra-ui/react";
import Icon from "@mdi/react";
import { mdiClose, mdiMagnify } from "@mdi/js";

type Size = ResponsiveValue<string | number>;

type SearchFieldProps = Omit<InputProps, "w" | "width" | "maxW" | "minW" | "flex" | "display" | "order"> & {
  w?: Size;
  width?: Size;
  maxW?: Size;
  minW?: Size;
  flex?: ResponsiveValue<string | number>;
  display?: ResponsiveValue<string>;
  order?: ResponsiveValue<number>;
  /** Si se indica, muestra un botón para limpiar la búsqueda cuando hay texto. */
  onClear?: () => void;
};

/** Campo de búsqueda estándar de barras de herramientas y filtros. */
const SearchField = ({
  w,
  width,
  maxW,
  minW,
  flex,
  display,
  order,
  onClear,
  placeholder = "Buscar…",
  ...inputProps
}: SearchFieldProps) => {
  const hasValue = typeof inputProps.value === "string" ? inputProps.value.length > 0 : !!inputProps.value;

  return (
    <InputGroup w={w ?? width} maxW={maxW} minW={minW} flex={flex} display={display} order={order} size="md">
      <InputLeftElement pointerEvents="none" color="text.muted" h="38px">
        <Icon path={mdiMagnify} size={0.8} />
      </InputLeftElement>
      <Input
        h="38px"
        pl={9}
        pr={onClear ? 9 : undefined}
        placeholder={placeholder}
        aria-label={typeof placeholder === "string" ? placeholder.replace(/…|\.\.\./, "") : "Buscar"}
        {...inputProps}
      />
      {onClear && hasValue && (
        <InputRightElement h="38px">
          <IconButton
            aria-label="Limpiar búsqueda"
            icon={<Icon path={mdiClose} size={0.7} />}
            size="xs"
            variant="ghost"
            onClick={onClear}
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
};

export default SearchField;
